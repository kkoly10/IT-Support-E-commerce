// File: app/portal/training/[id]/page.js (new — mkdir -p app/portal/training/[id])

'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '../../../../lib/supabase/client'

export default function CourseDetail() {
  const { id } = useParams()
  const [course, setCourse] = useState(null)
  const [progress, setProgress] = useState(null)
  const [currentLesson, setCurrentLesson] = useState(1)
  const [lessonContent, setLessonContent] = useState(null)
  const [lessonLoading, setLessonLoading] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizScore, setQuizScore] = useState(null)
  const [userId, setUserId] = useState(null)
  const [orgId, setOrgId] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadCourse()
  }, [id])

  async function loadCourse() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (profile) setOrgId(profile.organization_id)

    const { data: courseData } = await supabase
      .from('training_courses')
      .select('*')
      .eq('id', id)
      .single()

    setCourse(courseData)

    const { data: prog } = await supabase
      .from('training_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', id)
      .single()

    if (prog) {
      setProgress(prog)
      setCurrentLesson(Math.min(prog.lessons_completed + 1, courseData.lesson_count))
    }

    setLoading(false)
  }

  async function loadLesson(lessonNum) {
    setCurrentLesson(lessonNum)
    setLessonContent(null)
    setLessonLoading(true)
    setQuizSubmitted(false)
    setQuizAnswers({})
    setQuizScore(null)

    try {
      const res = await fetch('/api/ai/course-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseTitle: course.title,
          lessonNumber: lessonNum,
          totalLessons: course.lesson_count,
          category: course.category,
        }),
      })
      const data = await res.json()
      if (data.lesson_title) {
        setLessonContent(data)
      }
    } catch (err) {
      console.error('Lesson load error:', err)
    } finally {
      setLessonLoading(false)
    }
  }

  async function handleCompleteLesson() {
    if (!userId || !orgId) return

    const newCount = Math.max(currentLesson, progress?.lessons_completed || 0)

    if (progress) {
      await supabase
        .from('training_progress')
        .update({ lessons_completed: newCount })
        .eq('id', progress.id)

      setProgress(prev => ({ ...prev, lessons_completed: newCount }))
    } else {
      const { data: newProg } = await supabase
        .from('training_progress')
        .insert({
          user_id: userId,
          organization_id: orgId,
          course_id: id,
          lessons_completed: newCount,
        })
        .select()
        .single()

      setProgress(newProg)
    }

    if (currentLesson < course.lesson_count) {
      loadLesson(currentLesson + 1)
    }
  }

  async function handleSubmitQuiz() {
    if (!lessonContent?.quiz) return

    const total = lessonContent.quiz.length
    let correct = 0
    lessonContent.quiz.forEach((q, i) => {
      if (quizAnswers[i] === q.correct) correct++
    })

    const score = Math.round((correct / total) * 100)
    const passed = score >= 70
    setQuizScore(score)
    setQuizSubmitted(true)

    // Update progress
    const updateData = {
      quiz_score: score,
      quiz_passed: passed,
      lessons_completed: course.lesson_count,
    }

    if (passed) {
      updateData.completed_at = new Date().toISOString()
      updateData.certificate_issued = true
    }

    if (progress) {
      await supabase
        .from('training_progress')
        .update(updateData)
        .eq('id', progress.id)
    } else {
      await supabase
        .from('training_progress')
        .insert({
          user_id: userId,
          organization_id: orgId,
          course_id: id,
          ...updateData,
        })
    }

    setProgress(prev => ({ ...prev, ...updateData }))
  }

  if (loading) {
    return <div style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: 60 }}>Loading course...</div>
  }

  if (!course) {
    return <div style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: 60 }}>Course not found.</div>
  }

  const isCompleted = progress?.completed_at

  return (
    <div>
      <a href="/portal/training" style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}>← Back to courses</a>

      {/* Course header */}
      <div style={{
        background: 'white', border: '1px solid var(--border)', borderRadius: 14,
        padding: 24, marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: '1.8rem' }}>{course.icon}</span>
          <div>
            <h1 style={{ fontSize: '1.4rem', margin: 0 }}>{course.title}</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', margin: '4px 0 0' }}>
              {course.lesson_count} lessons · {course.estimated_minutes} min · {course.difficulty}
            </p>
          </div>
          {isCompleted && (
            <div style={{
              marginLeft: 'auto', padding: '6px 14px', borderRadius: 100,
              background: '#ecfdf5', color: '#059669', fontWeight: 700, fontSize: '0.82rem',
            }}>
              ✅ Completed — {progress.quiz_score}% Score
            </div>
          )}
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--ink-light)', lineHeight: 1.6 }}>{course.description}</p>

        {/* Lesson progress bar */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--ink-muted)', marginBottom: 6 }}>
            <span>Progress</span>
            <span>{progress?.lessons_completed || 0}/{course.lesson_count} lessons</span>
          </div>
          <div style={{ height: 6, background: 'var(--border-light)', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: 'var(--teal)', borderRadius: 100,
              width: `${((progress?.lessons_completed || 0) / course.lesson_count) * 100}%`,
              transition: 'width 0.5s',
            }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20 }}>
        {/* Lesson nav */}
        <div>
          {Array.from({ length: course.lesson_count }, (_, i) => i + 1).map((num) => {
            const isComplete = (progress?.lessons_completed || 0) >= num
            const isCurrent = currentLesson === num
            return (
              <button
                key={num}
                onClick={() => loadLesson(num)}
                style={{
                  width: '100%', padding: '10px 12px', marginBottom: 4, borderRadius: 8,
                  border: isCurrent ? '2px solid var(--teal)' : '1px solid var(--border)',
                  background: isCurrent ? 'var(--teal-light)' : isComplete ? '#ecfdf5' : 'white',
                  cursor: 'pointer', fontFamily: 'Outfit, sans-serif', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: '0.82rem', color: 'var(--ink)',
                }}
              >
                <span style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  background: isComplete ? '#059669' : isCurrent ? 'var(--teal)' : 'var(--border-light)',
                  color: isComplete || isCurrent ? 'white' : 'var(--ink-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 700,
                }}>
                  {isComplete ? '✓' : num}
                </span>
                Lesson {num}
              </button>
            )
          })}
        </div>

        {/* Lesson content */}
        <div>
          {!lessonContent && !lessonLoading && (
            <div style={{
              background: 'white', border: '1px solid var(--border)', borderRadius: 14,
              padding: 40, textAlign: 'center',
            }}>
              <p style={{ color: 'var(--ink-muted)', marginBottom: 16 }}>Select a lesson to start, or begin from where you left off.</p>
              <button
                onClick={() => loadLesson(currentLesson)}
                style={{
                  padding: '12px 24px', background: 'var(--teal)', color: 'white',
                  border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem',
                  cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                }}
              >
                {progress?.lessons_completed > 0 ? 'Continue Learning' : 'Start Course'}
              </button>
            </div>
          )}

          {lessonLoading && (
            <div style={{
              background: 'white', border: '1px solid var(--border)', borderRadius: 14,
              padding: 60, textAlign: 'center',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>📖</div>
              <p style={{ color: 'var(--ink-muted)' }}>Generating lesson content...</p>
            </div>
          )}

          {lessonContent && (
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
              {/* Lesson header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontWeight: 600, marginBottom: 4 }}>
                  LESSON {lessonContent.lesson_number} OF {course.lesson_count}
                </div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--ink)' }}>
                  {lessonContent.lesson_title}
                </h2>
              </div>

              <div style={{ padding: '20px 24px' }}>
                {/* Content blocks */}
                {lessonContent.content?.map((block, i) => (
                  <div key={i} style={{ marginBottom: 20 }}>
                    {block.type === 'text' && (
                      <>
                        {block.heading && (
                          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
                            {block.heading}
                          </h3>
                        )}
                        <p style={{ fontSize: '0.9rem', color: 'var(--ink-light)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                          {block.body}
                        </p>
                      </>
                    )}
                    {block.type === 'tip' && (
                      <div style={{ padding: 14, borderRadius: 8, background: '#e8f5f0', border: '1px solid #c8e6d8' }}>
                        <span style={{ fontSize: '0.85rem', color: '#0D7C66' }}>💡 <strong>Tip:</strong> {block.body}</span>
                      </div>
                    )}
                    {block.type === 'warning' && (
                      <div style={{ padding: 14, borderRadius: 8, background: '#fff5f5', border: '1px solid #ffcccc' }}>
                        <span style={{ fontSize: '0.85rem', color: '#c0392b' }}>⚠️ <strong>Warning:</strong> {block.body}</span>
                      </div>
                    )}
                    {block.type === 'example' && (
                      <div style={{ padding: 14, borderRadius: 8, background: '#f0f7ff', border: '1px solid #cce0ff' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1a5276', marginBottom: 4 }}>📋 {block.title}</div>
                        <span style={{ fontSize: '0.85rem', color: '#2c3e50', lineHeight: 1.6 }}>{block.body}</span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Key takeaways */}
                {lessonContent.key_takeaways?.length > 0 && (
                  <div style={{ padding: 14, borderRadius: 8, background: '#fafaf8', marginBottom: 20 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>📌 Key Takeaways</div>
                    {lessonContent.key_takeaways.map((t, i) => (
                      <div key={i} style={{ fontSize: '0.85rem', color: 'var(--ink-light)', padding: '3px 0', display: 'flex', gap: 8 }}>
                        <span style={{ color: 'var(--teal)' }}>✓</span> {t}
                      </div>
                    ))}
                  </div>
                )}

                {/* Quiz */}
                {lessonContent.quiz && lessonContent.quiz.length > 0 && (
                  <div style={{ borderTop: '2px solid var(--teal)', paddingTop: 20, marginTop: 20 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 16 }}>
                      📝 Course Quiz
                    </h3>

                    {lessonContent.quiz.map((q, qi) => (
                      <div key={qi} style={{
                        marginBottom: 20, padding: 16, borderRadius: 10,
                        background: quizSubmitted
                          ? quizAnswers[qi] === q.correct ? '#ecfdf5' : '#fff5f5'
                          : '#f8f9fa',
                        border: '1px solid ' + (quizSubmitted
                          ? quizAnswers[qi] === q.correct ? '#a7f3d0' : '#ffcccc'
                          : '#e8e6e1'),
                      }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 10 }}>
                          {qi + 1}. {q.question}
                        </div>
                        {q.options.map((opt, oi) => (
                          <label
                            key={oi}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0',
                              cursor: quizSubmitted ? 'default' : 'pointer', fontSize: '0.88rem',
                              color: quizSubmitted && oi === q.correct ? '#059669' : 'var(--ink-light)',
                              fontWeight: quizSubmitted && oi === q.correct ? 600 : 400,
                            }}
                          >
                            <input
                              type="radio"
                              name={`q-${qi}`}
                              checked={quizAnswers[qi] === oi}
                              onChange={() => !quizSubmitted && setQuizAnswers(prev => ({ ...prev, [qi]: oi }))}
                              disabled={quizSubmitted}
                            />
                            {opt}
                            {quizSubmitted && oi === q.correct && ' ✅'}
                          </label>
                        ))}
                        {quizSubmitted && quizAnswers[qi] !== q.correct && (
                          <div style={{ marginTop: 8, fontSize: '0.82rem', color: '#856404', background: '#fffdf5', padding: '6px 10px', borderRadius: 6 }}>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    ))}

                    {!quizSubmitted ? (
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={Object.keys(quizAnswers).length < lessonContent.quiz.length}
                        style={{
                          padding: '12px 24px', background: 'var(--teal)', color: 'white',
                          border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem',
                          cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                          opacity: Object.keys(quizAnswers).length < lessonContent.quiz.length ? 0.5 : 1,
                        }}
                      >
                        Submit Quiz
                      </button>
                    ) : (
                      <div style={{
                        padding: 20, borderRadius: 10, textAlign: 'center',
                        background: quizScore >= 70 ? '#ecfdf5' : '#fffdf5',
                        border: `1px solid ${quizScore >= 70 ? '#a7f3d0' : '#ffeaa7'}`,
                      }}>
                        <div style={{ fontSize: '2rem', marginBottom: 8 }}>
                          {quizScore >= 70 ? '🎉' : '📚'}
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: quizScore >= 70 ? '#059669' : '#856404' }}>
                          {quizScore}% — {quizScore >= 70 ? 'Passed!' : 'Not quite — review and try again'}
                        </div>
                        {quizScore >= 70 && (
                          <p style={{ fontSize: '0.88rem', color: 'var(--ink-muted)', marginTop: 8 }}>
                            Congratulations! You&apos;ve earned your certificate for {course.title}.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Next lesson / Complete button */}
                {!lessonContent.quiz && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--border-light)' }}>
                    <button
                      onClick={handleCompleteLesson}
                      style={{
                        padding: '12px 24px', background: 'var(--teal)', color: 'white',
                        border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem',
                        cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                      }}
                    >
                      {currentLesson < course.lesson_count ? 'Complete & Next Lesson →' : 'Complete Lesson'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}