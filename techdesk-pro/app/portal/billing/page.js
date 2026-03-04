'use client'

export default function BillingPage() {
  return (
    <div style={{ padding: '0' }}>
      <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Billing</h1>
      <p style={{ color: 'var(--ink-muted)', fontSize: '0.92rem', marginBottom: 32 }}>
        Manage your plan and invoices.
      </p>
      <div className="dashboard-empty">
        <p>Billing portal is coming soon. You'll be able to view invoices, manage your subscription, and upgrade your plan here.</p>
      </div>
    </div>
  )
}