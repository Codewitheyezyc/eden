import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";
import { CoursesClient } from "./courses-client";

export default async function CoursesPage({
  params,
}: {
  params: { facultySlug: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get Faculty by slug
  const { data: faculty } = await supabase
    .from("faculties")
    .select("id, slug")
    .eq("slug", params.facultySlug)
    .single();

  if (!faculty) redirect("/dashboard");

  // Fetch access & role
  const { data: facultyAccess } = await supabase
    .from("user_faculties")
    .select("role")
    .eq("user_id", user.id)
    .eq("faculty_id", faculty.id)
    .single();

  if (!facultyAccess) redirect("/dashboard");

  const role = facultyAccess.role || "STUDENT";

  // Fetch courses with their lessons
  const { data: coursesData } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      description,
      type,
      cover_gradient,
      lessons (
        id,
        title,
        type,
        content,
        duration,
        order_index
      )
    `)
    .eq("faculty_id", faculty.id)
    .order("created_at", { ascending: true });

  // Map to Course types and sort lessons programmatically by order_index
  const courses = (coursesData || []).map((course: any) => {
    const sortedLessons = [...(course.lessons || [])].sort(
      (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
    );
    return {
      id: course.id,
      title: course.title,
      description: course.description || "",
      type: course.type as "text" | "video",
      coverGradient: course.cover_gradient,
      lessons: sortedLessons.map((l: any) => ({
        id: l.id,
        title: l.title,
        type: l.type as "text" | "video",
        content: l.content,
        duration: l.duration,
      })),
    };
  });

  // Fetch user's completion progress
  const { data: progressData } = await supabase
    .from("user_lesson_progress")
    .select("lesson_id")
    .eq("user_id", user.id);

  const completedLessonIds = (progressData || []).map((p: any) => p.lesson_id);

  // Group completed lesson IDs by course ID to construct the exact progress map
  const progressMap: { [key: string]: string[] } = {};
  courses.forEach((course) => {
    progressMap[course.id] = course.lessons
      .filter((lesson) => completedLessonIds.includes(lesson.id))
      .map((lesson) => lesson.id);
  });

  return (
    <CoursesClient
      role={role}
      facultySlug={params.facultySlug}
      facultyId={faculty.id}
      initialCourses={courses}
      initialProgress={progressMap}
    />
  );
}
