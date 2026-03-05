// File: app/portal/training/page.js (new — mkdir -p app/portal/training)

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase/client'

const PLAN_RANK = { starter: 1, growth: 2, scale: 3, custom: 4 }

const CATEGORY_LABELS = {
  cybersecurity: { label: 'Cybersecurity', color: '#e74c3c' },
  cloud: { label: 'Cloud & Productivity', color: '#4285F4' },
  tools: { label: 'Business Tools', color: '#f39c12' },
  ecommerce: { label: 'E-Commerce', color: '#96BF48' },
  it: { label: 'IT Basics', color: '#0D7C66' },
}

export default function TrainingCatalog() {
  const [courses, setCourses] = useState([])
  const [progress, setProgress] = useState([])
  const [orgPlan, setOrgPlan] = useState('starter')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, organizations(plan)')
      .eq('id', user.id)
      .single()

    if (profile?.organizations?.plan) {
      setOrgPlan(profile.organizations.plan)
    }

    const { data: coursesData } = await supabase
      .from('training_courses')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })

    setCourses(coursesData || [])

    const { data: progressData } = await supabase
      .from('training_progress')
      .select('*')
      .eq('user_id', user.id)

    setProgress(progressData || [])
    setLoading(false)
  }

  function getCourseProgress(courseId) {
    return progress.find(p => p.course_id === courseId)
  }

  function isLocked(course) {
    return PLAN_RANK[course.min_plan] > PLAN_RANK[orgPlan]
  }

  const categories = ['all', ...new Set(courses.map(c => c.category))]

  const filtered = filter === 'all' ? courses : courses.filter(c => c.category === filter)

  const completedCount = progress.filter(p => p.completed_at).length
  const inProgressCount = progress.filter(p => !p.completed_at).length

  const difficultyColor = (d) => {
    const colors = { beginner: '#27ae60', intermediate: '#f39c12', advanced: '#e74c3c' }
    return colors[d] || '#8a8a8a'
  }

  if (loading) {
    return <div style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: 60 }}>Loading courses...</div>
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: '1.3rem' }}>🎓</span>
          <h1 style={{ fontSize: '1.6rem', margin: 0 }}>Training Academy</h1>
        </div>
        <p style={{ color: 'var(--ink-muted)', fontSize: '0.92rem' }}>
          Complete courses to build your team&apos;s skills. Earn certificates on completion.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--teal)' }}>{completedCount}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', fontWeight: 500 }}>Completed</div>
        </div>
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f39c12' }}>{inProgressCount}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', fontWeight: 500 }}>In Progress</div>
        </div>
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)' }}>{courses.length}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', fontWeight: 500 }}>Available</div>
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: '6px 14px', borderRadius: 100,
              border: filter === cat ? '2px solid var(--teal)' : '1px solid var(--border)',
              background: filter === cat ? 'var(--teal-light)' : 'white',
              color: filter === cat ? 'var(--teal)' : 'var(--ink-light)',
              fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif', textTransform: 'capitalize',
            }}
          >
            {cat === 'all' ? 'All Courses' : (CATEGORY_LABELS[cat]?.label || cat)}
          </button>
        ))}
      </div>

      {/* Course grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {filtered.map((course) => {
          const prog = getCourseProgress(course.id)
          const locked = isLocked(course)
          const completed = prog?.completed_at
          const started = prog && !completed
          const progressPct = prog ? Math.round((prog.lessons_completed / course.lesson_count) * 100) : 0

          return (
            <div
              key={course.id}
              style={{
                background: 'white', border: '1px solid var(--border)', borderRadius: 14,
                padding: 20, display: 'flex', flexDirection: 'column',
                opacity: locked ? 0.6 : 1, position: 'relative',
                transition: 'all 0.2s', cursor: locked ? 'default' : 'pointer',
              }}
              onClick={() => !locked && (window.location.href = `/portal/training/${course.id}`)}
            >
              {/* Locked badge */}
              {locked && (
                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  padding: '3px 10px', borderRadius: 100, fontSize: '0.68rem',
                  fontWeight: 700, background: '#f0f2f5', color: '#8a8a8a',
                  textTransform: 'uppercase',
                }}>
                  🔒 {course.min_plan}+ plan
                </div>
              )}

              {/* Completed badge */}
              {completed && (
                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  padding: '3px 10px', borderRadius: 100, fontSize: '0.68rem',
                  fontWeight: 700, background: '#ecfdf5', color: '#059669',
                }}>
                  ✅ Completed
                </div>
              )}

              <div style={{ fontSize: '2rem', marginBottom: 12 }}>{course.icon}</div>

              <div style={{
                display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap',
              }}>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                  background: (CATEGORY_LABELS[course.category]?.color || '#8a8a8a') + '18',
                  color: CATEGORY_LABELS[course.category]?.color || '#8a8a8a',
                  textTransform: 'uppercase',
                }}>
                  {CATEGORY_LABELS[course.category]?.label || course.category}
                </span>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                  background: difficultyColor(course.difficulty) + '18',
                  color: difficultyColor(course.difficulty),
                  textTransform: 'uppercase',
                }}>
                  {course.difficulty}
                </span>
              </div>

              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
                {course.title}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', lineHeight: 1.5, flex: 1 }}>
                {course.description}
              </p>

              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-light)',
              }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                  {course.lesson_count} lessons · {course.estimated_minutes} min
                </span>
                {started && !completed && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--teal)', fontWeight: 600 }}>
                    {progressPct}%
                  </span>
                )}
              </div>

              {/* Progress bar */}
              {started && !completed && (
                <div style={{
                  height: 4, background: 'var(--border-light)', borderRadius: 100,
                  marginTop: 8, overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', background: 'var(--teal)', borderRadius: 100,
                    width: `${progressPct}%`, transition: 'width 0.5s',
                  }} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}