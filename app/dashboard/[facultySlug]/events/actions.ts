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
