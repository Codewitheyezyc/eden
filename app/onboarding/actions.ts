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

  revalidatePath("/", "layout");
  redirect(`/dashboard/dance`);
}
