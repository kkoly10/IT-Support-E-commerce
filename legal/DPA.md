# Data Processing Agreement (DPA) — DRAFT TEMPLATE

> **⚠️ NOT LEGAL ADVICE.** Review-ready draft for Kocre IT Services. Have a
> data-protection attorney review before use. This DPA is designed to satisfy
> **GDPR Article 28(3)** and to support transfers under the **EU SCCs** and the
> **UK Addendum / IDTA**, plus **PIPEDA / Quebec Law 25** for Canada. Where the
> EU SCCs or UK Addendum are required, attach and complete them — they prevail
> over this DPA on transfer matters. Replace every `[BRACKET]`.

This Data Processing Agreement ("**DPA**") supplements and forms part of the
Master Services Agreement ("**MSA**") between **Kocre IT Services**
("**Processor**") and the client ("**Controller**"). On any conflict regarding
personal data, this DPA controls over the MSA.

## 1. Definitions
"**Applicable Data Protection Law**" means all privacy/data-protection laws
applicable to the processing, including the EU GDPR, UK GDPR and DPA 2018,
PIPEDA and Quebec Law 25, and US state privacy laws. "**Controller**,"
"**Processor**," "**Personal Data**," "**Processing**," "**Data Subject**,"
"**Personal Data Breach**," and "**Supervisory Authority**" have the meanings in
Applicable Data Protection Law. "**Sub-processor**" means a third party engaged
by Processor to process Personal Data. "**SCCs**" means the EU Standard
Contractual Clauses (Commission Decision 2021/914). "**UK Addendum**" means the
ICO's International Data Transfer Addendum to the SCCs.

## 2. Roles & Scope
2.1 Controller is the controller (or, where it acts for its own clients, may be a processor) and Processor is the processor of the Personal Data described in **Annex 1**.
2.2 Processor processes Personal Data only to provide the Services and only as a processor on Controller's behalf.

## 3. Processor Obligations (GDPR Art. 28(3))
Processor will:
- **(a) Instructions.** Process Personal Data only on Controller's documented instructions (including the MSA, this DPA, and Order Forms), unless required by law (in which case it will notify Controller unless legally prohibited).
- **(b) Confidentiality.** Ensure personnel authorized to process Personal Data are bound by confidentiality.
- **(c) Security.** Implement and maintain the technical and organizational measures in **Annex 2** appropriate to the risk (GDPR Art. 32).
- **(d) Sub-processors.** Controller provides **general authorization** for the Sub-processors listed in **Annex 3**. Processor will impose data-protection obligations no less protective than this DPA on each Sub-processor and remains **fully liable** for their performance. Processor will give Controller notice of intended additions/replacements and a reasonable opportunity to object on reasonable data-protection grounds.
- **(e) Data-subject requests.** Taking into account the nature of the processing, assist Controller by appropriate technical and organizational measures, insofar as possible, to respond to data-subject rights requests; promptly forward any request received directly.
- **(f) Assistance.** Assist Controller in ensuring compliance with GDPR Articles 32–36 (security, breach notification, data-protection impact assessments, prior consultation), taking into account the nature of processing and information available.
- **(g) Breach notification.** Notify Controller **without undue delay** after becoming aware of a Personal Data Breach affecting Controller's Personal Data, with information reasonably available to assist Controller's own notification obligations.
- **(h) Deletion/return.** At Controller's choice, delete or return all Personal Data at the end of the Services and delete existing copies, unless law requires storage.
- **(i) Audits.** Make available information necessary to demonstrate compliance with Art. 28 and allow for and contribute to audits, including inspections, by Controller or its mandated auditor — subject to reasonable notice, confidentiality, frequency limits, and Processor's security policies; Processor may satisfy audit requests via third-party reports where available.
- **(j) Notify on infringing instruction.** Inform Controller if, in its opinion, an instruction infringes Applicable Data Protection Law.

## 4. International Data Transfers
4.1 Processor will not transfer Personal Data to a country without an adequacy decision unless it has implemented an appropriate transfer mechanism.
4.2 **EU/EEA.** Where Processor processes EU/EEA Personal Data in a third country, the **SCCs (Module 2, controller-to-processor)** apply and are incorporated by reference; Controller is the data exporter and Processor the data importer. Annexes to the SCCs are completed by Annexes 1–3 of this DPA.
4.3 **UK.** For UK Personal Data, the **UK Addendum** to the SCCs applies (or, alternatively, the **UK IDTA**). The Parties will complete the required tables.
4.4 **Transfer Risk Assessment.** The Parties will cooperate on any transfer risk assessment required by Applicable Data Protection Law and implement supplementary measures as appropriate.
4.5 **Canada (PIPEDA/Law 25).** Processor remains accountable for Personal Data transferred for processing and will use contractual and other means to provide a comparable level of protection. For Quebec data, the Parties will support any privacy impact assessment required before transfer outside Quebec.

## 5. Liability
Each Party's liability under this DPA is subject to the limitations and
exclusions in the MSA, except where Applicable Data Protection Law (or the SCCs)
requires otherwise.

## 6. Term
This DPA takes effect on the MSA Effective Date and continues until Processor
has ceased processing and deleted or returned the Personal Data under Section 3(h).

---

## Annex 1 — Details of Processing
- **Parties:** Controller = [CLIENT LEGAL NAME]; Processor = Kocre IT Services.
- **Subject matter:** Provision of remote managed IT support and related Services under the MSA.
- **Duration:** For the term of the MSA plus any legally required retention.
- **Nature & purpose:** Helpdesk support, account/cloud (Microsoft 365, Google Workspace) administration, user onboarding/offboarding, ticket handling, and related support operations.
- **Types of Personal Data:** Contact and account details (names, business email, phone, job title); authentication/account identifiers; support-ticket contents and attachments that may contain personal data; technical/device data. *(Special-category data is not intended to be processed; if it is, the Parties will agree additional safeguards.)*
- **Categories of Data Subjects:** Controller's employees, contractors, and authorized users; Controller's own customers/contacts to the extent present in support materials.

## Annex 2 — Technical & Organizational Security Measures
*(Confirm/adjust to actual practice — accuracy matters.)*
- Encryption of Personal Data **in transit** (TLS); encryption at rest where supported by the underlying platform.
- **Access controls:** unique accounts, least-privilege access, and **multi-factor authentication** for administrative access.
- Role-based access to the client portal and segregation of client environments.
- Logging and monitoring of administrative access to support systems.
- Vendor/sub-processor due diligence and contractual data-protection terms.
- Secure credential handling; no use of client confidential data to train public AI models (per the Privacy Policy).
- Backup and recovery for Processor-controlled systems; documented incident-response process.
- Personnel confidentiality obligations and security awareness.

## Annex 3 — Authorized Sub-processors
*(Keep current; provide to Controller on request. Confirm each vendor's DPA includes SCCs + UK Addendum.)*

| Sub-processor | Purpose | Processing location |
|---|---|---|
| Supabase | Database, authentication, storage for the client portal | [US / region] |
| Vercel | Website & application hosting | [US / region] |
| Anthropic | AI-assisted workflow processing (human-supervised) | [US] |
| [Payment processor] | Billing and payments | [region] |
| [Email provider] | Transactional/support email | [region] |

---

**Kocre IT Services (Processor)**     **Client (Controller)**
Signature: ____________________        Signature: ____________________
Name: [NAME] · Date: __________        Name: [NAME] · Date: __________
