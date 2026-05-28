'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'

// Plan catalog mirrors the homepage PLAN_CATALOG so the portal tells the same
// story as the public site. Legacy ticket-credit plans are kept so any org
// still seeded with starter/growth/scale renders honestly with the original
// terms they signed up under.
const PLAN_CATALOG = {
  pending: {
    label: 'Plan to be confirmed',
    pricing: { type: 'pending' },
    note: 'Plan and pricing are confirmed during the fit review before activation.',
  },
  founding: {
    label: 'Founding Managed Support',
    pricing: { type: 'flat', monthly: 399 },
    note: '90-day pilot · up to 5 users / 5 Windows devices',
    fairUseTickets: 30,
  },
  remote: {
    label: 'Remote Desk',
    pricing: { type: 'per_user', perUser: 49, monthlyMin: 299 },
    note: 'Per supported user · helpdesk and cloud account support',
  },
  managed: {
    label: 'Managed Desk',
    pricing: { type: 'per_user', perUser: 89, monthlyMin: 499 },
    note: 'Per supported user · includes one managed Windows device per user',
  },
  secure: {
    label: 'Secure Desk',
    pricing: { type: 'per_user', perUser: 129, monthlyMin: 899 },
    note: 'Per supported user · includes basic security hygiene reviews',
  },
  custom: {
    label: 'Custom Review',
    pricing: { type: 'quote' },
    note: 'Tailored scope · invoiced per signed quote',
  },
  // Legacy ticket-credit plans — kept so existing accounts render honestly
  // with the terms they signed up under. Migrate these to the new keys when
  // the underlying contract is renewed.
  starter: {
    label: 'Starter (legacy)',
    pricing: { type: 'flat', monthly: 499 },
    legacy: true,
    legacyTicketLimit: 10,
    note: 'Legacy ticket-credit plan · 10 standard tickets/month',
  },
  growth: {
    label: 'Growth (legacy)',
    pricing: { type: 'flat', monthly: 999 },
    legacy: true,
    legacyTicketLimit: 30,
    note: 'Legacy ticket-credit plan · 30 standard tickets/month',
  },
  scale: {
    label: 'Scale (legacy)',
    pricing: { type: 'flat', monthly: 1999 },
    legacy: true,
    legacyTicketLimit: null,
    note: 'Legacy ticket-credit plan · custom ticket volume',
  },
}

function getPlan(key) {
  return PLAN_CATALOG[String(key || '').toLowerCase()] || PLAN_CATALOG.pending
}

function computeMonthlyCost(plan, userCount) {
  if (plan.pricing.type === 'flat') return plan.pricing.monthly
  if (plan.pricing.type === 'per_user') {
    const safeCount = Math.max(1, userCount || 0)
    return Math.max(plan.pricing.perUser * safeCount, plan.pricing.monthlyMin)
  }
  return null
}

function priceLine(plan, userCount) {
  if (plan.pricing.type === 'flat') {
    return `$${plan.pricing.monthly.toLocaleString()} / month`
  }
  if (plan.pricing.type === 'per_user') {
    const cost = computeMonthlyCost(plan, userCount)
    return `$${cost.toLocaleString()} / month · $${plan.pricing.perUser}/user × ${userCount || 1}, $${plan.pricing.monthlyMin} minimum`
  }
  if (plan.pricing.type === 'pending') {
    return 'Set during fit review'
  }
  return 'Quoted by review'
}

export default function BillingPage() {
  const [org, setOrg] = useState(null)
  const [userCount, setUserCount] = useState(1)
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

      const [ticketCountRes, userCountRes] = await Promise.all([
        supabase
          .from('tickets')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', profile.organization_id)
          .gte('created_at', monthStart.toISOString()),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', profile.organization_id),
      ])

      setMonthlyCount(ticketCountRes.count || 0)
      setUserCount(userCountRes.count || 1)
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

  const plan = getPlan(org?.plan)
  const paymentStatus = org?.payment_status || 'unknown'
  const isQuote = plan.pricing.type === 'quote'
  const isPending = plan.pricing.type === 'pending'

  // For legacy plans the "/ Y" denominator still has meaning. For new plans
  // we measure usage but don't pretend a hard ticket cap exists.
  const legacyTicketLimit = plan.legacy ? plan.legacyTicketLimit : null
  const fairUseSoftCap = plan.fairUseTickets ?? null
  const overLegacyLimit = legacyTicketLimit !== null && monthlyCount >= legacyTicketLimit
  const overFairUse = fairUseSoftCap !== null && monthlyCount >= fairUseSoftCap

  return (
    <div style={{ padding: 0 }}>
      <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Billing</h1>
      <p style={{ color: 'var(--ink-muted)', fontSize: '0.92rem', marginBottom: 32 }}>
        Your current plan and this month's usage. Invoices are managed directly by Kocre IT.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        <div className="stat-card">
          <div className="stat-card-label">Current plan</div>
          <div className="stat-card-value" style={{ fontSize: '1.35rem' }}>{plan.label}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', marginTop: 4 }}>
            {priceLine(plan, userCount)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: 6 }}>
            {plan.note}
          </div>
        </div>

        {plan.pricing.type === 'per_user' && (
          <div className="stat-card">
            <div className="stat-card-label">Supported users</div>
            <div className="stat-card-value" style={{ fontSize: '1.35rem' }}>{userCount}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
              Counted from your portal profiles. Adjust your roster through Settings or contact support.
            </div>
          </div>
        )}

        <div className="stat-card">
          <div className="stat-card-label">Tickets this month</div>
          <div
            className="stat-card-value"
            style={{
              fontSize: '1.35rem',
              color: overLegacyLimit || overFairUse ? '#b45309' : undefined,
            }}
          >
            {monthlyCount}
            {legacyTicketLimit !== null && ` / ${legacyTicketLimit}`}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
            {legacyTicketLimit !== null
              ? overLegacyLimit
                ? 'At your legacy plan’s monthly allotment — overage will be reviewed.'
                : 'Within your legacy plan’s monthly allotment.'
              : isQuote
                ? 'Fair-use volume is defined in your signed quote.'
                : isPending
                  ? 'Tracked from day one — fair-use limits are set when your plan is confirmed.'
                  : overFairUse
                    ? 'Above this plan’s typical fair-use range — we may flag this for review.'
                    : 'Per-user plans use fair-use volumes rather than a hard ticket cap.'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Payment status</div>
          <div className="stat-card-value" style={{ fontSize: '1.35rem', textTransform: 'capitalize' }}>
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
