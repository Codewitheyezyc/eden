"use client";

import { useState } from "react";
import { createClient } from "@/services/supabase/client";

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
}

export function EventCard({ event, userId, attendanceRecord, viewerRole = "STUDENT", facultySlug }: EventCardProps) {
  const supabase = createClient();
  const [isPresent, setIsPresent] = useState(!!attendanceRecord);
  const [loading, setLoading] = useState(false);

  // Format date nicely
  const dateObj = new Date(event.event_date);
  const day = dateObj.toLocaleDateString('en-US', { day: 'numeric' });
  const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
  const time = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const handleToggleAttendance = async () => {
    if (loading) return;
    setLoading(true);

    try {
      if (isPresent) {
        // Unmark attendance / Cancel RSVP
        await supabase
          .from("event_attendance")
          .delete()
          .match({ event_id: event.id, user_id: userId });
        setIsPresent(false);
      } else {
        // RSVP / Register to Attend
        await supabase
          .from("event_attendance")
          .upsert({
            event_id: event.id,
            user_id: userId,
            status: 'PRESENT',
            proof_image_url: null
          });
        setIsPresent(true);
      }
    } catch (error) {
      console.error("Failed to toggle RSVP:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="group relative bg-white dark:bg-[#0a0a0a] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-emerald-900/10 dark:hover:shadow-emerald-900/20 transition-all duration-300 hover:-translate-y-1 border border-gray-200 dark:border-white/10 flex flex-col h-full">
        
        {/* Date Badge */}
        <div className="absolute top-4 right-4 z-10 bg-white/90 dark:bg-black/80 backdrop-blur-md rounded-2xl p-2 px-3 text-center shadow-lg border border-white/20">
          <p className="text-emerald-600 dark:text-emerald-400 font-bold text-xl leading-none">{day}</p>
          <p className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">{month}</p>
        </div>

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
          <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/5 flex flex-col gap-3">
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
          </div>
        </div>
      </div>
    </>
  );
}
