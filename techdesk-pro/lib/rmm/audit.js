export const AUDIT_EVENT_TYPES = {
  DEVICE_CREATED: 'device_created',
  DEVICE_AGENT_SYNCED: 'device_agent_synced',
  ACCESS_REQUEST_CREATED: 'access_request_created',
  ACCESS_REQUEST_APPROVED: 'access_request_approved',
  ACCESS_REQUEST_DENIED: 'access_request_denied',
  SESSION_STARTED: 'session_started',
  SESSION_ENDED: 'session_ended',
  SESSION_FAILED: 'session_failed',
}

function ensureSupabaseClient(supabase) {
  if (!supabase) {
    throw new Error('Supabase client is required.')
  }

  return supabase
}

export async function writeAuditEvent(supabase, payload) {
  ensureSupabaseClient(supabase)

  const {
    organizationId = null,
    deviceId = null,
    ticketId = null,
    remoteSessionId = null,
    actorUserId = null,
    eventType,
    severity = 'info',
    message,
    metadata = {},
  } = payload

  if (!eventType) throw new Error('eventType is required.')
  if (!message) throw new Error('message is required.')

  const { data, error } = await supabase
    .from('audit_events')
    .insert({
      organization_id: organizationId,
      device_id: deviceId,
      ticket_id: ticketId,
      remote_session_id: remoteSessionId,
      actor_user_id: actorUserId,
      event_type: eventType,
      severity,
      message,
      metadata,
    })
    .select()
    .single()

  if (error) throw error
  return data
}