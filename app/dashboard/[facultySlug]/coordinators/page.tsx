import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";
import { DirectoryGrid, DirectoryUser } from "@/components/dashboard/directory-grid";

export default async function CoordinatorsDirectoryPage({
  params,
}: {
  params: { facultySlug: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get Faculty and check access
  const { data: faculty } = await supabase
    .from("faculties")
    .select("id")
    .eq("slug", params.facultySlug)
    .single();

  if (!faculty) redirect("/dashboard");

  // Check if ADMIN
  const { data: facultyAccess } = await supabase
    .from("user_faculties")
    .select("role")
    .eq("user_id", user.id)
    .eq("faculty_id", faculty.id)
    .single();

  if (facultyAccess?.role !== "ADMIN") {
    redirect(`/dashboard/${params.facultySlug}`);
  }

  // Fetch Coordinators
  const { data: coordinatorsData } = await supabase
    .from("user_faculties")
    .select(`
      user_id,
      users:user_id (
        id,
        full_name,
        avatar_url,
        email,
        profiles (
          phone,
          gender,
          kingschat_handle,
          campus_zone,
          date_of_birth,
          bio,
          is_verified
        )
      )
    `)
    .eq("faculty_id", faculty.id)
    .eq("role", "COORDINATOR")
    .order("created_at", { ascending: false });

  // Map to DirectoryUser format
  const users: DirectoryUser[] = (coordinatorsData || []).map((s: any) => {
    const userObj = Array.isArray(s.users) ? s.users[0] : s.users;
    const profile = userObj?.profiles ? (Array.isArray(userObj.profiles) ? userObj.profiles[0] : userObj.profiles) : null;
    return {
      id: s.user_id,
      full_name: userObj?.full_name || null,
      avatar_url: userObj?.avatar_url || null,
      email: userObj?.email || "",
      role: "COORDINATOR",
      profile: profile || null,
    };
  });

  // Get current user role
  const currentUserRole = facultyAccess?.role || "STUDENT";

  return (
    <div className="animate-in fade-in duration-700 slide-in-from-bottom-4">
      <DirectoryGrid 
        title="Coordinators Directory" 
        users={users} 
        currentUserRole={currentUserRole}
        facultyId={faculty.id}
        facultySlug={params.facultySlug}
      />
    </div>
  );
}
