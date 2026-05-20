import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";
import { AnnouncementsClient } from "./announcements-client";
import { parseCampuses } from "@/lib/campuses";

export default async function AnnouncementsPage({
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
    .select("id, slug")
    .eq("slug", params.facultySlug)
    .single();

  if (!faculty) redirect("/dashboard");

  // Check access & fetch role
  const { data: facultyAccess } = await supabase
    .from("user_faculties")
    .select("role")
    .eq("user_id", user.id)
    .eq("faculty_id", faculty.id)
    .single();

  if (!facultyAccess) redirect("/dashboard");

  // Fetch verified status and campus zone
  const { data: profile } = await supabase
    .from("profiles")
    .select("campus_zone")
    .eq("id", user.id)
    .single();

  const userCampuses = parseCampuses(profile?.campus_zone);

  // Fetch announcements where expires_at is in the future OR null
  const { data: announcementsData, error } = await supabase
    .from("announcements")
    .select(`
      id,
      title,
      content,
      created_at,
      expires_at,
      target_campuses,
      target_roles,
      sender:users!announcements_sender_id_fkey(
        full_name,
        avatar_url,
        email
      )
    `)
    .eq("faculty_id", faculty.id)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false });

  // Map to exact client types and filter by target permissions
  const allAnnouncements = (announcementsData || []).map((m: any) => {
    const senderObj = Array.isArray(m.sender) ? m.sender[0] : m.sender;
    return {
      id: m.id,
      title: m.title,
      content: m.content,
      created_at: m.created_at,
      expires_at: m.expires_at,
      target_campuses: m.target_campuses,
      target_roles: m.target_roles,
      sender: senderObj || null,
    };
  });

  const announcements = allAnnouncements.filter((m) => {
    // Admins see all announcements for management purposes
    if (facultyAccess.role === "ADMIN") return true;

    // Check Role Targeting
    if (m.target_roles) {
      const allowedRoles = m.target_roles.split(",").map((r: string) => r.trim());
      if (allowedRoles.length > 0 && !allowedRoles.includes(facultyAccess.role)) {
        return false;
      }
    }

    // Check Campus Targeting
    if (m.target_campuses) {
      const targetCampuses = parseCampuses(m.target_campuses);
      if (targetCampuses.length > 0) {
        const hasIntersection = userCampuses.some((c) => targetCampuses.includes(c));
        if (!hasIntersection) return false;
      }
    }

    return true;
  });

  return (
    <AnnouncementsClient
      initialAnnouncements={announcements}
      facultyId={faculty.id}
      facultySlug={faculty.slug}
      role={facultyAccess.role}
    />
  );
}
