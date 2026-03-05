// File: app/api/ai/auto-report/route.js (new — mkdir -p app/api/ai/auto-report)

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { organizationId, month } = await request.json()

    if (!organizationId) {
      return Response.json({ error: 'Missing organizationId' }, { status: 400 })
    }

    const reportMonth = month || new Date().toISOString().slice(0, 7)
    const startDate = `${reportMonth}-01`
    const endDate = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 1)).toISOString().slice(0, 10)

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

    // Calculate avg response time
    const withResponse = tickets?.filter(t => t.first_response_at && t.created_at) || []
    let avgResponseHours = null
    if (withResponse.length > 0) {
      const totalHours = withResponse.reduce((sum, t) => {
        return sum + (new Date(t.first_response_at) - new Date(t.created_at)) / (1000 * 60 * 60)
      }, 0)
      avgResponseHours = (totalHours / withResponse.length).toFixed(1)
    }

    // Calculate avg resolution time
    const withResolution = tickets?.filter(t => t.resolved_at && t.created_at) || []
    let avgResolutionHours = null
    if (withResolution.length > 0) {
      const totalHours = withResolution.reduce((sum, t) => {
        return sum + (new Date(t.resolved_at) - new Date(t.created_at)) / (1000 * 60 * 60)
      }, 0)
      avgResolutionHours = (totalHours / withResolution.length).toFixed(1)
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

    // SLA compliance
    const slaBreached = tickets?.filter(t => t.sla_breached).length || 0
    const slaCompliance = totalTickets > 0 ? Math.round(((totalTickets - slaBreached) / totalTickets) * 100) : 100

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
- Avg response time: ${avgResponseHours || 'N/A'} hours
- Avg resolution time: ${avgResolutionHours || 'N/A'} hours
- SLA compliance: ${slaCompliance}%
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
    if (aiResponse.ok) {
      const aiData = await aiResponse.json()
      const text = aiData.content.map(b => b.text || '').join('')
      try {
        const cleaned = text.replace(/```json\n?|```/g, '').trim()
        recommendations = JSON.parse(cleaned)
      } catch {
        recommendations = [text]
      }
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
    }

    // Save to monthly_reports table
    await supabase.from('monthly_reports').upsert({
      organization_id: organizationId,
      report_month: startDate,
      tickets_opened: totalTickets,
      tickets_resolved: resolved,
      avg_response_time_hours: avgResponseHours,
      avg_resolution_time_hours: avgResolutionHours,
      sla_compliance_pct: slaCompliance,
      top_categories: categories,
      recommendations: recommendations.join('\n'),
    }, {
      onConflict: 'organization_id,report_month',
    })

    return Response.json(reportData)

  } catch (err) {
    console.error('AutoReport error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}