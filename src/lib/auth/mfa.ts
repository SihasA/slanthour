// ─── MFA assurance-level helpers ─────────────────────────────────────
// Pure, framework-free logic shared by the login form and the middleware
// so the "does this user still owe us a 2FA challenge?" decision lives in
// one testable place. Supabase's Authenticator Assurance Levels:
//   aal1 = password (or OAuth) only
//   aal2 = a verified second factor was also satisfied
// When currentLevel is aal1 but nextLevel is aal2, the account HAS a
// verified factor the current session has not yet cleared.

export type AssuranceLevel = "aal1" | "aal2" | null;

/**
 * True when the session is authenticated at aal1 but the account requires
 * aal2, i.e. a verified TOTP factor exists and still needs a challenge.
 */
export function needsMfaChallenge(
  currentLevel: AssuranceLevel,
  nextLevel: AssuranceLevel
): boolean {
  return currentLevel === "aal1" && nextLevel === "aal2";
}
