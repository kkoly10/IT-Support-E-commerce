# Kocre IT Services

Remote-first managed IT support (MSP) for small businesses. Marketing site +
client portal + admin console. Serves the DC–Maryland–Virginia (DMV) area and
remotely across the **US, Canada, UK & Ireland**.

## Project layout & commands

- App lives in `techdesk-pro/` (Next.js App Router, Supabase backend).
- Dev: `cd techdesk-pro && npm run dev`
- Build: `cd techdesk-pro && npm run build`
- Centralized SEO/business constants: `techdesk-pro/lib/seo.js`
- Legal templates (drafts): `legal/MSA.md`, `legal/DPA.md`
- Feature work goes on a `claude/<topic>` branch with a PR (draft).

## Business facts (source of truth)

- Name: **Kocre IT Services** · Founder: Komlan Kouhiko
- Base: Stafford, Virginia, USA (remote-only; **no public street address** — service-area business)
- Phone: (540) 515-8324 · Email: hello@ / legal@ / privacy@ kocreit.com
- Plans: Starter $499/mo, Growth $999/mo, Scale $1,999/mo (month-to-month after onboarding)
- Role: **processor** for client business data; **controller** for own website/marketing data

---

# ⚖️ Legal & Compliance — open action items

**These are operational/legal tasks, NOT code.** A published policy does not by
itself make the business compliant. Have a **data-protection attorney** review the
policy + MSA + DPA before signing clients in the UK, Ireland, or Canada.
Nothing here is legal advice.

### Must-do before taking UK / EU (Ireland) / Canada clients
- [ ] **Have an attorney review** `app/privacy/page.js`, `legal/MSA.md`, `legal/DPA.md`.
- [ ] **GDPR Art. 27 Representative** — a US business processing EU/UK personal data
      likely must appoint an **EU representative** and a **UK representative**. Confirm
      whether this applies and appoint if so.
- [ ] **Subprocessor agreements** — make sure each vendor's DPA includes EU **SCCs** +
      the **UK Addendum**: Supabase, Anthropic (AI), Vercel, the payment processor, and
      email. Sign/accept each; keep copies.
- [ ] **Transfer Risk Assessment (TRA)** for UK/EU → US transfers (accompanies SCCs/IDTA).
- [ ] **Client DPA** — provide `legal/DPA.md` (lawyer-reviewed) to UK/EU/Canada clients;
      keep a current **subprocessor list** to share on request.

### Ongoing program (all markets)
- [ ] **DSAR process** — be able to action access / correction / deletion within the
      legal deadline (GDPR ~1 month; CCPA 45 days; PIPEDA 30 days).
- [ ] **Breach-notification plan** — GDPR: notify supervisory authority within **72h**;
      notify affected individuals/clients without undue delay; document every breach.
- [ ] **Records of Processing (GDPR Art. 30)** — maintain a simple register.
- [ ] **Designate a privacy officer / accountable contact** (required under PIPEDA;
      Quebec Law 25 requires a named privacy officer).
- [ ] **CASL (Canada anti-spam)** — get **consent before commercial email** to Canadian
      businesses (cold outreach included); include identification + unsubscribe.
- [ ] **Quebec Law 25** — privacy impact assessment before transferring personal info
      outside Quebec; confirm contractual safeguards.
- [ ] **Cookie consent banner** — only required if/when non-essential cookies or analytics
      are added (currently none on the site).

### Business setup
- [ ] Decide on a **registered address** for GDPR controller identity (city/state is used
      now; a registered/agent address may be advisable).
- [ ] Consider **cyber-liability / E&O insurance** (the MSA references it as recommended).
- [ ] Register the business entity / confirm structure for cross-border contracting.

### Reference (frameworks that apply)
- US: CCPA/CPRA (California), VCDPA (Virginia), + sector laws
- Canada: PIPEDA + Quebec Law 25 + CASL
- UK: UK GDPR + Data Protection Act 2018 (regulator: ICO)
- Ireland/EU: GDPR + Irish Data Protection Act 2018 (regulator: Data Protection Commission)
