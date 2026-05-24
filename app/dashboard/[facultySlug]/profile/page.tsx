import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";
import { ProfileContainer } from "@/components/dashboard/profile-container";

export default async function ProfilePage({ params }: { params: { facultySlug: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get Faculty
  const { data: faculty } = await supabase
    .from("faculties")
    .select("id")
    .eq("slug", params.facultySlug)
    .single();

  if (!faculty) redirect("/dashboard");

  // Fetch basic user record
  const { data: userRecord } = await supabase
    .from("users")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  // Fetch profile record (might be null if they haven't set it up yet)
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

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
        role={facultyAccess?.role || "STUDENT"}
      />
    </div>
  );
}
