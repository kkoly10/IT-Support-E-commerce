export function deriveSupportReadiness({
  organization = {},
  tasks = [],
  contacts = [],
  accessRows = [],
  documents = [],
}) {
  const blockedTasks = tasks.filter((task) => task.status === 'blocked')
  const doneTasks = tasks.filter((task) => task.status === 'done').length
  const checklistPercent = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0

  const hasPrimaryContact = contacts.some((c) => c.is_primary_contact)
  const hasAuthorizedRequester = contacts.some((c) => c.is_authorized_requester)
  const hasEmergencyCoverage =
    contacts.some((c) => c.receives_emergency_notices) ||
    contacts.some((c) => c.role_type === 'emergency')
  const hasSecurityCoverage =
    contacts.some((c) => c.receives_security_notices) ||
    contacts.some((c) => c.role_type === 'security')

  const approvedAccess = accessRows.filter((row) => row.status === 'approved').length
  const accessSubmitted = accessRows.length > 0

  const uploadedDocs = documents.length
  const reviewedDocs = documents.filter((doc) => doc.status === 'reviewed').length

  const discoveryCompleted = !!organization.discovery_completed
  const discoveryReviewed = organization.discovery_review_status === 'reviewed'

  const checks = [
    {
      key: 'discovery_completed',
      label: 'Discovery questionnaire completed',
      passed: discoveryCompleted,
    },
    {
      key: 'discovery_reviewed',
      label: 'Discovery reviewed by Kocre IT',
      passed: discoveryReviewed,
    },
    {
      key: 'primary_contact',
      label: 'Primary contact present',
      passed: hasPrimaryContact,
    },
    {
      key: 'authorized_requester',
      label: 'Authorized requester present',
      passed: hasAuthorizedRequester,
    },
    {
      key: 'emergency_coverage',
      label: 'Emergency contact coverage',
      passed: hasEmergencyCoverage,
    },
    {
      key: 'security_coverage',
      label: 'Security contact coverage',
      passed: hasSecurityCoverage,
    },
    {
      key: 'access_submitted',
      label: 'Access items submitted',
      passed: accessSubmitted,
    },
    {
      key: 'access_approved',
      label: 'At least one access item approved',
      passed: approvedAccess > 0,
    },
    {
      key: 'documents_uploaded',
      label: 'Documents uploaded',
      passed: uploadedDocs > 0,
    },
    {
      key: 'documents_reviewed',
      label: 'At least one document reviewed',
      passed: reviewedDocs > 0,
    },
    {
      key: 'checklist_progress',
      label: 'Checklist is at least 70% complete',
      passed: checklistPercent >= 70,
    },
    {
      key: 'no_blockers',
      label: 'No blocked onboarding tasks',
      passed: blockedTasks.length === 0,
    },
  ]

  const passedCount = checks.filter((item) => item.passed).length
  const percent = Math.round((passedCount / checks.length) * 100)
  const blockers = checks.filter((item) => !item.passed).map((item) => item.label)
  const ready = blockers.length === 0

  return {
    ready,
    percent,
    checklistPercent,
    blockers,
    checks,
    metrics: {
      approvedAccess,
      accessSubmitted,
      uploadedDocs,
      reviewedDocs,
      blockedTasks: blockedTasks.length,
    },
  }
}