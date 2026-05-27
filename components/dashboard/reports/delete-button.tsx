"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Trash2 } from "lucide-react";
import { deleteReport } from "@/app/dashboard/[facultySlug]/reports/actions";
import { useRouter } from "next/navigation";

export function DeleteReportButton({ reportId, facultyId, facultySlug }: { reportId: string, facultyId: string, facultySlug: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this report? This action cannot be undone.")) return;

    setIsDeleting(true);
    const result = await deleteReport(reportId, facultyId, facultySlug);
    
    if (result.error) {
      toast.error("Failed to delete report: " + result.error);
      setIsDeleting(false);
    } else {
      toast.success("Report deleted successfully!");
      router.push(`/dashboard/${facultySlug}/reports`);
      router.refresh();
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="inline-flex items-center justify-center bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-rose-200 dark:border-rose-500/20 disabled:opacity-50"
    >
      <Trash2 size={16} className="mr-2" />
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
}
