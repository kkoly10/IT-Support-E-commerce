export const KICKOFF_STATUS_LABELS = {
  not_scheduled: 'Not Scheduled',
  scheduled: 'Scheduled',
  completed: 'Completed',
}

export const HYPERCARE_STATUS_LABELS = {
  not_started: 'Not Started',
  active: 'Active',
  completed: 'Completed',
}

export function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function toLocalInputValue(value) {
  if (!value) return ''
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

export function deriveTransitionSummary(organization = {}) {
  const kickoffStatus = organization.kickoff_status || 'not_scheduled'
  const hypercareStatus = organization.hypercare_status || 'not_started'
  const activated = !!organization.support_activated_at

  let stageLabel = 'Onboarding Setup'
  if (kickoffStatus === 'scheduled') stageLabel = 'Kickoff Scheduled'
  if (kickoffStatus === 'completed') stageLabel = 'Kickoff Complete'
  if (activated) stageLabel = 'Support Activated'
  if (hypercareStatus === 'active') stageLabel = 'Hypercare Active'
  if (hypercareStatus === 'completed') stageLabel = 'Hypercare Complete'

  return {
    kickoffStatus,
    hypercareStatus,
    activated,
    stageLabel,
  }
}