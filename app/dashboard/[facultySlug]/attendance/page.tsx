import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";
import { parseCampuses } from "@/lib/campuses";
import { AttendanceClient } from "./attendance-client";

export default async function GeneralAttendancePage({
  params,
}: {
  params: { facultySlug: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Step 1: Get the faculty by slug
  const { data: faculty } = await supabase
    .from("faculties")
    .select("id, name, slug")
    .eq("slug", params.facultySlug)
    .single();

  if (!faculty) redirect("/dashboard");

  // Step 2: Get user's role in this faculty
  const { data: facultyAccess } = await supabase
    .from("user_faculties")
    .select("role")
    .eq("user_id", user.id)
    .eq("faculty_id", faculty.id)
    .single();

  const userRole = facultyAccess?.role;

  // Access Control: Students cannot access this route!
  if (!userRole || userRole === "STUDENT") {
    redirect(`/dashboard/${params.facultySlug}`);
  }

  // Step 3: Fetch all users in this faculty with profiles
  const { data: facultyMembers, error } = await supabase
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
    .eq("faculty_id", faculty.id);

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-200 dark:border-red-900/50">
        <h3 className="font-bold">Database Error</h3>
        <p className="text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  // Step 4: Map and filter only 100% completed profiles (is_verified === true)
  let allMembers = (facultyMembers || []).map((m: any) => {
    const userObj = Array.isArray(m.users) ? m.users[0] : m.users;
    const profile = userObj?.profiles ? (Array.isArray(userObj.profiles) ? userObj.profiles[0] : userObj.profiles) : null;
    
    return {
      id: m.user_id,
      fullName: userObj?.full_name || "Unknown Member",
      email: userObj?.email || "No Email Provided",
      avatarUrl: userObj?.avatar_url || null,
      role: m.role || "STUDENT",
      createdAt: m.created_at,
      profile: profile ? {
        phone: profile.phone || "",
        gender: profile.gender || "",
        kingschat: profile.kingschat_handle || "",
        campusZone: profile.campus_zone || "",
        dateOfBirth: profile.date_of_birth || "",
        bio: profile.bio || "",
        isVerified: !!profile.is_verified,
        leadershipRole: profile.leadership_role || "",
      } : null
    };
  }).filter(m => m.profile && m.profile.isVerified); // Only show 100% completed profiles

  // Step 5: Perform campus and role filtering if the viewer is a COORDINATOR
  if (userRole === "COORDINATOR") {
    // Get coordinator's own profile to identify their campus
    const { data: coordProfile } = await supabase
      .from("profiles")
      .select("campus_zone")
      .eq("id", user.id)
      .single();
    
    const coordinatorCampuses = parseCampuses(coordProfile?.campus_zone);

    allMembers = allMembers.filter(m => {
      // 1. Coordinators should NOT see admins in their view
      if (m.role === "ADMIN") return false;

      // 2. Coordinators should ONLY see members within their own campus
      const memberCampuses = parseCampuses(m.profile?.campusZone);
      const sharesCampus = coordinatorCampuses.some(c => memberCampuses.includes(c));

      return sharesCampus;
    });
  }

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">General Attendance</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {userRole === "ADMIN" 
            ? "Overview of all verified members who have completed their profiles across all campuses."
            : "Overview of verified members and coordinators within your assigned campus."}
        </p>
      </div>

      <AttendanceClient 
        initialMembers={allMembers} 
        viewerRole={userRole} 
        facultySlug={params.facultySlug}
      />
    </div>
  );
}
