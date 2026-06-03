import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";
import { ProfileContainer } from "@/components/dashboard/profile-container";

export default async function ProfilePage({ params }: { params: { facultySlug: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch Faculty details, User record, and Profile details in parallel
  const [facultyRes, userRecordRes, profileRes] = await Promise.all([
    supabase
      .from("faculties")
      .select("id")
      .eq("slug", params.facultySlug)
      .single(),
    supabase
      .from("users")
      .select("full_name, avatar_url, kingschat_username")
      .eq("id", user.id)
      .single(),
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
  ]);

  const faculty = facultyRes.data;
  const userRecord = userRecordRes.data;
  const profile = profileRes.data;

  if (!faculty) redirect("/dashboard");

  // Get user's role in this faculty
  const { data: facultyAccess } = await supabase
    .from("user_faculties")
    .select("role")
    .eq("user_id", user.id)
    .eq("faculty_id", faculty.id)
    .single();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">My Profile</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your personal information and preferences.</p>
      </div>

      <ProfileContainer 
        userId={user.id} 
        userEmail={user.email || ""}
        initialProfile={profile} 
        initialFullName={userRecord?.full_name} 
        initialAvatar={userRecord?.avatar_url}
        initialKingschatUsername={userRecord?.kingschat_username}
        role={facultyAccess?.role || "STUDENT"}
      />
    </div>
  );
}
