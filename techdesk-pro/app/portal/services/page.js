'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { SERVICE_CATALOG, calculateEstimate, formatUsd, normalizeSelection } from '../../../lib/service-catalog'

const PLAN_NAMES = {
  pending: 'To be confirmed', founding: 'Founding Managed Support', remote: 'Remote Desk', managed: 'Managed Desk',
  secure: 'Secure Desk', custom: 'Custom agreement', starter: 'Starter (existing agreement)', growth: 'Growth (existing agreement)', scale: 'Scale (existing agreement)',
}
const ACCOUNT_NAMES = { lead: 'Account created', onboarding: 'Onboarding', active: 'Active', paused: 'Paused', former: 'Former client' }
const REQUEST_NAMES = { requested: 'Awaiting Kocre review', reviewing: 'In review', quoted: 'Quote prepared', accepted: 'Request accepted', declined: 'Request reviewed', withdrawn: 'Withdrawn' }
const splitList = (value) => value.split(',').map((item) => item.trim()).filter(Boolean)
const finite = (value) => typeof value === 'number' && Number.isFinite(value)

function storedPrice(selection) {
  if (finite(selection?.oneTime)) return `${formatUsd(selection.oneTime)} one-time estimate`
  if (finite(selection?.monthly)) return `${selection.requiresQuote || selection.users > 2 ? 'Illustrative estimate' : 'Pilot pricing'}: ${formatUsd(selection.monthly)}/month${finite(selection.setup) ? ` + ${formatUsd(selection.setup)} setup` : ''}`
  return 'Written quote required'
}

