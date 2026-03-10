// File: app/admin/training/page.js (new — mkdir -p app/admin/training)

'use client'

import { useState } from 'react'

const CURRICULUM = [
  {
    area: 'IT Helpdesk Basics',
    icon: '🖥️',
    color: '#3498db',
    topics: [
      { title: 'Password resets & account lockouts', difficulty: 'beginner' },
      { title: 'Email setup and troubleshooting (Gmail, Outlook)', difficulty: 'beginner' },
      { title: 'Remote desktop support basics', difficulty: 'beginner' },
      { title: 'Printer and device troubleshooting', difficulty: 'beginner' },
      { title: 'Software installation and updates', difficulty: 'beginner' },
      { title: 'VPN setup and troubleshooting', difficulty: 'intermediate' },
      { title: 'Network connectivity issues', difficulty: 'intermediate' },
    ],
  },
  {
    area: 'Google Workspace Management',
    icon: '📧',
    color: '#4285F4',
    topics: [
      { title: 'Google Workspace admin console overview', difficulty: 'beginner' },
      { title: 'Adding and removing users in Google Workspace', difficulty: 'beginner' },
      { title: 'Setting up email aliases and groups', difficulty: 'beginner' },
      { title: 'Google Drive permissions and sharing', difficulty: 'beginner' },
      { title: 'Google Workspace security settings and 2FA', difficulty: 'intermediate' },
      { title: 'Email migration to Google Workspace', difficulty: 'intermediate' },
    ],
  },
  {
    area: 'Microsoft 365 Management',
    icon: '🔷',
    color: '#0078D4',
    topics: [
      { title: 'Microsoft 365 admin center basics', difficulty: 'beginner' },
      { title: 'Managing users and licenses in M365', difficulty: 'beginner' },
      { title: 'Setting up Outlook email accounts', difficulty: 'beginner' },
      { title: 'OneDrive and SharePoint permissions', difficulty: 'intermediate' },
      { title: 'Teams setup and management', difficulty: 'beginner' },
      { title: 'Microsoft 365 security and compliance basics', difficulty: 'intermediate' },
    ],
  },
  {
    area: 'Cybersecurity Essentials',
    icon: '🔒',
    color: '#e74c3c',
    topics: [
      { title: 'Two-factor authentication (2FA) setup guide', difficulty: 'beginner' },
      { title: 'How to identify phishing emails', difficulty: 'beginner' },
      { title: 'Password management best practices', difficulty: 'beginner' },
      { title: 'Basic email security rules and SPF/DKIM', difficulty: 'intermediate' },
      { title: 'Client security audit checklist', difficulty: 'intermediate' },
      { title: 'Responding to a security incident', difficulty: 'advanced' },
    ],
  },
  {
    area: 'Platform Operations',
    icon: '🛍️',
    color: '#96BF48',
    topics: [
      { title: 'Shopify admin dashboard overview', difficulty: 'beginner' },
      { title: 'Adding products and managing inventory in Shopify', difficulty: 'beginner' },
      { title: 'Shopify app installation and configuration', difficulty: 'beginner' },
      { title: 'Wix site editor and management basics', difficulty: 'beginner' },
      { title: 'WooCommerce plugin management', difficulty: 'intermediate' },
      { title: 'E-commerce payment gateway troubleshooting', difficulty: 'intermediate' },
      { title: 'Store performance optimization', difficulty: 'advanced' },
    ],
  },
  {
    area: 'Business Tools & Integrations',
    icon: '🔗',
    color: '#f39c12',
    topics: [
      { title: 'Zapier automation basics', difficulty: 'beginner' },
      { title: 'QuickBooks connection and troubleshooting', difficulty: 'beginner' },
      { title: 'Slack workspace setup and management', difficulty: 'beginner' },
      { title: 'CRM basics (HubSpot, Salesforce)', difficulty: 'intermediate' },
      { title: 'DNS and domain management fundamentals', difficulty: 'intermediate' },
      { title: 'SSL certificates explained', difficulty: 'intermediate' },
    ],
  },
]

