"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Plus, X, Megaphone, Trash2, Calendar, Clock, AlertTriangle, MessageSquare, Send, Globe, Users, MapPin } from "lucide-react";
import { createAnnouncement, deleteAnnouncement, updateAnnouncement } from "./actions";
import { format, formatDistanceToNow, isAfter } from "date-fns";
import { cn } from "@/lib/utils";
import { CAMPUSES } from "@/lib/campuses";

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  expires_at: string | null;
  target_campuses: string | null;
  target_roles: string | null;
  sender: {
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
}

interface AnnouncementsClientProps {
  initialAnnouncements: Announcement[];
  facultyId: string;
  facultySlug: string;
  role: string;
}

export function AnnouncementsClient({ initialAnnouncements, facultyId, facultySlug, role }: AnnouncementsClientProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);

  useEffect(() => {
    setAnnouncements(initialAnnouncements);
  }, [initialAnnouncements]);

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [setExpiration, setSetExpiration] = useState(false);
  const [expirationDate, setExpirationDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Targeting States
  const [targetAudience, setTargetAudience] = useState<"EVERYONE" | "COORDINATORS">("EVERYONE");
  const [campusTargetingType, setCampusTargetingType] = useState<"ALL" | "SPECIFIC">("ALL");
  const [selectedTargetCampuses, setSelectedTargetCampuses] = useState<string[]>([]);
  const [targetDropdownOpen, setTargetDropdownOpen] = useState(false);

  const canManage = role === "ADMIN";

  const startEdit = (msg: Announcement) => {
    setEditingAnnouncement(msg);
    setTitle(msg.title);
    setContent(msg.content);
    setSetExpiration(!!msg.expires_at);
    setExpirationDate(msg.expires_at ? format(new Date(msg.expires_at), "yyyy-MM-dd'T'HH:mm") : "");
    
    // De-serialize target audience
    const isCoordinators = msg.target_roles?.includes("COORDINATOR") && !msg.target_roles?.includes("STUDENT");
    setTargetAudience(isCoordinators ? "COORDINATORS" : "EVERYONE");
    
    if (msg.target_campuses) {
      try {
        const camps = JSON.parse(msg.target_campuses);
        setCampusTargetingType("SPECIFIC");
        setSelectedTargetCampuses(camps);
      } catch {
        setCampusTargetingType("ALL");
        setSelectedTargetCampuses([]);
      }
    } else {
      setCampusTargetingType("ALL");
      setSelectedTargetCampuses([]);
    }
    
    setSelectedAnnouncement(null); // Close the detail view
    setIsNewOpen(true); // Open form modal
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const expiresAt = setExpiration && expirationDate ? new Date(expirationDate).toISOString() : null;
      
      const roles: string[] = [];
      if (targetAudience === "EVERYONE") {
        roles.push("STUDENT", "COORDINATOR");
      } else {
        roles.push("COORDINATOR");
      }

      const campuses = (targetAudience === "COORDINATORS" && campusTargetingType === "SPECIFIC")
        ? selectedTargetCampuses
        : null;

      if (editingAnnouncement) {
        await updateAnnouncement(
          editingAnnouncement.id,
          title,
          content,
          expiresAt,
          campuses && campuses.length > 0 ? campuses : null,
          roles
        );
      } else {
        await createAnnouncement(
          facultyId, 
          title, 
          content, 
          expiresAt, 
          campuses && campuses.length > 0 ? campuses : null,
          roles
        );
      }
      
      // Clear form and close modal
      setTitle("");
      setContent("");
      setSetExpiration(false);
      setExpirationDate("");
      setTargetAudience("EVERYONE");
      setCampusTargetingType("ALL");
      setSelectedTargetCampuses([]);
      setEditingAnnouncement(null);
      setIsNewOpen(false);

      // Reload page
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to save announcement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    try {
      await deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((m) => m.id !== id));
      if (selectedAnnouncement?.id === id) {
        setSelectedAnnouncement(null);
      }
      toast.success("Announcement deleted successfully!");
    } catch (err) {
      toast.error("Failed to delete announcement");
    }
  };

  const activeAnnouncements = announcements.filter((m) => {
    if (!m.expires_at) return true;
    return isAfter(new Date(m.expires_at), new Date());
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4 relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Announcements</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-light leading-relaxed">
            Stay informed with the latest updates, event notices, and announcements.
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setEditingAnnouncement(null);
              setTitle("");
              setContent("");
              setSetExpiration(false);
              setExpirationDate("");
              setTargetAudience("EVERYONE");
              setCampusTargetingType("ALL");
              setSelectedTargetCampuses([]);
              setIsNewOpen(true);
            }}
            className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-bold transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:scale-102 shrink-0 animate-in fade-in zoom-in duration-500"
          >
            <Plus size={18} className="mr-2" />
            Post Announcement
          </button>
        )}
      </div>

      {/* Grid of Announcements */}
      {activeAnnouncements.length === 0 ? (
        <div className="bg-white/40 dark:bg-[#080808]/40 backdrop-blur-3xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-16 text-center shadow-xl">
          <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-gray-400">
            <Megaphone size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No announcements</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto font-light text-sm">
            Everything is quiet right now. Check back later for notifications.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeAnnouncements.map((msg) => {
            const previewText = msg.content.length > 150 ? msg.content.substring(0, 150) + "..." : msg.content;
            
            // Format audience description
            let audienceText = "Everyone";
            if (msg.target_roles?.includes("COORDINATOR") && !msg.target_roles?.includes("STUDENT")) {
              if (msg.target_campuses) {
                try {
                  const camps = JSON.parse(msg.target_campuses);
                  audienceText = `Coordinators (${camps.join(", ")})`;
                } catch {
                  audienceText = `Coordinators (${msg.target_campuses})`;
                }
              } else {
                audienceText = "Coordinators (All)";
              }
            }

            return (
              <div
                key={msg.id}
                onClick={() => setSelectedAnnouncement(msg)}
                className="group relative cursor-pointer flex flex-col justify-between p-6 bg-white/50 dark:bg-[#080808]/50 backdrop-blur-md border border-gray-200/50 dark:border-white/5 rounded-3xl hover:bg-white dark:hover:bg-[#0c0c0c] hover:border-emerald-500/30 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 h-full overflow-hidden"
              >
                {/* Visual Glow Ornament */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 pointer-events-none" />
                
                <div>
                  {/* Top Line with Badges */}
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <span className={cn(
                      "inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                      audienceText === "Everyone"
                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/10"
                        : "text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/10"
                    )}>
                      {audienceText === "Everyone" ? <Globe size={9} /> : <Users size={9} />}
                      {audienceText}
                    </span>

                    {msg.expires_at && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        <Clock size={10} />
                        Expires {format(new Date(msg.expires_at), "MMM d")}
                      </span>
                    )}
                  </div>

                  {/* Title & Preview */}
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {msg.title}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-light leading-relaxed mb-6 break-words">
                    {previewText}
                  </p>
                </div>

                {/* Footer Sender Info */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-150 dark:border-white/5 mt-auto">
                  <div className="flex items-center space-x-3 shrink-0">
                    {msg.sender?.avatar_url ? (
                      <img src={msg.sender.avatar_url} alt="" className="w-8 h-8 rounded-full border border-gray-200 dark:border-white/10" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center text-xs font-bold shadow-inner">
                        {msg.sender?.full_name?.charAt(0) || "U"}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        {msg.sender?.full_name || "Faculty Member"}
                      </p>
                      <p className="text-[10px] text-gray-400 font-light">
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(msg);
                        }}
                        className="p-2 bg-transparent hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-500 rounded-xl transition-all"
                        title="Edit Announcement"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, msg.id)}
                        className="p-2 bg-transparent hover:bg-rose-500/10 text-gray-400 hover:text-rose-500 rounded-xl transition-all"
                        title="Delete Announcement"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* NEW ANNOUNCEMENT MODAL */}
      {isNewOpen && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-white dark:bg-[#090909] border border-gray-200 dark:border-white/5 rounded-[2.5rem] shadow-2xl p-8 relative overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            {/* Top Glows */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Megaphone size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">{editingAnnouncement ? "Edit Announcement" : "Post Announcement"}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Broadcaster Portal</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsNewOpen(false);
                  setEditingAnnouncement(null);
                }}
                className="p-2 bg-gray-50 dark:bg-white/5 hover:bg-gray-150 dark:hover:bg-white/10 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-6">
              {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-semibold flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Announcement Title</label>
                <input
                  type="text"
                  placeholder="e.g. Urgent: Course rescheduling this Saturday"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium transition-all text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Detailed Message</label>
                <textarea
                  placeholder="Type your announcement content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-light min-h-[120px] transition-all leading-relaxed text-gray-900 dark:text-white"
                  required
                />
              </div>

              {/* TARGETING SECTION */}
              <div className="bg-gray-50/50 dark:bg-white/5 p-5 rounded-3xl border border-gray-200/50 dark:border-white/5 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Target Audience</label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value as any)}
                    className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/5 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <option value="EVERYONE">Everyone (Students & Coordinators)</option>
                    <option value="COORDINATORS">Coordinators Only</option>
                  </select>
                </div>

                {targetAudience === "COORDINATORS" && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Campus Scope</label>
                      <select
                        value={campusTargetingType}
                        onChange={(e) => setCampusTargetingType(e.target.value as any)}
                        className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/5 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <option value="ALL">All Coordinators</option>
                        <option value="SPECIFIC">Specific Campuses</option>
                      </select>
                    </div>

                    {campusTargetingType === "SPECIFIC" && (
                      <div className="space-y-2 relative">
                        <label className="text-[10px] text-gray-400 block font-semibold">Select Target Campuses</label>
                        <div 
                          onClick={() => setTargetDropdownOpen(!targetDropdownOpen)}
                          className="w-full min-h-[40px] bg-white dark:bg-black border border-gray-200 dark:border-white/5 rounded-xl px-3 py-1.5 text-xs flex flex-wrap gap-1.5 items-center cursor-pointer select-none"
                        >
                          {selectedTargetCampuses.length === 0 ? (
                            <span className="text-gray-400 font-light">Select Campuses...</span>
                          ) : (
                            selectedTargetCampuses.map((c) => (
                              <span 
                                key={c}
                                className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold px-2 py-0.5 rounded-md"
                              >
                                {c}
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTargetCampuses(selectedTargetCampuses.filter(item => item !== c));
                                  }}
                                  className="hover:text-rose-500 transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                              </span>
                            ))
                          )}
                        </div>

                        {targetDropdownOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setTargetDropdownOpen(false)}
                            />
                            <div className="absolute z-20 w-full mt-1 bg-white dark:bg-[#0c0c0c] border border-gray-200 dark:border-white/5 rounded-2xl shadow-xl max-h-40 overflow-y-auto p-2 flex flex-col gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
                              {CAMPUSES.map((c) => {
                                const isSelected = selectedTargetCampuses.includes(c);
                                return (
                                  <div 
                                    key={c}
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedTargetCampuses(selectedTargetCampuses.filter(item => item !== c));
                                      } else {
                                        setSelectedTargetCampuses([...selectedTargetCampuses, c]);
                                      }
                                    }}
                                    className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] cursor-pointer select-none transition-all
                                      ${isSelected 
                                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold" 
                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                                      }
                                    `}
                                  >
                                    <span>{c}</span>
                                    {isSelected && (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-600 dark:text-emerald-400"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Expiration date */}
              <div className="bg-gray-50/50 dark:bg-white/5 p-4 rounded-2xl border border-gray-200/50 dark:border-white/5 space-y-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={setExpiration}
                    onChange={(e) => setSetExpiration(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 border-gray-300 focus:ring-emerald-500 focus:ring-offset-0 bg-transparent"
                  />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Set Expiration Date</span>
                </label>

                {setExpiration && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <p className="text-[10px] text-gray-400 leading-normal mb-1">
                      After this date, the announcement will be automatically hidden from all feeds.
                    </p>
                    <input
                      type="datetime-local"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                      className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/5 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs text-gray-700 dark:text-gray-300"
                      required={setExpiration}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewOpen(false);
                    setEditingAnnouncement(null);
                  }}
                  className="flex-1 py-4 text-sm font-bold bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 inline-flex items-center justify-center py-4 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Clock size={16} className="animate-spin mr-2" />
                      {editingAnnouncement ? "Saving Changes..." : "Publishing..."}
                    </>
                  ) : (
                    <>
                      <Send size={16} className="mr-2" />
                      {editingAnnouncement ? "Save Changes" : "Publish"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL ANNOUNCEMENT VIEW MODAL */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-white dark:bg-[#090909] border border-gray-200 dark:border-white/5 rounded-[2.5rem] shadow-2xl p-8 md:p-12 relative overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            {/* Corner Decorative Lights */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

            <button
              onClick={() => setSelectedAnnouncement(null)}
              className="absolute right-6 top-6 p-2 bg-gray-50 dark:bg-white/5 hover:bg-gray-150 dark:hover:bg-white/10 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            {/* Header sender info */}
            <div className="flex items-center space-x-3 mb-6">
              {selectedAnnouncement.sender?.avatar_url ? (
                <img src={selectedAnnouncement.sender.avatar_url} alt="" className="w-10 h-10 rounded-full border border-gray-200 dark:border-white/10" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center text-sm font-bold shadow-inner">
                  {selectedAnnouncement.sender?.full_name?.charAt(0) || "U"}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {selectedAnnouncement.sender?.full_name || "Faculty Member"}
                </p>
                <div className="flex items-center space-x-2 text-[11px] text-gray-400 font-light">
                  <span>{format(new Date(selectedAnnouncement.created_at), "MMMM d, yyyy h:mm a")}</span>
                  <span>&bull;</span>
                  <span>{formatDistanceToNow(new Date(selectedAnnouncement.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">
              {selectedAnnouncement.title}
            </h2>

            {/* Expiration warning badge */}
            {selectedAnnouncement.expires_at && (
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/10 px-3 py-1 rounded-full uppercase tracking-wider mb-6">
                <Clock size={12} />
                Notice Expires on {format(new Date(selectedAnnouncement.expires_at), "MMMM d, yyyy 'at' h:mm a")}
              </div>
            )}

            {/* Body scrollable content */}
            <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-relaxed font-light text-base space-y-4 break-words whitespace-pre-line border-t border-gray-100 dark:border-white/5 pt-6">
              {selectedAnnouncement.content}
            </div>

            {/* Footer */}
            <div className="mt-12 flex justify-between items-center border-t border-gray-100 dark:border-white/5 pt-6">
              <div className="flex items-center text-xs text-gray-400 space-x-1.5">
                <MessageSquare size={14} />
                <span>Broadcasting to targeted members</span>
              </div>
              <div className="flex items-center space-x-2">
                {canManage && (
                  <button
                    onClick={() => startEdit(selectedAnnouncement)}
                    className="py-3 px-6 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="py-3 px-6 text-xs font-bold bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl hover:opacity-90 transition-opacity"
                >
                  Done Reading
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
