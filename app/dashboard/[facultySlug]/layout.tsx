import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { RealtimeDashboardListener } from "@/components/dashboard/realtime-listener";
import { ResourceNotFound } from "@/components/ui/resource-not-found";

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
      <ResourceNotFound 
        mode="faculty" 
        customSlug={params.facultySlug} 
        customErrorDetail={facultyError ? JSON.stringify(facultyError, null, 2) : "Query returned 0 rows. The faculty workspace slug is invalid."}
      />
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
    return (
      <ResourceNotFound 
        mode="access" 
        customErrorDetail={accessError ? JSON.stringify(accessError, null, 2) : "User does not have an assigned membership role for this faculty workspace."}
      />
    );
  }

  // Fetch verified status
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_verified, completed_tour")
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
      completedTour={profile?.completed_tour || false}
    >
      <RealtimeDashboardListener facultyId={faculty.id} />
      {children}
    </DashboardShell>
  );
}
