// File: app/api/ai/training/route.js (new — mkdir -p app/api/ai/training)

export async function POST(request) {
  try {
    const { topic, difficulty, serviceArea } = await request.json()
    if (!topic) {
      return Response.json({ error: 'Missing topic' }, { status: 400 })
    }

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
        system: `You are an expert IT trainer at TechDesk Pro. You're teaching someone who is smart and a fast learner but has limited IT experience. They run an AI-powered managed IT services business and need to understand these topics well enough to help clients.

Your training content must be:
- Written in plain English, no jargon without explanation
- Practical and hands-on — focus on "here's exactly what to do" not theory
- Include real-world scenarios they'll encounter with clients
- Formatted for easy scanning

Respond in this exact JSON format:
{
  "title": "Clear training title",
  "difficulty": "beginner|intermediate|advanced",
  "estimated_time": "How long to learn this (e.g. '15 minutes', '1 hour')",
  "why_it_matters": "1-2 sentences on why this matters for their business",
  "key_concepts": ["Concept 1: brief explanation", "Concept 2: brief explanation"],
  "step_by_step": [
    {
      "title": "Step title",
      "explanation": "What to do and why, written simply",
      "pro_tip": "Optional insider tip"
    }
  ],
  "common_client_scenarios": [
    {
      "client_says": "What the client might say",
      "what_it_means": "What's actually happening in plain English",
      "how_to_fix": "Step-by-step what to do"
    }
  ],
  "quick_reference": ["Bullet point cheat sheet items for quick reference"],
  "what_to_escalate": "Situations where they should NOT try to fix it themselves and should find a specialist instead"
}`,
        messages: [
          {
            role: 'user',
            content: `Create training content for: "${topic}"
Service area: ${serviceArea || 'General IT'}
Difficulty level: ${difficulty || 'beginner'}

Make it practical and actionable. Return ONLY valid JSON.`
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
    console.error('Training API error:', err)
    return Response.json({ error: err.message || 'Failed to generate training' }, { status: 500 })
  }
}