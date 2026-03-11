export const ACCESS_METHOD_LABELS = {
  delegated_admin: 'Delegated Admin',
  secure_share: 'Secure Share',
  temp_credentials: 'Temporary Credentials',
  vendor_invite: 'Vendor Invite',
  vpn: 'VPN / Network Access',
  other: 'Other',
}

export const ACCESS_STATUS_LABELS = {
  requested: 'Requested',
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  needs_followup: 'Needs Follow-up',
  revoked: 'Revoked',
}

export const ACCESS_STATUS_STYLES = {
  requested: { bg: '#f3f4f6', color: '#6b7280' },
  submitted: { bg: '#eef4ff', color: '#1d4ed8' },
  under_review: { bg: '#fff7ed', color: '#9a3412' },
  approved: { bg: '#ecfdf3', color: '#067647' },
  needs_followup: { bg: '#fef3f2', color: '#b42318' },
  revoked: { bg: '#f3f4f6', color: '#4b5563' },
}

export const ACCESS_METHOD_OPTIONS = [
  { value: 'delegated_admin', label: 'Delegated Admin' },
  { value: 'secure_share', label: 'Secure Share' },
  { value: 'temp_credentials', label: 'Temporary Credentials' },
  { value: 'vendor_invite', label: 'Vendor Invite' },
  { value: 'vpn', label: 'VPN / Network Access' },
  { value: 'other', label: 'Other' },
]

export function deriveAccessSummary(rows = []) {
  return {
    total: rows.length,
    submitted: rows.filter((r) => r.status === 'submitted').length,
    underReview: rows.filter((r) => r.status === 'under_review').length,
    approved: rows.filter((r) => r.status === 'approved').length,
    needsFollowup: rows.filter((r) => r.status === 'needs_followup').length,
  }
}