export default function ServicesPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [conflict, setConflict] = useState(false)
  const [message, setMessage] = useState(null)
  const [service, setService] = useState('')
  const [users, setUsers] = useState('1')
  const [systems, setSystems] = useState('')
  const [projects, setProjects] = useState('')
  const [note, setNote] = useState('')

  function restoreForm(result) {
    const selected = result.selection
    setService(normalizeSelection({ service: selected?.service, users: selected?.users }).service || '')
    setUsers(Number.isInteger(selected?.users) && selected.users > 0 ? String(selected.users) : '1')
    setSystems(Array.isArray(selected?.systems) ? selected.systems.join(', ') : '')
    setProjects(Array.isArray(selected?.projects) ? selected.projects.join(', ') : '')
    setNote(typeof selected?.note === 'string' ? selected.note : '')
  }

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/services/selection', { cache: 'no-store' })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Could not load your services. Please retry.')
      setData(result)
      restoreForm(result)
      setConflict(false)
    } catch (err) {
      setError(err.message || 'Could not load your services. Please retry.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const exactUsers = Number(users)
  const validUsers = service === 'one_time' || (/^[1-9]\d{0,2}$/.test(users) && exactUsers <= 250)
  const estimate = useMemo(() => calculateEstimate({ service, users: exactUsers }), [service, exactUsers])
  const ongoing = ['remote', 'managed', 'secure'].includes(service)
  const org = data?.organization
  const saved = data?.selection
  const selectedPlan = SERVICE_CATALOG[service]
  const active = org?.clientStatus === 'active'

  function chooseService(nextService) {
    setService(normalizeSelection({ service: nextService, users: Number(users) }).service || '')
  }

  async function save(event) {
    event.preventDefault()
    if (!service || !validUsers || !data?.canRequest || saving || loading || conflict) return
    setSaving(true)
    setError(null)
    setMessage(null)
    setConflict(false)
    try {
      const response = await fetch('/api/services/selection', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service, users: service === 'one_time' ? 1 : exactUsers,
          systems: splitList(systems), projects: splitList(projects), note,
          expectedRevision: data.revision,
        }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        setConflict(response.status === 409)
        throw new Error(result.error || 'Could not save your request. Please retry.')
      }
      setData(result)
      restoreForm(result)
      setMessage('Your team’s service suggestion is saved for Kocre review. Accepted scope, availability, and charges are confirmed through review and an authorized agreement.')
    } catch (err) {
      setError(err.message || 'Could not save your request. Please retry.')
    } finally {
      setSaving(false)
    }
  }

  if (loading && !data) return <div className="portal-page-loading" role="status">Loading your services...</div>

  return (
    <div className="services-page">
      <header className="portal-page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: 6 }}>Services</h1>
          <p className="services-muted">Team members can suggest support needs for this workspace. Kocre confirms accepted scope and charges through review and an authorized agreement.</p>
        </div>
      </header>

      {message && <div className="services-notice services-success" role="status">{message}</div>}
      {error && <div className="services-notice services-error" role="alert">
        <p style={{ margin: 0 }}>{error}</p>
        {(conflict || !data) && <button type="button" className="services-secondary" onClick={load} disabled={loading || saving} style={{ marginTop: 10 }}>{loading ? 'Reloading...' : 'Reload latest request'}</button>}
        {conflict && <p style={{ fontSize: '0.84rem', margin: '8px 0 0' }}>Reloading replaces the form with the latest saved details.</p>}
      </div>}

      {org && <section aria-label="Current account" className="services-account">
        <div className="stat-card"><div className="stat-card-label">Current agreed plan</div><div className="services-stat">{PLAN_NAMES[org.plan] || org.plan || 'To be confirmed'}</div><p className="services-small">Your signed scope and invoice determine existing charges.</p></div>
        <div className="stat-card"><div className="stat-card-label">Account status</div><div className="services-stat">{ACCOUNT_NAMES[org.clientStatus] || org.clientStatus || 'To be confirmed'}</div><p className="services-small">{active ? 'Your current agreement continues while changes are reviewed.' : 'Service activation follows review and any required setup.'}</p></div>
        <div className="stat-card"><div className="stat-card-label">Latest service request</div><div className="services-stat">{saved ? REQUEST_NAMES[saved.status] || 'Saved request' : 'No request yet'}</div><p className="services-small">{saved?.requestedAt && Number.isFinite(Date.parse(saved.requestedAt)) ? `Submitted ${new Date(saved.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Choose a path below when you are ready.'}</p></div>
      </section>}

      {saved && <section className="services-panel" aria-labelledby="saved-request-title">
        <h2 id="saved-request-title">Your saved request</h2>
        <div className="services-saved-summary">
          <div><strong>{Object.hasOwn(SERVICE_CATALOG, saved.service) ? SERVICE_CATALOG[saved.service].name : 'Service request'}</strong><p className="services-muted" style={{ margin: '6px 0' }}>{saved.service === 'one_time' ? 'One scheduled session, up to 60 minutes' : `${saved.users || 'To be confirmed'} people to support`}</p></div>
          <div><strong>{storedPrice(saved)}</strong><p className="services-small">{saved.requiresQuote ? 'Written quote and capacity review required.' : 'Final scope and availability are confirmed before charges.'}</p></div>
        </div>
        {typeof saved.priceVersion === 'string' && <p className="services-small" style={{ marginBottom: 0 }}>Saved pricing version: {saved.priceVersion}. Updating this request uses the current catalog.</p>}
      </section>}

      <form onSubmit={save} className="services-panel" aria-busy={saving || loading}>
        <h2>{saved ? active ? 'Request a service change' : 'Review or update your request' : 'Choose a service'}</h2>
        {data && !data.canRequest && <p className="services-notice">This account cannot submit a suggestion for this workspace. You can compare options here and <a href="mailto:hello@kocreit.com?subject=Workspace%20service%20request">contact Kocre for help</a>.</p>}

        <fieldset className="services-fieldset" disabled={saving || loading}>
          <legend>What kind of support do you need?</legend>
          <div className="services-paths">
            <label className={`services-choice ${service === 'one_time' ? 'is-selected' : ''}`}>
              <input type="radio" name="service-path" value="one_time" checked={service === 'one_time'} onChange={() => chooseService('one_time')} />
              <span><strong>One-time help</strong><span>Remote diagnosis or a fix for an eligible issue.</span><b>{formatUsd(SERVICE_CATALOG.one_time.sessionPrice)} / session</b></span>
            </label>
            <label className={`services-choice ${ongoing ? 'is-selected' : ''}`}>
              <input type="radio" name="service-path" value="ongoing" checked={ongoing} onChange={() => chooseService('remote')} />
              <span><strong>Ongoing support</strong><span>Remote Desk, Managed Desk, or Secure Desk for 1–10 people.</span><b>Pilot from {formatUsd(SERVICE_CATALOG.remote.firstUser)} / month</b></span>
            </label>
            <label className={`services-choice ${service === 'custom' ? 'is-selected' : ''}`}>
              <input type="radio" name="service-path" value="custom" checked={service === 'custom'} onChange={() => chooseService('custom')} />
              <span><strong>Custom & enterprise</strong><span>Larger teams, projects, and complex environments.</span><b>Written scope and quote</b></span>
            </label>
          </div>
        </fieldset>

        {ongoing && <fieldset className="services-fieldset" disabled={saving || loading}>
          <legend>Your ongoing support level</legend>
          <div className="services-levels">
            {['remote', 'managed', 'secure'].map((key) => <label key={key} className={`services-choice ${service === key ? 'is-selected' : ''}`}>
              <input type="radio" name="support-level" value={key} checked={service === key} onChange={() => chooseService(key)} />
              <span><strong>{SERVICE_CATALOG[key].name}</strong><span>{SERVICE_CATALOG[key].description}</span><b>{formatUsd(SERVICE_CATALOG[key].firstUser)} first user + {formatUsd(SERVICE_CATALOG[key].additionalUser)} each additional user / month</b></span>
            </label>)}
          </div>
        </fieldset>}

        {service && service !== 'one_time' && <div className="form-group services-count">
          <label htmlFor="service-users">People who need support</label>
          <input id="service-users" type="number" min="1" max="250" step="1" inputMode="numeric" value={users} onChange={(event) => { setUsers(event.target.value); setService(normalizeSelection({ service, users: Number(event.target.value) }).service || '') }} aria-describedby="service-users-help" required disabled={saving || loading} />
          <p id="service-users-help" className="services-small">Enter your support roster count (1–250), regardless of how many people have portal logins. Teams above 10 people use Custom review. For more than 250, describe the total in your note.</p>
        </div>}

        {selectedPlan && validUsers && <section aria-labelledby="estimate-title" className="services-estimate">
          <h3 id="estimate-title">{estimate.monthly !== null ? 'Pilot pricing · 1–2 users' : service === 'one_time' ? 'Your estimated cost' : 'Written quote required'}</h3>
          <dl>
            {service === 'one_time' ? <div><dt>One session, up to 60 minutes</dt><dd>{formatUsd(estimate.oneTime)}</dd></div> : <>
              <div><dt>Monthly support · {estimate.users} {estimate.users === 1 ? 'user' : 'users'}</dt><dd>{estimate.monthly === null ? 'By written quote' : formatUsd(estimate.monthly)}</dd></div>
              <div><dt>One-time setup</dt><dd>{estimate.monthly === null ? 'By written quote' : formatUsd(estimate.setup)}</dd></div>
              {estimate.totalInitial !== null && <div className="services-total"><dt>First month + setup</dt><dd>{formatUsd(estimate.totalInitial)}</dd></div>}
            </>}
          </dl>
          <p className="services-small">Pricing version {estimate.priceVersion}. Scope, availability, and charges are confirmed before service begins.</p>
          {ongoing && <p className="services-small">The public pilot price covers 1–2 supported people. Requests for 3 or more people require a written quote after workload, devices, security, cloud and compliance needs are reviewed.</p>}
          {service === 'one_time' && <p className="services-small">Additional work or time is separately scoped and approved.</p>}
        </section>}

        <fieldset className="services-fieldset" disabled={saving || loading}>
          <legend>Tell us about your needs <span className="services-optional">(optional)</span></legend>
          <div className="services-context">
            <div className="form-group"><label htmlFor="service-systems">Systems you use</label><input id="service-systems" type="text" value={systems} onChange={(event) => setSystems(event.target.value)} maxLength={1450} placeholder="Microsoft 365, Windows, Google Workspace" aria-describedby="service-systems-help" /><p id="service-systems-help" className="services-small">Separate up to 12 system names with commas.</p></div>
            <div className="form-group"><label htmlFor="service-projects">Projects or changes you are planning</label><input id="service-projects" type="text" value={projects} onChange={(event) => setProjects(event.target.value)} maxLength={1450} placeholder="Email migration, new employee setup" aria-describedby="service-projects-help" /><p id="service-projects-help" className="services-small">Separate up to 12 project names with commas.</p></div>
          </div>
          <div className="form-group"><label htmlFor="service-note">Anything else Kocre should review?</label><textarea id="service-note" rows={4} value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} placeholder="Describe the problem, timing, or special requirements." /><p className="services-small">{note.length.toLocaleString()} / 2,000 characters</p></div>
        </fieldset>

        <div className="services-submit-row">
          <p className="services-small">Saving records a nonbinding suggestion for your team. Accepted scope and charges require Kocre review and an authorized agreement. {active ? 'Your existing agreement remains in effect.' : 'Kocre will confirm any setup requirements and activation.'}</p>
          <button type="submit" className="services-submit" disabled={!service || !validUsers || !data?.canRequest || saving || loading || conflict}>{saving ? 'Saving request...' : saved ? 'Save updated request' : 'Save service request'}</button>
        </div>
      </form>

      <section className="services-panel" aria-labelledby="service-next-title">
        <h2 id="service-next-title">Continue your setup</h2>
        <p className="services-muted">Kocre reviews your request and confirms the applicable next steps. These pages keep your contact details and setup information together.</p>
        <div className="services-next-links">
          <Link href="/portal/contacts">Confirm your contacts →</Link>
          <Link href="/portal/onboarding">View onboarding steps →</Link>
          <Link href="/portal/access">Review access requests →</Link>
          {active ? <Link href="/portal/tickets/new">Open a support request →</Link> : <a href="mailto:hello@kocreit.com?subject=Service%20setup%20question">Ask a setup question →</a>}
        </div>
      </section>

      <style jsx>{`
        .services-page { max-width: 1120px; }
        .services-muted { color: var(--ink-muted); font-size: .93rem; line-height: 1.65; margin: 0; }
        .services-small { color: var(--ink-muted); font-size: .84rem; line-height: 1.65; margin: 6px 0 0; overflow-wrap: anywhere; }
        .services-account { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-bottom: 24px; }
        .services-stat { font-size: 1.1rem; font-weight: 700; line-height: 1.45; margin-top: 8px; }
        .services-panel { background: #fff; border: 1px solid var(--border); border-radius: 14px; padding: 24px; margin-bottom: 24px; min-width: 0; }
        .services-panel h2 { font-size: 1.14rem; margin: 0 0 18px; }
        .services-panel h3 { font-size: 1rem; margin: 0 0 14px; }
        .services-notice { border: 1px solid var(--border); border-radius: 10px; background: #f8fafc; padding: 14px 16px; font-size: .9rem; line-height: 1.65; margin: 0 0 20px; }
        .services-success { background: #ecfdf5; border-color: #a7f3d0; color: #065f46; }
        .services-error { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
        .services-saved-summary { display: flex; flex-wrap: wrap; gap: 20px 40px; justify-content: space-between; }
        .services-fieldset { border: 0; padding: 0; margin: 0 0 24px; min-width: 0; }
        .services-fieldset legend { font-size: .94rem; font-weight: 600; padding: 0; margin-bottom: 12px; }
        .services-paths { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        .services-levels, .services-context { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .services-choice { display: flex; align-items: flex-start; gap: 10px; border: 1.5px solid var(--border); border-radius: 11px; padding: 16px; cursor: pointer; min-width: 0; }
        .services-choice.is-selected { border-color: var(--teal); background: #effaf7; }
        .services-choice:focus-within { outline: 2px solid var(--teal); outline-offset: 3px; }
        .services-choice input { margin-top: 3px; flex-shrink: 0; width: 17px; height: 17px; accent-color: var(--teal); }
        .services-choice span { display: block; min-width: 0; }
        .services-choice strong { display: block; font-size: .95rem; }
        .services-choice span span { color: var(--ink-muted); font-size: .84rem; line-height: 1.6; margin-top: 7px; }
        .services-choice b { display: block; font-size: .83rem; line-height: 1.65; margin-top: 10px; font-weight: 600; }
        .services-count { max-width: 500px; margin-bottom: 24px; }
        .services-count input { max-width: 180px; }
        .services-page .form-group { min-width: 0; }
        .services-page input[type=text], .services-page input[type=number], .services-page textarea { box-sizing: border-box; width: 100%; min-width: 0; }
        .services-estimate { padding: 20px; border-radius: 11px; background: #f6faf9; border: 1px solid #d8e9e4; margin-bottom: 24px; }
        .services-estimate dl { margin: 0; }
        .services-estimate dl div { display: flex; justify-content: space-between; gap: 20px; padding: 8px 0; font-size: .93rem; }
        .services-estimate dd { margin: 0; font-weight: 700; text-align: right; }
        .services-total { border-top: 1px solid #d8e9e4; margin-top: 6px; }
        .services-optional { color: var(--ink-muted); font-weight: 400; }
        .services-submit-row { display: flex; align-items: center; justify-content: space-between; gap: 24px; border-top: 1px solid var(--border); padding-top: 18px; }
        .services-submit-row p { max-width: 650px; margin: 0; }
        .services-submit, .services-secondary { font: inherit; border-radius: 9px; padding: 12px 18px; min-height: 44px; font-size: .9rem; font-weight: 600; cursor: pointer; }
        .services-submit { background: var(--teal); color: #fff; border: 1px solid var(--teal); flex-shrink: 0; }
        .services-submit:disabled, .services-secondary:disabled { opacity: .5; cursor: not-allowed; }
        .services-secondary { background: #fff; color: var(--ink); border: 1px solid var(--border); }
        .services-next-links { display: flex; flex-wrap: wrap; gap: 12px 24px; margin-top: 18px; font-size: .9rem; }
        @media (max-width: 800px) { .services-account, .services-paths { grid-template-columns: 1fr; } .services-submit-row { align-items: stretch; flex-direction: column; gap: 14px; } }
        @media (max-width: 600px) { .services-panel { padding: 18px 16px; } .services-levels, .services-context { grid-template-columns: 1fr; } .services-estimate { padding: 16px; } .services-next-links { flex-direction: column; } }
      `}</style>
    </div>
  )
}
