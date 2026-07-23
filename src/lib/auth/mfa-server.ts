// ─── Server-side MFA enforcement ─────────────────────────────────────
// Data-layer companion to the pure decision in ./mfa. Middleware only gates
// page navigation; server actions and API routes must reject a 2FA-pending
// session themselves, or a scripted client at aal1 could read and write data
// without ever clearing the challenge. getAuthenticatorAssuranceLevel is a
// local JWT decode (no network), so calling it in every guard is cheap.

import type { createClient } from "@/lib/supabase/server";
import { needsMfaChallenge } from "./mfa";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

// Shared copy for a session that still owes its second-factor challenge.
// Lives here (a plain module) so both "use server" actions and route
// handlers can import it; a "use server" file may only export async fns.
export const MFA_PENDING_MESSAGE = "Finish two-factor verification to continue.";

/**
 * True when the current session is authenticated at aal1 but the account has
 * a verified second factor requiring aal2, i.e. the challenge is not yet
 * cleared. Sessions without 2FA (aal1/aal1) and fully verified sessions
 * (aal2) both return false, so existing users are unaffected.
 */
export async function isMfaChallengePending(supabase: ServerSupabase): Promise<boolean> {
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return !!data && needsMfaChallenge(data.currentLevel, data.nextLevel);
}
