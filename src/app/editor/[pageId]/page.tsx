import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { parseDocument } from "@/lib/page-document";
import { Editor } from "@/components/editor/Editor";
import type { Page, Profile } from "@/types";

export const metadata: Metadata = {
  title: "Editor — Slanthour",
  robots: { index: false },
};

export default async function EditorPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: page }, { data: profile }] = await Promise.all([
    supabase.from("pages").select("*").eq("id", pageId).single(),
    supabase.from("profiles").select("*").eq("id", user.id).single(),
  ]);

  // RLS scopes the read; ownership is still asserted explicitly.
  if (!page || page.user_id !== user.id || !profile) notFound();

  const typedPage = page as Page;
  return (
    <Editor
      page={{ ...typedPage, draft: parseDocument(typedPage.draft) }}
      profile={profile as Profile}
    />
  );
}
