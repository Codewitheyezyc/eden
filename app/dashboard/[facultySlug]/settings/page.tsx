import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";
import { SettingsClient } from "./settings-client";
import { parseCampuses } from "@/lib/campuses";

export default async function SettingsPage({
  params,
}: {
  params: { facultySlug: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get Faculty details
  const { data: faculty } = await supabase
    .from("faculties")
    .select("id, name, slug")
    .eq("slug", params.facultySlug)
    .single();

  if (!faculty) redirect("/dashboard");

  // Fetch access & role
  const { data: facultyAccess } = await supabase
    .from("user_faculties")
    .select("role")
    .eq("user_id", user.id)
    .eq("faculty_id", faculty.id)
    .single();

  if (!facultyAccess) redirect("/dashboard");

  // Fetch user profile info
  const { data: userRecord } = await supabase
    .from("users")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const currentUserData = {
    id: user.id,
    fullName: userRecord?.full_name || "",
    phone: profile?.phone || "",
    gender: profile?.gender || "",
    kingschatHandle: profile?.kingschat_handle || "",
    campusZone: parseCampuses(profile?.campus_zone).join(", "),
    dateOfBirth: profile?.date_of_birth || "",
    bio: profile?.bio || "",
  };

  // Fetch all faculty members for the role delegation tab
  const { data: membersData } = await supabase
    .from("user_faculties")
    .select(`
      user_id,
      role,
      user:users!user_faculties_user_id_fkey(
        full_name,
        avatar_url,
        email
      )
    `)
    .eq("faculty_id", faculty.id);

  // Map to exact client types
  const members = (membersData || []).map((m: any) => {
    const userObj = Array.isArray(m.user) ? m.user[0] : m.user;
    return {
      user_id: m.user_id,
      role: m.role,
      user: userObj || null,
    };
  });

  return (
    <SettingsClient
      facultyId={faculty.id}
      facultyName={faculty.name}
      facultySlug={faculty.slug}
      role={facultyAccess.role}
      currentUser={currentUserData}
      members={members}
    />
  );
}
