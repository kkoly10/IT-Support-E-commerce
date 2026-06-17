export const CONTACT_ROLE_LABELS = {
  primary: 'Primary Contact',
  billing: 'Billing Contact',
  security: 'Security Contact',
  emergency: 'Emergency / Escalation Contact',
  authorized_requester: 'Authorized Requester',
  general: 'General Contact',
}

export const CONTACT_ROLE_OPTIONS = [
  { value: 'primary', label: 'Primary Contact' },
  { value: 'billing', label: 'Billing Contact' },
  { value: 'security', label: 'Security Contact' },
  { value: 'emergency', label: 'Emergency / Escalation Contact' },
  { value: 'authorized_requester', label: 'Authorized Requester' },
  { value: 'general', label: 'General Contact' },
]

// Who may sign agreements on the org's behalf. The contact matrix's primary
// (when it lists an email) is the operational source of truth; the
// profiles.is_primary_contact flag set at signup is the fallback when the
// matrix has no addressable primary. Keeping this in one place stops the two
// flags from drifting apart between the portal gate and the sign API.
export function canSignAgreements(profile, contacts = []) {
  const primaries = (contacts || []).filter((c) => c?.is_primary_contact && c?.email)
  if (primaries.length > 0) {
    const email = (profile?.email || '').trim().toLowerCase()
    return !!email && primaries.some((c) => c.email.trim().toLowerCase() === email)
  }
  return !!profile?.is_primary_contact
}

export function deriveContactMatrixSummary(contacts = []) {
  const primary = contacts.find((c) => c.is_primary_contact)
  const billing = contacts.filter((c) => c.receives_billing_notices)
  const security = contacts.filter((c) => c.receives_security_notices)
  const emergency = contacts.filter((c) => c.receives_emergency_notices)
  const authorized = contacts.filter((c) => c.is_authorized_requester)

  return {
    total: contacts.length,
    hasPrimary: !!primary,
    primaryName: primary?.full_name || null,
    billingCount: billing.length,
    securityCount: security.length,
    emergencyCount: emergency.length,
    authorizedCount: authorized.length,
  }
}