import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Search, FileText, Calendar } from "lucide-react";
import { format } from "date-fns";

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: { facultySlug: string };
  searchParams: { q?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get faculty ID and user role
  const { data: facultyData } = await supabase
    .from("faculties")
    .select("id, name")
    .eq("slug", params.facultySlug)
    .single();

  if (!facultyData) redirect("/dashboard");

  const { data: roleData } = await supabase
    .from("user_faculties")
    .select("role")
    .eq("user_id", user.id)
    .eq("faculty_id", facultyData.id)
    .single();

  const canManage = roleData?.role === "ADMIN" || roleData?.role === "COORDINATOR";
  const query = searchParams.q || "";

  // Fetch reports
  let reportsQuery = supabase
    .from("reports")
    .select(`
      id, title, created_at, updated_at,
      author:users!reports_author_id_fkey(full_name, avatar_url)
    `)
    .eq("faculty_id", facultyData.id)
    .order("created_at", { ascending: false });

  if (query) {
    reportsQuery = reportsQuery.ilike("title", `%${query}%`);
  }

  const { data: reports } = await reportsQuery;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Monthly Reports</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            View and manage activity reports for {facultyData.name}.
          </p>
        </div>
        {canManage && (
          <Link
            href={`/dashboard/${params.facultySlug}/reports/new`}
            className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-emerald-500/20"
          >
            <Plus size={18} className="mr-2" />
            New Report
          </Link>
        )}
      </div>

      <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
        <form className="relative max-w-md mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search reports by title..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
          />
        </form>

        {!reports || reports.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <FileText size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No reports found</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
              {query ? `No reports matching "${query}".` : "There are no reports submitted yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report: any) => (
              <Link
                key={report.id}
                href={`/dashboard/${params.facultySlug}/reports/${report.id}`}
                className="group flex flex-col justify-between p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#111]/50 hover:bg-white dark:hover:bg-[#1a1a1a] hover:border-emerald-500/30 hover:shadow-lg transition-all duration-300 h-full"
              >
                <div>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3 space-x-2">
                    <Calendar size={14} />
                    <span>{format(new Date(report.created_at), "MMM d, yyyy")}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                    {report.title}
                  </h3>
                </div>
                <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex items-center space-x-2">
                    {report.author?.avatar_url ? (
                      <img src={report.author.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                        {report.author?.full_name?.charAt(0) || "U"}
                      </div>
                    )}
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium truncate max-w-[100px]">
                      {report.author?.full_name || "Unknown"}
                    </span>
                  </div>
                  {canManage && (
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      Edit Report
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
