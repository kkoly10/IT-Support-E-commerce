'use client'

export default function DocumentsPage() {
  return (
    <div style={{ padding: '0' }}>
      <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Documents</h1>
      <p style={{ color: 'var(--ink-muted)', fontSize: '0.92rem', marginBottom: 32 }}>
        Upload documents for AI processing.
      </p>
      <div className="dashboard-empty">
        <p>Document processing is coming soon. This is where you'll upload forms, invoices, and files for automated processing.</p>
      </div>
    </div>
  )
}