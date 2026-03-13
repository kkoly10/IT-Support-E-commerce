import { DEVICE_SUPPORT_STATUSES } from './policies'

function safeString(value) {
  if (value == null) return null
  const next = String(value).trim()
  return next.length ? next : null
}

export function mapProviderDevicePayload(provider, raw = {}) {
  if (provider === 'tactical') {
    return {
      hostname: safeString(raw.hostname || raw.computer_name),
      name: safeString(raw.display_name || raw.hostname || raw.computer_name) || 'Managed Device',
      osFamily: safeString(raw.operating_system || raw.os) || null,
      osVersion: safeString(raw.platform_version || raw.version),
      serialNumber: safeString(raw.serialnumber || raw.serial_number),
      assignedUser: safeString(raw.logged_in_username || raw.assigned_user),
      lastSeenAt: raw.last_seen || raw.check_in_time || null,
      online: !!raw.online,
      supportStatus: raw.online
        ? DEVICE_SUPPORT_STATUSES.ENROLLED
        : DEVICE_SUPPORT_STATUSES.OFFLINE,
      rawInventory: raw,
    }
  }

  if (provider === 'mesh') {
    return {
      hostname: safeString(raw.name || raw.host),
      name: safeString(raw.name) || 'Managed Device',
      osFamily: safeString(raw.osdesc || raw.platform),
      osVersion: safeString(raw.os_version || raw.agent_version),
      serialNumber: safeString(raw.serial),
      assignedUser: safeString(raw.user),
      lastSeenAt: raw.lastconnect || raw.last_seen || null,
      online: !!raw.connected,
      supportStatus: raw.connected
        ? DEVICE_SUPPORT_STATUSES.ENROLLED
        : DEVICE_SUPPORT_STATUSES.OFFLINE,
      rawInventory: raw,
    }
  }

  return {
    hostname: safeString(raw.hostname),
    name: safeString(raw.name) || 'Managed Device',
    osFamily: safeString(raw.os_family),
    osVersion: safeString(raw.os_version),
    serialNumber: safeString(raw.serial_number),
    assignedUser: safeString(raw.assigned_user),
    lastSeenAt: raw.last_seen_at || null,
    online: !!raw.online,
    supportStatus: raw.online
      ? DEVICE_SUPPORT_STATUSES.ENROLLED
      : DEVICE_SUPPORT_STATUSES.OFFLINE,
    rawInventory: raw,
  }
}