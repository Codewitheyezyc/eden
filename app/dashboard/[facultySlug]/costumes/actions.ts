"use server";

import { createClient } from "@/services/supabase/server";
import { revalidatePath } from "next/cache";

export interface SaveCostumeInput {
  shoeSize: string;
  trouserSize: string;
  topSize: string;
}

export async function saveMyCostumeSizes(data: SaveCostumeInput) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "You must be logged in to update your costume sizes." };
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        shoe_size: data.shoeSize?.trim() || null,
        trouser_size: data.trouserSize?.trim() || null,
        top_size: data.topSize?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating costume sizes:", updateError);
      return { error: updateError.message || "Failed to save costume sizes." };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: any) {
    console.error("Unexpected error in saveMyCostumeSizes:", err);
    return { error: err?.message || "An unexpected error occurred." };
  }
}

export interface EnrollMemberInput {
  facultyId: string;
  fullName: string;
  campusZone: string;
  phone?: string;
  gender?: string;
  shoeSize?: string;
  trouserSize?: string;
  topSize?: string;
  avatarUrl?: string;
  eventId?: string; // If enrolling directly from an event
}

export async function enrollMemberByCoordinator(data: EnrollMemberInput) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Authentication required." };
    }

    if (!data.fullName?.trim()) {
      return { error: "Full name is required." };
    }

    if (!data.campusZone?.trim()) {
      return { error: "Campus or zone is required." };
    }

    const cleanName = data.fullName.trim();
    const cleanPhoneDigits = (data.phone || "").replace(/\D/g, "");

    // 1. Anti-Duplicate Check: Prevent enrolling a member who already exists with this exact name in this faculty
    const { data: facultyMembers } = await supabase
      .from("user_faculties")
      .select("user_id, users:user_id(id, full_name, email)")
      .eq("faculty_id", data.facultyId);

    const existingNameMatch = (facultyMembers || []).find((row: any) => {
      const u = Array.isArray(row.users) ? row.users[0] : row.users;
      return u?.full_name?.trim().toLowerCase() === cleanName.toLowerCase();
    });

    if (existingNameMatch) {
      const u = Array.isArray(existingNameMatch.users) ? existingNameMatch.users[0] : existingNameMatch.users;
      return {
        error: `A member named "${u?.full_name || cleanName}" is already registered in this faculty. To prevent duplicate records, please find them in the directory.`
      };
    }

    // 2. Anti-Duplicate Check: Prevent duplicate phone numbers across registered members
    if (cleanPhoneDigits.length >= 8) {
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("id, phone, users:id(full_name)")
        .not("phone", "is", null);

      const existingPhoneMatch = (allProfiles || []).find((p: any) => {
        const pDigits = (p.phone || "").replace(/\D/g, "");
        return pDigits.length >= 8 && (pDigits.endsWith(cleanPhoneDigits) || cleanPhoneDigits.endsWith(pDigits));
      });

      if (existingPhoneMatch) {
        const u = Array.isArray(existingPhoneMatch.users) ? existingPhoneMatch.users[0] : existingPhoneMatch.users;
        return {
          error: `Phone number "${data.phone?.trim()}" is already registered to member "${u?.full_name || 'an existing member'}". Please verify the phone number.`
        };
      }
    }

    // Call the security definer RPC function to safely bypass RLS while enforcing admin/coordinator roles
    const { data: memberResult, error: rpcError } = await supabase.rpc("enroll_assisted_member", {
      p_faculty_id: data.facultyId,
      p_full_name: data.fullName.trim(),
      p_campus_zone: data.campusZone.trim(),
      p_phone: data.phone?.trim() || null,
      p_gender: data.gender || null,
      p_shoe_size: data.shoeSize?.trim() || null,
      p_trouser_size: data.trouserSize?.trim() || null,
      p_top_size: data.topSize?.trim() || null,
      p_avatar_url: data.avatarUrl || null,
      p_event_id: data.eventId || null,
    });

    if (rpcError) {
      console.error("Error executing enroll_assisted_member:", rpcError);
      return { error: rpcError.message || "Failed to enroll member." };
    }

    revalidatePath("/", "layout");
    return {
      success: true,
      member: memberResult,
    };
  } catch (err: any) {
    console.error("Unexpected error in enrollMemberByCoordinator:", err);
    return { error: err?.message || "An error occurred while enrolling the member." };
  }
}

