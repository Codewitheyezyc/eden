"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/services/supabase/client";
import { useRouter } from "next/navigation";

interface CreateEventModalProps {
  facultyId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingEvent?: {
    id: string;
    title: string;
    description: string | null;
    event_date: string;
    location: string | null;
  } | null;
}

export function CreateEventModal({ facultyId, isOpen, onClose, onSuccess, editingEvent }: CreateEventModalProps) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
  });

  useEffect(() => {
    if (editingEvent && isOpen) {
      try {
        const dt = new Date(editingEvent.event_date);
        const year = dt.getFullYear();
        const month = String(dt.getMonth() + 1).padStart(2, "0");
        const dateVal = String(dt.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${dateVal}`;
        
        const hours = String(dt.getHours()).padStart(2, "0");
        const minutes = String(dt.getMinutes()).padStart(2, "0");
        const timeStr = `${hours}:${minutes}`;

        setFormData({
          title: editingEvent.title,
          description: editingEvent.description || "",
          date: dateStr,
          time: timeStr,
          location: editingEvent.location || "",
        });
      } catch (err) {
        console.error(err);
      }
    } else if (isOpen) {
      setFormData({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
      });
    }
  }, [editingEvent, isOpen]);

  const createEventNotification = async (isUpdate: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch other faculty members
      const { data: members } = await supabase
        .from("user_faculties")
        .select("user_id")
        .eq("faculty_id", facultyId)
        .neq("user_id", user.id);

      // 2. Fetch faculty slug
      const { data: faculty } = await supabase
        .from("faculties")
        .select("slug")
        .eq("id", facultyId)
        .single();

      const facultySlug = faculty?.slug || "";

      if (members && members.length > 0) {
        const notificationsToInsert = members.map((m) => ({
          user_id: m.user_id,
          faculty_id: facultyId,
          title: isUpdate ? "Event Updated" : "New Event Scheduled",
          message: `${formData.title} - ${formData.location || "Online"} on ${new Date(`${formData.date}T${formData.time}`).toLocaleDateString()}`,
          link: `/dashboard/${facultySlug}/calendar`,
          is_read: false,
        }));

        await supabase.from("notifications").insert(notificationsToInsert);
      }
    } catch (err) {
      console.error("Failed to trigger event notification:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Combine date and time
      const eventDate = new Date(`${formData.date}T${formData.time}`).toISOString();

      if (editingEvent?.id) {
        const { error: updateError } = await supabase
          .from("events")
          .update({
            title: formData.title,
            description: formData.description,
            event_date: eventDate,
            location: formData.location,
          })
          .eq("id", editingEvent.id);

        if (updateError) throw updateError;
        
        await createEventNotification(true);
      } else {
        const { error: insertError } = await supabase.from("events").insert({
          faculty_id: facultyId,
          title: formData.title,
          description: formData.description,
          event_date: eventDate,
          location: formData.location,
          created_by: user.id
        });

        if (insertError) throw insertError;
        
        await createEventNotification(false);
      }

      onSuccess();
      router.refresh();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{editingEvent ? "Edit Event" : "Create New Event"}</h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/5 rounded-full transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-xl border border-red-200 dark:border-red-900">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Event Title</label>
              <input 
                type="text" 
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full bg-gray-50 dark:bg-[#030303] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-gray-900 dark:text-white"
                placeholder="e.g. Winter Showcase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <textarea 
                required
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full bg-gray-50 dark:bg-[#030303] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-gray-900 dark:text-white resize-none h-24"
                placeholder="Describe what the event is about..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                <input 
                  type="date" 
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#030303] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Time</label>
                <input 
                  type="time" 
                  required
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#030303] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
              <input 
                type="text" 
                required
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full bg-gray-50 dark:bg-[#030303] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-gray-900 dark:text-white"
                placeholder="e.g. Main Auditorium"
              />
            </div>

            <div className="pt-4 flex justify-end space-x-3">
              <button 
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-xl font-bold transition-colors shadow-sm shadow-emerald-600/20 disabled:opacity-50 flex items-center"
              >
                {loading ? "Saving..." : (editingEvent ? "Save Changes" : "Publish Event")}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>,
    document.body
  );
}
