"use client";

import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-[10px] uppercase tracking-wide text-muted hover:text-foreground transition-colors"
    >
      Sign out
    </button>
  );
}
