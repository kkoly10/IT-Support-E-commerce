// File: app/api/ai/sentinel/route.js (new — mkdir -p app/api/ai/sentinel)

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Vercel Cron calls this every hour
export async function GET(request) {
  // Verify cron secret (optional but recommended)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const results = []

    // Get all organizations with store URLs
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name, store_url, website_url, platform')

    for (const org of (orgs || [])) {
      const checks = []

      // Check store URL if exists
      if (org.store_url) {
        const storeCheck = await checkUrl(org.store_url, 'store')
        checks.push(storeCheck)
      }

      // Check website URL if exists
      if (org.website_url) {
        const siteCheck = await checkUrl(org.website_url, 'website')
        checks.push(siteCheck)
      }

      // Check for SLA breaches
      const slaCheck = await checkSLABreaches(org.id)
      if (slaCheck) checks.push(slaCheck)

      // Check ticket volume anomalies
      const volumeCheck = await checkTicketVolume(org.id, org.name)
      if (volumeCheck) checks.push(volumeCheck)

      // Log all findings
      for (const check of checks) {
        await supabase.from('activity_log').insert({
          organization_id: org.id,
          action: check.action,
          resource_type: 'sentinel_check',
          metadata: {
            type: check.type,
            status: check.status,
            message: check.message,
            url: check.url || null,
            severity: check.severity,
            auto_healed: check.auto_healed || false,
            checked_at: new Date().toISOString(),
          },
        })

        // If critical issue found, auto-create a ticket
        if (check.severity === 'critical' && !check.auto_healed) {
          await autoCreateTicket(org.id, check)
        }

        results.push({ org: org.name, ...check })
      }
    }

    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      checks_run: results.length,
      results,
    })

  } catch (err) {
    console.error('Sentinel error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

async function checkUrl(url, type) {
  try {
    const startTime = Date.now()
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000), // 10s timeout
    })
    const responseTime = Date.now() - startTime

    if (!response.ok) {
      return {
        type,
        action: `${type}_down`,
        status: 'error',
        severity: 'critical',
        message: `${type} returned HTTP ${response.status}`,
        url,
        response_time: responseTime,
      }
    }

    if (responseTime > 5000) {
      return {
        type,
        action: `${type}_slow`,
        status: 'warning',
        severity: 'warning',
        message: `${type} is slow (${(responseTime / 1000).toFixed(1)}s response time)`,
        url,
        response_time: responseTime,
      }
    }

    return {
      type,
      action: `${type}_healthy`,
      status: 'healthy',
      severity: 'info',
      message: `${type} is up (${responseTime}ms)`,
      url,
      response_time: responseTime,
    }
  } catch (err) {
    return {
      type,
      action: `${type}_unreachable`,
      status: 'error',
      severity: 'critical',
      message: `${type} is unreachable: ${err.message}`,
      url,
    }
  }
}

async function checkSLABreaches(orgId) {
  const { data: tickets } = await supabase
    .from('tickets')
    .select('id, title, created_at, sla_response_hours, first_response_at')
    .eq('organization_id', orgId)
    .eq('status', 'open')
    .is('first_response_at', null)

  const breached = (tickets || []).filter(t => {
    if (!t.sla_response_hours) return false
    const hoursOpen = (Date.now() - new Date(t.created_at).getTime()) / (1000 * 60 * 60)
    return hoursOpen > t.sla_response_hours
  })

  if (breached.length > 0) {
    return {
      type: 'sla',
      action: 'sla_breach_detected',
      status: 'warning',
      severity: 'warning',
      message: `${breached.length} ticket${breached.length > 1 ? 's' : ''} breaching SLA: ${breached.map(t => `"${t.title}"`).join(', ')}`,
    }
  }
  return null
}

async function checkTicketVolume(orgId, orgName) {
  // Get tickets in last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: recentTickets } = await supabase
    .from('tickets')
    .select('id')
    .eq('organization_id', orgId)
    .gte('created_at', oneDayAgo)

  // Get average daily tickets over last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: monthTickets } = await supabase
    .from('tickets')
    .select('id')
    .eq('organization_id', orgId)
    .gte('created_at', thirtyDaysAgo)

  const todayCount = recentTickets?.length || 0
  const avgDaily = ((monthTickets?.length || 0) / 30)

  if (todayCount > 0 && avgDaily > 0 && todayCount > avgDaily * 3) {
    return {
      type: 'volume',
      action: 'ticket_spike_detected',
      status: 'warning',
      severity: 'warning',
      message: `${orgName} has ${todayCount} tickets in last 24h (3x their average of ${avgDaily.toFixed(1)}/day). Possible incident.`,
    }
  }
  return null
}

async function autoCreateTicket(orgId, check) {
  // Get an admin profile to assign
  const { data: admin } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .single()

  await supabase.from('tickets').insert({
    organization_id: orgId,
    created_by: admin?.id,
    title: `🤖 Sentinel Alert: ${check.message}`,
    description: `Sentinel AI detected an issue:\n\nType: ${check.type}\nSeverity: ${check.severity}\nDetails: ${check.message}\n\nThis ticket was auto-created by the monitoring system.`,
    category: 'it_support',
    priority: check.severity === 'critical' ? 'urgent' : 'high',
    status: 'open',
  })
}