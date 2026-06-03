# Kocre IT (techdesk-pro) — Bug Hunt #2 (100 findings)

Date: 2026-06-03
Method: 8 parallel domain hunters reading source line-by-line, plus a live
cross-check of the production Supabase schema/policies/advisors. Each finding
cites a real file:line or a verified DB fact.

**Scope note:** This is a *second-pass* hunt. It deliberately EXCLUDES the 131
findings in `BUG-HUNT-REPORT.md` and everything already fixed on the
`claude/onboarding-org-rls` branch (profile bootstrap, internal-note leak,
`kb_articles`/`ghost_activity_logs` tables, org-documents storage RLS, the
`profiles` RLS recursion, the `ticket_ratings .single()` 406, and the
finish-signup dead-end loop). These are NEW issues.

Severity legend: **C**ritical / **H**igh / **M**edium / **L**ow.

---

## A. Schema / DB facts (live-verified) — highest priority

1. **[C] `assessment_submissions.converted_at` column does not exist.** Verified
   absent via `information_schema`. Breaks four paths:
   `app/api/assessment/link-signup/route.js:28` (`.update({converted_at})` with
   `throw error` → hard 500 when linking an assessment post-signup);
   `app/api/signup/complete/route.js:115` (same update, error swallowed → assessment
   silently never linked); `lib/ghost/reasoning-loaders.js:100,112` (selects the
   missing column → Ghost reasoning loader errors); `lib/ghost/reasoning-prompts.js:76`
   consumes the always-undefined value.
2. **[C] `get_user_org_id()` is never created by any migration in the repo.** Every
   policy in `20260603_onboarding_org_rls.sql` (and others) calls it; a from-scratch
   DB build fails with `function get_user_org_id() does not exist`. It exists only in
   prod.
3. **[C] The 4 onboarding/org tables are never created by any repo migration.**
   `organization_contacts`, `organization_documents`, `onboarding_tasks`,
   `organization_access_requests` are read/written across the app but exist only in
   prod — the repo can't reproduce the schema, and the RLS migration's
   `ALTER TABLE ... ENABLE RLS` would fail on a clean DB.
4. **[H] Org columns consumed by helpers are never added by any migration.**
   `discovery_completed`, `discovery_review_status` (`lib/readiness.js:27-28`),
   `kickoff_status`, `hypercare_status`, `support_activated_at`
   (`lib/transition.js:35-37`) — a from-scratch build is missing every onboarding/
   transition column the UI reads.
5. **[H] `tickets` UPDATE policy `clients_update_own_tickets` has no `WITH CHECK`.**
   USING restricts to own org + own row, but with a null check clause a client can
   update their ticket and set `organization_id` to another org or change
   `created_by` — the new values are never re-validated.
6. **[M] `assessment_submissions_public_insert` is `WITH CHECK (true)` for
   anon/authenticated.** Real submissions go through the service role, so this is dead
   config that lets any anon caller insert arbitrary lead rows via PostgREST (spam
   vector). Advisor `rls_policy_always_true`.
7. **[M] `avatars` bucket exposes a broad listing SELECT policy
   (`anyone_read_avatars`).** Lets any client enumerate every file in the bucket;
   not needed for public object-URL access. Advisor `public_bucket_allows_listing`.
8. **[M] 12 functions have a mutable `search_path`.** Incl. SECURITY DEFINER helpers
   `get_user_role`, `get_user_org_id`, `increment_ticket_count` used inside RLS — a
   privilege-escalation hazard. Advisor `function_search_path_mutable`.
9. **[M] SECURITY DEFINER functions are executable by `anon`.** `get_user_org_id`,
   `get_user_role`, `increment_ticket_count`, `is_admin`,
   `is_visible_message_sender`, `profiles_block_privilege_escalation` callable via
   `/rest/v1/rpc/...`; `increment_ticket_count` being anon-callable lets
   unauthenticated callers invoke a definer mutation.
10. **[L] Leaked-password protection (HaveIBeenPwned) is disabled** in Auth. Advisor
    `auth_leaked_password_protection`.
