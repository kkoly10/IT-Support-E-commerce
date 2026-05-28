'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'

const PLAN_PRICING = {
  starter: { label: 'Starter', price: 499, tickets: 10 },
  growth: { label: 'Growth', price: 999, tickets: 30 },
  scale: { label: 'Scale', price: 1999, tickets: null },
}

function planSummary(plan) {
  const key = String(plan || '').toLowerCase()
  return PLAN_PRICING[key] || PLAN_PRICING.starter
}

export default function BillingPage() {
  const [org, setOrg] = useState(null)
  const [monthlyCount, setMonthlyCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('*, organizations(*)')
        .eq('id', user.id)
        .single()

      if (!profile?.organizations) {
        setLoading(false)
        return
      }
      setOrg(profile.organizations)

      const monthStart = new Date()
      monthStart.setUTCDate(1)
      monthStart.setUTCHours(0, 0, 0, 0)
      const { count } = await supabase
        .from('tickets')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .gte('created_at', monthStart.toISOString())
      setMonthlyCount(count || 0)
      setLoading(false)
    }
    load()
  }, [supabase])

  if (loading) {
    return (
      <div style={{ padding: 0 }}>
        <p style={{ color: 'var(--ink-muted)' }}>Loading billing details…</p>
      </div>
    )
  }

  const plan = planSummary(org?.plan)
  const limit = org?.monthly_ticket_limit ?? plan.tickets
  const paymentStatus = org?.payment_status || 'unknown'
  const atLimit = limit !== null && monthlyCount >= limit

  return (
    <div style={{ padding: 0 }}>
      <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Billing</h1>
      <p style={{ color: 'var(--ink-muted)', fontSize: '0.92rem', marginBottom: 32 }}>
        Your current plan and this month's usage. Invoices are managed directly by Kocre IT.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        <div className="stat-card">
          <div className="stat-card-label">Current plan</div>
          <div className="stat-card-value" style={{ fontSize: '1.4rem' }}>{plan.label}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
            ${plan.price.toLocaleString()} / month
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Tickets this month</div>
          <div
            className="stat-card-value"
            style={{ fontSize: '1.4rem', color: atLimit ? '#b45309' : undefined }}
          >
            {monthlyCount}{limit !== null ? ` / ${limit}` : ''}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
            {limit === null
              ? 'Unlimited on this plan.'
              : atLimit
                ? 'At your monthly allotment — overage will be reviewed.'
                : 'Within your monthly allotment.'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Payment status</div>
          <div className="stat-card-value" style={{ fontSize: '1.4rem', textTransform: 'capitalize' }}>
            {String(paymentStatus).replace(/_/g, ' ')}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
            Invoiced monthly, month-to-month after onboarding.
          </div>
        </div>
      </div>

      <div style={{
        border: '1px solid var(--border-soft, #e5e7eb)',
        borderRadius: 12,
        padding: 20,
        background: 'var(--surface-1, #fff)',
      }}>
        <h2 style={{ fontSize: '1.05rem', marginTop: 0, marginBottom: 8 }}>
          Need an invoice, receipt, or plan change?
        </h2>
        <p style={{ color: 'var(--ink-muted)', fontSize: '0.92rem', marginBottom: 12 }}>
          Email <a href="mailto:hello@kocreit.com">hello@kocreit.com</a> or open a support
          request and we'll handle it directly.
        </p>
        <p style={{ color: 'var(--ink-muted)', fontSize: '0.85rem', margin: 0 }}>
          Self-serve checkout and invoice history will move into this portal as we add
          automated billing — until then, treat this as your current-state snapshot.
        </p>
      </div>
    </div>
  )
}
