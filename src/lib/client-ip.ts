// ─── Trusted client IP extraction ────────────────────────────────────
// Rate-limit keys must derive from an IP the caller cannot freely forge.
// The LEFTMOST X-Forwarded-For entry is client-supplied — a proxy appends
// the real connecting hop to the right — so keying a limiter on it lets an
// attacker rotate the key per request and defeat the limit entirely (the
// password-unlock brute-force guard depended on this). Prefer the
// platform's own trusted header, then the rightmost XFF hop (the one added
// by the proxy nearest us), never the leftmost.

type HeaderSource = { get(name: string): string | null };

export function clientIp(headers: HeaderSource): string {
  const real = headers.get("x-real-ip");
  if (real && real.trim()) return real.trim();

  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const hops = xff
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean);
    if (hops.length > 0) return hops[hops.length - 1];
  }
  return "unknown";
}