11. **[M] 28 foreign keys are unindexed.** Hot-path ones: `tickets.created_by`,
    `ticket_messages.sender_id`, `ticket_attachments.message_id`/`.uploaded_by`,
    `ticket_ratings.rated_by`, `activity_log.actor_id`,
    `organization_documents.uploaded_by`. Slow joins + slow cascade on delete.
12. **[L] 3 duplicate indexes.** `kb_articles` (`idx_kb_articles_source_ticket` vs
    `kb_articles_source_ticket_idx`; `idx_kb_articles_status` vs
    `kb_articles_status_idx`) and `ticket_ratings` (`idx_ratings_ticket` vs
    `idx_ticket_ratings_ticket_id`). Wasted writes/storage.
13. **[M] 36 RLS policies re-evaluate `auth.*`/helpers per-row** (use `auth.uid()`
    instead of `(SELECT auth.uid())`). Advisor `auth_rls_initplan`; degrades large
    list queries on `tickets`/`ticket_messages`/`profiles`/`organizations`.
14. **[M] Redundant overlapping permissive policies (175 advisor warnings).** Two
    migration generations left active: `tickets` SELECT has both
    `clients_read_own_tickets` + `tickets_access`; INSERT both `clients_create_tickets`
    + `tickets_insert`; `organizations` SELECT both `clients_read_own_org` +
    `clients_own_org`; `ticket_messages` SELECT both `clients_read_non_internal_messages`
    + `messages_access`; `profiles` has 3 overlapping SELECT and 3 INSERT policies.
15. **[M] `agreement_signatures` has only a SELECT policy — no write policy.** Works
    today only because the sole writer uses the service role; any future client/admin
    write path will silently fail under RLS.
16. **[L] `training_progress` write feature is dead.** Table + user INSERT/UPDATE
    policies exist, but no `insert`/`update`/`upsert` to `training_progress` exists
    anywhere in `app/` or `lib/` — progress/certificates can never be recorded.

---

## B. Authorization / API routes

17. **[H] IDOR in `app/api/process-document/route.js:52-65`.** Loads the job by raw
    `jobId` via service-role and never compares `job.organization_id` to the caller;
    `requireAdmin()` is only a global role check, so any admin processes/overwrites any
    org's document job and files.
18. **[H] Role-spoofing / prompt injection in `app/api/ai/atlas-chat/route.js:66-72`.**
    Client-supplied `conversationHistory` is mapped straight into the Anthropic
    `messages` array with arbitrary `role`/`content` — no `user`/`assistant`
    allowlist, no turn/length cap. A client can inject fake `assistant` turns.
19. **[H] Null-org crash in `app/api/ai/atlas-chat/route.js:30`.** `const org =
    profile.organization` is dereferenced (`org.id/name/plan`) with no null guard; a
    profile whose org join returns null throws a 500 (the `if (!profile)` guard does
    not cover it).
20. **[H] SSRF in `app/api/ai/sentinel/route.js:97-104`.** `checkUrl` server-side
    `fetch`es org-controlled `store_url`/`website_url` with no scheme/host allowlist —
    `http://169.254.169.254/...` or internal hosts can be probed.
21. **[M] `app/api/ai/sentinel/route.js:226-243` inserts `created_by: undefined`.**
    `autoCreateTicket` picks any global admin via `.single()`; if none exists it
    inserts `created_by: admin?.id` = null/undefined (FK/NOT NULL failure, unchecked),
    and otherwise attributes cross-org system tickets to an arbitrary admin.
22. **[M] Unguarded `JSON.parse` of LLM output 500s instead of degrading.**
    `triage-ticket/route.js:136`, `auto-resolve/route.js:131-132`,
    `course-lesson/route.js:90`, `training/route.js:81`,
    `auto-report/route.js:173` all call bare `JSON.parse(cleaned)` and return the raw
    parser error as a 500 — the hardened `parseClaudeJson` helper exists but is unused.
23. **[M] `app/api/ai/auto-report/route.js:206-207` writes strings to numeric
    columns.** `avg_response_time_hours`/`avg_resolution_time_hours` get `.toFixed(1)`
    (string) values into `monthly_reports`.
24. **[M] `app/api/ai/auto-report/route.js:166-212` swallows AI failures.** On
    `!aiResponse.ok` the report is still upserted and returned as success with empty
    `recommendations` — a persistent key/billing failure is invisible.
