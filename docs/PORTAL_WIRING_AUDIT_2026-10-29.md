# Portal wiring audit

Reviewed October 29, 2026.

**Reviewed baseline SHA:** `1f6935c74feaa8f037df0230485400de5a5c6442`

## Scope and evidence limits

Read `CLAUDE.md` and traced the existing portal pages to their Supabase queries, mutations, Storage calls, API handlers, and relevant administrator counterparts. The portal findings below describe the reviewed baseline, before the limited Health follow-up recorded at the end of this document. Concurrent homepage/signup work in the working tree was not reviewed as a completed implementation.

This is a functionality and reuse audit, not a full security audit. No production database, external provider, payment processor, remote device, or live API was called. No customer account, ticket, document, signature, or service state was changed during the audit. No secrets or private contact information are included here.

“Connected in source” is not proof of successful deployed behavior. Applied migrations, database permissions, Storage buckets/policies, Realtime publication, API configuration, scheduled execution, and external provider availability remain runtime-unverified. Existing bug reports were not treated as current evidence: several reported defects have already been corrected in source.

## Conclusion

Reuse the existing portal. Onboarding and support contain substantial working persistence paths. Their missing pieces warrant completion rather than replacement. Commercial billing and device/provider execution are the largest genuinely unwired areas.

## Reuse and wiring matrix

| Tab | Actual connection in reviewed source | Assessment and remaining work |
|---|---|---|
| [Dashboard](../techdesk-pro/app/portal/dashboard/page.js) | Reads profile/organization, tickets and count, contacts, access requests, documents, and onboarding tasks; derives readiness. | Connected view. Replace customer-facing internal gates; distinguish failed queries from empty data. Some metrics summarize only the latest 50 tickets. |
| [Onboarding](../techdesk-pro/app/portal/onboarding/page.js) | Reads tasks, contacts, access and organization transition fields. [Admin onboarding](../techdesk-pro/app/admin/onboarding/page.js) initializes/upserts default tasks and updates tasks/org. | Connected tracking. An uninitialized checklist is a legitimate empty state. The inspected signup path does not initialize it. Customer tasks are read-only; requirements are not yet branched by purchased service. |
| [Agreements](../techdesk-pro/app/portal/agreements/page.js) | Calls [sign API](../techdesk-pro/app/api/agreements/sign/route.js); records signer, version, document hash and time; updates organization agreement state. | Connected acknowledgement/signature flow. Current documents are draft versions. API leaves agreement state at `sent`, but the customer banner can still say all required agreements are signed. Align draft, acknowledged and executed states. |
| [Documents](../techdesk-pro/app/portal/documents/page.js) | Uploads to `organization-documents` Storage, inserts document rows, and lists metadata/review state. [Admin document page](../techdesk-pro/app/admin/document/page.js) retrieves signed URLs and records review. | Upload/review is connected. The customer list has no open/download action. Reuse the existing signed-URL retrieval pattern with the appropriate organization boundary. |
| [Contacts](../techdesk-pro/app/portal/contacts/page.js) | Reads/inserts contact rows and demotes earlier primary contacts. Multiple role flags can belong to one person. | Connected create/read workflow. No customer edit/archive/delete controls. Settings profile and contact matrix remain separate records. |
| [Access](../techdesk-pro/app/portal/access/page.js) | Inserts submitted access-request records; [admin access](../techdesk-pro/app/admin/access/page.js) updates review state and notes. | Connected manual access-review workflow. It records metadata and instructions; it does not itself grant Microsoft/Google permissions or provide a credential vault. |
| [Launch](../techdesk-pro/app/portal/launch/page.js) | Reads organization kickoff, hypercare, review and offboarding fields; acknowledgement buttons update timestamps/state. | Connected summary/acknowledgements. Not an exported pack, appointment scheduler, or automated offboarding process. Organization-update permissions still require runtime verification. |
| [Settings](../techdesk-pro/app/portal/settings/page.js) | Saves profile name and company/discovery fields, derives discovery completeness and resets review state. | Connected save workflow. Every save resets discovery to pending review, including unrelated changes. No roster management exists here despite Billing directing users to Settings for that purpose. |
| [Tickets](../techdesk-pro/app/portal/tickets/page.js) | List/filter/search; [creation](../techdesk-pro/app/portal/tickets/new/page.js) writes ticket/attachments and calls post-create AI; [detail](../techdesk-pro/app/portal/tickets/[id]/page.js) reads/writes messages and ratings with Realtime. Admin supports replies, assignment, priority and status. | Substantial reusable support workflow. Customer attachments are filenames without retrieval. Reply errors are ignored before clearing the draft. A downstream AI network failure can show creation as failed after the ticket already exists. No outbound notification sender was found in inspected app/library code. |
| [Billing](../techdesk-pro/app/portal/billing/page.js) | Reads organization plan/payment status and ticket/profile counts; calculates price from a local catalog. | Intentionally manual snapshot. No checkout, invoice history, pay action, payment-method change, cancellation, or subscription backend found in the reviewed baseline. Portal-profile count is not an agreed supported-person roster. |
| [Health](../techdesk-pro/app/portal/health/page.js) | Reads Sentinel events; [Sentinel API](../techdesk-pro/app/api/ai/sentinel/route.js) performs URL checks and writes events/tickets; [Vercel configuration](../techdesk-pro/vercel.json) declares an hourly schedule. | Backend exists; deployed execution unverified. Baseline falsely defaulted to healthy with no/stale data. Limited correction is recorded below. Other gaps remain: no customer URL-configuration path found; response time is omitted from saved metadata; repeated critical checks can create repeated tickets. |
| [Atlas](../techdesk-pro/app/portal/atlas/page.js) | Authenticated [chat API](../techdesk-pro/app/api/ai/atlas-chat/route.js) reads basic account/ticket context and calls Anthropic. | Connected external integration, runtime-unverified. Conversation is memory-only and performs no actions. Prompt retains a legacy default ticket limit and omits discovery/device context despite the UI's tech-stack claim. |
| [Training](../techdesk-pro/app/portal/training/page.js) | Reads course/progress rows; [course detail](../techdesk-pro/app/portal/training/[id]/page.js) requests generated lessons/quizzes and writes progress. | Partial learning workflow. Catalog plan locks are not rechecked in detail/lesson API. Lessons are not persisted/versioned; some writes ignore errors. Certificate issuance is a flag and congratulatory text, not an artifact/download. |
| Devices | No customer Devices route or navigation item, nor application caller for the [RMM helpers](../techdesk-pro/lib/rmm/devices.js). Helpers/schema support device records, mapping, audit, and session records. | Unwired foundation. Needs UI/API, actual provider enrollment/sync, consent/session execution, freshness and deployment checks. Recording a session is not starting one. [RMM SQL](../techdesk-pro/supabase/sql/2026-03-phase1-rmm-core.sql) is outside the migration chain. |

