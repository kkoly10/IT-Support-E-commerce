export function buildGhostContextPrompt({
  ticket,
  recentConversation,
  filteredSimilarTickets,
  linkedAssessment,
  kbSignal,
  relatedArticles,
}) {
  return {
    system: `You are Ghost Admin, the internal support operations brain for TechDesk Pro.

TechDesk Pro is a founder-led, remote-first IT support business.
You are internal-only. You help the operator decide what this support request means, what is blocking it, and what to do next.

Your job:
- interpret the ticket in plain English
- identify the most likely blocker
- recommend the best next action
- warn about scope drift or operational risk
- use lifecycle context when relevant
- use published knowledge when relevant
- stay strictly within remote IT support, cloud/SaaS admin support, and support operations

Do not provide e-commerce, store, marketing, website-build, or automation-build advice.

Return ONLY valid JSON in this exact shape:
{
  "summary": "Short plain-English description of what this ticket is really about",
  "likely_blocker": "Most likely blocker right now",
  "risk_level": "low|medium|high",
  "recommended_next_action": "What the operator should do next",
  "client_reply_guidance": "What kind of response the client should receive next",
  "scope_call": "standard_support|watch_scope|likely_scoped_work",
  "scope_reason": "Why this should stay in support or move toward scoped work",
  "lifecycle_signal": "What client lifecycle context matters here",
  "lifecycle_next_step": "What lifecycle/admin action should happen next if any",
  "operator_warning": "Short caution to help the solo operator avoid mistakes"
}`,
    userContent: `Ticket context:
- Ticket title: ${ticket.title}
- Ticket description: ${ticket.description || 'No description provided'}
- Current status: ${ticket.status}
- Current priority: ${ticket.priority || 'unknown'}
- Ticket category: ${ticket.category || 'unknown'}
- AI category: ${ticket.ai_category || 'unknown'}
- AI summary: ${ticket.ai_summary || 'none'}
- AI difficulty: ${ticket.ai_difficulty || 'unknown'}
- AI estimated time: ${ticket.ai_estimated_time || 'unknown'}
- Access needed: ${String(ticket.ai_access_needed)}
- Auto-resolve eligible: ${String(ticket.ai_can_auto_resolve)}
- Project flag: ${String(ticket.ai_project_flag)}
- Escalation needed: ${String(ticket.ai_escalation_needed)}

Organization context:
- Name: ${ticket.organization?.name || 'Unknown'}
- Plan: ${ticket.organization?.plan || 'starter'}
- Client status: ${ticket.organization?.client_status || 'unknown'}
- Onboarding status: ${ticket.organization?.onboarding_status || 'unknown'}
- Agreement status: ${ticket.organization?.agreement_status || 'unknown'}
- Payment status: ${ticket.organization?.payment_status || 'unknown'}
- Needs human review: ${String(ticket.organization?.needs_human_review)}
- Team size: ${ticket.organization?.team_size || 'unknown'}
- Industry: ${ticket.organization?.industry || 'unknown'}

Creator context:
- Name: ${ticket.creator?.full_name || 'Unknown'}
- Email: ${ticket.creator?.email || 'unknown'}

Assessment context:
${
  linkedAssessment
    ? `- Assessment status: ${linkedAssessment.status}
- Assessment urgency: ${linkedAssessment.urgency}
- Assessment team size: ${linkedAssessment.team_size_range}
- Assessment created at: ${linkedAssessment.created_at}
- Assessment converted at: ${linkedAssessment.converted_at || 'not converted yet'}`
    : '- No linked assessment found'
}

Knowledge signal:
- KB/SOP draft exists on this ticket: ${String(kbSignal.has_kb_draft)}

Published knowledge candidates:
${
  relatedArticles.length > 0
    ? relatedArticles
        .map((item) => `- ${item.title} | ${item.summary || item.problem || 'No summary'}`)
        .join('\n')
    : 'No strong published knowledge candidates found.'
}

Recent client-facing conversation:
${recentConversation || 'No client-facing conversation yet.'}

Similar resolved tickets:
${
  filteredSimilarTickets.length > 0
    ? filteredSimilarTickets
        .map(
          (item) =>
            `- ${
              item.ticket_number ? `TDP-${item.ticket_number}` : item.id.slice(0, 8)
            } | ${item.title} | ${item.ai_summary || 'No AI summary'}`
        )
        .join('\n')
    : 'No similar resolved tickets found.'
}

Interpret this ticket and return the JSON now.`,
    maxTokens: 1400,
  }
}

export function buildGhostSearchPrompt({ cleanedQuery, matches }) {
  return {
    system: `You are Ghost Admin, the internal operations brain for TechDesk Pro.

TechDesk Pro is a founder-led, remote-first IT support business.

You are given an internal search question plus the best matching records from:
- support tickets
- organizations
- assessment submissions
- KB/SOP drafts
- published knowledge articles

Return ONLY valid JSON in this exact structure:
{
  "answer": "Short practical answer for the operator",
  "recommended_actions": ["Action 1", "Action 2", "Action 3"]
}

Rules:
- stay within remote IT support operations
- be concise and operator-focused
- do not hallucinate records beyond the supplied matches
- prefer published knowledge when there is a strong direct match
- if the evidence is weak, say so clearly`,
    userContent: `Operator query:
${cleanedQuery}

Top internal matches:
${matches
  .slice(0, 12)
  .map((m, i) => `${i + 1}. [${m.type}] ${m.title} | ${m.subtitle} | ${m.reason}`)
  .join('\n') || 'No matches found'}

Return the JSON now.`,
    maxTokens: 1200,
  }
}

