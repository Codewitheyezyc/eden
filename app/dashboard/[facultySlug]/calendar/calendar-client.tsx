"use client";

import { useState, useMemo } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock, 
  Plus, 
  Info, 
  Check, 
  AlertCircle 
} from "lucide-react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  isToday,
  parseISO
} from "date-fns";
import { CreateEventModal } from "@/components/dashboard/create-event-modal";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  image_url: string | null;
  created_by: string | null;
  created_at: string | null;
}

interface CalendarClientProps {
  initialEvents: Event[];
  attendanceMap: Record<string, any>;
  role: string;
  userId: string;
  facultyId: string;
  facultySlug: string;
}

export function CalendarClient({
  initialEvents,
  attendanceMap,
  role,
  userId,
  facultyId,
  facultySlug,
}: CalendarClientProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const canManage = role === "ADMIN" || role === "COORDINATOR";

  // Helpers to get dates
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [startDate, endDate]);

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Get events on selected date
  const selectedDateEvents = useMemo(() => {
    return events.filter(event => isSameDay(parseISO(event.event_date), selectedDate));
  }, [events, selectedDate]);

  // Check if a day has any events
  const getDayEvents = (day: Date) => {
    return events.filter(event => isSameDay(parseISO(event.event_date), day));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Faculty Calendar</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-light leading-relaxed">
            Mark your attendance, coordinate schedules, and discover upcoming faculty workshops.
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setEditingEvent(null);
              setCreateModalOpen(true);
            }}
            className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-bold transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:scale-102 shrink-0 animate-in fade-in zoom-in duration-500"
          >
            <Plus size={18} className="mr-2" />
            Schedule Event
          </button>
        )}
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: The Interactive Calendar */}
        <div className="lg:col-span-2 bg-white/50 dark:bg-[#080808]/50 backdrop-blur-xl border border-gray-250/50 dark:border-white/5 rounded-3xl p-6 shadow-xl space-y-6">
          
          {/* Calendar Controller Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={goToday}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-bold text-gray-700 dark:text-gray-300 rounded-xl transition-all"
              >
                Today
              </button>
              <button
                onClick={prevMonth}
                className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl text-gray-600 dark:text-gray-400 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl text-gray-600 dark:text-gray-400 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Days of the week */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="py-2">{day}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isSel = isSameDay(day, selectedDate);
              const dayEvents = getDayEvents(day);
              const hasEvents = dayEvents.length > 0;
              const isTod = isToday(day);

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "min-h-[85px] p-3 rounded-2xl flex flex-col justify-between items-start transition-all relative border outline-none group text-left",
                    isCurrentMonth 
                      ? "bg-white/40 dark:bg-black/20 hover:bg-white dark:hover:bg-[#101010]" 
                      : "bg-gray-50/10 dark:bg-white/[0.01] opacity-35 hover:opacity-60",
                    isSel 
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.03]" 
                      : "border-gray-200/50 dark:border-white/5",
                    isTod && !isSel && "border-blue-500/50 dark:border-blue-500/40 bg-blue-500/[0.02]"
                  )}
                >
                  <span className={cn(
                    "text-xs font-bold px-1.5 py-0.5 rounded-md",
                    isTod 
                      ? "bg-blue-500 text-white" 
                      : isSel 
                      ? "text-emerald-700 dark:text-emerald-400 font-extrabold" 
                      : "text-gray-700 dark:text-gray-400"
                  )}>
                    {day.getDate()}
                  </span>

                  {/* Event indicators */}
                  {hasEvents && (
                    <div className="w-full space-y-1 mt-2">
                      {dayEvents.slice(0, 2).map((evt) => (
                        <div 
                          key={evt.id} 
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 truncate border border-emerald-500/20"
                        >
                          {evt.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[8px] text-gray-400 dark:text-gray-500 pl-1 font-semibold">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

        </div>

        {/* Right Side: Event Details Panel */}
        <div className="bg-white/50 dark:bg-[#080808]/50 backdrop-blur-xl border border-gray-250/50 dark:border-white/5 rounded-3xl p-6 shadow-xl flex flex-col justify-between min-h-[400px]">
          
          <div className="space-y-6">
            <div className="flex items-center space-x-2 pb-4 border-b border-gray-100 dark:border-white/5">
              <CalendarIcon className="text-emerald-600 dark:text-emerald-400 w-5 h-5" />
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight">
                {format(selectedDate, "MMMM d, yyyy")}
              </h3>
            </div>

            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {selectedDateEvents.length === 0 ? (
                <div className="py-12 text-center text-gray-400 dark:text-gray-500 font-light flex flex-col items-center">
                  <Info size={28} className="mb-3 text-gray-300 dark:text-gray-700" />
                  <p className="text-xs font-semibold uppercase tracking-wider">No events scheduled</p>
                  <p className="text-[11px] mt-1 max-w-[200px] leading-relaxed">
                    {canManage 
                      ? "Click 'Schedule Event' at the top to add a new event on this date." 
                      : "Check back later for any scheduled courses or activities."}
                  </p>
                </div>
              ) : (
                selectedDateEvents.map((evt) => {
                  const record = attendanceMap[evt.id];
                  const hasAttended = record?.status === "PRESENT";
                  
                  return (
                    <div 
                      key={evt.id} 
                      className="p-5 bg-white/80 dark:bg-[#0c0c0c]/80 border border-gray-200/50 dark:border-white/5 rounded-2xl space-y-4 hover:border-emerald-500/30 transition-all shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-extrabold text-gray-900 dark:text-white text-base leading-snug">{evt.title}</h4>
                          {evt.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-light mt-1.5 leading-relaxed leading-normal">{evt.description}</p>
                          )}
                        </div>
                        {canManage && (
                          <button
                            onClick={() => {
                              setEditingEvent(evt);
                              setCreateModalOpen(true);
                            }}
                            className="p-2 bg-gray-50 hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-500 rounded-xl transition-all shrink-0"
                            title="Edit Event"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                          </button>
                        )}
                      </div>

                      <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-white/5 text-[11px] text-gray-500 dark:text-gray-400">
                        {evt.location && (
                          <div className="flex items-center space-x-2">
                            <MapPin size={12} className="text-emerald-500" />
                            <span className="truncate">{evt.location}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Clock size={12} className="text-emerald-500" />
                          <span>{format(parseISO(evt.event_date), "h:mm a")}</span>
                        </div>
                      </div>

                      {/* Attendance Badge/Trigger */}
                      <div className="pt-2">
                        {hasAttended ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-md uppercase tracking-wider">
                            <Check size={10} />
                            Attended (Present)
                          </span>
                        ) : record?.status === "ABSENT" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-500/10 px-2.5 py-1 rounded-md uppercase tracking-wider">
                            <AlertCircle size={10} />
                            Absent
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded-md uppercase tracking-wider">
                            Pending Attendance Check
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {canManage && (
            <button
              onClick={() => {
                setEditingEvent(null);
                setCreateModalOpen(true);
              }}
              className="w-full mt-6 py-3 text-xs font-bold border border-emerald-500/25 hover:border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.05] rounded-xl transition-all"
            >
              Add Event to this day
            </button>
          )}

        </div>

      </div>

      {/* CREATE EVENT MODAL DIALOG */}
      <CreateEventModal
        facultyId={facultyId}
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setEditingEvent(null);
        }}
        editingEvent={editingEvent}
        onSuccess={() => {
          window.location.reload();
        }}
      />

    </div>
  );
}
