export const STATUS_OPTIONS = [
  'open',
  'in_progress',
  'waiting_on_client',
  'resolved',
  'closed',
]

export const STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting_on_client: 'Waiting on Client',
  resolved: 'Resolved',
  closed: 'Closed',
}

export const STATUS_COLORS = {
  open: '#f59e0b',
  in_progress: '#3b82f6',
  waiting_on_client: '#8b5cf6',
  resolved: '#10b981',
  closed: '#6b7280',
}

// Canonical DB-safe categories for tickets.category (ticket_category enum)
export const REQUEST_CATEGORY_OPTIONS = [
  'helpdesk',
  'accounts_access',
  'email_collaboration',
  'microsoft_365',
  'google_workspace',
  'saas_admin',
  'portal_account',
  'billing_scope',
  'device_guidance',
  'other',
]

export const CATEGORY_LABELS = {
  helpdesk: 'General Helpdesk',
  accounts_access: 'Accounts & Access',
  email_collaboration: 'Email & Collaboration',
  microsoft_365: 'Microsoft 365',
  google_workspace: 'Google Workspace',
  saas_admin: 'SaaS Admin',
  portal_account: 'Portal Account',
  billing_scope: 'Billing & Scope',
  device_guidance: 'Device Guidance',
  other: 'Other',
  // legacy/AI values: keep readable labels for old data without using them for writes
  security_review: 'Security Review',
  project_scoped: 'Project Scoped Work',
  unknown: 'Needs Review',
}

export const PRIORITY_COLORS = {
  low: '#6b7280',
  medium: '#f59e0b',
  high: '#f97316',
  urgent: '#ef4444',
}

export const normalizeRequestCategory = (category) => {
  if (!category) return category
  if (REQUEST_CATEGORY_OPTIONS.includes(category)) return category

  const aliasMap = {
    security_review: 'other',
    project_scoped: 'other',
    unknown: 'other',
    it_support: 'helpdesk',
  }

  return aliasMap[category] || 'other'
}

export const toLabel = (value, labels) => {
  if (!value) return '—'
  if (labels?.[value]) return labels[value]
  return value.replace(/_/g, ' ')
}
