export function buildSuggestReplyPrompt({ ticket, conversation }) {
  return {
    system: `You are Ghost Admin, the internal support operator brain for TechDesk Pro.

TechDesk Pro is a founder-led, remote-first IT support business.

You are helping the operator prepare the next client-facing reply and internal coaching guidance.

Return ONLY valid JSON in this exact shape:
{
  "suggested_reply": "Client-facing message",
  "coach": {
    "tone": "Short description of tone",
    "next_steps": ["Step 1", "Step 2"],
    "internal_note": "Short internal note for the operator",
    "escalation_reason": ""
  }
}

Rules:
- stay within remote IT support scope
- be practical, concise, and professional
- do not overpromise timelines
- keep internal guidance operator-focused
- only include escalation_reason if escalation is genuinely warranted`,
    userContent: `Ticket:
- Title: ${ticket.title}
- Description: ${ticket.description || 'No description provided'}
- Current status: ${ticket.status}
- Category: ${ticket.category || 'unknown'}
- AI category: ${ticket.ai_category || 'unknown'}
- AI summary: ${ticket.ai_summary || 'none'}
- Priority: ${ticket.priority || 'unknown'}
- Organization: ${ticket.organization?.name || 'Unknown'}
- Contact: ${ticket.creator?.full_name || 'Unknown'} (${ticket.creator?.email || 'unknown'})

Conversation:
${conversation || 'No client-facing conversation yet.'}

Generate the JSON now.`,
    maxTokens: 1100,
  }
}

export function buildFollowupDraftPrompt({ ticket, conversation, draftType }) {
  const promptMap = {
    waiting_on_client: {
      status: 'waiting_on_client',
      instruction:
        'Draft a professional update explaining that the team is waiting on the client before continuing.',
    },
    still_working: {
      status: 'in_progress',
      instruction:
        'Draft a professional update telling the client the issue is still being worked and what is happening next.',
    },
    confirm_resolution: {
      status: 'resolved',
      instruction:
        'Draft a professional message asking the client to confirm whether the issue is resolved.',
    },
    stale_nudge: {
      status: 'waiting_on_client',
      instruction:
        'Draft a polite follow-up message nudging the client for a response so the request can move forward.',
    },
    request_access_details: {
      status: 'waiting_on_client',
      instruction:
        'Draft a message asking for the most useful missing access, screenshots, error text, affected users, timing, and platform details.',
    },
    waiting_on_client_followup: {
      status: 'waiting_on_client',
      instruction:
        'Draft a message explaining the request is waiting on the client and clearly state what information is needed next.',
    },
  }

  const selected = promptMap[draftType] || promptMap.waiting_on_client

  return {
    system: `You are drafting a client-facing support message for TechDesk Pro.

TechDesk Pro is a remote-first IT support business.

Return ONLY valid JSON:
{
  "draft": "client-facing message",
  "suggested_status": "${selected.status}"
}

Rules:
- be professional, calm, and concise
- ask only for the most useful next information
- do not overpromise timelines
- stay within remote IT support scope
- write as an operator sending a real client update`,
    userContent: `Ticket:
- Title: ${ticket.title}
- Description: ${ticket.description || 'No description provided'}
- Current status: ${ticket.status}
- Category: ${ticket.category || 'unknown'}
- AI summary: ${ticket.ai_summary || 'none'}
- Organization: ${ticket.organization?.name || 'Unknown'}
- Contact: ${ticket.creator?.full_name || 'Unknown'} (${ticket.creator?.email || 'unknown'})

Draft type instruction:
${selected.instruction}

Conversation:
${conversation || 'No client-facing conversation yet.'}

Generate the JSON now.`,
    maxTokens: 900,
  }
}

export function buildKnowledgeDraftPrompt({ ticket, conversation }) {
  return {
    system: `You are an IT support knowledge-ops assistant for TechDesk Pro.

TechDesk Pro is a remote-first IT support business.
Your task is to convert one resolved support request into an internal KB/SOP draft.

Return ONLY valid JSON in this exact structure:
{
  "title": "Short practical SOP title",
  "short_summary": "1-2 sentence plain-English summary",
  "problem": "What issue the client faced",
  "likely_cause": "Most likely root cause",
  "steps_taken": ["Step 1", "Step 2", "Step 3"],
  "reusable_fix_guidance": "How to apply this fix next time",
  "future_prevention_note": "How to reduce recurrence"
}

Rules:
- keep it specific and reusable for a founder-led IT support operation
- avoid fluff
- avoid mentioning e-commerce, website-build, or automation-build business lines
- steps should be concise and operational
- if conversation data is sparse, infer carefully and stay practical`,
    userContent: `Resolved support request details:
- Ticket number: ${ticket.ticket_number || 'n/a'}
- Title: ${ticket.title}
- Description: ${ticket.description || 'No description provided'}
- Status: ${ticket.status}
- Category: ${ticket.category || 'unknown'}
- AI category: ${ticket.ai_category || 'unknown'}
- AI summary: ${ticket.ai_summary || 'none'}
- Organization: ${ticket.organization?.name || 'Unknown'}

Conversation transcript:
${conversation || 'No conversation available.'}

Generate the KB/SOP draft now.`,
    maxTokens: 1400,
  }
}