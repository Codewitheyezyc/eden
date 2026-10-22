"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/services/supabase/client";
import { CreateEventModal } from "./create-event-modal";
import { toggleEventAttendanceAction } from "@/app/dashboard/[facultySlug]/events/actions";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string;
    event_date: string;
    location: string;
    image_url: string | null;
  };
  userId: string;
  attendanceRecord: any | null;
  viewerRole?: string;
  facultySlug?: string;
  facultyId?: string;
}

export function EventCard({
  event,
  userId,
  attendanceRecord,
  viewerRole = "STUDENT",
  facultySlug,
  facultyId,
}: EventCardProps) {
  const supabase = createClient();
  const router = useRouter();

  const [isPresent, setIsPresent] = useState(!!attendanceRecord);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Synchronize state when attendanceRecord prop updates (e.g. from router.refresh or tab switch)
  useEffect(() => {
    setIsPresent(!!attendanceRecord);
  }, [attendanceRecord]);

  // Format date nicely
  const dateObj = new Date(event.event_date);
  const day = dateObj.toLocaleDateString("en-US", { day: "numeric" });
  const month = dateObj.toLocaleDateString("en-US", { month: "short" });
  const time = dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const handleToggleAttendance = async () => {
    if (loading) return;
    setLoading(true);

    // Timeout safety fallback: guarantee spinner resets within 15 seconds even on unstable mobile network
    const timeoutPromise = new Promise<{ error: string }>((resolve) =>
      setTimeout(
        () => resolve({ error: "Network request timed out. Please check your connection and try again." }),
        15000
      )
    );

    try {
      const nextPresent = !isPresent;
      const res = await Promise.race([
        toggleEventAttendanceAction(event.id, nextPresent, facultySlug),
        timeoutPromise,
      ]);

      if ("error" in res && res.error) {
        console.error("Failed to toggle RSVP:", res.error);
        alert(res.error);
        return;
      }

      setIsPresent(nextPresent);
      router.refresh();
    } catch (error: any) {
      console.error("Failed to toggle RSVP:", error);
      alert(error?.message || "An unexpected error occurred while updating attendance.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", event.id);

      if (error) {
        console.error("Failed to delete event:", error);
        alert("Failed to delete event: " + error.message);
        setIsDeleting(false);
        return;
      }

      setIsDeleted(true);
      setShowDeleteModal(false);
      router.refresh();
    } catch (err: any) {
      console.error("Failed to delete event:", err);
      alert("An error occurred while deleting the event.");
      setIsDeleting(false);
    }
  };

  if (isDeleted) return null;

  return (
    <>
      <div className="group relative bg-white dark:bg-[#0a0a0a] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-emerald-900/10 dark:hover:shadow-emerald-900/20 transition-all duration-300 hover:-translate-y-1 border border-gray-200 dark:border-white/10 flex flex-col h-full">
        {/* Date Badge */}
        <div className="absolute top-4 right-4 z-10 bg-white/90 dark:bg-black/80 backdrop-blur-md rounded-2xl p-2 px-3 text-center shadow-lg border border-white/20">
          <p className="text-emerald-600 dark:text-emerald-400 font-bold text-xl leading-none">{day}</p>
          <p className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">{month}</p>
        </div>

        {/* Admin Actions: Edit & Delete buttons */}
        {viewerRole === "ADMIN" && (
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-white/90 dark:bg-black/80 backdrop-blur-md rounded-2xl p-1.5 shadow-lg border border-white/20">
            {facultyId && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditModalOpen(true);
                }}
                title="Edit Event"
                className="p-1.5 rounded-xl hover:bg-emerald-500/10 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteModal(true);
              }}
              title="Delete Event"
              className="p-1.5 rounded-xl hover:bg-rose-500/10 text-gray-500 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </div>
        )}

        {/* Image Area */}
        <div className="h-48 bg-gray-100 dark:bg-gray-900 relative overflow-hidden shrink-0">
          {event.image_url ? (
            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-300 dark:text-emerald-800"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
          )}
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        {/* Content Area */}
        <div className="p-6 flex flex-col flex-1">
          <div className="flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-3 tracking-widest uppercase">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {time}
          </div>

          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{event.title}</h3>

          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span className="truncate">{event.location || "Location TBD"}</span>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-6 flex-1">
            {event.description || "No description provided."}
          </p>

          {/* Action Area */}
          <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              {isPresent ? (
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <span className="ml-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">Registered</span>
                </div>
              ) : (
                <span className="text-sm font-medium text-gray-400 dark:text-gray-500">Not Registered</span>
              )}

              <button
                onClick={handleToggleAttendance}
                disabled={loading}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
                  isPresent
                    ? "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 hover:scale-[1.02]"
                } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {loading && (
                  <svg className="animate-spin h-3.5 w-3.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                )}
                {isPresent ? "Cancel RSVP" : "I Will Attend"}
              </button>
            </div>

            {(viewerRole === "ADMIN" || viewerRole === "COORDINATOR") && facultySlug && (
              <a
                href={`/dashboard/${facultySlug}/events/${event.id}/attendance`}
                className="w-full text-center py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-xl transition-all border border-emerald-500/15"
              >
                View Attendance Tracker &rarr;
              </a>
            )}

            {viewerRole === "ADMIN" && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="w-full text-center py-1.5 bg-rose-500/5 hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[11px] font-bold rounded-xl transition-all border border-rose-500/10 flex items-center justify-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                Delete Event
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !isDeleting && setShowDeleteModal(false)}
          />
          <div className="relative bg-white dark:bg-[#0c0c0e] border border-gray-200 dark:border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">Delete Event?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-gray-900 dark:text-white">"{event.title}"</strong>?
              </p>
              <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40">
                ⚠️ All RSVP registrations and attendance records for this event will be permanently deleted.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-3 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  "Delete Event"
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Event Modal */}
      {facultyId && isEditModalOpen && (
        <CreateEventModal
          facultyId={facultyId}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            setIsEditModalOpen(false);
            router.refresh();
          }}
          editingEvent={{
            id: event.id,
            title: event.title,
            description: event.description,
            event_date: event.event_date,
            location: event.location,
          }}
        />
      )}
    </>
  );
}
