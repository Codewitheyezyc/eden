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
