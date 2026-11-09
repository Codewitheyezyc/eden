"use server";

import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function completeOnboarding(formData: {
  fullName?: string;
  campusZone?: string;
  phone?: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch Dance faculty ID
  const { data: danceFaculty, error: facultyError } = await supabase
    .from("faculties")
    .select("id, slug")
    .eq("slug", "dance")
    .single();

  if (facultyError || !danceFaculty) {
    console.error("Dance faculty not found:", facultyError);
    return { error: "Dance faculty not found. Please contact support." };
  }

  // 2. Link user to Dance faculty as STUDENT (safe upsert)
  const { error: linkError } = await supabase
    .from("user_faculties")
    .upsert(
      {
        user_id: user.id,
        faculty_id: danceFaculty.id,
        role: "STUDENT",
      },
      { onConflict: "user_id,faculty_id" }
    );

  if (linkError) {
    console.error("Error linking to dance faculty:", linkError);
    return { error: linkError.message };
  }

  // 3. Update user full name if supplied
  if (formData.fullName?.trim()) {
    await supabase
      .from("users")
      .update({ full_name: formData.fullName.trim() })
      .eq("id", user.id);
  }

  // 4. Update profile with campus zone and phone
  const profileUpdates: Record<string, any> = {
    id: user.id,
    updated_at: new Date().toISOString(),
  };

  if (formData.campusZone?.trim()) {
    profileUpdates.campus_zone = formData.campusZone.trim();
  }

  if (formData.phone?.trim()) {
    profileUpdates.phone = formData.phone.trim();
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(profileUpdates, { onConflict: "id" });

  if (profileError) {
    console.error("Error updating profile:", profileError);
    // Non-fatal, user is already linked
  }

  // 5. Anti-Duplicate Smart Link: Check if this dancer was previously enrolled
  // via coordinator assisted enrollment (with dummy email @loveworldarts.internal)
  try {
    const cleanPhoneDigits = (formData.phone || "").replace(/\D/g, "");
    const cleanName = (formData.fullName || "").trim().toLowerCase();

    if (cleanName || cleanPhoneDigits.length >= 8) {
      const { data: assistedUsers } = await supabase
        .from("users")
        .select(`
          id,
          email,
          full_name,
          profiles (
            phone,
            avatar_url,
            shoe_size,
            trouser_size,
            top_size,
            kingschat_handle,
            campus_zone
          )
        `)
        .ilike("email", "%@loveworldarts.internal");

      const matchingAssisted = (assistedUsers || []).find((au: any) => {
        if (au.id === user.id) return false;
        const auName = (au.full_name || "").trim().toLowerCase();
        const auProfile = Array.isArray(au.profiles) ? au.profiles[0] : au.profiles;
        const auPhoneDigits = (auProfile?.phone || "").replace(/\D/g, "");

        if (cleanName && auName === cleanName) return true;
        if (cleanPhoneDigits.length >= 8 && auPhoneDigits.length >= 8) {
          if (cleanPhoneDigits.endsWith(auPhoneDigits) || auPhoneDigits.endsWith(cleanPhoneDigits)) {
            return true;
          }
        }
        return false;
      });

      if (matchingAssisted) {
        const auProfile = Array.isArray(matchingAssisted.profiles) ? matchingAssisted.profiles[0] : matchingAssisted.profiles;
        if (auProfile) {
          const profileMigrates: Record<string, any> = {};
          if (auProfile.avatar_url) profileMigrates.avatar_url = auProfile.avatar_url;
          if (auProfile.shoe_size) profileMigrates.shoe_size = auProfile.shoe_size;
          if (auProfile.trouser_size) profileMigrates.trouser_size = auProfile.trouser_size;
          if (auProfile.top_size) profileMigrates.top_size = auProfile.top_size;
          if (auProfile.kingschat_handle) profileMigrates.kingschat_handle = auProfile.kingschat_handle;

          if (Object.keys(profileMigrates).length > 0) {
            await supabase.from("profiles").update(profileMigrates).eq("id", user.id);
            if (profileMigrates.avatar_url) {
              await supabase.from("users").update({ avatar_url: profileMigrates.avatar_url }).eq("id", user.id);
            }
          }
        }

        // Transfer event attendance
        const { data: existingAtt } = await supabase
          .from("event_attendance")
          .select("event_id")
          .eq("user_id", matchingAssisted.id);

        if (existingAtt && existingAtt.length > 0) {
          for (const att of existingAtt) {
            await supabase
              .from("event_attendance")
              .upsert(
                { event_id: att.event_id, user_id: user.id, status: "ATTENDED" },
                { onConflict: "event_id,user_id" }
              );
          }
        }

        // Clean up the duplicate assisted placeholder
        await supabase.from("event_attendance").delete().eq("user_id", matchingAssisted.id);
        await supabase.from("user_faculties").delete().eq("user_id", matchingAssisted.id);
        await supabase.from("profiles").delete().eq("id", matchingAssisted.id);
        await supabase.from("users").delete().eq("id", matchingAssisted.id);
      }
    }
  } catch (mergeErr) {
    console.error("Non-fatal error during assisted member deduplication:", mergeErr);
  }

  revalidatePath("/", "layout");
  redirect(`/dashboard/dance`);
}
