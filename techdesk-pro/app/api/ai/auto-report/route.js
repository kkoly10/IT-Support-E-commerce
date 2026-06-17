// File: app/api/ai/auto-report/route.js (new — mkdir -p app/api/ai/auto-report)

import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '../../../../lib/supabase/route-auth'
import {
  businessHoursBetween,
  getFirstAgentReplyAt,
  getResponseTargetHours,
} from '../../../../lib/sla'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const auth = await requireAdmin()
    if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

    const { organizationId, month } = await request.json()

    if (!organizationId) {
      return Response.json({ error: 'Missing organizationId' }, { status: 400 })
    }

    if (month && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return Response.json({ error: 'Invalid month — expected YYYY-MM.' }, { status: 400 })
    }

    const reportMonth = month || new Date().toISOString().slice(0, 7)
    const startDate = `${reportMonth}-01`
    // Pure string arithmetic — mixing a UTC date parse with local-time
    // .setMonth() shifted month boundaries on negative-UTC-offset servers.
    const [reportYear, reportMonthNum] = reportMonth.split('-').map(Number)
    const endDate =
      reportMonthNum === 12
        ? `${reportYear + 1}-01-01`
        : `${reportYear}-${String(reportMonthNum + 1).padStart(2, '0')}-01`

    // Get org info
    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single()

    if (!org) return Response.json({ error: 'Org not found' }, { status: 404 })

    // Get tickets for the month
    const { data: tickets } = await supabase
      .from('tickets')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate)
      .lt('created_at', endDate)

    const totalTickets = tickets?.length || 0
    const resolved = tickets?.filter(t => t.status === 'resolved' || t.status === 'closed').length || 0
    const open = tickets?.filter(t => t.status === 'open' || t.status === 'in_progress').length || 0

    // Calculate avg response time and SLA compliance from ticket_messages.
    // First response = earliest non-internal agent/AI reply. Elapsed time is
    // measured in business hours, ET Mon–Fri 9–18.
    //
    // slaCompliance is "of tickets we responded to this month, % that hit
    // the plan's first-response target." Un-responded tickets are excluded
    // from both numerator and denominator — the metric is null when there
    // are no responses to measure, rather than pretending 100% on no data.
    // When the plan has no agreed target (pending fit review), compliance
    // is null regardless.
    const targetHours = getResponseTargetHours(org.plan)
    const ticketResponseHours = []
    let slaCompliantCount = 0
    let withResponseCount = 0

    for (const ticket of tickets || []) {
      const { data: msgs } = await supabase
        .from('ticket_messages')
        .select('sender_type, is_internal_note, created_at')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true })

      const firstReplyAt = getFirstAgentReplyAt(msgs)
      if (!firstReplyAt) continue

      withResponseCount += 1
      const hours = businessHoursBetween(ticket.created_at, firstReplyAt)
      ticketResponseHours.push(hours)
      if (targetHours !== null && hours <= targetHours) slaCompliantCount += 1
    }

    // Keep these numeric (1 decimal) — monthly_reports columns are numeric and
    // .toFixed() strings were being written into them.
    const avgResponseHours = ticketResponseHours.length > 0
      ? Math.round((ticketResponseHours.reduce((s, h) => s + h, 0) / ticketResponseHours.length) * 10) / 10
      : null

    // Calculate avg resolution time
    const withResolution = tickets?.filter(t => t.resolved_at && t.created_at) || []
    let avgResolutionHours = null
    if (withResolution.length > 0) {
      const totalHours = withResolution.reduce((sum, t) => {
        return sum + (new Date(t.resolved_at) - new Date(t.created_at)) / (1000 * 60 * 60)
      }, 0)
      avgResolutionHours = Math.round((totalHours / withResolution.length) * 10) / 10
    }

    // Category breakdown
    const categories = {}
    tickets?.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + 1
    })

    // Get ratings for the month
    const { data: ratings } = await supabase
      .from('ticket_ratings')
      .select('rating')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate)
      .lt('created_at', endDate)

    const avgRating = ratings?.length > 0
      ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
      : null

    // Get training compliance
    const { data: trainingStatuses } = await supabase
      .from('training_assignment_status')
      .select('status')
      .eq('organization_id', organizationId)

    const trainingTotal = trainingStatuses?.length || 0
    const trainingComplete = trainingStatuses?.filter(s => s.status === 'completed').length || 0
    const trainingRate = trainingTotal > 0 ? Math.round((trainingComplete / trainingTotal) * 100) : null

    // SLA compliance: % of responded tickets that hit the plan's first-response
    // target (business hours). null when there's no response data — better than
    // pretending 100% on an empty month.
    const slaCompliance = targetHours === null
      ? null
      : withResponseCount > 0
        ? Math.round((slaCompliantCount / withResponseCount) * 100)
        : null

    // Generate AI recommendations
    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: 'You are a managed IT services consultant writing the recommendations section of a monthly client report. Be specific, actionable, and concise. Write 3-5 bullet points.',
        messages: [{
          role: 'user',
          content: `Write recommendations for ${org.name} based on their monthly IT report:
- Total tickets: ${totalTickets} (${resolved} resolved, ${open} still open)
- First-response target for this plan: ${targetHours !== null ? `${targetHours} business hours` : 'not yet agreed (pending fit review)'}
- Tickets with a recorded first response this month: ${withResponseCount}
- Avg first response: ${avgResponseHours !== null ? avgResponseHours + ' business hours' : 'N/A (no responses recorded)'}
- Avg resolution time: ${avgResolutionHours || 'N/A'} hours
- First-response compliance: ${slaCompliance !== null ? slaCompliance + '%' : 'N/A (no responses recorded)'}
- Category breakdown: ${JSON.stringify(categories)}
- Satisfaction rating: ${avgRating || 'N/A'}/5
- Training compliance: ${trainingRate !== null ? trainingRate + '%' : 'N/A'}
- Plan: ${org.plan}
- Platform: ${org.platform || 'Not specified'}

Give 3-5 specific, actionable recommendations. Return as a JSON array of strings.`
        }],
      }),
    })

    let recommendations = []
    let aiError = null
    if (aiResponse.ok) {
      const aiData = await aiResponse.json()
      const blocks = Array.isArray(aiData?.content) ? aiData.content : []
      const text = blocks.map((b) => b?.text || '').join('')
      try {
        const cleaned = text.replace(/```json\n?|```/g, '').trim()
        const parsed = JSON.parse(cleaned)
        // The prompt asks for a JSON array of strings; valid-but-wrong-shape
        // output (object/number) must not crash the report after the AI spend.
        recommendations = Array.isArray(parsed) ? parsed.map(String) : text ? [text] : []
      } catch {
        recommendations = text ? [text] : []
      }
    } else {
      // Surface persistent key/billing failures instead of silently shipping a
      // report with empty recommendations.
      aiError = `Recommendations unavailable: AI request failed (${aiResponse.status}).`
      console.error('AutoReport AI failure:', aiResponse.status, await aiResponse.text().catch(() => ''))
    }

    // Build report data
    const reportData = {
      organization: org.name,
      plan: org.plan,
      report_month: reportMonth,
      generated_at: new Date().toISOString(),
      summary: {
        total_tickets: totalTickets,
        resolved: resolved,
        open: open,
        avg_response_hours: avgResponseHours,
        avg_resolution_hours: avgResolutionHours,
        sla_compliance: slaCompliance,
        satisfaction_rating: avgRating,
        training_compliance: trainingRate,
      },
      categories,
      recommendations,
      ...(aiError ? { ai_error: aiError } : {}),
    }

    // Save to monthly_reports table
    const { error: upsertError } = await supabase.from('monthly_reports').upsert({
      organization_id: organizationId,
      report_month: startDate,
      tickets_opened: totalTickets,
      tickets_resolved: resolved,
      avg_response_time_hours: avgResponseHours,
      avg_resolution_time_hours: avgResolutionHours,
      sla_compliance_pct: slaCompliance,
      top_categories: categories,
      recommendations: recommendations.length > 0 ? recommendations.join('\n') : null,
    }, {
      onConflict: 'organization_id,report_month',
    })
    if (upsertError) {
      console.error('AutoReport save failed:', upsertError)
      return Response.json(
        { error: `Report computed but could not be saved: ${upsertError.message}` },
        { status: 500 }
      )
    }

    return Response.json(reportData)

  } catch (err) {
    console.error('AutoReport error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}