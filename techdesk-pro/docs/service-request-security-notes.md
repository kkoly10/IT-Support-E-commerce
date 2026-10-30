# Service request permission model and existing RLS follow-up

## Policy implemented in this change

A service request is a nonbinding discovery suggestion. A verified client member
may submit suggestions for the workspace linked to their profile. A verified
administrator may explicitly target a client workspace. Contact-matrix entries
and `profiles.is_primary_contact` do not authorize this operation.

The API verifies the user and email, binds the profile to that user, checks the
workspace and role, computes catalog estimates on the server, and records
`requestedBy`. A request always receives `status: requested`. It updates only
`organizations.discovery_profile.service_selection` and `needs_human_review`.
It cannot accept an agreement, modify the active plan or lifecycle, or authorize
a payment. Saved estimates remain informational until the business reviews the
scope and obtains an authorized agreement.

The API requires a revision and uses JSONB equality in the update statement to
reject stale or concurrent writes with HTTP 409. This protects this API's writes;
it does not make the underlying discovery JSON an immutable commercial ledger.

Automatic primary-contact provisioning during signup runs only when the
verified user's ID derives the deterministic ID of that signup workspace.
Ordinary legacy sign-ins and invited members cannot trigger contact creation or
promotion, even if their editable profile primary flag is true.

## Deployment verification required

The repository does not contain a complete production database baseline. Before
releasing the full portal, verify deployed membership creation, tenant isolation,
commercial-field protection, and contractual authority with integration tests.
Source-level handler tests do not replace database-policy verification. Detailed
source findings are retained in the private release review.

This change includes no database migration and does not assert that the wider
portal's database permissions have been verified or hardened.
