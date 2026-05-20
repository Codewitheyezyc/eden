"use server";

import { createClient } from "@/services/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCourseAction(
  facultyId: string,
  courseData: {
    title: string;
    description: string;
    type: "text" | "video";
    coverGradient: string;
    lessons: {
      title: string;
      type: "text" | "video";
      content: string;
      duration: string;
    }[];
  }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Validate user role - must be ADMIN of the faculty
  const { data: access } = await supabase
    .from("user_faculties")
    .select("role")
    .eq("user_id", user.id)
    .eq("faculty_id", facultyId)
    .single();

  if (!access || access.role !== "ADMIN") {
    throw new Error("Unauthorized access level. Only administrators can manage courses.");
  }

  // Insert course
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .insert({
      faculty_id: facultyId,
      title: courseData.title,
      description: courseData.description,
      type: courseData.type,
      cover_gradient: courseData.coverGradient,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (courseError || !course) {
    throw new Error(courseError?.message || "Failed to create course");
  }

  // Insert lessons
  const lessonsToInsert = courseData.lessons.map((lesson, idx) => ({
    course_id: course.id,
    title: lesson.title,
    type: lesson.type,
    content: lesson.content,
    duration: lesson.duration,
    order_index: idx,
  }));

  const { error: lessonsError } = await supabase
    .from("lessons")
    .insert(lessonsToInsert);

  if (lessonsError) {
    // Attempt to roll back course creation
    await supabase.from("courses").delete().eq("id", course.id);
    throw new Error(lessonsError.message);
  }

  revalidatePath("/", "layout");
  return { success: true, courseId: course.id };
}

export async function deleteCourseAction(courseId: string, facultyId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Validate user role
  const { data: access } = await supabase
    .from("user_faculties")
    .select("role")
    .eq("user_id", user.id)
    .eq("faculty_id", facultyId)
    .single();

  if (!access || access.role !== "ADMIN") {
    throw new Error("Unauthorized access level. Only administrators can manage courses.");
  }

  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", courseId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function toggleLessonProgressAction(lessonId: string, completed: boolean) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  if (completed) {
    const { error } = await supabase
      .from("user_lesson_progress")
      .insert({
        user_id: user.id,
        lesson_id: lessonId,
      });

    if (error && error.code !== "23505") { // Ignore duplicate key errors (code 23505)
      throw new Error(error.message);
    }
  } else {
    const { error } = await supabase
      .from("user_lesson_progress")
      .delete()
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId);

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath("/", "layout");
  return { success: true };
}
