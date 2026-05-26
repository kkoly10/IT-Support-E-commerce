import crypto from 'node:crypto'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '../../../../lib/supabase/server'
import { getAgreement, REQUIRED_AGREEMENT_KEYS } from '../../../../lib/agreements'

const service = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
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
    if (!profile.is_primary_contact) {
      return Response.json(
        { error: 'Only your organization’s primary contact can sign agreements.' },
        { status: 403 }
      )
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
    if (allSigned) {
      await service
        .from('organizations')
        .update({ agreement_status: 'signed' })
        .eq('id', profile.organization_id)
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