export default function TrainingHub() {
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [trainingContent, setTrainingContent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [customTopic, setCustomTopic] = useState('')
  const [expandedArea, setExpandedArea] = useState(null)

  async function loadTraining(topic, difficulty, serviceArea) {
    setSelectedTopic(topic)
    setTrainingContent(null)
    setLoading(true)

    try {
      const res = await fetch('/api/ai/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, difficulty, serviceArea }),
      })
      const data = await res.json()
      if (data.title) {
        setTrainingContent(data)
      }
    } catch (err) {
      console.error('Training load error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCustomSearch(e) {
    e.preventDefault()
    if (!customTopic.trim()) return
    await loadTraining(customTopic.trim(), 'beginner', 'General IT')
  }

  const difficultyColor = (d) => {
    const colors = { beginner: '#27ae60', intermediate: '#f39c12', advanced: '#e74c3c' }
    return colors[d] || '#8a8a8a'
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: '1.4rem' }}>🎓</span>
            <h1 className="admin-page-title">Training Hub</h1>
          </div>
          <p className="admin-page-desc">Learn any IT skill on demand — AI generates practical guides tailored for you</p>
        </div>
      </div>

      {/* Custom search */}
      <form onSubmit={handleCustomSearch} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          type="text"
          value={customTopic}
          onChange={(e) => setCustomTopic(e.target.value)}
          placeholder="Ask anything... e.g. 'How do I migrate email to Google Workspace?'"
          className="admin-search-input"
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          disabled={loading || !customTopic.trim()}
          style={{
            padding: '10px 20px', borderRadius: 8,
            background: 'var(--teal)', color: 'white', border: 'none',
            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap',
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? 'Generating...' : '🧠 Teach Me'}
        </button>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: trainingContent || loading ? '1fr 1.5fr' : '1fr', gap: 20 }}>
        {/* Curriculum sidebar */}
        <div>
          {CURRICULUM.map((area, i) => (
            <div key={i} className="admin-card" style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
              <button
                onClick={() => setExpandedArea(expandedArea === i ? null : i)}
                style={{
                  width: '100%', padding: '14px 16px', border: 'none', background: 'transparent',
                  display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                  fontFamily: 'Outfit, sans-serif', textAlign: 'left',
                }}
              >
                <span style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: area.color + '15', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '1.1rem'
                }}>
                  {area.icon}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)' }}>{area.area}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>{area.topics.length} lessons</div>
                </div>
                <span style={{
                  fontSize: '0.85rem', color: 'var(--ink-muted)',
                  transform: expandedArea === i ? 'rotate(90deg)' : 'none',
                  transition: 'transform 0.2s',
                }}>▶</span>
              </button>

              {expandedArea === i && (
                <div style={{ borderTop: '1px solid #f0ede8' }}>
                  {area.topics.map((topic, j) => (
                    <button
                      key={j}
                      onClick={() => loadTraining(topic.title, topic.difficulty, area.area)}
                      style={{
                        width: '100%', padding: '10px 16px 10px 62px', border: 'none',
                        background: selectedTopic === topic.title ? '#f0f7ff' : 'transparent',
                        cursor: 'pointer', fontFamily: 'Outfit, sans-serif', textAlign: 'left',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        borderBottom: j < area.topics.length - 1 ? '1px solid #f8f8f6' : 'none',
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', color: 'var(--ink-light)' }}>{topic.title}</span>
                      <span style={{
                        fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                        background: difficultyColor(topic.difficulty) + '18',
                        color: difficultyColor(topic.difficulty),
                        textTransform: 'uppercase', flexShrink: 0, marginLeft: 8,
                      }}>
                        {topic.difficulty}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Training content panel */}
        {(trainingContent || loading) && (
          <div>
            {loading ? (
              <div className="admin-card" style={{ textAlign: 'center', padding: 60 }}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>🧠</div>
                <p style={{ color: 'var(--ink-muted)' }}>Generating your training guide...</p>
              </div>
            ) : trainingContent && (
              <div className="admin-card" style={{ padding: 0 }}>
                {/* Header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0ede8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                      background: difficultyColor(trainingContent.difficulty) + '18',
                      color: difficultyColor(trainingContent.difficulty),
                      textTransform: 'uppercase',
                    }}>
                      {trainingContent.difficulty}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                      ⏱️ {trainingContent.estimated_time}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
                    {trainingContent.title}
                  </h2>
                  <p style={{ fontSize: '0.88rem', color: 'var(--teal)', fontWeight: 500 }}>
                    {trainingContent.why_it_matters}
                  </p>
                </div>

                <div style={{ padding: '20px 24px' }}>
                  {/* Key Concepts */}
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                      Key Concepts
                    </h3>
                    {trainingContent.key_concepts?.map((concept, i) => (
                      <div key={i} style={{
                        padding: '8px 12px', background: '#f8f9fa', borderRadius: 6,
                        marginBottom: 6, fontSize: '0.88rem', color: 'var(--ink-light)', lineHeight: 1.5,
                      }}>
                        {concept}
                      </div>
                    ))}
                  </div>

                  {/* Step by step */}
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                      Step-by-Step Guide
                    </h3>
                    {trainingContent.step_by_step?.map((step, i) => (
                      <div key={i} style={{
                        display: 'flex', gap: 12, padding: '12px 0',
                        borderBottom: i < trainingContent.step_by_step.length - 1 ? '1px solid #f0ede8' : 'none',
                      }}>
                        <span style={{
                          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                          background: 'var(--teal-light)', color: 'var(--teal)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.78rem', fontWeight: 700,
                        }}>{i + 1}</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)', marginBottom: 4 }}>
                            {step.title}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--ink-light)', lineHeight: 1.6 }}>
                            {step.explanation}
                          </div>
                          {step.pro_tip && (
                            <div style={{
                              marginTop: 6, padding: '6px 10px', borderRadius: 6,
                              background: '#fffdf5', border: '1px solid #ffeaa7',
                              fontSize: '0.82rem', color: '#856404',
                            }}>
                              💡 {step.pro_tip}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Client scenarios */}
                  {trainingContent.common_client_scenarios?.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                        Real Client Scenarios
                      </h3>
                      {trainingContent.common_client_scenarios.map((scenario, i) => (
                        <div key={i} style={{
                          background: '#f8f9fa', borderRadius: 8, padding: 14, marginBottom: 10,
                        }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
                            🗣️ Client says: &ldquo;{scenario.client_says}&rdquo;
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--ink-light)', marginBottom: 4 }}>
                            <strong>What it means:</strong> {scenario.what_it_means}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--teal)' }}>
                            <strong>How to fix:</strong> {scenario.how_to_fix}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick reference */}
                  {trainingContent.quick_reference?.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                        Quick Reference Cheat Sheet
                      </h3>
                      <div style={{ background: '#e8f5f0', borderRadius: 8, padding: 14 }}>
                        {trainingContent.quick_reference.map((item, i) => (
                          <div key={i} style={{ fontSize: '0.85rem', color: 'var(--ink)', padding: '4px 0', display: 'flex', gap: 8 }}>
                            <span style={{ color: 'var(--teal)' }}>✓</span>
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Escalation */}
                  {trainingContent.what_to_escalate && (
                    <div style={{
                      padding: 14, borderRadius: 8,
                      background: '#fff5f5', border: '1px solid #ffcccc',
                    }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#c0392b', marginBottom: 4 }}>
                        ⚠️ When to Escalate (Don&apos;t Try to Fix These Yourself)
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6b2020', lineHeight: 1.6 }}>
                        {trainingContent.what_to_escalate}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}