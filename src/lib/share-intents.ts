// ─── Share-intent URL builders ───────────────────────────────────────
// Pure helpers that turn a published page URL + title into the share
// targets the celebration sheet offers. No dependency, no SDK: every
// channel is a plain intent URL the browser already knows how to open
// (wa.me, twitter intent, mailto). Kept pure so they unit-test cleanly
// (see share-intents.test.ts) and can run on server or client.

import type { Visibility } from "@/types";

/** The one-line blurb that rides along with the link in every channel. */
export function shareMessage(title: string): string {
  const clean = title.trim();
  return clean ? `${clean} — on Slanthour` : "A page I made on Slanthour";
}

/** WhatsApp: wa.me only carries a single text field, so the link is folded
 * into the message body. */
export function whatsappShareUrl(url: string, title: string): string {
  const text = `${shareMessage(title)} ${url}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** X (Twitter): url and text are separate params; X renders the unfurl
 * card from the url on its own. */
export function xShareUrl(url: string, title: string): string {
  const params = new URLSearchParams({ url, text: shareMessage(title) });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

/** Email: subject names the page, body leads with the blurb then the link
 * on its own line so it stays clickable in every mail client. */
export function mailtoShareUrl(url: string, title: string): string {
  const clean = title.trim();
  const subject = clean ? `${clean} · Slanthour` : "A page on Slanthour";
  const body = `${shareMessage(title)}\n\n${url}`;
  const params = new URLSearchParams({ subject, body });
  // URLSearchParams encodes spaces as "+", which mail clients show
  // literally in the body; mailto wants %20. Newlines must stay %0A.
  return `mailto:?${params.toString().replace(/\+/g, "%20")}`;
}

/** One honest line about who can actually open the shared link, so the
 * owner is never surprised about reach. `null` for a fully public page —
 * nothing needs saying. */
export function visibilityNote(visibility: Visibility): string | null {
  switch (visibility) {
    case "unlisted":
      return "Unlisted — only people with the link can see this.";
    case "password":
      return "Password protected — anyone with the link still needs the password.";
    case "public":
    default:
      return null;
  }
}
