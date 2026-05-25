import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";
import { HQLeadersClient } from "./hq-leaders-client";

export default async function HQLeadersDirectoryPage({
  params,
}: {
  params: { facultySlug: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Step 1: Get Faculty by slug
  const { data: faculty } = await supabase
    .from("faculties")
    .select("id, name, slug")
    .eq("slug", params.facultySlug)
    .single();

  if (!faculty) redirect("/dashboard");

  // Step 2: Get the viewer's role in this faculty
  const { data: facultyAccess } = await supabase
    .from("user_faculties")
    .select("role")
    .eq("user_id", user.id)
    .eq("faculty_id", faculty.id)
    .single();

  const viewerRole = facultyAccess?.role || "STUDENT";

  // Step 3: Fetch all members associated with this faculty who have leadership roles
  const { data: adminUsers, error } = await supabase
    .from("user_faculties")
    .select(`
      user_id,
      role,
      users:user_id (
        id,
        full_name,
        avatar_url,
        email,
        profiles (
          campus_zone,
          gender,
          phone,
          kingschat_handle,
          bio,
          is_verified,
          leadership_role,
          leadership_metadata
        )
      )
    `)
    .eq("faculty_id", faculty.id);

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-200 dark:border-red-900/50">
        <h3 className="font-bold">Database Error</h3>
        <p className="text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  // Step 4: Map users into clean Leader profile objects
  const leadersList = (adminUsers || []).map((m: any) => {
    const userObj = Array.isArray(m.users) ? m.users[0] : m.users;
    const profile = userObj?.profiles ? (Array.isArray(userObj.profiles) ? userObj.profiles[0] : userObj.profiles) : null;

    return {
      id: m.user_id,
      fullName: userObj?.full_name || "HQ Administrator",
      email: userObj?.email || "No Email",
      avatarUrl: userObj?.avatar_url || null,
      role: m.role || "ADMIN",
      profile: profile ? {
        campusZone: profile.campus_zone || "",
        gender: profile.gender || "",
        phone: profile.phone || "",
        kingschat: profile.kingschat_handle || "",
        bio: profile.bio || "",
        isVerified: !!profile.is_verified,
        leadershipRole: profile.leadership_role || "",
        leadershipMetadata: profile.leadership_metadata || {},
      } : null
    };
  }).filter(l => l.profile && l.profile.leadershipRole); // Only list users with active leadership roles assigned

  // Step 5: Fetch all other faculty members (used by Admins to assign a new leader!)
  let potentialLeaders: { id: string; fullName: string; email: string; currentRole: string }[] = [];
  if (viewerRole === "ADMIN") {
    const { data: allFacultyUsers } = await supabase
      .from("user_faculties")
      .select(`
        user_id,
        role,
        users:user_id (
          full_name,
          email
        )
      `)
      .eq("faculty_id", faculty.id);

    potentialLeaders = (allFacultyUsers || []).map((u: any) => {
      const userObj = Array.isArray(u.users) ? u.users[0] : u.users;
      return {
        id: u.user_id,
        fullName: userObj?.full_name || "Unknown Member",
        email: userObj?.email || "",
        currentRole: u.role || "STUDENT"
      };
    });
  }

  return (
    <div className="space-y-6">
      <HQLeadersClient 
        leaders={leadersList}
        potentialLeaders={potentialLeaders}
        viewerRole={viewerRole}
        facultySlug={params.facultySlug}
        facultyId={faculty.id}
      />
    </div>
  );
}
