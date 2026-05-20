"use server";

import { createClient } from "@/services/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: {
  fullName: string;
  phone: string;
  gender: string;
  kingschatHandle: string;
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
    .update({ full_name: data.fullName })
    .eq("id", user.id);

  if (userError) throw new Error(userError.message);

  // Update public.profiles
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      phone: data.phone || null,
      gender: data.gender || null,
      kingschat_handle: data.kingschatHandle || null,
      campus_zone: data.campusZone || null,
      date_of_birth: data.dateOfBirth || null,
      bio: data.bio || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) throw new Error(profileError.message);

  revalidatePath(`/dashboard`);
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

  revalidatePath(`/dashboard`);
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

  revalidatePath(`/dashboard`);
}
