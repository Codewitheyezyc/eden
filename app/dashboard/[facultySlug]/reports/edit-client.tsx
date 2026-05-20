"use client";

import { useState } from "react";
import { RichTextEditor } from "@/components/dashboard/reports/rich-text-editor";
import { saveReport } from "./actions";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EditReportClient({
  facultyId,
  facultySlug,
  report
}: {
  facultyId: string;
  facultySlug: string;
  report?: any;
}) {
  const [title, setTitle] = useState(report?.title || "");
  const [content, setContent] = useState(report?.content || "<p>Write your report here...</p>");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Please provide a title for the report.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const result = await saveReport(facultyId, facultySlug, title, content, report?.id);

    if (result.error) {
      setError(result.error);
      setIsSaving(false);
    } else {
      router.push(`/dashboard/${facultySlug}/reports`);
      router.refresh();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={`/dashboard/${facultySlug}/reports`}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {report ? "Edit Report" : "New Monthly Report"}
          </h1>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
          {isSaving ? "Saving..." : "Save Report"}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}

      <div className="space-y-4 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Report Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. October 2026 Activities Report"
            className="text-lg font-medium py-6 bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-gray-800 rounded-xl"
          />
        </div>
        
        <div className="space-y-2 pt-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Content</label>
          <RichTextEditor content={content} onChange={setContent} />
        </div>
      </div>
    </div>
  );
}
