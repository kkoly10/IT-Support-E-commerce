import { SERVICE_CATALOG, formatUsd } from '../../lib/service-catalog'

// A saved request is separate from the organization's accepted plan. Never
// use editable discovery data as an invoice, entitlement or activation flag.
export default function ServiceRequestSummary({ selection, operator = false }) {
  const service = Object.hasOwn(SERVICE_CATALOG, selection?.service) ? SERVICE_CATALOG[selection.service] : null
  if (!service) return null
  const finitePrice = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0
  const systems = Array.isArray(selection.systems) ? selection.systems.filter((item) => typeof item === 'string') : []
  const projects = Array.isArray(selection.projects) ? selection.projects.filter((item) => typeof item === 'string') : []
  const users = Number.isInteger(selection.users) && selection.users > 0 ? selection.users : null
  return (
    <section className="dashboard-section" style={{ padding: 20, marginBottom: 20, border: '1px solid var(--border)', borderRadius: 12 }}>
      <h2 style={{ fontSize: '1.05rem', marginBottom: 8 }}>{operator ? 'Service request to review' : 'Your requested service'}</h2>
      <p><strong>{service.name}</strong>{selection.service !== 'one_time' && users ? ` · ${users} supported ${users === 1 ? 'person' : 'people'}` : ''}</p>
      <p style={{ color: 'var(--ink-muted)', marginTop: 8 }}>
        {operator ? 'Review the requested scope, supported people, coverage and price before activating service.' : 'Kocre IT will confirm scope, availability and price. This request has not changed your accepted plan or charged you.'}
      </p>
      {finitePrice(selection.monthly) && <p style={{ marginTop: 8 }}>{selection.requiresQuote ? 'Illustrative estimate' : 'Requested pilot pricing'}: {formatUsd(selection.monthly)}/month{finitePrice(selection.setup) ? ` · ${formatUsd(selection.setup)} setup` : ''}{selection.requiresQuote ? ' · Written quote required' : ''}</p>}
      {finitePrice(selection.oneTime) && <p style={{ marginTop: 8 }}>Requested session: {formatUsd(selection.oneTime)} · Up to {service.sessionMinutes} minutes, subject to remote suitability.</p>}
      {selection.service === 'custom' && <p style={{ marginTop: 8 }}>Pricing by written proposal.</p>}
      {operator && typeof selection.note === 'string' && selection.note && <p style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{selection.note}</p>}
      {operator && systems.length > 0 && <p style={{ marginTop: 8 }}>Systems: {systems.join(', ')}</p>}
      {operator && projects.length > 0 && <p style={{ marginTop: 8 }}>Projects: {projects.join(', ')}</p>}
      {!operator && <a href="/portal/services" style={{ display: 'inline-block', marginTop: 12, color: 'var(--teal)' }}>Review your service request →</a>}
    </section>
  )
}