25. **[M] `app/api/ai/auto-report/route.js:209` `recommendations.join` throws on
    non-array JSON.** Valid-but-wrong-shape model output (object/number) aborts the
    report after the AI cost was spent.
26. **[M] `app/api/ai/auto-report/route.js:27-29` month-boundary bug.** Unvalidated
    `month` + `new Date(startDate).setMonth(...)` mixes UTC parse with local-time
    `.setMonth`; negative-UTC offsets shift which tickets fall in the report month, and
    a malformed `month` yields `Invalid Date` rather than a 400.
27. **[M] `app/api/process-document/route.js:157-159` `aiResult.content.map` assumes
    an array.** A non-array `content` envelope (HTTP 200) throws and marks the job
    failed with a misleading error.
28. **[M] Unbounded batch size in `ghost-batch-action/route.js:145-148` &
    `ghost-kb-batch-action/route.js:156-159`.** `request.json()` accepts arbitrary-
    length id arrays processed sequentially (~4 queries each) with no cap → timeouts.
29. **[L] `app/api/ai/post-create-ticket/route.js:78-84` swallows auto-resolve
    failure.** Unlike the triage branch it never checks `autoResolveResponse.ok`;
    returns `success: true` even on a downstream 500.
30. **[L] `app/api/ai/course-lesson/route.js:15` strict-equality on unvalidated
    types.** `lessonNumber === totalLessons`: a string `"3"` vs number `3` never
    triggers final-lesson quiz generation.
31. **[L] `app/api/ai/auto-resolve/route.js:16` confidence gate trusts triage-time
    score.** `safeToAutoResolve` uses the stored `ai_confidence`; the resolution
    model's own `parsed.confidence` (line 150) is logged but never re-checked against
    the 0.9 threshold.
32. **[L] `app/api/process-document/route.js:80,99-102` filename prompt-context
    confusion.** `filePath.split('/').pop()` is embedded into the prompt unsanitized;
    a filename containing `--- File:` can confuse the doc-extraction context.

---

## C. RLS / multi-tenant logic (code + policy)

33. **[H] Self-approve via direct insert: `20260603_onboarding_org_rls.sql:133-138`.**
    The `organization_access_requests` INSERT WITH CHECK validates `submitted_by`/
    `admin_notes`/`reviewed_by` but NOT `status`, so a client using the authenticated
    client directly can insert `status='approved'`.
34. **[H] That self-approve flips a readiness gate.** `lib/readiness.js:21` derives
    `access_approved` from `status === 'approved'`; combined with #33 a client passes
    their own "At least one access item approved" onboarding gate with no admin review.
35. **[H] `supabase/sql/2026-03-phase1-rmm-core.sql:353-378`
    `access_requests_update_policy` lets any org member set `status='approved'`.**
    (Distinct from the known "file not in migrations/" issue — this is the permissive
    self-approve policy itself.)
36. **[M] `lib/rmm/sessions.js:66-99` `approveAccessRequest` has no state guard.**
    Updates by id only; an already `denied`/`expired`/`cancelled` request can be
    silently flipped back to `approved`.
37. **[M] `lib/rmm/sessions.js:161-184` `endRemoteSessionRecord` has no `ended_at is
    null` guard.** Re-ending an already-closed session overwrites the original
    `ended_at`/`summary`/`outcome`, corrupting audit duration.
38. **[M] `lib/rmm/devices.js:119-133` cross-tenant agent attach.** `upsertProviderAgent`
    updates `devices` by `id` only and writes `device_agents.organization_id` from the
    caller payload — nothing enforces the payload org matches the device's real org.
39. **[M] `lib/rmm/devices.js:117-130` provider sync clobbers human-set fields.** A
    payload missing the hostname overwrites a curated device name with the generic
    `'Managed Device'` and can flip a device out of `retired`/`pending_enrollment`.
40. **[M] `lib/rmm/policies.js:38-42` `requestTypeForMode` makes 3 request types
    unreachable.** Only returns `unattended_setup`/`attended_remote`;
    `password_reset`/`admin_access`/`general_support` can never be created even though
    the CHECK constraint + UI allow them.
