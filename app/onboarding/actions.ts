"use server";

import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";

export async function assignFaculty(facultyId: string, facultySlug: string, role: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Insert the association using our newly added RLS policy that allows inserts
  const { error } = await supabase
    .from("user_faculties")
    .insert({
      user_id: user.id,
      faculty_id: facultyId,
      role: role
    });

  if (error) {
    console.error("Error assigning faculty:", error);
    return { error: error.message };
  }

  // Success, redirect to their new dashboard
  redirect(`/dashboard/${facultySlug}`);
}
