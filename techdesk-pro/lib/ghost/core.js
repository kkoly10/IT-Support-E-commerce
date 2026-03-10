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
import {
  loadGhostContextBundle,
  loadGhostSearchBundle,
  loadAssessmentReviewBundle,
  loadOnboardingReviewBundle,
} from './reasoning-loaders'
import {
  buildGhostContextPrompt,
  buildGhostSearchPrompt,
  buildAssessmentReviewPrompt,
  buildOnboardingReviewPrompt,
} from './reasoning-prompts'
import { normalizeRequestCategory } from '../support-ui'

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

function buildGhostSearchFallback(query, matches) {
  if (matches.length === 0) {
    return {
      answer: `I did not find strong matches for "${query}" across tickets, organizations, assessments, drafts, or published knowledge.`,
      recommended_actions: [
        'Try a more specific client, platform, or issue keyword.',
        'Search by organization name, Microsoft 365 / Google Workspace term, or part of the ticket title.',
      ],
    }
  }

  return {
    answer: `I found ${matches.length} relevant internal records for "${query}". Review the strongest matches first and use published knowledge when available.`,
    recommended_actions: [
      'Open any published knowledge match first if it directly fits the issue.',
      'Use similar tickets and drafts to reduce duplicate work.',
      'Check lifecycle or assessment context before committing to a next step.',
    ],
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
    const parsed = await askClaudeJson(prompt)
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

export async function getGhostTicketContext(ticketId) {
  const bundle = await loadGhostContextBundle(ticketId)
  const parsed = await askClaudeJson(buildGhostContextPrompt(bundle))

  return {
    ...parsed,
    similar_tickets: bundle.filteredSimilarTickets.map((item) => ({
      id: item.id,
      ticket_number: item.ticket_number,
      title: item.title,
      summary: item.ai_summary || '',
      category: normalizeRequestCategory(item.ai_category || item.category || 'other'),
      created_at: item.created_at,
    })),
    linked_assessment: bundle.linkedAssessment,
    kb_signal: bundle.kbSignal,
    published_knowledge: bundle.relatedArticles.map((item) => ({
      id: item.id,
      title: item.title,
      summary: item.summary || item.problem || '',
      published_at: item.published_at,
    })),
  }
}

export async function runGhostSearch(query) {
  const bundle = await loadGhostSearchBundle(query)
  let synthesized = buildGhostSearchFallback(bundle.cleanedQuery, bundle.matches)

  try {
    const parsed = await askClaudeJson(buildGhostSearchPrompt(bundle))
    if (parsed?.answer) {
      synthesized = {
        answer: parsed.answer,
        recommended_actions: Array.isArray(parsed.recommended_actions)
          ? parsed.recommended_actions
          : [],
      }
    }
  } catch (err) {
    console.error('Ghost search synthesis fallback used:', err)
  }

  return {
    answer: synthesized.answer,
    recommended_actions: Array.isArray(synthesized.recommended_actions)
      ? synthesized.recommended_actions
      : [],
    counts: bundle.counts,
    matches: bundle.matches.slice(0, 20),
  }
}

export async function reviewAssessmentSubmission(assessmentId) {
  const bundle = await loadAssessmentReviewBundle(assessmentId)
  const parsed = await askClaudeJson(buildAssessmentReviewPrompt(bundle))

  return {
    qualification_summary: parsed.qualification_summary || 'No summary returned.',
    fit_score: typeof parsed.fit_score === 'number' ? parsed.fit_score : 0,
    fit_label: parsed.fit_label || 'unclear_fit',
    urgency_signal: parsed.urgency_signal || 'medium',
    recommended_status: parsed.recommended_status || 'contacted',
    recommended_next_action: parsed.recommended_next_action || 'Review manually.',
    review_flag: parsed.review_flag || 'human_review',
    onboarding_readiness: parsed.onboarding_readiness || 'needs_manual_review',
    operator_warning: parsed.operator_warning || 'Review carefully before proceeding.',
  }
}

export async function reviewOnboardingState(organizationId) {
  const bundle = await loadOnboardingReviewBundle(organizationId)
  const parsed = await askClaudeJson(buildOnboardingReviewPrompt(bundle))

  return {
    lifecycle_summary: parsed.lifecycle_summary || 'No lifecycle summary returned.',
    readiness_label: parsed.readiness_label || 'needs_work',
    blockers: Array.isArray(parsed.blockers) ? parsed.blockers : [],
    recommended_client_status:
      parsed.recommended_client_status || bundle.organization.client_status || 'lead',
    recommended_onboarding_status:
      parsed.recommended_onboarding_status ||
      bundle.organization.onboarding_status ||
      'not_started',
    recommended_next_action:
      parsed.recommended_next_action || 'Review organization manually.',
    operator_warning:
      parsed.operator_warning ||
      'Confirm prerequisites before moving this organization forward.',
  }
}