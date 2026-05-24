import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";
import { LeaderProfileClient } from "./leader-profile-client";

export default async function HQLeaderProfilePage({
  params,
}: {
  params: { facultySlug: string; leaderId: string };
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

  // Step 2: Get user's role in this faculty (Viewer)
  const { data: facultyAccess } = await supabase
    .from("user_faculties")
    .select("role")
    .eq("user_id", user.id)
    .eq("faculty_id", faculty.id)
    .single();

  const viewerRole = facultyAccess?.role || "STUDENT";

  // Step 3: Fetch the Leader's basic user & faculty record
  const { data: leaderAccess, error: accessError } = await supabase
    .from("user_faculties")
    .select("role")
    .eq("user_id", params.leaderId)
    .eq("faculty_id", faculty.id)
    .single();

  if (accessError || !leaderAccess) {
    redirect(`/dashboard/${params.facultySlug}/hq-leaders`);
  }

  // Step 4: Fetch detailed profile variables
  const { data: userProfile, error: profileError } = await supabase
    .from("users")
    .select(`
      id,
      full_name,
      avatar_url,
      email,
      profiles (
        campus_zone,
        phone,
        gender,
        kingschat_handle,
        bio,
        is_verified,
        leadership_role,
        leadership_metadata
      )
    `)
    .eq("id", params.leaderId)
    .single();

  if (profileError || !userProfile) {
    redirect(`/dashboard/${params.facultySlug}/hq-leaders`);
  }

  const profileObj = Array.isArray(userProfile.profiles) ? userProfile.profiles[0] : userProfile.profiles;

  // Make sure they actually have a leadership role assigned (otherwise redirect back)
  if (!profileObj?.leadership_role) {
    redirect(`/dashboard/${params.facultySlug}/hq-leaders`);
  }

  // Step 5: Format leader profile data safely
  const leaderData = {
    id: userProfile.id,
    fullName: userProfile.full_name || "HQ Faculty Leader",
    email: userProfile.email || "No Email Provided",
    avatarUrl: userProfile.avatar_url || null,
    role: leaderAccess.role || "ADMIN",
    profile: {
      campusZone: profileObj.campus_zone || "",
      phone: profileObj.phone || "",
      gender: profileObj.gender || "",
      kingschat: profileObj.kingschat_handle || "",
      bio: profileObj.bio || "",
      isVerified: !!profileObj.is_verified,
      leadershipRole: profileObj.leadership_role || "",
      metadata: profileObj.leadership_metadata || {},
    }
  };

  return (
    <div className="space-y-6">
      <LeaderProfileClient 
        leader={leaderData}
        viewerRole={viewerRole}
        facultySlug={params.facultySlug}
        facultyId={faculty.id}
        facultyName={faculty.name}
        currentUserId={user.id}
      />
    </div>
  );
}
