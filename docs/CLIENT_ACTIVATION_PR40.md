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
- Only the **current primary contact whose email matches verified Supabase Auth identity** can accept or decline the quote. Quote acceptance captures the name, user ID and timestamp.
- Acceptance is explicitly *commercial quote acceptance*, not an executed MSA/DPA. It does not charge a payment method.
- Accepted clients can see exactly which operational checks Kocre has recorded. **Remote, Managed, Secure, One-Time and Custom** get different checklists.
- Support is shown as active only after Kocre performs an explicit backend activation.

## Kocre operator experience

- Admin navigation includes **Client Activation**. A specific client can be selected or opened by organization ID.
- Kocre creates the only current offer for the chosen service request. Source selection/revision are checked before publication, and public-pilot price overrides require a written explanation.
- The offer is published **in the portal**; no email is sent automatically. Kocre must notify the primary contact separately.
- Kocre waits for acceptance, starts onboarding, and enters a verifiable reference for an executed non-draft agreement and a paid external invoice/receipt.
- Kocre must attest to personally checking the evidence. The portal cannot itself verify that an external payment cleared or that a document is legally executed.
- An evidence reference is required for every service-specific check (e.g., endpoint enrollment, patch baseline, security agent and backup scope for Secure Desk).
- The backend refuses activation if any mandatory condition is missing and records which verified user performed the transition.
- Direct browser writes to organization commercial fields are blocked by a database trigger. The old admin client editor no longer offers plan/payment/activation toggles, and the old admin onboarding activation button links to the evidence-backed workflow.

## Important limits

1. **Legal:** the existing in-portal MSA/DPA are **draft versions**. They are not a substitute for finalized executed agreements. The initial Kocre operator must obtain externally executed, properly reviewed documents and record their real references. Legal review is still required.
2. **Payments:** no Stripe charge, checkout, invoice generation, or automated collection was added. Operator-verified paid invoice/receipt references are required. Never mistake a typed reference for a payment-provider confirmation.
3. **One primary service order per organization:** a database unique index prevents overlapping offered/accepted/onboarding/active orders during the pilot. Renewal, plan changes, and multiple concurrent projects need a later commercial contract model.
4. **No automatic computer enrollment:** a Managed/Secure service cannot be activated until its actual endpoint/security checks are verified. The setup currently can use supervised Personal Commands, Mesh and Tactical RMM enrollment.
5. **No automatic notifications:** published offers are visible in the portal, but staff must email/call the client separately.
6. **Legacy accounts:** existing accepted plan prices are not overwritten. Billing retains legacy display behavior; the new written offer is the authoritative record for a new activation.

## Deployment prerequisite — do not skip

The code needs **`techdesk-pro/supabase/migrations/20261030040638_client_activation_orders.sql`** applied to the actual Kocre Supabase project before deployment. The Supabase connector currently exposed other projects but not an identifiable Kocre project; no production migration was applied as part of this work.

Before enabling in production:

1. Identify and independently verify the **Kocre** Supabase project reference.
2. Review/apply the migration in that project using the project's normal migration workflow (do not apply it to Korent, Couranr or any other database).
3. Confirm `service_orders` exists with RLS enabled; cross-tenant reads and all browser writes are rejected, admin-only API mutations work, and the organization commercial-field trigger blocks direct browser bypass.
4. Use a **disposable authenticated QA organization** and test quote publication, primary-only acceptance, exact prices, declined/expired offers, evidence gates, partial-failure retry, and activation to active support.
5. Verify the portal renders consistently on phone/desktop and that the route handles missing database configuration truthfully.
6. Complete legal review and operator payment-evidence process before onboarding a paying client.

## Validation

- Domain tests in `tests/client-activation.test.mjs`.
- API/tenant/recovery tests in `tests/client-activation-api.test.mjs`.
- Existing pricing, signup, health and service-request regressions.
- Next.js configured/build test (86 routes including the new client and admin activation routes).

Unit tests and a successful build do **not** establish that the production database migration, e-signature, checkout, or live service operations are working.
