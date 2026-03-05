// File: app/api/ai/course-lesson/route.js (new — mkdir -p app/api/ai/course-lesson)

export async function POST(request) {
  try {
    const { courseTitle, lessonNumber, totalLessons, category } = await request.json()
    if (!courseTitle || !lessonNumber) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const isLastLesson = lessonNumber === totalLessons

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        system: `You are creating employee training content for a business IT training platform called TechDesk Pro Academy. The content should be professional, practical, and easy to understand for non-technical employees.

Write lesson ${lessonNumber} of ${totalLessons} for the course "${courseTitle}" (category: ${category}).

${isLastLesson ? 'This is the FINAL lesson. Include a comprehensive quiz at the end.' : 'This is a regular lesson.'}

Respond in this exact JSON format:
{
  "lesson_title": "Clear lesson title",
  "lesson_number": ${lessonNumber},
  "content": [
    {
      "type": "text",
      "heading": "Section heading",
      "body": "Clear, practical explanation. Use simple language. 2-3 paragraphs max per section."
    },
    {
      "type": "tip",
      "body": "A practical tip or best practice"
    },
    {
      "type": "warning",
      "body": "Important warning or common mistake to avoid"
    },
    {
      "type": "example",
      "title": "Real-World Example",
      "body": "A relatable workplace scenario"
    }
  ],
  "key_takeaways": ["3-4 bullet point takeaways from this lesson"],
  ${isLastLesson ? `"quiz": [
    {
      "question": "Clear question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Why this answer is correct"
    }
  ]` : `"quiz": null`}
}

${isLastLesson ? 'Include 5-8 quiz questions covering the entire course, not just this lesson. Mix difficulty levels.' : ''}
Return ONLY valid JSON.`,
        messages: [
          {
            role: 'user',
            content: `Generate lesson ${lessonNumber} of ${totalLessons} for "${courseTitle}". Make it practical and engaging.`
          }
        ],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`API error: ${errText}`)
    }

    const aiResult = await response.json()
    const resultText = aiResult.content
      .map(block => block.type === 'text' ? block.text : '')
      .join('')

    const cleaned = resultText.replace(/```json\n?|```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return Response.json(parsed)

  } catch (err) {
    console.error('Course lesson error:', err)
    return Response.json({ error: err.message || 'Failed to generate lesson' }, { status: 500 })
  }
}