import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";
import { SettingsClient } from "./settings-client";
import { parseCampuses } from "@/lib/campuses";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
};


export default async function SettingsPage({
  params,
}: {
  params: { facultySlug: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Step 1: Fetch Faculty details, User record, and Profile details in parallel
  const [facultyRes, userRecordRes, profileRes] = await Promise.all([
    supabase
      .from("faculties")
      .select("id, name, slug")
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

  // Step 2: Fetch viewer's role and all faculty members in parallel
  const [accessRes, membersRes] = await Promise.all([
    supabase
      .from("user_faculties")
      .select("role")
      .eq("user_id", user.id)
      .eq("faculty_id", faculty.id)
      .single(),
    supabase
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
      .eq("faculty_id", faculty.id)
  ]);

  const facultyAccess = accessRes.data;
  const membersData = membersRes.data;

  if (!facultyAccess) redirect("/dashboard");

  const currentUserData = {
    id: user.id,
    fullName: userRecord?.full_name || "",
    phone: profile?.phone || "",
    gender: profile?.gender || "",
    kingschatUsername: userRecord?.kingschat_username || "",
    campusZone: parseCampuses(profile?.campus_zone).join(", "),
    dateOfBirth: profile?.date_of_birth || "",
    bio: profile?.bio || "",
  };

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
