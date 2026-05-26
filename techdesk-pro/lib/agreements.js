// Canonical client-facing agreement text for in-portal e-signature.
//
// IMPORTANT:
// - This is the exact text a client sees and signs. Each signature is recorded
//   against a specific `version` plus a SHA-256 hash of `body`, so DO NOT edit a
//   body without BUMPING its `version` — otherwise old signatures would no
//   longer match the current text.
// - Keep these in sync with the master drafts in legal/MSA.md and legal/DPA.md.
// - Versions containing "draft" are NOT attorney-finalized. Do not treat
//   signatures of a draft version as a binding executed agreement; finalize the
//   text, bump to a non-draft version, then collect real signatures.

export const AGREEMENT_EFFECTIVE_DATE = '2026-05-26'

const MSA_BODY = `KOCRE IT SERVICES — MASTER SERVICES AGREEMENT

This Master Services Agreement governs the IT support services Kocre IT Services
("Kocre IT", "we") provides to the client identified at sign-up ("Client",
"you"). Specific plan tier, fees, and scope are set out in your Order Form.

1. SERVICES. We provide remote managed IT support as described in your Order
Form, using commercially reasonable skill and care. Services are remote-only;
on-site work is not included. Implementation projects, migrations, major
remediation, and out-of-hours work are out of scope and quoted separately.

2. TERM & TERMINATION. After onboarding, plans are month-to-month. Either party
may terminate for convenience on 30 days' written notice, or for material
breach not cured within 15 days (immediately for non-payment or unlawful use).
On termination you pay for services rendered through the termination date.

3. FEES. Recurring fees are billed monthly in advance and are due on the terms
stated in your Order Form. Overdue amounts may accrue interest and we may
suspend Services for non-payment after notice. Fees exclude applicable taxes.

4. YOUR RESPONSIBILITIES. You will provide timely access, accurate information,
and cooperation; maintain your own backups unless backup is a contracted
Service; ensure you have the right and authority to grant us access to your
systems and data; maintain valid software licenses; and use the Services
lawfully.

5. SUPPORT. Standard support is provided Monday–Friday, 9:00–18:00 ET, excluding
US holidays; clients in other regions receive support during overlapping hours.
Response targets are goals, not guarantees, unless a separate SLA is signed. We
do not guarantee uninterrupted, error-free, or incident-free systems.

6. CONFIDENTIALITY. Each party protects the other's confidential information and
uses it only to perform this Agreement.

7. INTELLECTUAL PROPERTY. We retain all rights in our software, portal, tools,
methods, and documentation. You own your data and grant us a limited license to
use it solely to provide the Services. We may use aggregated, de-identified data
to improve our services.

8. DATA PROTECTION. For personal data we process on your behalf, you are the
controller and Kocre IT is the processor; that processing is governed by our
Data Processing Agreement (DPA), incorporated by reference.

9. WARRANTIES & DISCLAIMER. We warrant that we will perform with reasonable
skill and care. EXCEPT AS EXPRESSLY STATED, THE SERVICES ARE PROVIDED "AS IS"
AND WE DISCLAIM ALL IMPLIED WARRANTIES TO THE MAXIMUM EXTENT PERMITTED BY LAW.

10. LIMITATION OF LIABILITY. NEITHER PARTY IS LIABLE FOR INDIRECT, INCIDENTAL,
SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS OR DATA. EACH
PARTY'S TOTAL AGGREGATE LIABILITY WILL NOT EXCEED THE FEES PAID BY CLIENT IN THE
12 MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM. These limits do not apply
to payment obligations, breach of confidentiality, indemnification, or gross
negligence, willful misconduct, or fraud.

11. INDEMNIFICATION. We will defend you against third-party claims that our
proprietary tools infringe their intellectual property. You will defend us
against claims arising from your data, your unlawful or non-compliant use, or
your lack of authority to grant access.

12. GENERAL. The parties are independent contractors. This Agreement is governed
by the laws of the Commonwealth of Virginia, USA. The MSA, the DPA, and your
Order Form are the entire agreement; amendments must be in writing. Electronic
acceptance and signatures are valid and enforceable.`

