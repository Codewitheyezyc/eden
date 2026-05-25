import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";
import { UsersManagementClient } from "./users-client";
import { DirectoryUser } from "@/components/dashboard/directory-grid";

export default async function UsersManagementPage({
  params,
}: {
  params: { facultySlug: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get Faculty by slug
  const { data: faculty } = await supabase
    .from("faculties")
    .select("id, name, slug")
    .eq("slug", params.facultySlug)
    .single();

  if (!faculty) redirect("/dashboard");

  // Check if current user is ADMIN
  const { data: facultyAccess } = await supabase
    .from("user_faculties")
    .select("role")
    .eq("user_id", user.id)
    .eq("faculty_id", faculty.id)
    .single();

  if (facultyAccess?.role !== "ADMIN") {
    redirect(`/dashboard/${params.facultySlug}`);
  }

  // Fetch all users mapped to this faculty
  const { data: facultyUsersData } = await supabase
    .from("user_faculties")
    .select(`
      user_id,
      role,
      created_at,
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
          is_verified,
          leadership_role
        )
      )
    `)
    .eq("faculty_id", faculty.id)
    .order("created_at", { ascending: false });

  // Map to DirectoryUser format, incorporating user_faculties role
  const users: DirectoryUser[] = (facultyUsersData || []).map((s: any) => {
    const userObj = Array.isArray(s.users) ? s.users[0] : s.users;
    const profile = userObj?.profiles ? (Array.isArray(userObj.profiles) ? userObj.profiles[0] : userObj.profiles) : null;
    return {
      id: s.user_id,
      full_name: userObj?.full_name || null,
      avatar_url: userObj?.avatar_url || null,
      email: userObj?.email || "",
      role: s.role || "STUDENT", // Fetch the faculty role directly
      profile: profile || null,
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="mb-2">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">User Directory & Role Assignments</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Supervise registered faculty members. Elevate roles to zonal leaders/admins, downgrade roles, or clear access profiles.
        </p>
      </div>

      <UsersManagementClient
        initialUsers={users}
        facultyId={faculty.id}
        facultySlug={params.facultySlug}
        currentAdminId={user.id}
      />
    </div>
  );
}
