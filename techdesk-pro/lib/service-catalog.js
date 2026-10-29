// New inquiries use this catalog. Existing organizations keep their accepted
// plan/price until a new quote is approved; choosing a service never activates it.
export const PRICING_VERSION = '2026-10-29-v2'

export const SERVICE_CATALOG = Object.freeze({
  one_time: Object.freeze({
    key: 'one_time',
    name: 'One-time IT Help',
    description: 'A scheduled remote diagnosis or repair session for an eligible issue.',
    sessionPrice: 125,
    sessionMinutes: 60,
    setup: 0,
  }),
  remote: Object.freeze({
    key: 'remote',
    name: 'Remote Desk',
    description: 'Remote helpdesk, employee IT support, and administration of your agreed cloud accounts.',
    firstUser: 149,
    additionalUser: 49,
    setup: 199,
  }),
  managed: Object.freeze({
    key: 'managed',
    name: 'Managed Desk',
    description: 'Remote Desk plus proactive management for one approved Windows computer per supported person.',
    firstUser: 229,
    additionalUser: 99,
    setup: 499,
  }),
  secure: Object.freeze({
    key: 'secure',
    name: 'Secure Desk',
    description: 'Managed Desk plus managed endpoint security, security baselines, and agreed backup/recovery oversight.',
    firstUser: 299,
    additionalUser: 129,
    setup: 699,
  }),
  custom: Object.freeze({
    key: 'custom',
    name: 'Custom & enterprise',
    description: 'A written scope for complex environments, cloud infrastructure, larger teams, or additional coverage.',
  }),
})

const RECURRING_SERVICES = new Set(['remote', 'managed', 'secure'])

export function normalizeSelection(selection = {}) {
  const candidate = selection && typeof selection === 'object' ? selection : {}
  let service = Object.hasOwn(SERVICE_CATALOG, candidate.service) ? candidate.service : null
  const raw = typeof candidate.users === 'number' ? candidate.users :
    /^\d{1,3}$/.test(String(candidate.users ?? '')) ? Number(candidate.users) : 1
  const users = Number.isInteger(raw) && raw > 0 ? Math.min(raw, 250) : 1
  if (RECURRING_SERVICES.has(service) && users > 10) service = 'custom'
  return { service, users: service === 'one_time' ? 1 : users }
}

export function calculateEstimate(selection = {}) {
  const { service, users } = normalizeSelection(selection)
  const plan = SERVICE_CATALOG[service]
  const recurring = RECURRING_SERVICES.has(service)
  // 3–10 person totals are illustrative and require a written quote. Larger
  // environments are custom-priced; never pretend the small-team rate applies.
  const monthly = recurring && users <= 10 ? plan.firstUser + (users - 1) * plan.additionalUser : null
  const setup = plan?.setup ?? null
  const oneTime = service === 'one_time' ? plan.sessionPrice : null
  return {
    service,
    users,
    monthly,
    setup,
    oneTime,
    totalInitial: oneTime ?? (monthly === null ? null : monthly + setup),
    requiresQuote: service === 'custom' || (recurring && users > 2),
    priceVersion: PRICING_VERSION,
  }
}

export function signupHref(selection = {}) {
  const { service, users } = normalizeSelection(selection)
  if (!service) return '/signup'
  return `/signup?${new URLSearchParams({ service, users: String(users) }).toString()}`
}

export function formatUsd(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}
