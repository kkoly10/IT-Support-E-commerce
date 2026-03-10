import { parseClaudeJson } from './json'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const DEFAULT_MODEL = 'claude-sonnet-4-20250514'

export async function askClaudeJson({
  system,
  userContent,
  model = DEFAULT_MODEL,
  maxTokens = 1200,
}) {
  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: [
        {
          role: 'user',
          content: userContent,
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Anthropic API error: ${errorText}`)
  }

  const aiResult = await response.json()
  const parsed = parseClaudeJson(aiResult)

  if (!parsed) {
    throw new Error('Claude returned invalid JSON')
  }

  return parsed
}