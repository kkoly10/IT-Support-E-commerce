import { AUDIT_EVENT_TYPES, writeAuditEvent } from './audit'
import { mapProviderDevicePayload } from './mapper'
import { DEVICE_SUPPORT_STATUSES } from './policies'

function ensureSupabaseClient(supabase) {
  if (!supabase) throw new Error('Supabase client is required.')
  return supabase
}

export async function createPendingDevice(supabase, payload) {
  ensureSupabaseClient(supabase)

  const {
    organizationId,
    actorUserId = null,
    name,
    hostname = null,
    deviceType = 'workstation',
    osFamily = null,
    osVersion = null,
    assignedUser = null,
    siteLabel = null,
    notes = null,
  } = payload

  if (!organizationId) throw new Error('organizationId is required.')
  if (!name) throw new Error('name is required.')

  const { data, error } = await supabase
    .from('devices')
    .insert({
      organization_id: organizationId,
      created_by_user_id: actorUserId,
      name,
      hostname,
      device_type: deviceType,
      os_family: osFamily,
      os_version: osVersion,
      assigned_user: assignedUser,
      site_label: siteLabel,
      support_status: DEVICE_SUPPORT_STATUSES.PENDING_ENROLLMENT,
      notes,
    })
    .select()
    .single()

  if (error) throw error

  await writeAuditEvent(supabase, {
    organizationId,
    deviceId: data.id,
    actorUserId,
    eventType: AUDIT_EVENT_TYPES.DEVICE_CREATED,
    message: `Device "${data.name}" was added in pending enrollment state.`,
    metadata: {
      hostname: data.hostname,
      deviceType: data.device_type,
    },
  })

  return data
}

export async function listOrgDevices(supabase, organizationId) {
  ensureSupabaseClient(supabase)
  if (!organizationId) throw new Error('organizationId is required.')

  const { data, error } = await supabase
    .from('devices')
    .select(`
      *,
      device_agents(*)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getDeviceById(supabase, deviceId) {
  ensureSupabaseClient(supabase)
  if (!deviceId) throw new Error('deviceId is required.')

  const { data, error } = await supabase
    .from('devices')
    .select(`
      *,
      device_agents(*)
    `)
    .eq('id', deviceId)
    .single()

  if (error) throw error
  return data
}

export async function upsertProviderAgent(supabase, payload) {
  ensureSupabaseClient(supabase)

  const {
    organizationId,
    deviceId,
    actorUserId = null,
    provider,
    providerPayload,
    providerDeviceId = null,
    providerAgentId = null,
    meshNodeId = null,
    agentVersion = null,
  } = payload

  if (!organizationId) throw new Error('organizationId is required.')
  if (!deviceId) throw new Error('deviceId is required.')
  if (!provider) throw new Error('provider is required.')

  const mapped = mapProviderDevicePayload(provider, providerPayload || {})

  const { error: deviceUpdateError } = await supabase
    .from('devices')
    .update({
      name: mapped.name,
      hostname: mapped.hostname,
      os_family: mapped.osFamily,
      os_version: mapped.osVersion,
      serial_number: mapped.serialNumber,
      assigned_user: mapped.assignedUser,
      support_status: mapped.supportStatus,
      last_seen_at: mapped.lastSeenAt,
    })
    .eq('id', deviceId)

  if (deviceUpdateError) throw deviceUpdateError

  const { data, error } = await supabase
    .from('device_agents')
    .upsert(
      {
        organization_id: organizationId,
        device_id: deviceId,
        provider,
        provider_device_id: providerDeviceId,
        provider_agent_id: providerAgentId,
        mesh_node_id: meshNodeId,
        agent_version: agentVersion,
        online: mapped.online,
        last_seen_at: mapped.lastSeenAt,
        raw_inventory: mapped.rawInventory,
      },
      {
        onConflict: 'device_id,provider',
      }
    )
    .select()
    .single()

  if (error) throw error

  await writeAuditEvent(supabase, {
    organizationId,
    deviceId,
    actorUserId,
    eventType: AUDIT_EVENT_TYPES.DEVICE_AGENT_SYNCED,
    message: `Device agent mapping for provider "${provider}" was synchronized.`,
    metadata: {
      provider,
      providerDeviceId,
      providerAgentId,
      meshNodeId,
      online: mapped.online,
    },
  })

  return data
}