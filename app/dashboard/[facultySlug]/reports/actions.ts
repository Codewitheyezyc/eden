"use server";

import { createClient } from "@/services/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveReport(facultyId: string, facultySlug: string, title: string, content: string, reportId?: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  if (reportId) {
    // Update existing report
    const { data, error } = await supabase
      .from("reports")
      .update({
        title,
        content,
        updated_at: new Date().toISOString()
      })
      .eq("id", reportId)
      .eq("faculty_id", facultyId)
      .select()
      .single();

    if (error) {
      console.error("Error updating report:", error);
      return { error: error.message };
    }
    
    revalidatePath(`/dashboard/${facultySlug}`, "layout");
    return { data };
  } else {
    // Create new report
    const { data, error } = await supabase
      .from("reports")
      .insert({
        faculty_id: facultyId,
        author_id: user.id,
        title,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating report:", error);
      return { error: error.message };
    }
    
    revalidatePath(`/dashboard/${facultySlug}`, "layout");
    return { data };
  }
}

export async function deleteReport(reportId: string, facultyId: string, facultySlug: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify role
  const { data: roleData } = await supabase
    .from("user_faculties")
    .select("role")
    .eq("user_id", user.id)
    .eq("faculty_id", facultyId)
    .single();

  if (roleData?.role !== "ADMIN" && roleData?.role !== "COORDINATOR") {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("reports")
    .delete()
    .eq("id", reportId)
    .eq("faculty_id", facultyId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/${facultySlug}`, "layout");
  return { success: true };
}
