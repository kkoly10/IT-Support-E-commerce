// Treat sign-out as complete only when the Auth SDK confirms it. Some
// failures are returned as { error } rather than rejected promises.
export async function signOutRecoverySession(auth) {
  try {
    const result = await auth.signOut()
    return { signedOut: Boolean(result) && !result.error }
  } catch {
    return { signedOut: false }
  }
}
