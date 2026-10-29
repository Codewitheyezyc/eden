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

    // 1. Generate new UUID for the member
    const newMemberId = crypto.randomUUID();

    // 2. Insert into public.users
    const { error: userError } = await supabase.from("users").insert({
      id: newMemberId,
      full_name: data.fullName.trim(),
      email: `member-${newMemberId.substring(0, 8)}@loveworldarts.internal`,
      avatar_url: data.avatarUrl || null,
    });

    if (userError) {
      console.error("Error inserting enrolled user:", userError);
      return { error: userError.message || "Failed to create user record." };
    }

    // 3. Link to faculty as STUDENT
    const { error: facultyError } = await supabase.from("user_faculties").insert({
      user_id: newMemberId,
      faculty_id: data.facultyId,
      role: "STUDENT",
    });

    if (facultyError) {
      console.error("Error linking to faculty:", facultyError);
    }

    // 4. Insert into profiles (trg_set_member_id will assign member_id automatically)
    const { data: createdProfile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: newMemberId,
        campus_zone: data.campusZone.trim(),
        phone: data.phone?.trim() || null,
        gender: data.gender || null,
        shoe_size: data.shoeSize?.trim() || null,
        trouser_size: data.trouserSize?.trim() || null,
        top_size: data.topSize?.trim() || null,
        avatar_url: data.avatarUrl || null,
        is_assisted_enrollment: true,
        enrolled_by: user.id,
      })
      .select("member_id")
      .single();

    if (profileError) {
      console.error("Error creating profile:", profileError);
    }

    // 5. If eventId is provided, also register them for the event
    if (data.eventId) {
      await supabase.from("event_attendance").insert({
        event_id: data.eventId,
        user_id: newMemberId,
        status: "ATTENDED",
        created_at: new Date().toISOString(),
      });
    }

    revalidatePath("/", "layout");
    return {
      success: true,
      member: {
        id: newMemberId,
        fullName: data.fullName.trim(),
        memberId: createdProfile?.member_id || "LAA-DNC-AUTO",
        campusZone: data.campusZone.trim(),
        avatarUrl: data.avatarUrl || null,
      },
    };
  } catch (err: any) {
    console.error("Unexpected error in enrollMemberByCoordinator:", err);
    return { error: err?.message || "An error occurred while enrolling the member." };
  }
}

