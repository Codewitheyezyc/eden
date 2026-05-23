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

export async function deleteUserAccount(userId: string, facultyId: string, facultySlug: string) {
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
    return { error: "Only admins can delete user accounts." };
  }

  // Don't allow removing yourself
  if (userId === user.id) {
    return { error: "You cannot delete your own account." };
  }

  const { error } = await supabase.rpc("delete_user_account", { target_user_id: userId });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/${facultySlug}`, "layout");
  return { success: true };
}

export async function deleteUserAccounts(userIds: string[], facultyId: string, facultySlug: string) {
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
    return { error: "Only admins can delete user accounts." };
  }

  // Filter out the active admin user's ID
  const targetIds = userIds.filter(id => id !== user.id);

  if (targetIds.length === 0) {
    return { error: "No valid users selected to delete." };
  }

  const { error } = await supabase.rpc("delete_user_accounts", { target_user_ids: targetIds });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/${facultySlug}`, "layout");
  return { success: true };
}

export async function deleteAllUsersByRole(roleFilter: "STUDENT" | "COORDINATOR", facultyId: string, facultySlug: string) {
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
    return { error: "Only admins can delete user accounts." };
  }

  const { error } = await supabase.rpc("delete_all_users_by_role", { 
    role_filter: roleFilter, 
    f_id: facultyId 
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/${facultySlug}`, "layout");
  return { success: true };
}
