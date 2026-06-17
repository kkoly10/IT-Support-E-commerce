import crypto from 'node:crypto'
import { createClient as createServerClient } from '../../../../lib/supabase/server'
import { getService } from '../../../../lib/supabase/route-auth'
import { getAgreement, isDraftVersion, REQUIRED_AGREEMENT_KEYS } from '../../../../lib/agreements'
import { canSignAgreements } from '../../../../lib/contacts'

export async function POST(request) {
  try {
    // Lazy service client — a module-scope client breaks builds in env-less
    // checkouts during page-data collection.
    const service = getService()
    // Identify the signer from their authenticated session (anon client + cookies).
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'You must be signed in to accept an agreement.' }, { status: 401 })
    }

    const { documentKey, signerName } = await request.json()
    const doc = getAgreement(documentKey)
    if (!doc) {
      return Response.json({ error: 'Unknown agreement.' }, { status: 400 })
    }

    const name = (signerName || '').trim()
    if (name.length < 2) {
      return Response.json({ error: 'Type your full legal name to sign.' }, { status: 400 })
    }

    const { data: profile } = await service
      .from('profiles')
      .select('organization_id, email, is_primary_contact')
      .eq('id', user.id)
      .single()
    if (!profile?.organization_id) {
      return Response.json({ error: 'No organization is linked to this account.' }, { status: 400 })
    }

    // The contact matrix's primary (portal Contacts page) and the
    // profiles.is_primary_contact flag set at signup can drift apart; defer to
    // the shared gate so the org's current primary can sign and a demoted one
    // cannot.
    const { data: contacts } = await service
      .from('organization_contacts')
      .select('email, is_primary_contact')
      .eq('organization_id', profile.organization_id)
      .eq('is_primary_contact', true)
    const signerEmail = profile.email || user.email || null
    const signerProfile = { email: signerEmail, is_primary_contact: profile.is_primary_contact }
    if (!canSignAgreements(signerProfile, contacts)) {
      return Response.json(
        { error: 'Only your organization’s primary contact can sign agreements.' },
        { status: 403 }
      )
    }

    // Reconcile the signup-time profiles flag with the contact matrix so other
    // consumers of profiles.is_primary_contact see the current primary.
    if (!profile.is_primary_contact) {
      const { error: promoteError } = await service
        .from('profiles')
        .update({ is_primary_contact: true })
        .eq('id', user.id)
      const { error: demoteError } = await service
        .from('profiles')
        .update({ is_primary_contact: false })
        .eq('organization_id', profile.organization_id)
        .neq('id', user.id)
      if (promoteError || demoteError) {
        console.error('Primary-contact flag reconcile failed:', promoteError || demoteError)
      }
    }

    // Idempotency: a signature for this document at its current version already
    // on file means there is nothing new to record (double-click / retry safe).
    const { data: priorSignature, error: priorError } = await service
      .from('agreement_signatures')
      .select('id, signed_at')
      .eq('organization_id', profile.organization_id)
      .eq('document_type', doc.key)
      .eq('document_version', doc.version)
      .order('signed_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (priorError) throw priorError
    if (priorSignature) {
      return Response.json({
        success: true,
        id: priorSignature.id,
        signedAt: priorSignature.signed_at,
        alreadySigned: true,
      })
    }

    // Server-captured, tamper-resistant audit fields.
    const documentHash = crypto.createHash('sha256').update(doc.body).digest('hex')
    const forwarded = request.headers.get('x-forwarded-for') || ''
    const ipAddress = forwarded.split(',')[0].trim() || request.headers.get('x-real-ip') || null
    const userAgent = request.headers.get('user-agent') || null

    const { data: signature, error } = await service
      .from('agreement_signatures')
      .insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        document_type: doc.key,
        document_version: doc.version,
        document_title: doc.title,
        document_hash: documentHash,
        signer_name: name,
        signer_email: profile.email || user.email || null,
        signature_method: 'typed',
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select('id, signed_at')
      .single()
    if (error) throw error

    // When every required document has a signature at its current version,
    // mark the organization's agreement as signed.
    const { data: existing } = await service
      .from('agreement_signatures')
      .select('document_type, document_version')
      .eq('organization_id', profile.organization_id)

    const signedKeys = new Set(
      (existing || [])
        .filter((row) => {
          const d = getAgreement(row.document_type)
          return d && d.version === row.document_version
        })
        .map((row) => row.document_type)
    )
    const allSigned = REQUIRED_AGREEMENT_KEYS.every((key) => signedKeys.has(key))
    // Draft versions are not attorney-finalized — acknowledging them is signing
    // progress, but must never mark the org as having executed agreements.
    const anyDraft = REQUIRED_AGREEMENT_KEYS.some((key) =>
      isDraftVersion(getAgreement(key)?.version)
    )
    // Reflect signing progress: 'signed' once all required documents are signed
    // at their current, non-draft version, otherwise 'sent' (in progress).
    // Note: a later document version bump will not downgrade an
    // already-'signed' org until the next signing action re-runs this check.
    const { error: statusError } = await service
      .from('organizations')
      .update({ agreement_status: allSigned && !anyDraft ? 'signed' : 'sent' })
      .eq('id', profile.organization_id)
    if (statusError) {
      console.error('Agreement status update failed:', statusError)
    }

    return Response.json({
      success: true,
      id: signature.id,
      signedAt: signature.signed_at,
      allSigned,
    })
  } catch (err) {
    console.error('Agreement sign error:', err)
    return Response.json({ error: err.message || 'Failed to record signature.' }, { status: 500 })
  }
}
