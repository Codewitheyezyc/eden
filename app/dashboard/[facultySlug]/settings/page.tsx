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

  // Step 2: Fetch viewer's role and faculty members in parallel
  const [accessRes, membersRes, campusesRes, rolesRes, profilesDataRes] = await Promise.all([
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
      .eq("faculty_id", faculty.id),
    supabase
      .from("campuses")
      .select("id, name, is_active, created_at")
      .order("name", { ascending: true }),
    supabase
      .from("leadership_roles")
      .select("id, title, is_active, created_at")
      .order("title", { ascending: true }),
    supabase
      .from("profiles")
      .select("campus_zone, leadership_role")
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

  // Calculate member counts per campus and leadership role
  const campusCounts: Record<string, number> = {};
  const roleCounts: Record<string, number> = {};

  (profilesDataRes.data || []).forEach((p: any) => {
    if (p.campus_zone) {
      parseCampuses(p.campus_zone).forEach((c: string) => {
        campusCounts[c] = (campusCounts[c] || 0) + 1;
      });
    }
    if (p.leadership_role) {
      roleCounts[p.leadership_role] = (roleCounts[p.leadership_role] || 0) + 1;
    }
  });

  const campuses = (campusesRes.data || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    isActive: c.is_active,
    memberCount: campusCounts[c.name] || 0,
    createdAt: c.created_at,
  }));

  const leadershipRoles = (rolesRes.data || []).map((r: any) => ({
    id: r.id,
    title: r.title,
    isActive: r.is_active,
    leaderCount: roleCounts[r.title] || 0,
    createdAt: r.created_at,
  }));

  return (
    <SettingsClient
      facultyId={faculty.id}
      facultyName={faculty.name}
      facultySlug={faculty.slug}
      role={facultyAccess.role}
      currentUser={currentUserData}
      members={members}
      campuses={campuses}
      leadershipRoles={leadershipRoles}
    />
  );
}
