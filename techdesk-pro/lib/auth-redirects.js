import { selectionFromParams, signupResumeHref } from './signup-context.js'

// The auth callback is the sole place that decides where a verified session
// goes. Do not accept arbitrary external "next" URLs from a confirmation link.
export function confirmationDestinations(url) {
  const recovery = url.searchParams.get('flow') === 'recovery'
  const resume = signupResumeHref(selectionFromParams(url.searchParams))
  return {
    recovery,
    success: recovery ? '/reset-password' : resume,
    failure: recovery
      ? '/forgot-password?auth_error=recovery'
      : '/login?auth_error=confirmation&next=' + encodeURIComponent(resume),
  }
}
