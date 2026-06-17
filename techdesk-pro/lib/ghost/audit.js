import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function logGhostEvent({
  actorUserId = null,
  entityType,
  entityId = null,
  actionType,
  routeName = null,
  outcomeStatus = 'success',
  summary = '',
  inputPayload = {},
  outputPayload = {},
}) {
  try {
    // supabase-js returns errors rather than throwing — check explicitly so a
    // rejected audit write is at least visible in server logs.
    const { error } = await supabase.from('ghost_activity_logs').insert({
      actor_user_id: actorUserId,
      entity_type: entityType,
      entity_id: entityId ? String(entityId) : null,
      action_type: actionType,
      route_name: routeName,
      outcome_status: outcomeStatus,
      summary,
      input_payload: inputPayload || {},
      output_payload: outputPayload || {},
    })

    if (error) {
      console.error('Ghost audit log insert rejected:', error, { actionType, entityType, entityId })
    }
  } catch (err) {
    console.error('Ghost audit log error:', err)
  }
}