41. **[L] `lib/rmm/policies.js:48-58` `requiresAccessRequest` ignores its `device`
    arg.** Decides solely on a global config flag, contradicting per-device intent.
42. **[M] `phase1-rmm-core.sql:287-298` permission mismatch.** `device_agents` INSERT
    requires `role='admin'`, but `devices` insert + the agent-sync flow let org members
    create devices → orphaned device with no agent mapping under RLS.

---

## D. Admin console pages

43. **[M] `app/admin/layout.js:104` ambiguous active nav.**
    `pathname.startsWith(item.href)` lights up multiple items because hrefs are
    prefixes (`/admin/kb` ⊂ `/admin/kb-drafts`, `/admin/ghost` ⊂ `/admin/ghost/search`).
44. **[H] `app/admin/reports/page.js:62-68` CSAT `NaN`.** `reduce(sum + r.rating)` and
    `r.rating === n` with no null guard; one nullable `rating` row renders `NaN/5`.
45. **[M] `app/admin/reports/page.js:16,29,33` dead `reports` query.** `reports` state
    is set but never read; any RLS/missing-table failure on `monthly_reports` is
    invisible.
46. **[H] `app/admin/compliance/page.js:41-49` unchecked 4-query `Promise.all` with a
    named FK hint.** If `training_assignment_status_user_id_fkey` or the org FK is
    absent, the page silently renders 0% compliance with no error.
47. **[M] `app/admin/compliance/page.js:91-107,318-321` null `due_date` → always
    overdue.** `new Date(null)` = epoch 1970 `< now`, so undated assignments are wrongly
    counted overdue across stats, the org table, and the overdue list.
48. **[H] `app/admin/kb/[id]/page.js:92-98` `.single()` 406.** Non-legacy branch uses
    `.single()` on `kb_sop_drafts`; a stale/deleted/malformed id 406s instead of the
    `.maybeSingle()` used right below.
49. **[M] `app/admin/kb/published/[id]/page.js:47-57` inner ticket `.single()` throws.**
    If `source_ticket_id` points to a deleted ticket, the inner `.single()` aborts the
    try before `setTicket`, even though the article loaded fine.
50. **[M] `app/admin/kb/page.js:165-207,351` legacy-note queue logic.** Legacy notes
    (`status='legacy_note'`) always fall into "Needs Review" with no published/ready
    path, yet still count toward `visibleDrafts.length` used by `allVisibleSelected`,
    so "select all" can never become checked when any legacy note is visible.
51. **[M] `app/admin/assessments/page.js:60-63` optimistic update never checks the
    result.** On a failed Supabase update the UI shows the new status while the DB keeps
    the old one, no error surfaced.
52. **[L] `app/admin/assessments/page.js:197,206` unguarded `new Date(created_at)` /
    raw `urgency`.** Null `created_at` renders "Invalid Date"; `urgency` is used for
    styling with no enum validation.
53. **[M] `app/admin/document/page.js:85-97` missing `storage_path` guard.**
    `createSignedUrl(doc.storage_path)` errors into a raw `alert(err.message)` when a
    document row has no stored file.
54. **[H] `app/admin/onboarding/page.js:239,271-281` stale-state readiness writeback.**
    `syncOrganizationFromTasks` reads `organizations.find(...)` from the stale
    pre-update array (loaded async), so readiness/`support_ready` is derived from
    outdated org fields and written back.
55. **[M] `app/admin/onboarding/page.js:178-199` template upsert can wipe operator
    edits.** "Refresh template rows" upserts default rows on
    `onConflict:'organization_id,task_key'`, resetting edited `status`/`notes`/
    `due_date`; and if the unique constraint is absent the upsert errors raw.
56. **[L] `app/admin/tickets/page.js:147-161` selection survives filter switches.**
    `selectedIds` can contain ids not in the current `filtered` view, so `runBatchAction`
    can POST tickets not on screen.
57. **[M] `app/admin/tickets/[id]/page.js:417-433,151-155,1304-1310` assign-to-me
    gaps.** Optimistic `assigned_to` never reloads the join; the detail query doesn't
    fetch `assigned_agent`, so a ticket assigned to someone else just says "Agent
    assigned"; no unassign/reassign UI; reassigning silently overwrites.
