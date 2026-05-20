import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Calendar } from "lucide-react";
import { format } from "date-fns";
import { DownloadButton } from "@/components/dashboard/reports/download-button";
import { DeleteReportButton } from "@/components/dashboard/reports/delete-button";

export default async function ViewReportPage({ params }: { params: { facultySlug: string, reportId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: faculty } = await supabase
    .from("faculties")
    .select("id")
    .eq("slug", params.facultySlug)
    .single();

  if (!faculty) redirect("/dashboard");

  const { data: roleData } = await supabase
    .from("user_faculties")
    .select("role")
    .eq("user_id", user.id)
    .eq("faculty_id", faculty.id)
    .single();

  const canManage = roleData?.role === "ADMIN" || roleData?.role === "COORDINATOR";

  // Fetch report
  const { data: report } = await supabase
    .from("reports")
    .select(`
      *,
      author:users!reports_author_id_fkey(id, full_name, avatar_url)
    `)
    .eq("id", params.reportId)
    .eq("faculty_id", faculty.id)
    .single();

  if (!report) redirect(`/dashboard/${params.facultySlug}/reports`);

  // Fetch author's role in this faculty
  let authorRole = "Unknown";
  if (report.author?.id) {
    const { data: authorRoleData } = await supabase
      .from("user_faculties")
      .select("role")
      .eq("user_id", report.author.id)
      .eq("faculty_id", faculty.id)
      .single();
    
    if (authorRoleData?.role) {
      authorRole = authorRoleData.role.charAt(0).toUpperCase() + authorRoleData.role.slice(1).toLowerCase();
    }
  }

  const formattedDate = format(new Date(report.created_at), "MMMM d, yyyy");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/dashboard/${params.facultySlug}/reports`}
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Reports
        </Link>
        <div className="flex items-center space-x-3">
          <DownloadButton
            title={report.title}
            content={report.content || ""}
            authorName={report.author?.full_name || "Unknown"}
            authorRole={authorRole}
            date={formattedDate}
          />
          {canManage && (
            <>
              <Link
                href={`/dashboard/${params.facultySlug}/reports/${params.reportId}/edit`}
                className="inline-flex items-center justify-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                <Edit size={16} className="mr-2" />
                Edit Report
              </Link>
              <DeleteReportButton reportId={report.id} facultyId={faculty.id} facultySlug={params.facultySlug} />
            </>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-3xl p-8 md:p-12 shadow-sm">
        <header className="mb-10 text-center border-b border-gray-100 dark:border-gray-900 pb-10">
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 uppercase tracking-widest border border-gray-200 dark:border-gray-700">
              {authorRole} Report
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            {report.title}
          </h1>
          <div className="flex items-center justify-center space-x-6 text-gray-500 dark:text-gray-400 text-sm">
            <div className="flex items-center">
              {report.author?.avatar_url ? (
                <img src={report.author.avatar_url} alt="" className="w-6 h-6 rounded-full mr-2" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold mr-2">
                  {report.author?.full_name?.charAt(0) || "U"}
                </div>
              )}
              <span>{report.author?.full_name || "Unknown"}</span>
            </div>
            <div className="flex items-center">
              <Calendar size={16} className="mr-2" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </header>

        <div 
          className="prose dark:prose-invert prose-emerald max-w-none prose-img:rounded-xl prose-img:shadow-md"
          dangerouslySetInnerHTML={{ __html: report.content || "" }}
        />
      </div>
    </div>
  );
}
