import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { RealtimeDashboardListener } from "@/components/dashboard/realtime-listener";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { facultySlug: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Step 1: Get the faculty by slug
  const { data: faculty, error: facultyError } = await supabase
    .from("faculties")
    .select("id, name, slug")
    .eq("slug", params.facultySlug)
    .single();

  if (facultyError || !faculty) {
    return (
      <div className="p-10 font-mono text-sm">
        <h2 className="text-red-500 font-bold mb-4">Error finding faculty!</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-2">The system tried to search the database for a faculty with the exact slug: <span className="font-bold bg-red-100 text-red-800 px-2 rounded">"{params.facultySlug}"</span></p>
        <p className="text-gray-700 dark:text-gray-300 mb-4">But it returned 0 rows (it doesn't exist in the database).</p>
        <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-gray-500">{JSON.stringify(facultyError || "Not found")}</div>
      </div>
    );
  }

  // Step 2: Get user's role in this faculty
  const { data: facultyAccess, error: accessError } = await supabase
    .from("user_faculties")
    .select("role")
    .eq("user_id", user.id)
    .eq("faculty_id", faculty.id)
    .single();

  if (accessError || !facultyAccess) {
    return <div className="p-10 text-red-500 font-mono text-sm">Error finding access: {JSON.stringify(accessError || "No access")}</div>;
  }

  // Fetch verified status
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_verified")
    .eq("id", user.id)
    .single();

  return (
    <DashboardShell 
      facultyName={faculty.name} 
      facultySlug={faculty.slug} 
      role={facultyAccess.role}
      userEmail={user.email || "User"}
      userName={user.user_metadata?.full_name}
      avatarUrl={user.user_metadata?.avatar_url}
      isVerified={profile?.is_verified || false}
    >
      <RealtimeDashboardListener facultyId={faculty.id} />
      {children}
    </DashboardShell>
  );
}
