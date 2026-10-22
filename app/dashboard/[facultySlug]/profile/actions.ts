"use server";

import { createClient } from "@/services/supabase/server";
import { revalidatePath } from "next/cache";
import { formatCampusesForDb } from "@/lib/campuses";

export interface SaveProfileInput {
  fullName: string;
  phone: string;
  gender: string;
  kingschatUsername: string;
  campusZone: string[];
  dob: string;
  bio: string;
  leadershipRole?: string | null;
  isVerified?: boolean;
}

export async function saveProfileAction(data: SaveProfileInput) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "You must be logged in to update your profile." };
    }

    // 1. Update basic user info in public.users
    const { error: userError } = await supabase
      .from("users")
      .update({
        full_name: data.fullName?.trim() || null,
        kingschat_username: data.kingschatUsername ? data.kingschatUsername.trim() : null,
      })
      .eq("id", user.id);

    if (userError) {
      console.error("Error updating public.users:", userError);
      return { error: userError.message || "Failed to update user account details." };
    }

    // 2. Validate leadership_role - only allow if caller is actually ADMIN
    let leadershipRoleToSave: string | null = null;
    if (data.leadershipRole && data.leadershipRole.trim() !== "") {
      const { data: adminCheck } = await supabase
        .from("user_faculties")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "ADMIN")
        .limit(1);

      if (adminCheck && adminCheck.length > 0) {
        leadershipRoleToSave = data.leadershipRole.trim();
      }
    }

    // 3. Upsert profile info in public.profiles
    const formattedCampus = formatCampusesForDb(data.campusZone || []);
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        phone: data.phone?.trim() || null,
        gender: data.gender || null,
        campus_zone: formattedCampus || null,
        date_of_birth: data.dob || null,
        bio: data.bio?.trim() || null,
        kingschat_handle: data.kingschatUsername ? data.kingschatUsername.trim() : null,
        is_verified: data.isVerified ?? false,
        leadership_role: leadershipRoleToSave,
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error("Error upserting public.profiles:", profileError);
      return { error: profileError.message || "Failed to update profile information." };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: any) {
    console.error("Unexpected error in saveProfileAction:", err);
    return { error: err?.message || "An unexpected error occurred while saving your profile." };
  }
}
