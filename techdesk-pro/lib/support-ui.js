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

export const CATEGORY_LABELS = {
  helpdesk: 'General Helpdesk',
  accounts_access: 'Accounts & Access',
  email_collaboration: 'Email & Collaboration',
  microsoft_365: 'Microsoft 365',
  google_workspace: 'Google Workspace',
  saas_admin: 'SaaS Admin',
  device_guidance: 'Device Guidance',
  security_review: 'Security Review',
  project_scoped: 'Project Scoped',
  portal_account: 'Portal Account',
  billing_scope: 'Billing & Scope',
  unknown: 'Needs Review',
  other: 'Other',
}

export const PRIORITY_COLORS = {
  low: '#6b7280',
  medium: '#f59e0b',
  high: '#f97316',
  urgent: '#ef4444',
}

export const toLabel = (value, labels) => {
  if (!value) return '—'
  if (labels?.[value]) return labels[value]
  return value.replace(/_/g, ' ')
}
