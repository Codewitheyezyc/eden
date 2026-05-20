"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/services/supabase/client";
import { Bell, Check, Trash2, Calendar, FileText, Megaphone, Info } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export function NotificationsDropdown({ facultySlug }: { facultySlug: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);

  // Play custom synthesized notification sound using the Web Audio API
  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      
      // Check if browser has suspended the context
      if (ctx.state === "suspended") {
        // Drop sound if not interacted yet to prevent console errors
        return;
      }

      // Master Gain for precise, non-intrusive volume
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.06, ctx.currentTime); // Sleek, quiet
      masterGain.connect(ctx.destination);

      // Primary crisp oscillator
      const osc1 = ctx.createOscillator();
      osc1.type = "sine";
      // Pristine chime tone (E6 to G6 quick slide)
      osc1.frequency.setValueAtTime(1318.51, ctx.currentTime); // E6
      osc1.frequency.exponentialRampToValueAtTime(1567.98, ctx.currentTime + 0.08); // G6
      osc1.connect(masterGain);

      // Warm secondary oscillator for depth
      const osc2 = ctx.createOscillator();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc2.connect(masterGain);

      // Rapid linear decay envelope for modern "pop-in" click feel
      masterGain.gain.setValueAtTime(0.06, ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.35);
      osc2.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("AudioContext block or error:", e);
    }
  };

  useEffect(() => {
    // Get logged-in user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchNotifications(user.id);
      }
    };
    getUser();

    // Close on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen to realtime notifications table
  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel(`notifications-realtime-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newNotif = payload.new as Notification;
            setNotifications((prev) => [newNotif, ...prev]);
            playNotificationSound();
          } else if (payload.eventType === "UPDATE") {
            const updatedNotif = payload.new as Notification;
            setNotifications((prev) =>
              prev.map((n) => (n.id === updatedNotif.id ? updatedNotif : n))
            );
          } else if (payload.eventType === "DELETE") {
            const deletedNotif = payload.old as { id: string };
            setNotifications((prev) => prev.filter((n) => n.id !== deletedNotif.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchNotifications = async (uid: string) => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setNotifications(data);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (!error) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getNotificationIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("event")) return <Calendar className="w-4 h-4 text-rose-500" />;
    if (t.includes("announcement") || t.includes("message")) return <Megaphone className="w-4 h-4 text-emerald-500" />;
    if (t.includes("report")) return <FileText className="w-4 h-4 text-blue-500" />;
    return <Info className="w-4 h-4 text-amber-500" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-300 rounded-full hover:bg-gray-150 dark:hover:bg-white/5 border border-transparent",
          isOpen && "bg-gray-150 dark:bg-white/5 border-gray-250 dark:border-white/10"
        )}
      >
        <Bell className="w-[18px] h-[18px] transition-transform duration-300 hover:scale-105" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold px-1 animate-in zoom-in duration-300">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/80 dark:bg-[#080808]/80 backdrop-blur-2xl border border-gray-200/50 dark:border-white/5 rounded-3xl shadow-2xl z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2 duration-300">
          
          {/* Header */}
          <div className="p-4 border-b border-gray-250/30 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-gray-900 dark:text-white text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {unreadCount} New
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline flex items-center space-x-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List Area */}
          <div className="max-h-[350px] overflow-y-auto divide-y divide-gray-200/50 dark:divide-white/5">
            {notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-3 animate-pulse" />
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">All caught up!</p>
                <p className="text-xs text-gray-400">No new notifications at this time.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif.id)}
                  className={cn(
                    "p-4 hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors cursor-pointer flex gap-3 relative group",
                    !notif.is_read && "bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01]"
                  )}
                >
                  {/* Read/Unread dot indicator */}
                  {!notif.is_read && (
                    <span className="absolute top-4 left-2 w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                  )}

                  {/* Icon */}
                  <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                    {getNotificationIcon(notif.title)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1 mb-0.5">
                      <p className={cn("text-xs font-bold text-gray-900 dark:text-white truncate", !notif.is_read && "font-extrabold")}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">
                        {format(new Date(notif.created_at), "MMM d, h:mm a")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal line-clamp-2 pr-4 font-light">
                      {notif.message}
                    </p>
                    
                    {/* Action link if available */}
                    {notif.link && (
                      <a
                        href={notif.link}
                        className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-2 block hover:underline"
                      >
                        View details &rarr;
                      </a>
                    )}
                  </div>

                  {/* Delete button displayed on hover */}
                  <button
                    onClick={(e) => handleDeleteNotification(e, notif.id)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-lg shrink-0"
                    title="Delete Notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
          
          {/* Footer view all */}
          <div className="p-3 bg-gray-50/50 dark:bg-white/[0.01] border-t border-gray-250/30 dark:border-white/5 text-center">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Eden Notifications
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
