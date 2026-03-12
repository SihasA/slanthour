import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile for sidebar
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen">
      <Sidebar
        displayName={profile?.display_name ?? "User"}
        username={profile?.username ?? ""}
        email={user.email ?? ""}
      />
      {/* Main content — offset by sidebar on desktop */}
      <main className="md:ml-56 pt-16 md:pt-0">{children}</main>
    </div>
  );
}
