import { isArborAuthed } from "@/lib/arbor/auth";
import ArborGate from "@/components/arbor/ArborGate";
import ArborApp from "@/components/arbor/ArborApp";

export const metadata = {
  title: "Arbor AI",
  robots: { index: false, follow: false },
};

// Always evaluate the gate per request (reads the session cookie).
export const dynamic = "force-dynamic";

export default async function ArborPage() {
  const authed = await isArborAuthed();
  if (!authed) return <ArborGate />;
  return <ArborApp />;
}
