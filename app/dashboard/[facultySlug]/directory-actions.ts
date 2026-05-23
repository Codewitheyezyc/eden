"use server";

import { createClient } from "@/services/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateUserRole(userId: string, facultyId: string, newRole: "STUDENT" | "COORDINATOR" | "ADMIN", facultySlug: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify the current user is an ADMIN for this faculty
  const { data: currentUserAccess } = await supabase
    .from("user_faculties")
    .select("role")
    .eq("user_id", user.id)
    .eq("faculty_id", facultyId)
    .single();

  if (currentUserAccess?.role !== "ADMIN") {
    return { error: "Only admins can change user roles." };
  }

  // Don't allow changing your own role
  if (userId === user.id) {
    return { error: "You cannot change your own role." };
  }

  const { error } = await supabase
    .from("user_faculties")
    .update({ role: newRole })
    .eq("user_id", userId)
    .eq("faculty_id", facultyId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/${facultySlug}`, "layout");
  return { success: true };
}

export async function removeUserFromFaculty(userId: string, facultyId: string, facultySlug: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify current user is ADMIN
  const { data: currentUserAccess } = await supabase
    .from("user_faculties")
    .select("role")
    .eq("user_id", user.id)
    .eq("faculty_id", facultyId)
    .single();

  if (currentUserAccess?.role !== "ADMIN") {
    return { error: "Only admins can remove users." };
  }

  // Don't allow removing yourself
  if (userId === user.id) {
    return { error: "You cannot remove yourself from this faculty." };
  }

  const { error } = await supabase
    .from("user_faculties")
    .delete()
    .eq("user_id", userId)
    .eq("faculty_id", facultyId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/${facultySlug}`, "layout");
  return { success: true };
}

export async function removeUsersFromFaculty(userIds: string[], facultyId: string, facultySlug: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify current user is ADMIN
  const { data: currentUserAccess } = await supabase
    .from("user_faculties")
    .select("role")
    .eq("user_id", user.id)
    .eq("faculty_id", facultyId)
    .single();

  if (currentUserAccess?.role !== "ADMIN") {
    return { error: "Only admins can remove users." };
  }

  // Filter out the active admin user's ID
  const targetIds = userIds.filter(id => id !== user.id);

  if (targetIds.length === 0) {
    return { error: "No valid users selected to remove." };
  }

  const { error } = await supabase
    .from("user_faculties")
    .delete()
    .eq("faculty_id", facultyId)
    .in("user_id", targetIds);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/${facultySlug}`, "layout");
  return { success: true };
}

export async function clearAllUsersFromFaculty(roleFilter: "STUDENT" | "COORDINATOR", facultyId: string, facultySlug: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify current user is ADMIN
  const { data: currentUserAccess } = await supabase
    .from("user_faculties")
    .select("role")
    .eq("user_id", user.id)
    .eq("faculty_id", facultyId)
    .single();

  if (currentUserAccess?.role !== "ADMIN") {
    return { error: "Only admins can clear users." };
  }

  const { error } = await supabase
    .from("user_faculties")
    .delete()
    .eq("faculty_id", facultyId)
    .eq("role", roleFilter);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/${facultySlug}`, "layout");
  return { success: true };
}
