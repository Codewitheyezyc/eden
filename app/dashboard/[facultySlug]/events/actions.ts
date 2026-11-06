"use server";

import { createClient } from "@/services/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleEventAttendanceAction(
  eventId: string,
  targetPresent: boolean,
  facultySlug?: string
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "You must be signed in to manage event attendance." };
    }

    if (targetPresent) {
      // Register RSVP / Attend
      const { error } = await supabase
        .from("event_attendance")
        .upsert(
          {
            event_id: eventId,
            user_id: user.id,
            status: "PRESENT",
            proof_image_url: null,
          },
          { onConflict: "event_id,user_id" }
        );

      if (error) {
        console.error("Failed to mark attendance (Server Action):", error);
        return { error: error.message || "Failed to register for event." };
      }
    } else {
      // Cancel RSVP
      const { error } = await supabase
        .from("event_attendance")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Failed to cancel attendance (Server Action):", error);
        return { error: error.message || "Failed to cancel attendance." };
      }
    }

    if (facultySlug) {
      revalidatePath(`/dashboard/${facultySlug}/events`);
      revalidatePath(`/dashboard/${facultySlug}`);
    } else {
      revalidatePath("/", "layout");
    }

    return { success: true, isPresent: targetPresent };
  } catch (err: any) {
    console.error("Unexpected error in toggleEventAttendanceAction:", err);
    return { error: err?.message || "An unexpected error occurred while updating attendance." };
  }
}

/**
 * Bulk-registers all enrolled faculty members to an event.
 * Only callable by Admins and Coordinators.
 */
export async function syncAllFacultyMembersToEventAction(
  eventId: string,
  facultyId: string,
  facultySlug?: string
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Authentication required." };
    }

    const { data, error } = await supabase.rpc("sync_faculty_members_to_event", {
      p_event_id: eventId,
      p_faculty_id: facultyId,
    });

    if (error) {
      console.error("Error executing sync_faculty_members_to_event:", error);
      return { error: error.message || "Failed to sync faculty members to event." };
    }

    if (facultySlug) {
      revalidatePath(`/dashboard/${facultySlug}/events/${eventId}/attendance`);
      revalidatePath(`/dashboard/${facultySlug}/events`);
    } else {
      revalidatePath("/", "layout");
    }

    return {
      success: true,
      insertedCount: data?.insertedCount ?? 0,
      totalFacultyMembers: data?.totalFacultyMembers ?? 0,
    };
  } catch (err: any) {
    console.error("Unexpected error in syncAllFacultyMembersToEventAction:", err);
    return { error: err?.message || "An error occurred while syncing faculty members." };
  }
}

/**
 * Manually adds an individual member to an event.
 * Only callable by Admins and Coordinators.
 */
export async function addMemberToEventAction(
  eventId: string,
  targetUserId: string,
  facultyId: string,
  facultySlug?: string
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Authentication required." };
    }

    const { error: insertError } = await supabase
      .from("event_attendance")
      .upsert(
        {
          event_id: eventId,
          user_id: targetUserId,
          status: "PRESENT",
          proof_image_url: null,
        },
        { onConflict: "event_id,user_id" }
      );

    if (insertError) {
      console.error("Error adding member to event:", insertError);
      return { error: insertError.message || "Failed to add member to event." };
    }

    if (facultySlug) {
      revalidatePath(`/dashboard/${facultySlug}/events/${eventId}/attendance`);
      revalidatePath(`/dashboard/${facultySlug}/events`);
    } else {
      revalidatePath("/", "layout");
    }

    return { success: true };
  } catch (err: any) {
    console.error("Unexpected error in addMemberToEventAction:", err);
    return { error: err?.message || "An error occurred while adding member." };
  }
}

/**
 * Removes a member from an event attendance roster.
 * Only callable by Admins and Coordinators.
 */
export async function removeMemberFromEventAction(
  eventId: string,
  targetUserId: string,
  facultyId: string,
  facultySlug?: string
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Authentication required." };
    }

    const { error: deleteError } = await supabase
      .from("event_attendance")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", targetUserId);

    if (deleteError) {
      console.error("Error removing member from event:", deleteError);
      return { error: deleteError.message || "Failed to remove member from event." };
    }

    if (facultySlug) {
      revalidatePath(`/dashboard/${facultySlug}/events/${eventId}/attendance`);
      revalidatePath(`/dashboard/${facultySlug}/events`);
    } else {
      revalidatePath("/", "layout");
    }

    return { success: true };
  } catch (err: any) {
    console.error("Unexpected error in removeMemberFromEventAction:", err);
    return { error: err?.message || "An error occurred while removing member." };
  }
}
