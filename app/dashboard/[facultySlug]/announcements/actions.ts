"use server";

import { createClient } from "@/services/supabase/server";
import { revalidatePath } from "next/cache";
import { parseCampuses } from "@/lib/campuses";

export async function createAnnouncement(
  facultyId: string,
  title: string,
  content: string,
  expiresAt: string | null,
  targetCampuses: string[] | null = null,
  targetRoles: string[] | null = null
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Validate role
  const { data: access } = await supabase
    .from("user_faculties")
    .select("role")
    .eq("user_id", user.id)
    .eq("faculty_id", facultyId)
    .single();

  if (!access || (access.role !== "ADMIN" && access.role !== "COORDINATOR")) {
    throw new Error("Unauthorized access level");
  }

  // Insert announcement
  const { data: newAnn, error } = await supabase
    .from("announcements")
    .insert({
      faculty_id: facultyId,
      sender_id: user.id,
      title,
      content,
      expires_at: expiresAt || null,
      target_campuses: targetCampuses ? JSON.stringify(targetCampuses) : null,
      target_roles: targetRoles ? targetRoles.join(",") : null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  // Fetch faculty slug for notification redirect link
  const { data: faculty } = await supabase
    .from("faculties")
    .select("slug")
    .eq("id", facultyId)
    .single();

  const facultySlug = faculty?.slug || "";

  // Notify other users in the faculty based on role & campus targeting
  const { data: members } = await supabase
    .from("user_faculties")
    .select(`
      user_id,
      role,
      user:users!user_faculties_user_id_fkey(
        profiles!profiles_id_fkey(campus_zone)
      )
    `)
    .eq("faculty_id", facultyId)
    .neq("user_id", user.id);

  if (members && members.length > 0) {
    const membersToNotify = members.filter((m: any) => {
      // 1. Role Check
      if (targetRoles && targetRoles.length > 0) {
        if (!targetRoles.includes(m.role)) return false;
      }

      // 2. Campus Check
      if (targetCampuses && targetCampuses.length > 0) {
        const userObj = Array.isArray(m.user) ? m.user[0] : m.user;
        const profile = userObj?.profiles ? (Array.isArray(userObj.profiles) ? userObj.profiles[0] : userObj.profiles) : null;
        const userCamps = parseCampuses(profile?.campus_zone);
        const hasIntersection = userCamps.some((c: string) => targetCampuses.includes(c));
        if (!hasIntersection) return false;
      }

      return true;
    });

    if (membersToNotify.length > 0) {
      const notificationsToInsert = membersToNotify.map((m: any) => ({
        user_id: m.user_id,
        faculty_id: facultyId,
        title: "New Announcement",
        message: `${title}: ${content.substring(0, 80)}${content.length > 80 ? "..." : ""}`,
        link: `/dashboard/${facultySlug}/announcements`,
        is_read: false,
      }));

      await supabase.from("notifications").insert(notificationsToInsert);
    }
  }

  revalidatePath("/", "layout");
}

export async function deleteAnnouncement(announcementId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // First fetch announcement to get faculty_id
  const { data: ann } = await supabase
    .from("announcements")
    .select("faculty_id")
    .eq("id", announcementId)
    .single();

  if (!ann) throw new Error("Announcement not found");

  // Validate role
  const { data: access } = await supabase
    .from("user_faculties")
    .select("role")
    .eq("user_id", user.id)
    .eq("faculty_id", ann.faculty_id)
    .single();

  if (!access || (access.role !== "ADMIN" && access.role !== "COORDINATOR")) {
    throw new Error("Unauthorized access level");
  }

  const { error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", announcementId);

  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
}

export async function updateAnnouncement(
  announcementId: string,
  title: string,
  content: string,
  expiresAt: string | null,
  targetCampuses: string[] | null = null,
  targetRoles: string[] | null = null
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // First fetch announcement to get faculty_id
  const { data: ann } = await supabase
    .from("announcements")
    .select("faculty_id")
    .eq("id", announcementId)
    .single();

  if (!ann) throw new Error("Announcement not found");

  // Validate role
  const { data: access } = await supabase
    .from("user_faculties")
    .select("role")
    .eq("user_id", user.id)
    .eq("faculty_id", ann.faculty_id)
    .single();

  if (!access || (access.role !== "ADMIN" && access.role !== "COORDINATOR")) {
    throw new Error("Unauthorized access level");
  }

  const { error } = await supabase
    .from("announcements")
    .update({
      title,
      content,
      expires_at: expiresAt || null,
      target_campuses: targetCampuses ? JSON.stringify(targetCampuses) : null,
      target_roles: targetRoles ? targetRoles.join(",") : null,
    })
    .eq("id", announcementId);

  if (error) throw new Error(error.message);

  // Fetch faculty slug for notification redirect link
  const { data: faculty } = await supabase
    .from("faculties")
    .select("slug")
    .eq("id", ann.faculty_id)
    .single();

  const facultySlug = faculty?.slug || "";

  // Notify other users in the faculty about the update
  const { data: members } = await supabase
    .from("user_faculties")
    .select(`
      user_id,
      role,
      user:users!user_faculties_user_id_fkey(
        profiles!profiles_id_fkey(campus_zone)
      )
    `)
    .eq("faculty_id", ann.faculty_id)
    .neq("user_id", user.id);

  if (members && members.length > 0) {
    const membersToNotify = members.filter((m: any) => {
      if (targetRoles && targetRoles.length > 0) {
        if (!targetRoles.includes(m.role)) return false;
      }
      if (targetCampuses && targetCampuses.length > 0) {
        const userObj = Array.isArray(m.user) ? m.user[0] : m.user;
        const profile = userObj?.profiles ? (Array.isArray(userObj.profiles) ? userObj.profiles[0] : userObj.profiles) : null;
        const userCamps = parseCampuses(profile?.campus_zone);
        const hasIntersection = userCamps.some((c: string) => targetCampuses.includes(c));
        if (!hasIntersection) return false;
      }
      return true;
    });

    if (membersToNotify.length > 0) {
      const notificationsToInsert = membersToNotify.map((m: any) => ({
        user_id: m.user_id,
        faculty_id: ann.faculty_id,
        title: "Announcement Updated",
        message: `${title}: ${content.substring(0, 80)}${content.length > 80 ? "..." : ""}`,
        link: `/dashboard/${facultySlug}/announcements`,
        is_read: false,
      }));

      await supabase.from("notifications").insert(notificationsToInsert);
    }
  }

  revalidatePath("/", "layout");
}
