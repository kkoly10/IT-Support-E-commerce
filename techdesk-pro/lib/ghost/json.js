export function safeJsonParse(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export function extractTextBlocks(aiResult) {
  return (aiResult?.content || [])
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('')
}

export function parseClaudeJson(aiResult) {
  const raw = extractTextBlocks(aiResult)
    .replace(/```json\n?|```/g, '')
    .trim()

  const direct = safeJsonParse(raw)
  if (direct) return direct

  const firstBrace = raw.indexOf('{')
  const lastBrace = raw.lastIndexOf('}')

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return safeJsonParse(raw.slice(firstBrace, lastBrace + 1))
  }

  return null
}