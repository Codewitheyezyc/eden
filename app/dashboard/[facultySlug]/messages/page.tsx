import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";
import { MessagesClient } from "./messages-client";
import { parseCampuses } from "@/lib/campuses";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messages",
};


export default async function MessagesPage({
  params,
}: {
  params: { facultySlug: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch Faculty and user's profile details in parallel
  const [facultyRes, profileRes] = await Promise.all([
    supabase
      .from("faculties")
      .select("id, slug")
      .eq("slug", params.facultySlug)
      .single(),
    supabase
      .from("profiles")
      .select("campus_zone")
      .eq("id", user.id)
      .single()
  ]);

  const faculty = facultyRes.data;
  const profile = profileRes.data;

  if (!faculty) redirect("/dashboard");

  // Fetch access role and messages in parallel
  const [accessRes, messagesRes] = await Promise.all([
    supabase
      .from("user_faculties")
      .select("role")
      .eq("user_id", user.id)
      .eq("faculty_id", faculty.id)
      .single(),
    supabase
      .from("messages")
      .select(`
        id,
        title,
        content,
        created_at,
        expires_at,
        target_campuses,
        target_roles,
        sender:users!messages_sender_id_fkey(
          full_name,
          avatar_url,
          email
        )
      `)
      .eq("faculty_id", faculty.id)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order("created_at", { ascending: false })
  ]);

  const facultyAccess = accessRes.data;
  const messagesData = messagesRes.data;

  if (!facultyAccess) redirect("/dashboard");

  const userCampuses = parseCampuses(profile?.campus_zone);

  // Map to exact client types and filter by target permissions
  const allMessages = (messagesData || []).map((m: any) => {
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

  const messages = allMessages.filter((m) => {
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
    <MessagesClient
      initialMessages={messages}
      facultyId={faculty.id}
      facultySlug={faculty.slug}
      role={facultyAccess.role}
    />
  );
}