58. **[M] `app/admin/sentinel/page.js:52-59` ISO string-compare window.** `cutoff`
    (`toISOString()` `Z`) is lexicographically compared to Postgres `+00`-style
    timestamps; boundary rows are misclassified, skewing healthy/warning/critical
    counts.
59. **[L] `app/admin/clients/page.js:312,514` array assumption on jsonb columns.**
    `(org.service_types||[]).map` / `joinList` throw if those columns come back as a
    JSON string rather than a JS array.
60. **[L] `app/admin/clients/page.js:518-532` per-org signatures fetch swallows
    errors.** RLS denial silently shows "No agreements signed" (false negative); no
    loading state.
61. **[L] `app/admin/contacts/page.js:99-123` missing empty state under filter.** The
    `grouped.length===0` check is computed before filtering, so a search matching
    nothing renders a blank page (all groups return null).
62. **[L] `app/admin/launch/page.js:227-265` uncontrolled inputs keep stale values.**
    `key={selectedOrg.id}` + `defaultValue`: after `loadOrganizations()` replaces the
    array the key is unchanged, so the DOM keeps old uncontrolled values until a
    different org is selected and reselected.
63. **[L] `app/admin/layout.js:39-57` admin profile `.single()` 406 + silent
    fallback.** A profile-less admin shows hardcoded "Admin"/"Administrator" forever
    and emits a 406.

---

## E. Client portal pages

64. **[H] Profile `.single()` 406 across the whole portal.** The layout was fixed to
    `maybeSingle`, but `dashboard:129`, `onboarding:76`, `tickets/[id]`, `contacts`,
    `access`, `settings`, `agreements`, `billing`, `launch`, `training/[id]` still use
    `.single()` on `profiles`; any profile-less user triggers 406s + silent empty
    states.
65. **[M] Two independent `is_primary_contact` flags drift out of sync.**
    `app/portal/agreements/page.js:107` and `api/agreements/sign/route.js:41` gate
    signing on `profiles.is_primary_contact` (which exists and is set `true` at
    signup), but the contacts UI writes a *separate* `organization_contacts.is_primary_contact`
    (`portal/contacts/page.js`). Changing the primary contact via the contacts page
    never updates the `profiles` flag, so the person the org considers primary can be
    blocked from signing while a former primary still can. *(Corrected from the
    hunter's original "wrong table" claim — `profiles` does have the column; the bug is
    the two flags are never reconciled.)*
66. **[M] `app/portal/agreements/page.js:66-68` `signatureFor` crash.**
    `AGREEMENT_DOCUMENTS[key]` dereferenced as `doc.version` with no null guard; a
    signature whose `document_type` is no longer in the catalog crashes the render.
67. **[H] `app/portal/training/page.js:69` plan-gating broken for new plans.**
    `PLAN_RANK` only has `starter/growth/scale/custom`; new plans
    (`founding/remote/managed/secure/pending`) map to `undefined`, so every course
    unlocks regardless of plan.
68. **[H] `app/portal/tickets/[id]/page.js:159-167` rating insert errors swallowed.**
    No `error` check; on RLS/constraint failure it still shows "Thanks for your
    feedback!" though nothing saved.
69. **[H] `app/portal/tickets/[id]/page.js:122-123` realtime messages render without
    sender join.** The realtime INSERT handler pushes raw `payload.new` (no `profiles`
    join), so new messages show no sender name and differ structurally from reloaded
    rows.
70. **[M] `app/portal/tickets/[id]/page.js:142-147` double-render race.** `handleSendMessage`
    inserts then `loadTicket()` while the realtime channel also delivers the same
    INSERT → message can appear twice; full reload discards rating/scroll state.
71. **[M] `app/portal/tickets/[id]/page.js:31` `removeAllChannels()` on unmount.** Tears
    down the client-wide channel registry, not just this ticket's channel — can kill
    unrelated subscriptions.
72. **[H] `app/portal/tickets/new/page.js:85-104` silent upload failure + orphan rows.**
    A storage upload error skips the attachment insert with no `else`/user feedback;
    the ticket is created and the user believes files uploaded.
