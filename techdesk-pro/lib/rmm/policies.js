import { RMM_CONFIG, isAttendedMode, isUnattendedMode } from './config'

export const ACCESS_REQUEST_TYPES = {
  ATTENDED_REMOTE: 'attended_remote',
  UNATTENDED_SETUP: 'unattended_setup',
  PASSWORD_RESET: 'password_reset',
  ADMIN_ACCESS: 'admin_access',
  GENERAL_SUPPORT: 'general_support',
}

export const ACCESS_REQUEST_STATUSES = {
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  DENIED: 'denied',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
}

export const DEVICE_SUPPORT_STATUSES = {
  PENDING_ENROLLMENT: 'pending_enrollment',
  ENROLLED: 'enrolled',
  OFFLINE: 'offline',
  RETIRED: 'retired',
  ERROR: 'error',
}

export const SESSION_OUTCOMES = {
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
  ESCALATED: 'escalated',
}

export function validateSessionMode(mode) {
  return isUnattendedMode(mode) ? 'unattended' : 'attended'
}

export function requestTypeForMode(mode) {
  return isUnattendedMode(mode)
    ? ACCESS_REQUEST_TYPES.UNATTENDED_SETUP
    : ACCESS_REQUEST_TYPES.ATTENDED_REMOTE
}

export function deviceAllowsUnattended(device) {
  return !!device?.unattended_access_approved && !device?.is_attended_only
}

export function requiresAccessRequest({ mode, device }) {
  if (isUnattendedMode(mode)) {
    return false
  }

  if (!RMM_CONFIG.requireApprovalForAttended) {
    return false
  }

  return true
}

export function buildSessionPolicyDecision({ mode, device, accessRequest }) {
  const normalizedMode = validateSessionMode(mode)

  if (!device) {
    return {
      allowed: false,
      code: 'device_missing',
      reason: 'Device not found.',
    }
  }

  if (device.support_status === DEVICE_SUPPORT_STATUSES.RETIRED) {
    return {
      allowed: false,
      code: 'device_retired',
      reason: 'This device is retired and cannot be used for remote support.',
    }
  }

  if (isUnattendedMode(normalizedMode)) {
    if (RMM_CONFIG.requireOnboardingForUnattended && !deviceAllowsUnattended(device)) {
      return {
        allowed: false,
        code: 'unattended_not_approved',
        reason: 'Unattended access has not been approved for this device.',
      }
    }

    return {
      allowed: true,
      mode: 'unattended',
      requestRequired: false,
    }
  }

  const requestRequired = requiresAccessRequest({ mode: normalizedMode, device })

  if (!requestRequired) {
    return {
      allowed: true,
      mode: 'attended',
      requestRequired: false,
    }
  }

  if (!accessRequest) {
    return {
      allowed: false,
      code: 'access_request_required',
      reason: 'An approved attended access request is required before starting a session.',
    }
  }

  if (accessRequest.status !== ACCESS_REQUEST_STATUSES.APPROVED) {
    return {
      allowed: false,
      code: 'access_request_not_approved',
      reason: 'The related access request is not approved.',
    }
  }

  if (accessRequest.expires_at && new Date(accessRequest.expires_at).getTime() < Date.now()) {
    return {
      allowed: false,
      code: 'access_request_expired',
      reason: 'The related access request has expired.',
    }
  }

  return {
    allowed: true,
    mode: 'attended',
    requestRequired: true,
  }
}