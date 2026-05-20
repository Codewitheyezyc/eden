"use server";

import { createClient } from "@/services/supabase/server";
import { revalidatePath } from "next/cache";

export async function createMessage(
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

  const { error } = await supabase.from("messages").insert({
    faculty_id: facultyId,
    sender_id: user.id,
    title,
    content,
    expires_at: expiresAt || null,
    target_campuses: targetCampuses ? JSON.stringify(targetCampuses) : null,
    target_roles: targetRoles ? targetRoles.join(",") : null,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard`);
}

export async function deleteMessage(messageId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // First fetch message to get faculty_id
  const { data: msg } = await supabase
    .from("messages")
    .select("faculty_id")
    .eq("id", messageId)
    .single();

  if (!msg) throw new Error("Message not found");

  // Validate role
  const { data: access } = await supabase
    .from("user_faculties")
    .select("role")
    .eq("user_id", user.id)
    .eq("faculty_id", msg.faculty_id)
    .single();

  if (!access || (access.role !== "ADMIN" && access.role !== "COORDINATOR")) {
    throw new Error("Unauthorized access level");
  }

  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", messageId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard`);
}
