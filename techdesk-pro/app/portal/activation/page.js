'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { checksFor, formatOrderAmount, ORDER_STATUS_LABELS } from '../../../lib/client-activation.js'
import { SERVICE_CATALOG } from '../../../lib/service-catalog.js'

const panel = { background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 22, marginBottom: 18 }
const muted = { color: 'var(--ink-muted)', fontSize: '.9rem', lineHeight: 1.7 }
const actionStyle = { padding: '11px 17px', background: 'var(--teal)', border: 0, borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 600 }
const money = (value) => value == null ? 'Not applicable' : formatOrderAmount(value)

export default function ClientActivationPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [acceptedName, setAcceptedName] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const response = await fetch('/api/client-activation', { cache: 'no-store' })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Unable to retrieve your offer.')
      setData(result)
      setError('')
    } catch (err) { setError(err.message || 'Unable to retrieve your offer.') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function submit(action, order) {
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      const response = await fetch('/api/client-activation', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action, orderId: order.id, expectedRevision: order.revision,
          ...(action === 'accept' ? { acceptedName, acknowledged } : {}),
        }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Could not update this offer.')
      setNotice(action === 'accept' ? 'Your quote acceptance was recorded. Kocre will coordinate the next setup steps.' : 'Your decision was recorded.')
      await load()
      window.dispatchEvent(new Event('kocre:workspace-updated'))
    } catch (err) { setError(err.message || 'Could not update this offer.') }
    finally { setBusy(false) }
  }

  const order = data?.orders?.find((row) => ['offered', 'accepted', 'onboarding', 'active'].includes(row.status)) || data?.orders?.[0]
  const selectedService = data?.selection?.service
  const serviceName = order ? (SERVICE_CATALOG[order.service_key]?.name || 'Custom service') : null
  const activationSynchronized = !order || order.status !== 'active' ||
    (data?.organization?.clientStatus === 'active' && data?.organization?.plan === order.service_key)
  const statusLabel = order?.status === 'active' && !activationSynchronized
    ? 'Finalizing activation' : (ORDER_STATUS_LABELS[order?.status] || order?.status)

  return <div style={{ maxWidth: 960 }}>
    <header className="portal-page-header" style={{ marginBottom: 24 }}>
      <h1 style={{ fontSize: '1.65rem', marginBottom: 6 }}>Your offer &amp; activation</h1>
      <p style={muted}>Your written service scope, acceptance and setup status in one place. Kocre confirms when support actually goes live.</p>
    </header>
    {loading && <p role="status">Loading your activation record…</p>}
    {error && <div role="alert" style={{ ...panel, color: '#b42318', background: '#fff6f5' }}>{error} <button onClick={load} disabled={busy}>Retry</button></div>}
    {notice && <div role="status" style={{ ...panel, color: '#067647', background: '#ecfdf3' }}>{notice}</div>}

    {!loading && data && !order && <section style={panel}>
      <h2 style={{ marginTop: 0 }}>{selectedService ? 'Kocre is reviewing your request' : 'Choose your first service'}</h2>
      <p style={muted}>{selectedService
        ? 'Your service request is saved. Kocre will review your needs and publish a written offer here when scope and pricing are confirmed. No service has been activated or charged.'
        : 'You have an account, but no service has been requested yet. Start by selecting the type of support you need.'}</p>
      <Link href="/portal/services" style={{ color: 'var(--teal)', fontWeight: 600 }}>{selectedService ? 'Review your request' : 'Choose a service'} →</Link>
    </section>}

    {order && <section style={panel}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'start', gap: 14 }}>
        <div>
          <div style={{ fontSize: '.82rem', color: 'var(--ink-muted)' }}>Written service offer</div>
          <h2 style={{ margin: '6px 0 2px' }}>{serviceName}</h2>
          <p style={{ ...muted, margin: 0 }}>{order.supported_users} supported {order.supported_users === 1 ? 'person' : 'people'} · {statusLabel}</p>
        </div>
        <span className="ticket-platform" style={{ background: order.status === 'active' && activationSynchronized ? '#ecfdf3' : '#eef4ff', color: order.status === 'active' && activationSynchronized ? '#067647' : '#1d4ed8' }}>
          {statusLabel}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginTop: 18 }}>
        <div><div style={muted}>Monthly fee</div><strong>{money(order.monthly_cents)}</strong></div>
        <div><div style={muted}>One-time setup</div><strong>{money(order.setup_cents)}</strong></div>
        {order.one_time_cents != null && <div><div style={muted}>One-time service</div><strong>{money(order.one_time_cents)}</strong></div>}
      </div>
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 18 }}>
        <h3 style={{ fontSize: '1rem' }}>Included service scope</h3>
        <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{order.scope_summary}</p>
        {order.exclusions && <><h3 style={{ fontSize: '1rem' }}>Not included</h3><p style={{ whiteSpace: 'pre-wrap', ...muted }}>{order.exclusions}</p></>}
        {order.external_costs && <><h3 style={{ fontSize: '1rem' }}>Separate provider costs</h3><p style={{ whiteSpace: 'pre-wrap', ...muted }}>{order.external_costs}</p></>}
        <p style={muted}>Support hours: {order.support_window}. Offer expires {new Date(order.quote_valid_until).toLocaleDateString('en-US')}.</p>
        <p style={muted}>Prices and scope are those of this written offer, not an automatically changing website calculator. Quote acceptance does not collect payment or replace an executed services agreement.</p>
      </div>
      {order.status === 'offered' && <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18 }}>
        {data?.canAccept ? <>
          <h3 style={{ fontSize: '1rem' }}>Accept this commercial quote</h3>
          <p style={muted}>Acceptance confirms the listed commercial scope and price for Kocre to prepare onboarding. The separate finalized service agreement and payment are verified before activation.</p>
          <label style={{ display: 'grid', gap: 6, marginBottom: 12 }}>Your full name
            <input value={acceptedName} onChange={(e) => setAcceptedName(e.target.value)} placeholder="Full name" maxLength={120} style={{ padding: 11, border: '1px solid var(--border)', borderRadius: 8 }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'start', gap: 9, marginBottom: 14, fontSize: '.9rem', lineHeight: 1.6 }}>
            <input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} style={{ marginTop: 5 }} />
            I am authorized to accept this written scope and price on behalf of my organization.
          </label>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button style={actionStyle} disabled={busy || !acknowledged || acceptedName.trim().length < 2} onClick={() => submit('accept', order)}>{busy ? 'Recording…' : 'Accept quote'}</button>
            <button disabled={busy} onClick={() => submit('decline', order)} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)' }}>Decline</button>
          </div>
        </> : <p style={muted}>Only the client portal user specifically designated by Kocre on this offer can accept or decline it. Contact Kocre if the authorized signer must change.</p>}
      </div>}
    </section>}

    {order && ['accepted', 'onboarding', 'active'].includes(order.status) && <section style={panel}>
      <h2 style={{ marginTop: 0 }}>Service activation progress</h2>
      <p style={muted}>Your quote has been accepted. Kocre coordinates verification and onboarding. Checked items below represent evidence Kocre has actually recorded, not promised future coverage.</p>
      <div style={{ display: 'grid', gap: 12 }}>
        <div><strong>{order.agreement_verified_at ? '✓' : '○'} Executed services agreement</strong><p style={{ margin: '2px 0', ...muted }}>{order.agreement_verified_at ? 'Verified by Kocre' : 'Awaiting finalized agreement verification (draft documents do not count)'}</p></div>
        <div><strong>{order.payment_verified_at ? '✓' : '○'} Payment verification</strong><p style={{ margin: '2px 0', ...muted }}>{order.payment_verified_at ? 'External receipt verified by Kocre' : 'Awaiting external invoice/payment confirmation; the portal does not charge your card'}</p></div>
        {checksFor(order.service_key).map(([key, label]) => {
          const checked = Boolean(order.check_evidence?.[key]?.verifiedAt)
          return <div key={key}><strong>{checked ? '✓' : '○'} {label}</strong><p style={{ margin: '2px 0', ...muted }}>{checked ? 'Verified by Kocre' : 'Kocre will confirm this during setup'}</p></div>
        })}
      </div>
      {order.status === 'active' && (activationSynchronized
        ? <p role="status" style={{ marginTop: 18, padding: 12, background: '#ecfdf3', color: '#067647', borderRadius: 8 }}>
            {order.service_key === 'one_time'
              ? 'Your one-time support session has been activated within the agreed scope.'
              : 'Your managed service is active.'}
            {' '}Activated on {new Date(order.activated_at).toLocaleDateString('en-US')}. <Link href="/portal/tickets/new">Open a support request →</Link>
          </p>
        : <p role="status" style={{ marginTop: 18, padding: 12, background: '#eef4ff', color: '#1d4ed8', borderRadius: 8 }}>
            Kocre is completing the final account activation. Your support service will be shown as active once the account synchronization is confirmed.
          </p>)}
    </section>}

    <p style={muted}>Questions about your offer? <a href="mailto:hello@kocreit.com?subject=Kocre%20service%20activation">Contact Kocre IT</a>.</p>
  </div>
}
