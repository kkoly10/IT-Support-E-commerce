# Kocre IT — SEO plan & changelog

## Where SEO actually stood (audit, 2026-06)

The **technical foundation was already good** — contrary to "it's terrible":
- Homepage: clean `canonical` (`https://kocreit.com`), Open Graph + Twitter cards, rich
  JSON-LD (`ProfessionalService`, `FAQPage` ×13, `ContactPoint`, founder `Person`, `Offer`s,
  `areaServed` cities), correct `robots.txt`, complete `sitemap.xml`.
- Service-area pages (`/service-areas/*`): canonical + `Service`/`BreadcrumbList` JSON-LD. Strong.

The real problems were **per-page execution gaps + thin content footprint**:
1. `/free-assessment` (top lead page) and `/pilot` rendered the **generic homepage title/description**
   (free-assessment was `'use client'`, pilot had no metadata) and had no canonical.
2. `/automation` was an **exact duplicate** of `/ecommerce` ("Support Scope") — two indexed URLs,
   duplicate content. **Both retired** (no longer part of the business model).
3. Very few commercial pages — nothing targeting high-intent **service** keywords.

## What changed in this PR

**On-page fixes**
- `/free-assessment` → split into a server `page.js` (owns metadata + canonical) wrapping the client form.
- `/pilot` → added unique title/description/canonical/OG.
- `/ecommerce` and `/automation` → **deleted**; 301-redirected to `/` in `next.config.ts` so indexed
  URLs don't 404. Removed from the sitemap.

**New ranking content** — `app/services/` (mirrors the proven service-area template):
- `/services` index + dynamic `/services/[slug]` with canonical, `Service` + `BreadcrumbList` +
  `FAQPage` JSON-LD, internal cross-links (services ↔ service areas), and sitemap entries.
- Pages + primary keyword each (in `lib/seo.js` → `SERVICES`):

| URL | Primary keyword |
|-----|-----------------|
| `/services/managed-it-services` | managed IT services for small business |
| `/services/remote-it-helpdesk` | remote IT helpdesk support for small business |
| `/services/microsoft-365-support` | Microsoft 365 support & administration for small business |
| `/services/google-workspace-support` | Google Workspace support & administration for small business |
| `/services/employee-onboarding-offboarding` | employee IT onboarding & offboarding for small business |

- Content is written to match Kocre IT's **real stated scope** (remote-first, Windows-first,
  basic security hygiene — not 24/7 SOC/compliance, fair-use not unlimited) to avoid overpromising.

**Internal linking** — added a "Services" column + bottom-row link in the homepage footer.

## Keyword map (adjust as you like)

- **Local + head terms** (already covered by service-area pages): "managed IT services {city}",
  "IT support for small business {city/region}", "remote IT support DMV / Northern Virginia /
  Stafford / Fredericksburg / DC / Maryland / Richmond".
- **Service terms** (new pages above).
- **Suggested next pages** if you want more coverage: `/services/small-business-cybersecurity`
  (framed as hygiene, not SOC), `/services/it-support-near-me` (or rely on service-area pages),
  and per-industry pages only if you actually serve them (law firms, nonprofits, dental, etc.).

## Off-page / non-code levers (the biggest ranking factors — these are NOT code)

For a newer local MSP, code is ~20% of the battle. Prioritize:
1. **Google Business Profile** — create/verify it (service-area business, no address shown), pick
   primary category "Computer support and services", add services, photos, and collect reviews.
   This is the #1 driver of local pack visibility.
2. **Reviews** — Google + a few directories. Ask every happy client.
3. **Citations/NAP consistency** — same name/phone everywhere (the JSON-LD already standardizes it).
4. **Backlinks** — local business orgs, chambers of commerce, partner/vendor listings, a few
   relevant directories. Quality over quantity.
5. **Content cadence** — a light blog answering real small-business IT questions (you already have
   13 solid FAQ answers to expand from) builds topical authority over months.

## How to verify after deploy
- `curl -s https://kocreit.com/services/managed-it-services | grep -o '<title>[^<]*'` → unique title.
- Check `https://kocreit.com/sitemap.xml` includes `/services` + the 5 service URLs and no longer
  lists `/ecommerce` or `/automation`.
- `curl -I https://kocreit.com/automation` → `308/301` redirect to `/`.
- Google Search Console: submit the sitemap; request indexing for the new service pages.
- Validate JSON-LD with Google's Rich Results Test on a couple of service URLs.
