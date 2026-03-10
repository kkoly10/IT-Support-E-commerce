import { askClaudeJson } from './anthropic'
import { loadTicketRuntimeContext, updateTicketStatus } from './ticket-loaders'
import {
  buildSuggestReplyPrompt,
  buildFollowupDraftPrompt,
  buildKnowledgeDraftPrompt,
} from './ticket-prompts'
import {
  upsertKnowledgeDraft,
  insertKnowledgeNote,
  publishKnowledgeArticle,
} from './knowledge'

function normalizeKnowledgeDraft(ticket, parsed) {
  return {
    title: parsed.title || `SOP: ${ticket.title}`,
    short_summary:
      parsed.short_summary || ticket.ai_summary || 'Support request resolution summary.',
    problem: parsed.problem || ticket.description || ticket.title,
    likely_cause: parsed.likely_cause || 'Cause to be confirmed by support lead.',
    steps_taken: Array.isArray(parsed.steps_taken) ? parsed.steps_taken : [],
    reusable_fix_guidance:
      parsed.reusable_fix_guidance ||
      'Document repeatable fix pattern and verify access prerequisites.',
    future_prevention_note:
      parsed.future_prevention_note ||
      'Add onboarding checks and proactive monitoring where applicable.',
  }
}

export async function getTicketCoachSuggestion(ticketId) {
  const { ticket, conversation } = await loadTicketRuntimeContext(ticketId)
  const prompt = buildSuggestReplyPrompt({ ticket, conversation })
  const parsed = await askClaudeJson(prompt)

  return {
    suggested_reply: parsed.suggested_reply || '',
    coach: {
      tone: parsed.coach?.tone || 'Professional and clear',
      next_steps: Array.isArray(parsed.coach?.next_steps) ? parsed.coach.next_steps : [],
      internal_note: parsed.coach?.internal_note || '',
      escalation_reason: parsed.coach?.escalation_reason || '',
    },
  }
}

export async function getTicketFollowupDraft(ticketId, draftType) {
  const { ticket, conversation } = await loadTicketRuntimeContext(ticketId)
  const prompt = buildFollowupDraftPrompt({ ticket, conversation, draftType })
  const parsed = await askClaudeJson(prompt)

  return {
    draft: parsed.draft || '',
    suggested_status: parsed.suggested_status || 'waiting_on_client',
  }
}

export async function generateTicketKnowledgeDraft(ticketId) {
  const { ticket, conversation } = await loadTicketRuntimeContext(ticketId)

  if (!['resolved', 'closed'].includes(ticket.status)) {
    throw new Error('KB/SOP drafts can only be generated from resolved or closed support requests')
  }

  const prompt = buildKnowledgeDraftPrompt({ ticket, conversation })
  const parsed = await askClaudeJson(prompt)
  const draft = normalizeKnowledgeDraft(ticket, parsed)

  const draftId = await upsertKnowledgeDraft(ticketId, draft, 'draft')
  await insertKnowledgeNote(ticketId, draft)

  return {
    draft,
    draftId,
    stored_in: 'kb_sop_drafts + ticket_messages.is_internal_note=true',
  }
}

export async function runGhostTicketAction(ticketId, action) {
  const { ticket, conversation } = await loadTicketRuntimeContext(ticketId)

  if (action === 'waiting_on_client_followup') {
    const prompt = buildFollowupDraftPrompt({
      ticket,
      conversation,
      draftType: 'waiting_on_client_followup',
    })
    const parsed = await askClaudeJson(prompt)

    await updateTicketStatus(ticketId, 'waiting_on_client')

    return {
      success: true,
      action,
      draft: parsed.draft || '',
      updatedStatus: 'waiting_on_client',
      message: 'Ticket moved to waiting on client and follow-up draft prepared.',
    }
  }

  if (action === 'request_access_details') {
    const prompt = buildFollowupDraftPrompt({
      ticket,
      conversation,
      draftType: 'request_access_details',
    })
    const parsed = await askClaudeJson(prompt)

    await updateTicketStatus(ticketId, 'waiting_on_client')

    return {
      success: true,
      action,
      draft: parsed.draft || '',
      updatedStatus: 'waiting_on_client',
      message: 'Access/details request draft prepared and ticket moved to waiting on client.',
    }
  }

  if (action === 'resolve_and_publish') {
    if (!['resolved', 'closed'].includes(ticket.status)) {
      await updateTicketStatus(ticketId, 'resolved')
    }

    const prompt = buildKnowledgeDraftPrompt({
      ticket: { ...ticket, status: 'resolved' },
      conversation,
    })
    const parsed = await askClaudeJson(prompt, 1400)
    const draft = normalizeKnowledgeDraft(ticket, parsed)

    const draftId = await upsertKnowledgeDraft(ticketId, draft, 'draft')
    await insertKnowledgeNote(ticketId, draft)
    const articleId = await publishKnowledgeArticle(ticketId, draftId, draft)

    return {
      success: true,
      action,
      updatedStatus: 'resolved',
      draft,
      draftId,
      articleId,
      message: 'Ticket resolved and knowledge article published.',
    }
  }

  throw new Error('Unsupported action')
}