73. **[M] `app/portal/tickets/new/page.js:87` / `documents/page.js:119` `Date.now()`-per-
    file collision + unsanitized name.** Multiple files in the same ms share a key;
    `file.name` with `/` is interpolated raw into the storage path → overwrite.
74. **[H] `app/portal/documents/page.js:149-152` storage-vs-DB divergence.** The
    storage upload commits but the `organization_documents` insert is wrapped in a
    try/catch that only `console.warn`s — files land in the bucket with no DB row while
    the UI says "uploaded successfully."
75. **[M] `app/portal/documents/page.js:87-96` dead inner try/catch masks errors.**
    Supabase queries don't throw, so the `catch{ nextDocuments=[] }` never runs; a real
    RLS error sets `docs` to null and the user sees "No documents uploaded yet."
76. **[H] `app/portal/launch/page.js:62-78` client writes to `organizations` directly.**
    Acknowledge buttons `update(...).eq('id', org.id)` on `organizations`; tightened
    RLS rejects org-level writes and surfaces a raw Postgres/RLS error to the user.
77. **[M] `app/portal/contacts/page.js:103-109` non-atomic primary demotion.** The
    demote `update(...).neq('id', inserted.id)` is unchecked; on failure the org keeps
    two `is_primary_contact=true` rows, breaking `deriveContactMatrixSummary` and the
    agreements gate.
78. **[H] `app/portal/training/[id]/page.js:54` `.single()` 406 on unstarted course.**
    `training_progress` queried with `.single()`; never-started course 406s every load.
79. **[M] `app/portal/training/[id]/page.js:171` lost row id after first insert.**
    `setProgress(prev => ({...prev,...}))` when `progress` was null discards the insert
    result, so a later update's `.eq('id', progress.id)` is `undefined`.
80. **[M] `app/portal/training/[id]/page.js:121-124` course never completes.**
    `newCount = Math.max(currentLesson, …)` records the current lesson as completed
    before it's finished, and the final lesson never sets `completed_at`, so a quiz-less
    course never shows complete.
81. **[M] `app/portal/dashboard/page.js:223,232` metric divergence + wrong cap.**
    Escalated/auto-resolve counts come from a `.limit(50)` ticket fetch while
    `monthlyTicketCount` is an exact count (they diverge); `org?.monthly_ticket_limit
    || 10` treats a real `0`/unset growth limit as 10.
82. **[M] `app/portal/billing/page.js:97` user-count undercount.**
    `userCountRes.count || 1` bills as 1 user when an RLS failure returns null count.
