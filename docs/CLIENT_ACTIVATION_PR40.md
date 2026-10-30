# PR #40 — Client Activation (first paying customer)

## Goal

A customer must be able to go from a saved request to **an explicitly accepted, evidence-backed active service**, while Kocre operates the initial work manually. This is a first-customer activation workflow, not automated checkout, unattended device enrollment, or an AI Technician.

```text
Marketing → Signup → Service request → Kocre written offer → Primary contact accepts
→ Kocre verifies executed agreement and external payment
→ Kocre verifies service-specific onboarding → Activate → Support portal
```

The AI-native MSP primary vision remains [unchanged](AI-NATIVE-MSP-PRIMARY-VISION.md). Manual operator steps here are the honest first-customer workflow that will later feed the AI Technician event layer.

## Customer experience

- New prospects see their own saved service request and can open **Offer & Activation**.
- Before a quote is prepared, the page explains that Kocre is reviewing the request; no payment or activation is implied.
- A quote displays its **fixed price, service, supported-person count, written scope, excluded work, separate provider charges, support window and expiration**.
- Only the **specific verified portal user designated by Kocre on the written offer** can accept or decline. This authority is bound to a server-created order, **not** a primary-contact flag editable in the client contact matrix. Acceptance captures name, verified user ID, and timestamp.
- Acceptance is explicitly *commercial quote acceptance*, not an executed MSA/DPA. It does not charge a payment method.
- Accepted clients can see exactly which operational checks Kocre has recorded. **Remote, Managed, Secure, One-Time and Custom** get different checklists.
- Support is shown as active only after Kocre performs an explicit backend activation.

## Kocre operator experience

- Admin navigation includes **Client Activation**. A specific client can be selected or opened by organization ID.
- Kocre creates the only current offer for the chosen service request and explicitly designates the customer portal user authorized to sign. Source selection/revision are checked before publication, and public-pilot price overrides require a written explanation.
- The offer is published **in the portal**; no email is sent automatically. Kocre must notify the primary contact separately.
- Kocre waits for acceptance, starts onboarding, and enters a verifiable reference for an executed non-draft agreement and a paid external invoice/receipt.
- Kocre must attest to personally checking the evidence. The portal cannot itself verify that an external payment cleared or that a document is legally executed.
- An evidence reference is required for every service-specific check (e.g., endpoint enrollment, patch baseline, security agent and backup scope for Secure Desk).
- The backend refuses activation if any mandatory condition is missing, records the verified operator, and supports retries after a persisted order transition fails to sync the organization. The admin console exposes the recovery action.
- The migration adds `one_time` to the existing `plan_tier` enum so one-time activation can synchronize correctly. Direct browser writes to organization commercial fields are blocked by a database trigger. The old admin client editor no longer offers plan/payment/activation toggles, and the old admin onboarding activation button links to the evidence-backed workflow.

## Important limits

1. **Legal:** the existing in-portal MSA/DPA are **draft versions**. They are not a substitute for finalized executed agreements. The initial Kocre operator must obtain externally executed, properly reviewed documents and record their real references. Legal review is still required.
2. **Payments:** no Stripe charge, checkout, invoice generation, or automated collection was added. Operator-verified paid invoice/receipt references are required. Never mistake a typed reference for a payment-provider confirmation.
3. **One primary service order per organization:** a database unique index prevents overlapping offered/accepted/onboarding/active orders during the pilot. Renewal, plan changes, and multiple concurrent projects need a later commercial contract model.
4. **No automatic computer enrollment:** a Managed/Secure service cannot be activated until its actual endpoint/security checks are verified. The setup currently can use supervised Personal Commands, Mesh and Tactical RMM enrollment.
5. **No automatic notifications:** published offers are visible in the portal, but staff must email/call the client separately.
6. **Legacy accounts:** existing accepted plan prices are not overwritten. Billing retains legacy display behavior; the new written offer is the authoritative record for a new activation.

## Deployment status and remaining operational verification

The single migration `techdesk-pro/supabase/migrations/20261030040638_client_activation_orders.sql` was **applied on October 30, 2026** to the verified Kocre IT Supabase project `ibmdgjfhuxlxmyejqqdx`, and its version was recorded in `supabase_migrations.schema_migrations`. The live `kocreit.com/signup` public frontend bundle was independently observed referencing that project. No other business database was changed and no historical migrations were replayed.

Read-only verification confirmed:
- `service_orders` exists with RLS enabled and the tenant-read policy installed;
- the `plan_tier` enum now supports `one_time`;
- the organization commercial-state protection trigger exists;
- anonymous role has **no table SELECT permission**;
- authenticated role has table SELECT but no INSERT, UPDATE or DELETE permission;
- migration version `20261030040638` is registered.

The new API and UI were not yet exercised end-to-end using a real authenticated QA customer at the time of these checks. Before using a paying customer, run a disposable QA customer through offer publication, designated-signer acceptance, excluded/nonstandard pricing, external evidence, service-specific checks, partial-failure recovery, and activation; confirm that cross-tenant access fails and both phone and desktop portal views remain clear.

The MSA/DPA in this repo remain **drafts**. Kocre must obtain a properly executed non-draft agreement and independently verify external payment before marking a real customer active. Publishing an offer does not send an email, take payment, generate an invoice, or provision an endpoint.

## Validation

- Domain tests in `tests/client-activation.test.mjs`.
- API/tenant/recovery tests in `tests/client-activation-api.test.mjs`.
- Existing pricing, signup, health and service-request regressions.
- Full Node test suite: **55 passing**; Next.js configured/build test: **86 routes** including the new client and admin activation routes.
- Codex's four initial P1/P2 review findings were fixed; subsequent security/UX findings on admin and client state were also addressed and re-reviewed.

Unit tests, a passing build, and successful database migration do **not** establish that independent legal execution, payment collection, authenticated end-to-end behavior, or live endpoint operations are working.
