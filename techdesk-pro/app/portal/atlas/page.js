// File: app/portal/atlas/page.js (new — mkdir -p app/portal/atlas)

'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '../../../lib/supabase/client'

export default function AtlasAIPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [userId, setUserId] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    getUser()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!input.trim() || sending || !userId) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setSending(true)

    try {
      const response = await fetch('/api/ai/atlas-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages,
          userId,
        }),
      })

      const data = await response.json()

      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I had trouble processing that. Please try again.' }])
      }
    } catch (err) {
      console.error('Atlas AI error:', err)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again in a moment.' }])
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const SUGGESTIONS = [
    'What is the status of my open tickets?',
    'How can we reduce repeated account-access issues?',
    'What admin controls should we tighten in Google Workspace?',
    'Help me troubleshoot my email setup',
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #0D7C66, #10a37f)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: '0.9rem'
          }}>A</div>
          <div>
            <h1 style={{ fontSize: '1.4rem', margin: 0 }}>Atlas AI</h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', margin: 0 }}>Your business copilot — ask me anything</p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div style={{
        flex: 1, overflowY: 'auto', background: 'white',
        border: '1px solid var(--border)', borderRadius: 12,
        padding: 20, marginBottom: 16
      }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: 'linear-gradient(135deg, #0D7C66, #10a37f)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '1.5rem',
              margin: '0 auto 16px'
            }}>A</div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: 8, color: 'var(--ink)' }}>Hey! I'm Atlas AI</h2>
            <p style={{ color: 'var(--ink-muted)', fontSize: '0.92rem', maxWidth: 400, margin: '0 auto 24px' }}>
              I know your account, your tickets, and your tech stack. Ask me anything about your support requests, tools, users, or IT setup.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 500, margin: '0 auto' }}>
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(s)
                    inputRef.current?.focus()
                  }}
                  style={{
                    padding: '8px 14px', borderRadius: 100,
                    border: '1px solid var(--border)', background: 'var(--bg)',
                    fontSize: '0.82rem', color: 'var(--ink-light)', cursor: 'pointer',
                    fontFamily: 'Outfit, sans-serif', transition: 'all 0.15s'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div style={{
                  maxWidth: '75%',
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user' ? 'var(--teal)' : '#f0f2f5',
                  color: msg.role === 'user' ? 'white' : 'var(--ink)',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.role === 'assistant' && (
                    <div style={{
                      fontSize: '0.72rem', fontWeight: 600, color: 'var(--teal)',
                      marginBottom: 4, letterSpacing: '0.04em'
                    }}>
                      ATLAS AI
                    </div>
                  )}
                  {msg.content}
                </div>
              </div>
            ))}
            {sending && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '12px 16px', borderRadius: '16px 16px 16px 4px',
                  background: '#f0f2f5', color: 'var(--ink-muted)',
                  fontSize: '0.9rem'
                }}>
                  <span style={{ display: 'inline-block', animation: 'pulse 1.5s infinite' }}>Atlas is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Atlas anything..."
          disabled={sending}
          style={{
            flex: 1, padding: '12px 16px',
            border: '1px solid var(--border)', borderRadius: 10,
            fontSize: '0.9rem', fontFamily: 'Outfit, sans-serif',
            outline: 'none', color: 'var(--ink)'
          }}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          style={{
            padding: '12px 20px', background: 'var(--teal)', color: 'white',
            border: 'none', borderRadius: 10, fontWeight: 600,
            fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
            opacity: sending || !input.trim() ? 0.5 : 1,
            whiteSpace: 'nowrap'
          }}
        >
          Send
        </button>
      </form>
    </div>
  )
}