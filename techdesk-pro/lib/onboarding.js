export const ONBOARDING_PHASE_LABELS = {
  discovery: 'Discovery',
  contacts: 'Contacts',
  access: 'Access',
  documents: 'Documents',
  validation: 'Validation',
  handoff: 'Handoff',
}

export const ONBOARDING_OWNER_LABELS = {
  client: 'Client',
  kocre: 'Kocre IT',
}

export const ONBOARDING_STATUS_LABELS = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  done: 'Done',
  skipped: 'Skipped',
}

export const ONBOARDING_STATUS_STYLES = {
  not_started: { bg: '#f3f4f6', color: '#6b7280' },
  in_progress: { bg: '#eef4ff', color: '#1d4ed8' },
  blocked: { bg: '#fef3f2', color: '#b42318' },
  done: { bg: '#ecfdf3', color: '#067647' },
  skipped: { bg: '#fffaeb', color: '#b54708' },
}

export const DEFAULT_ONBOARDING_TEMPLATE = [
  {
    task_key: 'confirm_primary_contact',
    title: 'Confirm primary support contact',
    phase: 'contacts',
    owner_type: 'client',
    sort_order: 10,
  },
  {
    task_key: 'confirm_billing_contact',
    title: 'Confirm billing contact',
    phase: 'contacts',
    owner_type: 'client',
    sort_order: 15,
  },
  {
    task_key: 'confirm_security_contact',
    title: 'Confirm security contact',
    phase: 'contacts',
    owner_type: 'client',
    sort_order: 18,
  },
  {
    task_key: 'confirm_emergency_contact',
    title: 'Confirm escalation or emergency contact',
    phase: 'contacts',
    owner_type: 'client',
    sort_order: 20,
  },
  {
    task_key: 'confirm_authorized_requesters',
    title: 'Confirm authorized requesters',
    phase: 'contacts',
    owner_type: 'client',
    sort_order: 25,
  },
  {
    task_key: 'review_contact_matrix',
    title: 'Review contact and escalation matrix',
    phase: 'contacts',
    owner_type: 'kocre',
    sort_order: 28,
  },
  {
    task_key: 'complete_environment_profile',
    title: 'Complete company and environment profile',
    phase: 'discovery',
    owner_type: 'client',
    sort_order: 30,
  },
  {
    task_key: 'review_discovery_inputs',
    title: 'Review client discovery inputs',
    phase: 'discovery',
    owner_type: 'kocre',
    sort_order: 40,
  },
  {
    task_key: 'upload_service_agreement',
    title: 'Upload signed service agreement or onboarding approval',
    phase: 'documents',
    owner_type: 'client',
    sort_order: 50,
  },
  {
    task_key: 'upload_support_documents',
    title: 'Upload onboarding and support reference documents',
    phase: 'documents',
    owner_type: 'client',
    sort_order: 60,
  },
  {
    task_key: 'review_uploaded_documents',
    title: 'Review uploaded documents and request follow-up if needed',
    phase: 'documents',
    owner_type: 'kocre',
    sort_order: 70,
  },
  {
    task_key: 'provide_admin_access',
    title: 'Provide required access details for support',
    phase: 'access',
    owner_type: 'client',
    sort_order: 80,
  },
  {
    task_key: 'validate_access',
    title: 'Validate access and confirm support reach',
    phase: 'access',
    owner_type: 'kocre',
    sort_order: 90,
  },
  {
    task_key: 'run_support_readiness_review',
    title: 'Run support readiness review',
    phase: 'validation',
    owner_type: 'kocre',
    sort_order: 100,
  },
  {
    task_key: 'complete_first_workflow_test',
    title: 'Complete first support workflow test',
    phase: 'validation',
    owner_type: 'kocre',
    sort_order: 110,
  },
  {
    task_key: 'transition_to_active_support',
    title: 'Transition account to active support',
    phase: 'handoff',
    owner_type: 'kocre',
    sort_order: 120,
  },
]

export function buildDefaultTaskRows(organizationId) {
  return DEFAULT_ONBOARDING_TEMPLATE.map((task) => ({
    organization_id: organizationId,
    task_key: task.task_key,
    title: task.title,
    phase: task.phase,
    owner_type: task.owner_type,
    status: 'not_started',
    sort_order: task.sort_order,
  }))
}

export function sortOnboardingTasks(tasks = []) {
  return [...tasks].sort((a, b) => {
    const phaseOrder = ['contacts', 'discovery', 'documents', 'access', 'validation', 'handoff']
    const phaseDelta =
      phaseOrder.indexOf(a.phase || 'discovery') - phaseOrder.indexOf(b.phase || 'discovery')

    if (phaseDelta !== 0) return phaseDelta
    return (a.sort_order || 100) - (b.sort_order || 100)
  })
}

export function groupOnboardingTasks(tasks = []) {
  return sortOnboardingTasks(tasks).reduce((acc, task) => {
    const phase = task.phase || 'discovery'
    if (!acc[phase]) acc[phase] = []
    acc[phase].push(task)
    return acc
  }, {})
}

export function deriveOnboardingSummary(tasks = []) {
  const total = tasks.length
  const done = tasks.filter((task) => task.status === 'done').length
  const blockedTasks = tasks.filter((task) => task.status === 'blocked')
  const inProgress = tasks.filter((task) => task.status === 'in_progress').length
  const percent = total ? Math.round((done / total) * 100) : 0

  return {
    total,
    done,
    inProgress,
    blocked: blockedTasks.length,
    blockedTitles: blockedTasks.map((task) => task.title),
    percent,
  }
}