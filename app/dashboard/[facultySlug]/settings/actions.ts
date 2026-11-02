"use server";

import { createClient } from "@/services/supabase/server";
import { revalidatePath } from "next/cache";
import { formatCampusesForDb } from "@/lib/campuses";


export async function updateProfile(data: {
  fullName: string;
  phone: string;
  gender: string;
  kingschatUsername: string;
  campusZone: string;
  dateOfBirth: string;
  bio: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Update public.users
  const { error: userError } = await supabase
    .from("users")
    .update({ 
      full_name: data.fullName,
      kingschat_username: data.kingschatUsername || null
    })
    .eq("id", user.id);

  if (userError) throw new Error(userError.message);

  // Convert comma-separated string back to array and serialize as JSON
  const campusArray = data.campusZone
    ? data.campusZone.split(",").map(c => c.trim()).filter(Boolean)
    : [];
  const dbCampusZone = formatCampusesForDb(campusArray);

  // Update public.profiles
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      phone: data.phone || null,
      gender: data.gender || null,
      campus_zone: dbCampusZone || null,
      date_of_birth: data.dateOfBirth || null,
      bio: data.bio || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) throw new Error(profileError.message);

  revalidatePath("/", "layout");
}

export async function updateFaculty(facultyId: string, name: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Validate ADMIN role
  const { data: access } = await supabase
    .from("user_faculties")
    .select("role")
    .eq("user_id", user.id)
    .eq("faculty_id", facultyId)
    .single();

  if (!access || access.role !== "ADMIN") {
    throw new Error("Unauthorized. Only administrators can change faculty settings.");
  }

  const { error } = await supabase
    .from("faculties")
    .update({ name })
    .eq("id", facultyId);

  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
}

export async function updateUserRoleInFaculty(
  facultyId: string,
  targetUserId: string,
  newRole: "ADMIN" | "COORDINATOR" | "STUDENT"
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  if (user.id === targetUserId) {
    throw new Error("You cannot change your own role to prevent locking yourself out!");
  }

  // Validate ADMIN role of caller
  const { data: callerAccess } = await supabase
    .from("user_faculties")
    .select("role")
    .eq("user_id", user.id)
    .eq("faculty_id", facultyId)
    .single();

  if (!callerAccess || callerAccess.role !== "ADMIN") {
    throw new Error("Unauthorized. Only administrators can manage roles.");
  }

  const { error } = await supabase
    .from("user_faculties")
    .update({ role: newRole })
    .eq("user_id", targetUserId)
    .eq("faculty_id", facultyId);

  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
}

export async function manageCampusAction(data: {
  action: "add" | "update" | "delete";
  id?: string;
  name?: string;
  oldName?: string;
}) {
  const supabase = createClient();
  const { data: res, error } = await supabase.rpc("admin_manage_campus", {
    p_action: data.action,
    p_id: data.id || null,
    p_name: data.name || null,
    p_old_name: data.oldName || null,
  });

  if (error) return { error: error.message };
  if (!res?.success) return { error: res?.error || "Failed to manage campus" };

  revalidatePath("/", "layout");
  return { success: true, data: res };
}

export async function manageLeadershipRoleAction(data: {
  action: "add" | "update" | "delete";
  id?: string;
  title?: string;
  oldTitle?: string;
}) {
  const supabase = createClient();
  const { data: res, error } = await supabase.rpc("admin_manage_leadership_role", {
    p_action: data.action,
    p_id: data.id || null,
    p_title: data.title || null,
    p_old_title: data.oldTitle || null,
  });

  if (error) return { error: error.message };
  if (!res?.success) return { error: res?.error || "Failed to manage leadership role" };

  revalidatePath("/", "layout");
  return { success: true, data: res };
}
