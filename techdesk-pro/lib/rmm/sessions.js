import { AUDIT_EVENT_TYPES, writeAuditEvent } from './audit'
import {
  ACCESS_REQUEST_STATUSES,
  SESSION_OUTCOMES,
  requestTypeForMode,
  validateSessionMode,
} from './policies'

function ensureSupabaseClient(supabase) {
  if (!supabase) throw new Error('Supabase client is required.')
  return supabase
}

export async function createAccessRequest(supabase, payload) {
  ensureSupabaseClient(supabase)

  const {
    organizationId,
    deviceId = null,
    ticketId = null,
    requestedByUserId = null,
    mode = 'attended',
    reason,
    expiresAt = null,
  } = payload

  if (!organizationId) throw new Error('organizationId is required.')
  if (!reason) throw new Error('reason is required.')

  const requestType = requestTypeForMode(mode)

  const { data, error } = await supabase
    .from('access_requests')
    .insert({
      organization_id: organizationId,
      device_id: deviceId,
      ticket_id: ticketId,
      requested_by_user_id: requestedByUserId,
      request_type: requestType,
      reason,
      status: ACCESS_REQUEST_STATUSES.SUBMITTED,
      expires_at: expiresAt,
    })
    .select()
    .single()

  if (error) throw error

  await writeAuditEvent(supabase, {
    organizationId,
    deviceId,
    ticketId,
    actorUserId: requestedByUserId,
    eventType: AUDIT_EVENT_TYPES.ACCESS_REQUEST_CREATED,
    message: `Access request created for ${requestType}.`,
    metadata: {
      accessRequestId: data.id,
      requestType,
      expiresAt,
    },
  })

  return data
}

export async function approveAccessRequest(supabase, payload) {
  ensureSupabaseClient(supabase)

  const { accessRequestId, approvedByUserId } = payload
  if (!accessRequestId) throw new Error('accessRequestId is required.')

  const { data, error } = await supabase
    .from('access_requests')
    .update({
      status: ACCESS_REQUEST_STATUSES.APPROVED,
      approved_by_user_id: approvedByUserId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', accessRequestId)
    .select()
    .single()

  if (error) throw error

  await writeAuditEvent(supabase, {
    organizationId: data.organization_id,
    deviceId: data.device_id,
    ticketId: data.ticket_id,
    actorUserId: approvedByUserId,
    eventType: AUDIT_EVENT_TYPES.ACCESS_REQUEST_APPROVED,
    message: `Access request "${data.id}" was approved.`,
    metadata: {
      requestType: data.request_type,
      approvedAt: data.approved_at,
    },
  })

  return data
}

export async function startRemoteSessionRecord(supabase, payload) {
  ensureSupabaseClient(supabase)

  const {
    organizationId,
    deviceId = null,
    ticketId = null,
    accessRequestId = null,
    startedByUserId = null,
    provider = 'mesh',
    mode = 'attended',
    launchMethod = 'new_tab',
    providerSessionRef = null,
    providerLaunchUrl = null,
    reason = null,
  } = payload

  if (!organizationId) throw new Error('organizationId is required.')
  if (!deviceId) throw new Error('deviceId is required.')

  const sessionMode = validateSessionMode(mode)

  const { data, error } = await supabase
    .from('remote_sessions')
    .insert({
      organization_id: organizationId,
      device_id: deviceId,
      ticket_id: ticketId,
      access_request_id: accessRequestId,
      started_by_user_id: startedByUserId,
      provider,
      session_mode: sessionMode,
      launch_method: launchMethod,
      provider_session_ref: providerSessionRef,
      provider_launch_url: providerLaunchUrl,
      reason,
    })
    .select()
    .single()

  if (error) throw error

  await writeAuditEvent(supabase, {
    organizationId,
    deviceId,
    ticketId,
    remoteSessionId: data.id,
    actorUserId: startedByUserId,
    eventType: AUDIT_EVENT_TYPES.SESSION_STARTED,
    message: `Remote session started in ${sessionMode} mode.`,
    metadata: {
      provider,
      launchMethod,
      providerSessionRef,
    },
  })

  return data
}

export async function endRemoteSessionRecord(supabase, payload) {
  ensureSupabaseClient(supabase)

  const {
    remoteSessionId,
    actorUserId = null,
    summary = null,
    outcome = SESSION_OUTCOMES.COMPLETED,
  } = payload

  if (!remoteSessionId) throw new Error('remoteSessionId is required.')

  const { data, error } = await supabase
    .from('remote_sessions')
    .update({
      ended_at: new Date().toISOString(),
      summary,
      outcome,
    })
    .eq('id', remoteSessionId)
    .select()
    .single()

  if (error) throw error

  await writeAuditEvent(supabase, {
    organizationId: data.organization_id,
    deviceId: data.device_id,
    ticketId: data.ticket_id,
    remoteSessionId: data.id,
    actorUserId,
    eventType:
      outcome === SESSION_OUTCOMES.FAILED
        ? AUDIT_EVENT_TYPES.SESSION_FAILED
        : AUDIT_EVENT_TYPES.SESSION_ENDED,
    severity: outcome === SESSION_OUTCOMES.FAILED ? 'warning' : 'info',
    message:
      outcome === SESSION_OUTCOMES.FAILED
        ? `Remote session "${data.id}" ended with a failure outcome.`
        : `Remote session "${data.id}" ended.`,
    metadata: {
      outcome,
      summary,
    },
  })

  return data
}