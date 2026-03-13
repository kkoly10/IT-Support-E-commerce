const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on'])

function envFlag(value, fallback = false) {
  if (value == null) return fallback
  return TRUE_VALUES.has(String(value).trim().toLowerCase())
}

function cleanUrl(value) {
  if (!value) return ''
  return String(value).replace(/\/+$/, '')
}

export const RMM_CONFIG = {
  provider: process.env.RMM_PROVIDER || 'tactical',
  tacticalBaseUrl: cleanUrl(process.env.TACTICAL_BASE_URL),
  tacticalApiUrl: cleanUrl(process.env.TACTICAL_API_URL),
  tacticalApiKey: process.env.TACTICAL_API_KEY || '',
  meshBaseUrl: cleanUrl(process.env.MESH_BASE_URL),
  meshAdminUser: process.env.MESH_ADMIN_USER || '',
  meshAdminPassword: process.env.MESH_ADMIN_PASSWORD || '',
  defaultMode: process.env.RMM_DEFAULT_MODE || 'attended',
  defaultLaunchMethod: process.env.RMM_SESSION_LAUNCH_METHOD || 'new_tab',
  requireApprovalForAttended: envFlag(process.env.RMM_REQUIRE_APPROVAL_FOR_ATTENDED, true),
  requireOnboardingForUnattended: envFlag(
    process.env.RMM_REQUIRE_ONBOARDING_FOR_UNATTENDED,
    true
  ),
}

export function assertRmmConfig() {
  if (RMM_CONFIG.provider === 'tactical') {
    const missing = []
    if (!RMM_CONFIG.tacticalBaseUrl) missing.push('TACTICAL_BASE_URL')
    if (!RMM_CONFIG.tacticalApiUrl) missing.push('TACTICAL_API_URL')
    if (!RMM_CONFIG.tacticalApiKey) missing.push('TACTICAL_API_KEY')
    if (!RMM_CONFIG.meshBaseUrl) missing.push('MESH_BASE_URL')

    if (missing.length) {
      throw new Error(`Missing RMM env values: ${missing.join(', ')}`)
    }
  }

  return RMM_CONFIG
}

export function isAttendedMode(mode) {
  return (mode || '').toLowerCase() !== 'unattended'
}

export function isUnattendedMode(mode) {
  return (mode || '').toLowerCase() === 'unattended'
}