'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '../../../lib/supabase/client'
import { activationBlockers, checksFor, formatOrderAmount, ORDER_STATUS_LABELS } from '../../../lib/client-activation.js'
import { calculateEstimate, SERVICE_CATALOG } from '../../../lib/service-catalog.js'

const style = {
  panel: { padding: 20, border: '1px solid var(--border)', borderRadius: 12, background: '#fff', marginBottom: 18 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, font: 'inherit' },
  button: { background: 'var(--teal)', color: '#fff', padding: '10px 14px', border: 0, borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  muted: { color: 'var(--ink-muted)', fontSize: '.88rem', lineHeight: 1.7 },
}
function Field({ label, children }) { return <label style={{ display: 'grid', gap: 6, marginBottom: 12, fontSize: '.9rem' }}><strong>{label}</strong>{children}</label> }
function moneyInput(value, onChange, placeholder = '0.00') {
  return <input inputMode="decimal" type="number" min="0" step=".01" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={style.input} />
}
function toCents(value) {
  if (value === '' || value === null || value === undefined) return null
  const n = Number(value)
  return Number.isFinite(n) ? Math.round(n * 100) : null
}

export default function AdminActivationPage() {
  const [orgs, setOrgs] = useState([])
  const [orgId, setOrgId] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [scopeSummary, setScopeSummary] = useState('')
  const [exclusions, setExclusions] = useState('Hardware, third-party licenses and out-of-scope projects are separately quoted.')
  const [externalCosts, setExternalCosts] = useState('Third-party licenses, endpoint security, backup storage and cloud usage are separate unless explicitly included.')
  const [supportWindow, setSupportWindow] = useState('Weekdays 9:00 AM–6:00 PM Eastern, excluding US holidays')
  const [pricingExplanation, setPricingExplanation] = useState('')
  const [authorizedSignerUserId, setAuthorizedSignerUserId] = useState('')
  const [monthly, setMonthly] = useState('')
  const [setup, setSetup] = useState('')
  const [oneTime, setOneTime] = useState('')
  const [agreementRef, setAgreementRef] = useState('')
  const [paymentRef, setPaymentRef] = useState('')
  const [evidenceByKey, setEvidenceByKey] = useState({})
  const [agreementAttested, setAgreementAttested] = useState(false)
  const [paymentAttested, setPaymentAttested] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function listOrgs() {
      const supabase = createClient()
      const { data: rows, error: loadError } = await supabase.from('organizations')
        .select('id, name, client_status').order('created_at', { ascending: false })
      if (cancelled) return
      if (loadError) setError('Unable to list organizations. Confirm you are signed in as an administrator.')
      else {
        setOrgs(rows || [])
        const searchId = new URLSearchParams(window.location.search).get('organizationId')
        const first = rows?.find((row) => row.id === searchId)?.id || rows?.[0]?.id || ''
        setOrgId(first)
      }
      setLoading(false)
    }
    listOrgs()
    return () => { cancelled = true }
  }, [])

  async function load(selectedId) {
    if (!selectedId) return
    setLoading(true); setError('')
    try {
      const response = await fetch('/api/client-activation?organizationId=' + encodeURIComponent(selectedId), { cache: 'no-store' })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Unable to load activation record.')
      setData(result)
      setAuthorizedSignerUserId('')
    } catch (err) { setError(err.message || 'Unable to load activation record.'); setData(null) }
    finally { setLoading(false) }
  }
  useEffect(() => { load(orgId) }, [orgId])

  useEffect(() => {
    if (!data) return
    const estimate = calculateEstimate(data.selection || {})
    const service = SERVICE_CATALOG[data.selection?.service]
    setMonthly(estimate.monthly === null ? '' : String(estimate.monthly))
    setSetup(estimate.setup === null ? '0' : String(estimate.setup))
    setOneTime(estimate.oneTime === null ? '' : String(estimate.oneTime))
    setScopeSummary('')
  }, [data?.requestRevision, orgId])

  const order = data?.orders?.find((row) => ['offered', 'accepted', 'onboarding', 'active'].includes(row.status)) || data?.orders?.[0]
  const pendingOrActive = Boolean(order && ['offered', 'accepted', 'onboarding', 'active'].includes(order.status))
  const blockers = order?.status === 'onboarding' ? activationBlockers(order) : []

  async function perform(action, details = {}) {
    setBusy(true); setError(''); setNotice('')
    try {
      const payload = {
        action, organizationId: orgId,
        ...(action === 'offer' ? {
          expectedRequestRevision: data.requestRevision,
          scopeSummary, exclusions, externalCosts, supportWindow, pricingExplanation,
          authorizedSignerUserId,
          monthlyCents: toCents(monthly), setupCents: toCents(setup), oneTimeCents: toCents(oneTime),
        } : { orderId: order.id, expectedRevision: order.revision, ...details }),
      }
      const response = await fetch('/api/client-activation', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'This activation step could not be completed.')
      setNotice(result.message || 'Activation record updated and saved.')
      await load(orgId)
    } catch (err) {
      // Refresh the order revision after a partially persisted transition.
      // The repair actions below can then resume the organization sync.
      await load(orgId)
      setError(err.message || 'Unable to save this change.')
    } finally { setBusy(false) }
  }

  return <div style={{ maxWidth: 1050 }}>
    <header className="admin-page-header" style={{ marginBottom: 20 }}>
      <div>
        <h1 className="admin-page-title">Client Activation</h1>
        <p className="admin-page-desc">Review, quote, collect external evidence, and activate only after service-specific readiness is verified.</p>
      </div>
    </header>

    <section style={style.panel}>
      <Field label="Customer organization">
        <select value={orgId} onChange={(e) => { setOrgId(e.target.value); setNotice(''); setError(''); }} style={style.input}>
          {!orgs.length && <option value="">No organizations available</option>}
          {orgs.map((o) => <option key={o.id} value={o.id}>{o.name} — {o.client_status}</option>)}
        </select>
      </Field>
      {orgId && <Link href={'/admin/onboarding?organizationId=' + encodeURIComponent(orgId)} style={{ color: 'var(--teal)' }}>Open detailed onboarding →</Link>}
    </section>

    {error && <div role="alert" style={{ ...style.panel, background: '#fff6f5', color: '#b42318' }}>{error} <button onClick={() => load(orgId)}>Retry</button></div>}
    {notice && <div role="status" style={{ ...style.panel, background: '#ecfdf3', color: '#067647' }}>{notice}</div>}
    {loading && <p>Loading client activation…</p>}
    {!loading && data && !pendingOrActive && <section style={style.panel}>
      <h2 style={{ marginTop: 0 }}>Publish a written offer</h2>
      {data.selection ? <>
        <p style={style.muted}><strong>Requested:</strong> {SERVICE_CATALOG[data.selection.service]?.name || data.selection.service} · {data.selection.users} supported people. A written offer creates no charge and sends no email automatically.</p>
        <Field label="Authorized client signer — designated by Kocre">
          <select value={authorizedSignerUserId} onChange={(e) => setAuthorizedSignerUserId(e.target.value)} style={style.input}>
            <option value="">Select the account authorized to accept this offer</option>
            {(data.signerCandidates || []).map((person) => (
              <option key={person.id} value={person.id}>{person.full_name || person.email} ({person.email})</option>
            ))}
          </select>
        </Field>
        <Field label="Included scope — describe exact covered systems and work"><textarea value={scopeSummary} onChange={(e) => setScopeSummary(e.target.value)} rows={4} placeholder={SERVICE_CATALOG[data.selection.service]?.description || 'Describe actual included support and exclusions'} style={style.input} /></Field>
        <Field label="Exclusions"><textarea value={exclusions} onChange={(e) => setExclusions(e.target.value)} rows={2} style={style.input} /></Field>
        <Field label="External provider costs"><textarea value={externalCosts} onChange={(e) => setExternalCosts(e.target.value)} rows={2} style={style.input} /></Field>
        <Field label="Staffed support window"><input value={supportWindow} onChange={(e) => setSupportWindow(e.target.value)} style={style.input} /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: 14 }}>
          <Field label="Monthly USD">{moneyInput(monthly, setMonthly, 'For recurring support')}</Field>
          <Field label="Setup USD">{moneyInput(setup, setSetup)}</Field>
          <Field label="One-time USD">{moneyInput(oneTime, setOneTime, 'For one-time work')}</Field>
        </div>
        <Field label="Pricing explanation for any negotiated rate"><textarea value={pricingExplanation} onChange={(e) => setPricingExplanation(e.target.value)} rows={2} style={style.input} /></Field>
        <p style={style.muted}>Quote validity: 30 days. Amounts are captured in the offer and will not silently change if website prices change. For 3+ people or Custom, enter explicitly agreed pricing.</p>
        <button style={style.button} disabled={busy || !authorizedSignerUserId || scopeSummary.trim().length < 12} onClick={() => perform('offer')}>{busy ? 'Publishing…' : 'Publish offer in client portal'}</button>
      </> : <p style={style.muted}>The customer has not submitted a service request. Ask them to select a service in their portal before preparing an offer.</p>}
    </section>}

    {order && <section style={style.panel}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: '0 0 6px' }}>{SERVICE_CATALOG[order.service_key]?.name || order.service_key} · {order.supported_users} people</h2>
          <p style={style.muted}>{ORDER_STATUS_LABELS[order.status] || order.status} · Offer ID: {order.id}</p>
        </div>
        <strong>{order.monthly_cents != null ? formatOrderAmount(order.monthly_cents) + '/month' : formatOrderAmount(order.one_time_cents)}</strong>
      </div>
      <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>{order.scope_summary}</p>
      {order.status === 'offered' && <>
        <p style={style.muted}>Offer is visible to the client in Your Offer & Activation. Contact the primary contact separately: publishing does not send an email.</p>
        <button disabled={busy} onClick={() => perform('withdraw')} style={style.button}>Withdraw unaccepted offer</button>
      </>}
      {order.status === 'accepted' && <>
        <p style={style.muted}>Accepted by {order.accepted_name || 'designated authorized signer'} at {new Date(order.accepted_at).toLocaleString('en-US')}. Commercial quote acceptance is not the executed MSA.</p>
        <button disabled={busy} style={style.button} onClick={() => perform('begin_onboarding')}>Start client onboarding</button>
      </>}
    </section>}

    {order && order.status === 'onboarding' && <section style={style.panel}>
      {data?.organization?.clientStatus !== 'onboarding' && (
        <div role="alert" style={{ padding: 14, marginBottom: 16, background: '#fff4e6', borderRadius: 8 }}>
          <strong>Onboarding synchronization incomplete.</strong>
          <p style={style.muted}>The accepted order is saved but the client account is not yet in onboarding.</p>
          <button style={style.button} disabled={busy} onClick={() => perform('begin_onboarding')}>Repair onboarding synchronization</button>
        </div>
      )}
      <h2 style={{ marginTop: 0 }}>Activation evidence</h2>
      <p style={style.muted}>These are human-verified external records, not payment or signature functionality. Do not enter a reference unless you have examined the underlying executed agreement or payment receipt.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        <div>
          <h3>Executed agreement</h3>
          <p style={style.muted}>{order.agreement_verified_at ? 'Verified: ' + order.agreement_reference : 'MSA/DPA in this repository are drafts; use a separate finalized executed agreement.'}</p>
          {!order.agreement_verified_at && <>
            <Field label="Final executed agreement reference"><input value={agreementRef} onChange={(e) => setAgreementRef(e.target.value)} placeholder="Signed file ID / contract reference" style={style.input} /></Field>
            <label style={style.muted}><input type="checkbox" checked={agreementAttested} onChange={(e) => setAgreementAttested(e.target.checked)} /> I verified the executed non-draft agreement.</label>
            <p><button style={style.button} disabled={busy || !agreementAttested || agreementRef.trim().length < 8} onClick={() => perform('record_agreement', { reference: agreementRef, attested: true })}>Record agreement verification</button></p>
          </>}
        </div>
        <div>
          <h3>Payment verification</h3>
          <p style={style.muted}>{order.payment_verified_at ? 'Verified: ' + order.payment_reference : 'An external invoice/receipt must be verified. No payment is collected by Kocre’s portal.'}</p>
          {!order.payment_verified_at && <>
            <Field label="External payment reference"><input value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="Paid invoice / transaction reference" style={style.input} /></Field>
            <label style={style.muted}><input type="checkbox" checked={paymentAttested} onChange={(e) => setPaymentAttested(e.target.checked)} /> I checked the actual payment ledger/receipt.</label>
            <p><button style={style.button} disabled={busy || !paymentAttested || paymentRef.trim().length < 8} onClick={() => perform('record_payment', { reference: paymentRef, attested: true })}>Record payment verification</button></p>
          </>}
        </div>
      </div>
      <h3>Service-specific readiness</h3>
      {checksFor(order.service_key).map(([key, label]) => {
        const verified = order.check_evidence?.[key]
        return <div key={key} style={{ padding: '12px 0', borderTop: '1px solid var(--border)' }}>
          <strong>{verified ? '✓ ' : '○ '}{label}</strong>
          {verified ? <p style={style.muted}>Verified: {verified.evidence}</p> : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 9 }}>
            <input value={evidenceByKey[key] || ''} onChange={(e) => setEvidenceByKey((prev) => ({ ...prev, [key]: e.target.value }))} placeholder="Real device, ticket, or checklist evidence reference" style={{ ...style.input, flex: 1, minWidth: 240 }} />
            <button disabled={busy || (evidenceByKey[key] || '').trim().length < 8} style={style.button} onClick={() => perform('verify_check', { checkKey: key, evidence: evidenceByKey[key] })}>Verify</button>
          </div>}
        </div>
      })}
      <div style={{ padding: 15, borderRadius: 10, background: blockers.length ? '#fffaeb' : '#ecfdf3' }}>
        <strong>{blockers.length ? blockers.length + ' activation requirements remaining' : 'All required evidence has been recorded'}</strong>
        {blockers.length > 0 && <ul style={{ paddingLeft: 20, lineHeight: 1.7 }}>{blockers.map((item) => <li key={item}>{item}</li>)}</ul>}
        <button style={{ ...style.button, marginTop: 12 }} disabled={busy || blockers.length > 0} onClick={() => perform('activate')}>Activate customer support</button>
      </div>
    </section>}

    {order?.status === 'active' && <section style={style.panel}>
      {data?.organization?.clientStatus !== 'active' || data?.organization?.plan !== order.service_key ? (
        <div role="alert" style={{ padding: 14, background: '#fff4e6', borderRadius: 8 }}>
          <h2>Activation synchronization incomplete</h2>
          <p style={style.muted}>The service order is active, but the customer account has not reflected the activation. Repair the account before telling the customer service is live.</p>
          <button style={style.button} disabled={busy} onClick={() => perform('activate')}>Repair activation synchronization</button>
        </div>
      ) : (
        <>
          <h2>Service activated</h2>
          <p style={style.muted}>Support activated {new Date(order.activated_at).toLocaleString('en-US')} after recorded agreement, payment and service readiness checks. <Link href="/admin/tickets">Open ticket operations →</Link></p>
        </>
      )}
    </section>}
  </div>
}
