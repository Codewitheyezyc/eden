"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Plus, X, Megaphone, Trash2, Calendar, Clock, AlertTriangle, MessageSquare, Send } from "lucide-react";
import { createMessage, deleteMessage } from "./actions";
import { format, formatDistanceToNow, isAfter } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CAMPUSES } from "@/lib/campuses";

interface Message {
  id: string;
  title: string;
  content: string;
  created_at: string;
  expires_at: string | null;
  sender: {
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
}

interface MessagesClientProps {
  initialMessages: Message[];
  facultyId: string;
  facultySlug: string;
  role: string;
}

export function MessagesClient({ initialMessages, facultyId, facultySlug, role }: MessagesClientProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [setExpiration, setSetExpiration] = useState(false);
  const [expirationDate, setExpirationDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedTargetCampuses, setSelectedTargetCampuses] = useState<string[]>([]);
  const [targetDropdownOpen, setTargetDropdownOpen] = useState(false);
  const [targetStudent, setTargetStudent] = useState(true);
  const [targetCoordinator, setTargetCoordinator] = useState(true);

  const canManage = role === "ADMIN" || role === "COORDINATOR";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const expiresAt = setExpiration && expirationDate ? new Date(expirationDate).toISOString() : null;
      
      const roles: string[] = [];
      if (targetStudent) roles.push("STUDENT");
      if (targetCoordinator) roles.push("COORDINATOR");
      const finalRoles = roles.length > 0 ? roles : ["STUDENT", "COORDINATOR"];

      await createMessage(
        facultyId, 
        title, 
        content, 
        expiresAt, 
        selectedTargetCampuses.length > 0 ? selectedTargetCampuses : null,
        finalRoles
      );
      
      // Clear form and close modal
      setTitle("");
      setContent("");
      setSetExpiration(false);
      setExpirationDate("");
      setSelectedTargetCampuses([]);
      setTargetStudent(true);
      setTargetCoordinator(true);
      setIsNewOpen(false);

      // Reload page
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to post message");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    try {
      await deleteMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
      toast.success("Announcement deleted successfully!");
    } catch (err) {
      toast.error("Failed to delete announcement");
    }
  };

  // Filter out any messages that are expired (just in case)
  const activeMessages = messages.filter((m) => {
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
            Stay informed with the latest updates and announcements from faculty administrators.
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setIsNewOpen(true)}
            className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-bold transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:scale-102 shrink-0"
          >
            <Plus size={18} className="mr-2" />
            Post Announcement
          </button>
        )}
      </div>

      {/* Messages Grid */}
      {activeMessages.length === 0 ? (
        <div className="bg-white/40 dark:bg-[#080808]/40 backdrop-blur-3xl border border-gray-250/50 dark:border-white/5 rounded-3xl p-16 text-center shadow-xl">
          <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-gray-400">
            <Megaphone size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No active announcements</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto font-light text-sm">
            Everything is quiet right now. Check back later for faculty notifications.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeMessages.map((msg) => {
            const previewText = msg.content.length > 150 ? msg.content.substring(0, 150) + "..." : msg.content;
            return (
              <div
                key={msg.id}
                onClick={() => setSelectedMessage(msg)}
                className="group relative cursor-pointer flex flex-col justify-between p-6 bg-white/50 dark:bg-[#080808]/50 backdrop-blur-md border border-gray-200/50 dark:border-white/5 rounded-3xl hover:bg-white dark:hover:bg-[#0c0c0c] hover:border-emerald-500/30 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 h-full overflow-hidden"
              >
                {/* Visual Glow Ornament */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />
                
                <div>
                  {/* Top line with badges */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/10">
                        <Megaphone size={14} className="group-hover:rotate-12 transition-transform" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Notice
                      </span>
                    </div>

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
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shadow-inner">
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
                    <button
                      onClick={(e) => handleDelete(e, msg.id)}
                      className="p-2 bg-transparent hover:bg-rose-500/10 text-gray-400 hover:text-rose-500 rounded-xl transition-all"
                      title="Delete Announcement"
                    >
                      <Trash2 size={14} />
                    </button>
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
          <div className="w-full max-w-lg bg-white dark:bg-[#090909] border border-gray-250 dark:border-white/5 rounded-[2.5rem] shadow-2xl p-8 relative overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            {/* Top Glows */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Megaphone size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Post Announcement</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Broadcaster Portal</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewOpen(false)}
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
                  className="w-full bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Detailed Message</label>
                <textarea
                  placeholder="Type your announcement content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-light min-h-[150px] transition-all leading-relaxed"
                  required
                />
              </div>

              {/* Audience Targeting Configuration */}
              <div className="bg-gray-50/50 dark:bg-white/5 p-5 rounded-3xl border border-gray-200/50 dark:border-white/5 space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Audience Targeting</label>
                
                {/* Target Roles Checkboxes */}
                <div className="space-y-2">
                  <p className="text-[10px] text-gray-400">Target announcements to specific roles:</p>
                  <div className="flex gap-4">
                    <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={targetStudent}
                        onChange={(e) => setTargetStudent(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-emerald-600 border-gray-300 focus:ring-emerald-500 bg-transparent"
                      />
                      <span>Students</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={targetCoordinator}
                        onChange={(e) => setTargetCoordinator(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-emerald-600 border-gray-300 focus:ring-emerald-500 bg-transparent"
                      />
                      <span>Coordinators</span>
                    </label>
                  </div>
                </div>

                {/* Target Campuses Multi-Select Dropdown */}
                <div className="space-y-2 relative">
                  <p className="text-[10px] text-gray-400">Target specific campuses (leave empty to broadcast to all):</p>
                  
                  <div 
                    onClick={() => setTargetDropdownOpen(!targetDropdownOpen)}
                    className="w-full min-h-[40px] bg-white dark:bg-[#0c0c0c] border border-gray-250 dark:border-white/5 rounded-xl px-3 py-1.5 text-xs flex flex-wrap gap-1.5 items-center cursor-pointer select-none"
                  >
                    {selectedTargetCampuses.length === 0 ? (
                      <span className="text-gray-400 font-light">All Campuses / Zones</span>
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
                      <div className="absolute z-20 w-full mt-1 bg-white dark:bg-[#0c0c0c] border border-gray-205 dark:border-white/5 rounded-2xl shadow-xl max-h-40 overflow-y-auto p-2 flex flex-col gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
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
                  onClick={() => setIsNewOpen(false)}
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
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send size={16} className="mr-2" />
                      Publish
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL ANNOUNCEMENT VIEW MODAL */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-white dark:bg-[#090909] border border-gray-250 dark:border-white/5 rounded-[2.5rem] shadow-2xl p-8 md:p-12 relative overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            {/* Corner Decorative Lights */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

            <button
              onClick={() => setSelectedMessage(null)}
              className="absolute right-6 top-6 p-2 bg-gray-50 dark:bg-white/5 hover:bg-gray-150 dark:hover:bg-white/10 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            {/* Header sender info */}
            <div className="flex items-center space-x-3 mb-6">
              {selectedMessage.sender?.avatar_url ? (
                <img src={selectedMessage.sender.avatar_url} alt="" className="w-10 h-10 rounded-full border border-gray-200 dark:border-white/10" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold shadow-inner">
                  {selectedMessage.sender?.full_name?.charAt(0) || "U"}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {selectedMessage.sender?.full_name || "Faculty Member"}
                </p>
                <div className="flex items-center space-x-2 text-[11px] text-gray-400 font-light">
                  <span>{format(new Date(selectedMessage.created_at), "MMMM d, yyyy h:mm a")}</span>
                  <span>&bull;</span>
                  <span>{formatDistanceToNow(new Date(selectedMessage.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">
              {selectedMessage.title}
            </h2>

            {/* Expiration warning badge */}
            {selectedMessage.expires_at && (
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/10 px-3 py-1 rounded-full uppercase tracking-wider mb-6">
                <Clock size={12} />
                Notice Expires on {format(new Date(selectedMessage.expires_at), "MMMM d, yyyy 'at' h:mm a")}
              </div>
            )}

            {/* Body scrollable content */}
            <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-relaxed font-light text-base space-y-4 break-words whitespace-pre-line border-t border-gray-100 dark:border-white/5 pt-6">
              {selectedMessage.content}
            </div>

            {/* Footer */}
            <div className="mt-12 flex justify-between items-center border-t border-gray-100 dark:border-white/5 pt-6">
              <div className="flex items-center text-xs text-gray-400 space-x-1.5">
                <MessageSquare size={14} />
                <span>Broadcasting to all members</span>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="py-3 px-6 text-xs font-bold bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl hover:opacity-90 transition-opacity"
              >
                Done Reading
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