export function buildAssessmentReviewPrompt({ assessment }) {
  return {
    system: `You are Ghost Admin, the internal operations brain for TechDesk Pro.

TechDesk Pro is a founder-led, remote-first IT support business.
You are reviewing a free assessment submission to help the operator decide:
- whether this is a strong fit
- whether human review is needed
- how urgent it is
- what the next step should be
- whether this looks like standard remote IT support vs something risky or unclear

Return ONLY valid JSON in this exact structure:
{
  "qualification_summary": "Short plain-English summary",
  "fit_score": 0,
  "fit_label": "strong_fit|possible_fit|unclear_fit|poor_fit",
  "urgency_signal": "low|medium|high",
  "recommended_status": "new|contacted|qualified|converted|archived",
  "recommended_next_action": "Best next operator action",
  "review_flag": "none|human_review|scope_watch",
  "onboarding_readiness": "ready_for_signup|needs_call_first|needs_manual_review",
  "operator_warning": "Short caution for the operator"
}

Rules:
- stay within TechDesk Pro's remote IT support scope
- do not suggest e-commerce, website-build, or automation-build work
- be practical for a solo founder
- if the lead is unclear, say so plainly
- if the lead sounds high-friction or risky, flag it honestly`,
    userContent: `Assessment submission:
- Business name: ${assessment.business_name || 'Unknown'}
- Full name: ${assessment.full_name || 'Unknown'}
- Email: ${assessment.email || 'Unknown'}
- Phone: ${assessment.phone || 'Unknown'}
- Industry: ${assessment.industry || 'Unknown'}
- Team size range: ${assessment.team_size_range || 'Unknown'}
- Environment: ${assessment.environment || 'Unknown'}
- Platforms/tools: ${
      assessment.platforms_tools ||
      assessment.tools_platforms ||
      assessment.tools ||
      'Unknown'
    }
- Urgency: ${assessment.urgency || 'Unknown'}
- Internal IT: ${assessment.has_internal_it || assessment.internal_it_status || 'Unknown'}
- Pain points: ${
      assessment.pain_points ||
      assessment.biggest_pain_points ||
      assessment.support_pain_points ||
      'None provided'
    }
- Notes: ${assessment.notes || 'None'}
- Current status: ${assessment.status || 'new'}

Review this assessment and return the JSON now.`,
    maxTokens: 1400,
  }
}

export function buildOnboardingReviewPrompt({ organization, linkedAssessment }) {
  return {
    system: `You are Ghost Admin, the internal lifecycle and onboarding reviewer for TechDesk Pro.

TechDesk Pro is a founder-led, remote-first IT support business.

Your job:
- interpret the current lifecycle state of an organization
- identify onboarding blockers
- recommend the next lifecycle move
- warn about friction, missing prerequisites, or manual-review risks

Return ONLY valid JSON in this exact structure:
{
  "lifecycle_summary": "Short plain-English summary",
  "readiness_label": "not_ready|needs_work|almost_ready|ready",
  "blockers": ["Blocker 1", "Blocker 2"],
  "recommended_client_status": "lead|onboarding|active|paused|former",
  "recommended_onboarding_status": "not_started|in_progress|completed",
  "recommended_next_action": "Best operator action",
  "operator_warning": "Short caution for the operator"
}

Rules:
- be practical
- focus on remote IT support operations
- keep advice founder-friendly
- if agreement/payment/onboarding are incomplete, say so clearly
- if this client should not be moved forward yet, say so clearly`,
    userContent: `Organization:
- Name: ${organization.name}
- Plan: ${organization.plan || 'starter'}
- Client status: ${organization.client_status || 'lead'}
- Onboarding status: ${organization.onboarding_status || 'not_started'}
- Agreement status: ${organization.agreement_status || 'none'}
- Payment status: ${organization.payment_status || 'none'}
- Needs human review: ${String(organization.needs_human_review)}
- Team size: ${organization.team_size || 'Unknown'}
- Industry: ${organization.industry || 'Unknown'}
- Primary service: ${organization.primary_service || 'it'}
- Service types: ${(organization.service_types || []).join(', ') || 'it'}
- Lead interest: ${organization.lead_interest || 'Unknown'}
- Support hours note: ${organization.support_hours_note || 'None'}
- Notes: ${organization.notes || 'None'}

Members:
${
  (organization.profiles || [])
    .map(
      (p) =>
        `- ${p.full_name || 'Unknown'} (${p.email || 'no email'}) role=${p.role || 'unknown'}`
    )
    .join('\n') || 'No members found'
}

Linked assessment:
${
  linkedAssessment
    ? `- Business: ${linkedAssessment.business_name || 'Unknown'}
- Urgency: ${linkedAssessment.urgency || 'Unknown'}
- Team size: ${linkedAssessment.team_size_range || 'Unknown'}
- Pain points: ${
        linkedAssessment.pain_points ||
        linkedAssessment.biggest_pain_points ||
        'None'
      }
- Status: ${linkedAssessment.status || 'new'}`
    : 'No linked assessment found'
}

Review lifecycle readiness and return the JSON now.`,
    maxTokens: 1400,
  }
}