export const LAUNCH_PACK_STATUS_LABELS = {
  not_delivered: 'Not Delivered',
  delivered: 'Delivered',
  acknowledged: 'Acknowledged',
}

export const OFFBOARDING_PLAN_STATUS_LABELS = {
  not_defined: 'Not Defined',
  documented: 'Documented',
  reviewed: 'Reviewed',
}

export const QBR_CADENCE_LABELS = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  semiannual: 'Semiannual',
  annual: 'Annual',
}

export function formatLaunchDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function toLaunchInputValue(value) {
  if (!value) return ''
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

export function deriveLaunchSummary(organization = {}) {
  const launchDelivered = !!organization.launch_pack_delivered_at
  const guideAcknowledged = !!organization.client_guide_acknowledged_at
  const securityAcknowledged = !!organization.security_policy_acknowledged_at
  const qbrScheduled = !!organization.next_qbr_scheduled_for

  const checks = [
    {
      key: 'launch_pack',
      label: 'Launch pack delivered',
      passed: launchDelivered,
    },
    {
      key: 'client_guide',
      label: 'Client guide acknowledged',
      passed: guideAcknowledged,
    },
    {
      key: 'security_policy',
      label: 'Security rules acknowledged',
      passed: securityAcknowledged,
    },
    {
      key: 'qbr',
      label: 'Next review / QBR scheduled',
      passed: qbrScheduled,
    },
    {
      key: 'offboarding',
      label: 'Offboarding plan documented',
      passed: organization.offboarding_plan_status === 'documented' || organization.offboarding_plan_status === 'reviewed',
    },
  ]

  const passed = checks.filter((c) => c.passed).length
  const percent = Math.round((passed / checks.length) * 100)

  return {
    percent,
    checks,
    ready: checks.every((c) => c.passed),
  }
}