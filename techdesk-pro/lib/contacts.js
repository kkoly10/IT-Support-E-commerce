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