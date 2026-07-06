// ─── Best-effort in-memory rate limiter ──────────────────────────────
// Sliding-window counter keyed by (bucket, identifier). Per-instance only:
// on serverless hosting each instance keeps its own counters, so this is a
// brute-force speed bump, not a hard guarantee — platform-level limiting
// (e.g. Vercel WAF / Supabase auth limits) remains the real control.
// Documented in ARCHITECTURE.md §13.

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();
const MAX_ENTRIES = 10_000;

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function rateLimit(
  bucket: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
  now = Date.now()
): RateLimitResult {
  // Opportunistic cleanup to bound memory.
  if (windows.size > MAX_ENTRIES) {
    for (const [key, win] of windows) {
      if (win.resetAt <= now) windows.delete(key);
    }
  }

  const key = `${bucket}:${identifier}`;
  const existing = windows.get(key);

  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Test hook. */
export function resetRateLimiter(): void {
  windows.clear();
}