## Highest-priority action gaps

1. **Commercial records and actions.** Existing organization flags cannot represent an accepted one-time job alongside recurring scope, versioned prices, invoices and cancellation. Keep supported-person count independent of portal logins and connect Billing to accepted commercial records and the shared catalog.
2. **Device/provider execution.** Preserve the RMM helpers, but do not advertise them as operational enrollment, protection or remote assistance. Verify the actual provider and deployment before enabling those actions.
3. **Complete the support loop.** Add authorized retrieval of uploaded files, checked reply errors, retry-safe ticket creation, and operational notification delivery. Optional AI failure must not undo the apparent success of a persisted support request.
4. **Truthful result states.** Failed queries must not look like empty lists; failed writes must not look successful. Distinguish loading, empty, not configured, error, stale and verified results.
5. **Consistent readiness.** Dashboard derives status from records; other pages read stored organization flags; admin onboarding synchronizes those flags only on some actions. Centralize transitions or use a consistent derived source. Apply requirements to the relevant capability rather than a universal percentage.
6. **Accurate service boundaries.** Keep connected manual access review, checklist, document, contact and launch workflows. Label their manual actions accurately. Atlas/training do not imply technical execution or a complete certification platform.

## Database permission verification before full portal release

The repository does not contain a complete production database baseline. Verify
actual policies, grants and triggers for membership creation, organization
isolation, privileged commercial fields and contractual authority. Source-level
handler tests cannot establish that these database boundaries are secure.
Detailed source findings are retained in the private release review.

The new service-request flow accepts nonbinding suggestions from verified client
members of their linked workspace. It does not use contact-role preferences as
commercial approval authority and does not change the accepted plan, payment or
activation state. Signup initializes contacts only for the verified creator's
deterministic workspace. This limited functionality does not replace a full
portal permission review.

## Follow-up implemented in this change

The Health page now checks authentication/profile/event-query failures, has explicit loading/error/unknown/stale/current/warning/critical states, and preserves timestamps for previously loaded records after a failed refresh. Missing data no longer produces a positive status. The positive label describes the latest recorded checks rather than all customer systems.

The pure [health-state helper](../techdesk-pro/lib/health-status.mjs) requires an explicit recent successful check for a positive state. It marks results older than two hours stale, using the recorded check timestamp before database insertion time. The threshold allows two intervals of the hourly schedule declared in source; it is not evidence that the production schedule is enabled or executing. The page reevaluates age while open and offers a button to refresh saved results without claiming to execute a new check.

[Focused tests](../techdesk-pro/tests/health-status.test.mjs) cover missing/invalid results, failed reads with cached successes, time-based expiry, warning/critical precedence, later recovery, original check time, and implausible future timestamps. Run:

```sh
cd techdesk-pro
node --test --test-isolation=none tests/health-status.test.mjs
```

All nine focused cases passed in this runtime with isolation disabled. The default isolated runner reported only a file-level result here, so the command above was used to verify individual cases. Health-page JSX transpilation produced no syntax diagnostics, and `git diff --check` was clean. These checks do not replace a browser/runtime check against the deployed backend.

This follow-up does not change other portal components, global styles, the Sentinel backend, production configuration, or external service state. The remaining Health integration gaps in the matrix still need separate work and runtime verification.
