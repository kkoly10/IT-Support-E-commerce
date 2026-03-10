export const metadata = {
  title: 'Support Scope | TechDesk Pro',
  description: 'TechDesk Pro support scope and boundaries for remote IT and cloud/SaaS support.',
}

export default function SupportScopePage() {
  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '32px 16px 60px' }}>
      <h1 style={{ marginBottom: 8 }}>Support Scope</h1>
      <p style={{ color: 'var(--ink-muted)', marginBottom: 18 }}>
        TechDesk Pro is focused on remote-first IT support, cloud administration, and SaaS operations support.
      </p>
      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
        <h2 style={{ marginBottom: 10 }}>What we handle</h2>
        <ul style={{ lineHeight: 1.8, color: 'var(--ink-light)' }}>
          <li>User account access and permission support</li>
          <li>Microsoft 365 and Google Workspace administration</li>
          <li>SaaS admin tasks and support request triage</li>
          <li>Business-hours remote helpdesk operations</li>
        </ul>
        <p style={{ marginTop: 14, color: 'var(--ink-muted)' }}>
          For full scope details, see <a href="/support-transparency">Support Transparency</a>.
        </p>
      </div>
    </main>
  )
}
