import { createClient } from '@supabase/supabase-js'

// Service-role client — never exposed to the browser. Hardcodes role='client'
// so a tampered request can't elevate the new account to 'admin'.
const service = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function POST(request) {
  try {
    const payload = await request.json()
    const {
      userId,
      email,
      fullName,
      companyName,
      teamSize,
      industry,
      leadInterest,
      painPoints,
      assessmentId,
    } = payload

    if (!userId || !email || !companyName) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the auth user exists (and the email matches) so the caller can't
    // attach an org to an account they don't own.
    const { data: lookup, error: lookupError } = await service.auth.admin.getUserById(userId)
    if (lookupError || !lookup?.user) {
      return Response.json({ error: 'Account not found.' }, { status: 400 })
    }
    if (String(lookup.user.email || '').toLowerCase() !== String(email || '').toLowerCase()) {
      return Response.json({ error: 'Account email does not match.' }, { status: 400 })
    }

    // Reject re-runs against an existing profile.
    const { data: existingProfile } = await service
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()
    if (existingProfile) {
      return Response.json({ error: 'Account already set up.' }, { status: 409 })
    }

    const parsedTeamSize = teamSize ? parseInt(teamSize, 10) : null
    const needsReview =
      (parsedTeamSize !== null && parsedTeamSize > 15) || leadInterest === 'not_sure'

    const trimmedCompany = String(companyName || '').trim()
    const slug = `${slugify(trimmedCompany)}-${Date.now().toString(36)}`

    const { data: org, error: orgError } = await service
      .from('organizations')
      .insert({
        name: trimmedCompany,
        slug,
        plan: 'starter',
        monthly_ticket_limit: 10,
        client_status: 'lead',
        lead_interest: leadInterest || 'it',
        primary_service: 'it',
        service_types: ['it'],
        team_size: parsedTeamSize,
        industry: industry?.trim() || null,
        needs_human_review: needsReview,
        agreement_status: 'none',
        payment_status: 'none',
        onboarding_status: 'not_started',
        notes: painPoints?.trim() || null,
      })
      .select('id')
      .single()

    if (orgError) {
      return Response.json({ error: `Organization setup failed: ${orgError.message}` }, { status: 500 })
    }

    // role is hardcoded — the request body cannot influence it.
    const { error: profileError } = await service.from('profiles').insert({
      id: userId,
      email,
      full_name: fullName?.trim() || null,
      organization_id: org.id,
      role: 'client',
      is_primary_contact: true,
    })

    if (profileError) {
      // Roll back the org so a retry can succeed.
      await service.from('organizations').delete().eq('id', org.id)
      return Response.json({ error: `Profile setup failed: ${profileError.message}` }, { status: 500 })
    }

    if (assessmentId) {
      await service
        .from('assessment_submissions')
        .update({
          linked_organization_id: org.id,
          status: 'converted',
          converted_at: new Date().toISOString(),
        })
        .eq('id', assessmentId)
    }

    return Response.json({ success: true, organizationId: org.id })
  } catch (err) {
    console.error('Signup complete error:', err)
    return Response.json(
      { error: err.message || 'Failed to complete signup.' },
      { status: 500 }
    )
  }
}
