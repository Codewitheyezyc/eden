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
}

export function EventCard({ event, userId, attendanceRecord }: EventCardProps) {
  const supabase = createClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPresent, setIsPresent] = useState(!!attendanceRecord);
  const [proofImage, setProofImage] = useState<string | null>(attendanceRecord?.proof_image_url || null);
  const [uploading, setUploading] = useState(false);

  // Format date nicely
  const dateObj = new Date(event.event_date);
  const day = dateObj.toLocaleDateString('en-US', { day: 'numeric' });
  const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
  const time = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Handle fake upload for now (until buckets are confirmed)
  const handleToggleAttendance = async () => {
    if (isPresent) {
      // Unmark attendance
      setIsPresent(false);
      setProofImage(null);
      await supabase.from("event_attendance").delete().match({ event_id: event.id, user_id: userId });
    } else {
      setIsModalOpen(true);
    }
  };

  const handleSimulateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    try {
      // For now, we simulate upload and just mark present since buckets might not be initialized yet
      // In production, upload to supabase storage here:
      // const { data } = await supabase.storage.from('event_proofs').upload(`${userId}/${event.id}.jpg`, file);
      
      setTimeout(async () => {
        const fakeUrl = URL.createObjectURL(file);
        
        await supabase.from("event_attendance").upsert({
          event_id: event.id,
          user_id: userId,
          status: 'PRESENT',
          proof_image_url: fakeUrl // Would be real publicURL in prod
        });

        setProofImage(fakeUrl);
        setIsPresent(true);
        setIsModalOpen(false);
        setUploading(false);
      }, 1000);
      
    } catch (error) {
      console.error(error);
      setUploading(false);
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
          <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
            {isPresent ? (
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full border-2 border-emerald-500 overflow-hidden shrink-0">
                  {proofImage ? (
                    <img src={proofImage} alt="Proof" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-emerald-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  )}
                </div>
                <span className="ml-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">Present</span>
              </div>
            ) : (
              <span className="text-sm font-medium text-gray-400 dark:text-gray-500">Not Attended</span>
            )}

            <button 
              onClick={handleToggleAttendance}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                isPresent 
                ? "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700" 
                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20"
              }`}
            >
              {isPresent ? "Cancel" : "Mark Present"}
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Modal (Glassmorphism) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Upload Selfie</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Take a picture of yourself at the event to mark yourself as present!</p>
              
              <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="user"
                  onChange={handleSimulateUpload}
                  disabled={uploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`w-full py-12 rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center ${uploading ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-gray-300 dark:border-gray-700 group-hover:border-emerald-500 group-hover:bg-emerald-50/50 dark:group-hover:bg-emerald-900/10'}`}>
                  {uploading ? (
                    <>
                      <svg className="animate-spin h-8 w-8 text-emerald-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium text-sm">Uploading Proof...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mb-2 group-hover:text-emerald-500"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      <span className="text-gray-600 dark:text-gray-300 font-medium">Tap to open Camera</span>
                    </>
                  )}
                </div>
              </div>

              <button 
                onClick={() => setIsModalOpen(false)}
                className="mt-6 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