const DPA_BODY = `KOCRE IT SERVICES — DATA PROCESSING AGREEMENT

This Data Processing Agreement ("DPA") supplements the Master Services Agreement
and governs Kocre IT's processing of personal data on your behalf. On any
conflict regarding personal data, this DPA controls.

1. ROLES. You are the controller (or, where you act for your own clients, may be
a processor) and Kocre IT is the processor. Kocre IT processes personal data
only to provide the Services and only as a processor on your behalf.

2. PROCESSOR OBLIGATIONS (GDPR Art. 28). Kocre IT will:
 (a) process personal data only on your documented instructions, unless
     required by law;
 (b) ensure personnel authorized to process are bound by confidentiality;
 (c) implement appropriate technical and organizational security measures
     (GDPR Art. 32);
 (d) engage sub-processors only under your general authorization, impose
     equivalent data-protection terms on them, give notice of changes with an
     opportunity to object, and remain fully liable for their performance;
 (e) assist you, insofar as possible, in responding to data-subject rights
     requests, and promptly forward any request received directly;
 (f) assist you with security, breach notification, data-protection impact
     assessments, and prior consultation (GDPR Art. 32–36);
 (g) notify you without undue delay after becoming aware of a personal data
     breach affecting your data;
 (h) delete or return all personal data at the end of the Services, at your
     choice, unless retention is required by law;
 (i) make available information necessary to demonstrate compliance and allow
     for and contribute to audits; and
 (j) inform you if, in its opinion, an instruction infringes data-protection
     law.

3. INTERNATIONAL TRANSFERS. Where personal data is transferred from the EU/EEA
or UK to a country without an adequacy decision, the EU Standard Contractual
Clauses (controller-to-processor module) and, for UK data, the UK Addendum/IDTA
apply, together with a transfer risk assessment and supplementary measures as
appropriate. For Canada, Kocre IT remains accountable for transferred personal
data and uses contractual means to ensure comparable protection (PIPEDA; Quebec
Law 25, including support for any required privacy impact assessment).

4. DETAILS OF PROCESSING. Subject matter: provision of remote managed IT
support. Duration: the term of the MSA plus legally required retention. Data
types: contact/account details, authentication identifiers, support-ticket
contents and attachments, and technical/device data. Data subjects: your
employees, contractors, authorized users, and contacts present in support
materials. Special-category data is not intended to be processed.

5. SECURITY MEASURES. Encryption in transit; access controls and least-privilege
access with multi-factor authentication for administrative access; segregation
of client environments; logging of administrative access; sub-processor due
diligence; secure credential handling; no use of client confidential data to
train public AI models; backup, recovery, and incident response.

6. SUB-PROCESSORS. A current list of sub-processors (including hosting,
database/authentication, AI-assisted processing, payments, and email providers)
is available on request and updated as it changes.

7. LIABILITY & TERM. Liability under this DPA is subject to the limitations in
the MSA, except where data-protection law requires otherwise. This DPA continues
until Kocre IT has ceased processing and deleted or returned the personal data.`

export const AGREEMENT_DOCUMENTS = {
  msa: {
    key: 'msa',
    title: 'Master Services Agreement',
    version: '0.1-draft',
    effectiveDate: AGREEMENT_EFFECTIVE_DATE,
    summary:
      'Governs the IT support we provide: scope, term, fees, responsibilities, liability, and IP.',
    body: MSA_BODY,
  },
  dpa: {
    key: 'dpa',
    title: 'Data Processing Agreement',
    version: '0.1-draft',
    effectiveDate: AGREEMENT_EFFECTIVE_DATE,
    summary:
      'Governs how we handle personal data on your behalf as your processor (GDPR/UK/PIPEDA).',
    body: DPA_BODY,
  },
}

// Documents a client must sign during onboarding before activation.
export const REQUIRED_AGREEMENT_KEYS = ['msa', 'dpa']

export function getAgreement(key) {
  return AGREEMENT_DOCUMENTS[key] || null
}

export function isDraftVersion(version) {
  return typeof version === 'string' && version.toLowerCase().includes('draft')
}