83. **[M] `app/portal/health/page.js:50-52` ISO string-compare window** (same class as
    #58) can include/exclude the wrong rows for the "last 5 minutes" status.
84. **[L] `app/portal/health/page.js:68` severity icon vs status key mismatch.**
    `severityIcon` keyed `info/warning/critical` while the banner uses
    `healthy/warning/critical`; a `healthy`/`info` row renders the fallback icon.
85. **[M] `app/portal/settings/page.js:161` discovery-complete gate only at save
    time.** Whitespace-only entries flip discovery to "incomplete" with no feedback; the
    gate never reflects the loaded state.
86. **[L] `app/portal/atlas/page.js:42-46` history off-by-one.** `conversationHistory:
    messages` captures state before the new user message is appended.
87. **[M] Inconsistent client instantiation across portal pages.** `contacts`,
    `access`, `documents`, `settings`, `agreements`, `launch`, `onboarding` create
    `supabase` at module scope while `dashboard`, `health`, `atlas`, `billing`,
    `tickets` create it in-component — divergent session/refresh behavior page to page.

---

## F. Ghost AI subsystem

88. **[M] `lib/ghost/audit.js:20-30` audit writes fail silently.** `logGhostEvent`
    awaits the insert but never checks the returned `{error}`; supabase-js returns
    (not throws) query errors, so failed audit writes are dropped invisibly — no Ghost
    action audit trail when RLS/columns/constraints reject.
89. **[M] `lib/ghost/core.js:454` `fit_score` coerced to 0.** `typeof
    parsed.fit_score === 'number' ? … : 0` — when the model returns `"75"` (string) the
    real score becomes 0, mislabeling strong leads as zero-fit. No `Number()` coercion.
90. **[M] `lib/ghost/reasoning-loaders.js:82-93` closed tickets never "similar."**
    `filteredSimilarTickets` only queries `.eq('status','resolved')`; tickets resolved
    via `closed` are excluded from similar-ticket context.
91. **[M] Prompt injection via unescaped ticket/org fields.**
    `lib/ghost/reasoning-prompts.js:49,61` (and `ticket-prompts`) interpolate raw
    `ticket.title/description`, conversation bodies, `organization.notes`, assessment
    `pain_points` into "Return ONLY JSON" prompts — a client can steer
    `recommended_next_action`/`risk_level`/`scope_call`.
92. **[L] `lib/ghost/core.js:286` draft normalized from stale-status ticket.**
    `normalizeKnowledgeDraft(ticket, parsed)` uses the original `ticket` whose `status`
    wasn't updated, while the prompt was built with `{...ticket, status: finalStatus}`.
93. **[L] `lib/ghost/core.js:342` spreads raw LLM JSON.** `...parsed` is spread into the
    returned context object with no schema validation; arbitrary model-emitted keys pass
    through to the client.
94. **[L] `lib/ghost/core.js:396-407` search AI failure not audited.** A thrown
    `askClaudeJson` error in `runGhostSearch` is only `console.error`'d and falls back to
    a canned answer — unlike every other path it's never recorded to the audit log.

---

## G. Shared business-logic libs

95. **[H] `lib/launch.js:36-38` timezone round-trip corrupts saved dates.**
    `toLaunchInputValue` builds a `datetime-local` from local time while storage/format
    use ISO/UTC; editing and re-saving a launch/QBR date silently shifts it by the UTC
    offset.
96. **[H] `lib/assessment-commercial.js:63-64` tiny teams upsold to Scale.** Plan
    thresholds OR team-size with fit score: a 1–5-person team with `fit_score >= 85` is
    pushed to **Scale** purely on an internal fit metric.
97. **[M] `lib/assessment-commercial.js:33,48-52` plan-derivation hazards.** Unmatched
    team-size buckets fall through to `parseInt` and silently take the leading number
    (`'16-30'`→16); and a row with `fit_score` but no `fit_label` defaults the label to
    `possible_fit`, so the `poor_fit` short-circuit can't fire on a low score alone.
98. **[M] `lib/access.js:37-44` access summary buckets don't partition the total.**
    Counts `submitted/under_review/approved/needs_followup` but omits `requested` and
    `revoked`, so the breakdown never sums to `rows.length`.
99. **[M] Default-param-vs-null in `lib/access.js:37`, `lib/contacts.js:19`,
    `lib/launch.js:41`.** Defaults (`rows=[]` etc.) only apply to `undefined`; a
    Supabase `data:null` (common on error) reaches `.find`/`.filter` and throws.
100. **[H] `app/api/agreements/sign/route.js:54-96` duplicate signatures + draft marked
     "signed".** Signatures are inserted with no idempotency (double-click → multiple
     legal signature rows), and `allSigned` matches on `document_version` while both
     required docs are `'0.1-draft'` — `isDraftVersion()` exists but is never called, so
     an org is flipped to `agreement_status:'signed'` on unenforceable draft agreements.

---

## Recommended triage order

**Fix first (correctness / data-loss / security):**
- DB reproducibility: #1–#4 (missing column, missing function, missing tables/columns) — the repo can't rebuild the schema from scratch today.
- Self-approve holes: #5, #33–#35, #36.
- Silent data divergence shown as success: #68, #72, #74, #51, #88.
- Broken gates: #65 (primary contact can't sign), #67 (plan gating), #64 (portal-wide 406s).
- Commercial correctness: #96, #100, #23.

**Then:** the `.single()`→`.maybeSingle()` sweep (#48, #49, #63, #64, #78), the
unguarded-`JSON.parse` sweep (#22), SSRF/injection (#18, #20, #91), and the
advisor cleanup (#8–#14).

> Caveat: a handful of medium/low items are fragility/defense-in-depth rather than
> reproduced failures (noted inline). The schema items (#1–#4) and the
> self-approve/gate items are the ones I'd treat as must-fix.
