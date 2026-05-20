"use client";

import { useState, useEffect, useRef } from "react";
import { 
  BookOpen, Video, Plus, CheckCircle, Play, ArrowLeft, 
  Award, Trophy, Clock, FileText, ChevronRight, Sparkles, 
  Volume2, Trash2, Book, Monitor, Send, HelpCircle 
} from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";

interface Lesson {
  id: string;
  title: string;
  type: "text" | "video";
  content: string; // The text content or the video URL
  duration: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  type: "text" | "video";
  coverGradient: string;
  lessons: Lesson[];
}

interface CoursesClientProps {
  role: string;
  facultySlug: string;
}

// Curated beautiful pre-populated courses
const initialCourses: Course[] = [
  {
    id: "course-1",
    title: "Effective Leadership in Ministry",
    description: "Master the fundamental pillars of servant leadership, administrative excellence, and ministerial growth.",
    type: "text",
    coverGradient: "from-emerald-500/80 to-teal-800/80",
    lessons: [
      {
        id: "c1-l1",
        title: "Foundational Principles of Ministerial Leadership",
        type: "text",
        duration: "10 mins read",
        content: `### 1. The Call to Servant Leadership
Leadership in ministry is fundamentally distinct from secular corporate governance. While secular management prioritizes organizational hierarchy and operational efficiency, ministerial leadership is rooted in **servant leadership**—where greatness is defined by service.

> "But he that is greatest among you shall be your servant." 

#### Core Pillars of Servant Leadership:
* **Humility:** Placing the growth, well-being, and spiritual success of your flock above personal status or authority.
* **Empathy:** Listening actively to the struggles, suggestions, and feedback of coordinators and students alike.
* **Integrity:** Maintaining the highest moral, spiritual, and financial standards in private and public office.

---

### 2. Vision Casting and Alignment
Every successful ministry starts with a clear, God-given vision. However, a vision only becomes powerful when it is shared and aligned across all tiers of the organization.

1. **Clarity:** State the mission of your faculty in simple, actionable terms. Avoid ambiguity.
2. **Communication:** Regularly preach the vision. Use announcements, events, and reports to reinforce the core target.
3. **Delegation:** Break the vision down into smaller team targets. Empower coordinators to manage specific operations.

---

### 3. Spiritual Discipline of a Leader
You cannot pour from an empty cup. Your public leadership is only as strong as your private devotional life. Leaders must cultivate:
* **Consistent Word Study:** Daily immersion in scripture to ensure teachings are doctrinally sound.
* **Prayer Life:** Engaging in deep, personal communion to maintain spiritual sensitivity and vision clarity.
* **Mentorship:** Actively submitting to spiritual oversight to remain accountable.`,
      },
      {
        id: "c1-l2",
        title: "Servant Leadership and Team Mentorship",
        type: "text",
        duration: "15 mins read",
        content: `### 1. Raising High-Performance Coordinators
A leader's legacy is not measured by how many followers they gather, but by how many leaders they raise. To build an enduring faculty, you must transform your coordinators from operational supervisors into spiritual mentors.

#### The Mentorship Funnel:
1. **I Do, You Watch:** Model excellent execution of ministry events, report analysis, and pastoral care.
2. **I Do, You Help:** Involve coordinators in co-hosting events and planning curriculum.
3. **You Do, I Help:** Delegate full event management to coordinators while offering subtle, encouraging guidance.
4. **You Do, I Watch:** Fully empower coordinators to lead, step back, and act as a resource only when needed.

---

### 2. Building a Culture of Trust
Trust is the fuel of voluntary organizations. In a student ministry, peer-to-peer relationships dictate operational speed.
* **Transparency:** Share administrative constraints openly. If a budget is tight or an event is delayed, explain why.
* **Zero Gossip Policy:** Cultivate a culture where feedback is given directly, constructively, and privately.
* **Celebration:** Publicly praise coordinators for their hard work. A simple "Thank you" card or shoutout in the Messages board increases engagement tenfold.`,
      },
    ],
  },
  {
    id: "course-2",
    title: "Advanced Digital Evangelism",
    description: "Leverage cutting-edge social channels, content strategy, and digital storytelling to reach Gen-Z.",
    type: "video",
    coverGradient: "from-indigo-500/80 to-purple-800/80",
    lessons: [
      {
        id: "c2-l1",
        title: "Introduction to Social Media Outreach",
        type: "video",
        duration: "4 mins",
        content: "https://www.w3schools.com/html/mov_bbb.mp4",
      },
      {
        id: "c2-l2",
        title: "Content Strategy & Digital Storytelling",
        type: "video",
        duration: "3 mins",
        content: "https://www.w3schools.com/html/movie.mp4",
      },
    ],
  },
];

export function CoursesClient({ role, facultySlug }: CoursesClientProps) {
  const isAdmin = role === "ADMIN";
  
  // State for Courses
  const [courses, setCourses] = useState<Course[]>([]);
  
  // Load courses from LocalStorage or fallback to pre-populated
  useEffect(() => {
    const saved = localStorage.getItem(`eden_courses_${facultySlug}`);
    if (saved) {
      try {
        setCourses(JSON.parse(saved));
      } catch (e) {
        setCourses(initialCourses);
      }
    } else {
      setCourses(initialCourses);
    }
  }, [facultySlug]);

  const saveCoursesList = (updated: Course[]) => {
    setCourses(updated);
    localStorage.setItem(`eden_courses_${facultySlug}`, JSON.stringify(updated));
  };

  // State for Course Progress (Tracks completed lessons map: { [courseId]: string[] })
  const [progress, setProgress] = useState<{ [key: string]: string[] }>({});
  
  useEffect(() => {
    const savedProgress = localStorage.getItem(`eden_course_progress_${facultySlug}`);
    if (savedProgress) {
      try {
        setProgress(JSON.parse(savedProgress));
      } catch (e) {}
    }
  }, [facultySlug]);

  const saveProgress = (courseId: string, completedLessonIds: string[]) => {
    const updated = { ...progress, [courseId]: completedLessonIds };
    setProgress(updated);
    localStorage.setItem(`eden_course_progress_${facultySlug}`, JSON.stringify(updated));
  };

  // State for Admin Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState<"text" | "video">("text");
  
  // Custom lessons inside new course creator
  const [newLessons, setNewLessons] = useState<{ title: string; content: string; duration: string }[]>([
    { title: "Lesson 1: Getting Started", content: "", duration: "5 mins" }
  ]);

  // Immersive Learning Player State
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [showCongrats, setShowCongrats] = useState(false);

  // Video Ref
  const videoRef = useRef<HTMLVideoElement>(null);

  const addLessonField = () => {
    setNewLessons([...newLessons, { title: `Lesson ${newLessons.length + 1}: `, content: "", duration: newType === "text" ? "10 mins read" : "5 mins" }]);
  };

  const updateLessonField = (index: number, field: string, value: string) => {
    const updated = [...newLessons];
    updated[index] = { ...updated[index], [field]: value };
    setNewLessons(updated);
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    // Pick random neon gradient
    const gradients = [
      "from-emerald-500/80 to-teal-800/80",
      "from-indigo-500/80 to-purple-800/80",
      "from-rose-500/80 to-pink-800/80",
      "from-amber-500/80 to-orange-850/80",
      "from-cyan-500/80 to-blue-800/80"
    ];
    const randGradient = gradients[Math.floor(Math.random() * gradients.length)];

    const created: Course = {
      id: `course-${Date.now()}`,
      title: newTitle,
      description: newDesc,
      type: newType,
      coverGradient: randGradient,
      lessons: newLessons.map((l, i) => ({
        id: `l-${Date.now()}-${i}`,
        title: l.title || `Lesson ${i + 1}`,
        type: newType,
        content: l.content || (newType === "text" ? "Lesson text coming soon..." : "https://www.w3schools.com/html/mov_bbb.mp4"),
        duration: l.duration || (newType === "text" ? "10 mins read" : "5 mins"),
      }))
    };

    const updatedList = [created, ...courses];
    saveCoursesList(updatedList);

    // Reset Form
    setNewTitle("");
    setNewDesc("");
    setNewType("text");
    setNewLessons([{ title: "Lesson 1: Getting Started", content: "", duration: "5 mins" }]);
    setShowAddModal(false);
  };

  const handleDeleteCourse = (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this course permanently?")) return;
    const filtered = courses.filter(c => c.id !== courseId);
    saveCoursesList(filtered);
  };

  const completeLesson = (courseId: string, lessonId: string) => {
    const currentCompleted = progress[courseId] || [];
    if (currentCompleted.includes(lessonId)) return;

    const updated = [...currentCompleted, lessonId];
    saveProgress(courseId, updated);

    // Check if entire course is completed!
    const course = courses.find(c => c.id === courseId);
    if (course && updated.length === course.lessons.length) {
      triggerConfetti();
      setShowCongrats(true);
    }
  };

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#10b981", "#3b82f6", "#f59e0b"]
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#10b981", "#3b82f6", "#f59e0b"]
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  // Video finished playing trigger
  const handleVideoEnded = () => {
    if (!activeCourse) return;
    const lesson = activeCourse.lessons[activeLessonIndex];
    completeLesson(activeCourse.id, lesson.id);
  };

  // Calculate percentage progress of course
  const getCourseProgressPercentage = (courseId: string, lessonsCount: number) => {
    if (lessonsCount === 0) return 0;
    const completed = progress[courseId] || [];
    return Math.round((completed.length / lessonsCount) * 100);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4 relative">
      
      {/* 1. IMMERSIVE LEARNING PLAYER VIEW (LMS CANVAS INLINE VIEW) */}
      {activeCourse ? (
        <div className="w-full bg-white/40 dark:bg-[#07070a]/40 backdrop-blur-3xl border border-gray-200/50 dark:border-white/5 rounded-3xl flex flex-col md:flex-row overflow-hidden shadow-2xl animate-in fade-in duration-300 min-h-[70vh]">
          
          {/* Immersive Left Sidebar: Lessons List */}
          <div className="w-full md:w-80 bg-gray-50/50 dark:bg-[#0d0d11]/50 border-b md:border-b-0 md:border-r border-gray-200/50 dark:border-white/5 flex flex-col shrink-0">
            {/* Header / Back button */}
            <div className="p-6 border-b border-gray-200/50 dark:border-white/5 flex items-center justify-between">
              <button 
                onClick={() => setActiveCourse(null)}
                className="flex items-center space-x-2 text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-xs font-bold uppercase tracking-wider"
              >
                <ArrowLeft size={16} />
                <span>Exit Course</span>
              </button>
              
              <Award className="text-emerald-500 w-5 h-5 animate-pulse" />
            </div>

            <div className="p-6">
              <h2 className="text-gray-900 dark:text-white font-extrabold text-base line-clamp-2 tracking-tight">{activeCourse.title}</h2>
              <div className="mt-2 w-full bg-gray-200 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500" 
                  style={{ width: `${getCourseProgressPercentage(activeCourse.id, activeCourse.lessons.length)}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-1.5">
                {getCourseProgressPercentage(activeCourse.id, activeCourse.lessons.length)}% Completed
              </p>
            </div>

            {/* List of lessons */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[350px] md:max-h-[600px]">
              {activeCourse.lessons.map((lesson, idx) => {
                const isActive = idx === activeLessonIndex;
                const isCompleted = (progress[activeCourse.id] || []).includes(lesson.id);

                return (
                  <button
                    key={lesson.id}
                    onClick={() => {
                      setActiveLessonIndex(idx);
                      setShowCongrats(false);
                    }}
                    className={`w-full flex items-start space-x-3 p-4 rounded-2xl text-left transition-all duration-300 ${
                      isActive 
                        ? "bg-emerald-50 dark:bg-emerald-500/10 border border-gray-200 dark:border-emerald-500/20 text-gray-900 dark:text-white" 
                        : "bg-white/10 dark:bg-white/[0.02] border border-gray-100 dark:border-transparent text-gray-500 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="mt-0.5">
                      {isCompleted ? (
                        <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                      ) : lesson.type === "video" ? (
                        <Play size={16} className={isActive ? "text-emerald-500" : "text-gray-400 dark:text-gray-500"} />
                      ) : (
                        <FileText size={16} className={isActive ? "text-emerald-500" : "text-gray-400 dark:text-gray-500"} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate ${isActive ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                        {lesson.title}
                      </p>
                      <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mt-0.5">
                        {lesson.duration}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Immersive Right Panel: Main Content Viewer */}
          <div className="flex-1 flex flex-col bg-transparent overflow-hidden relative">
            
            <div className="flex-1 overflow-y-auto py-12 px-6 md:px-12 w-full">
              <div className="max-w-3xl mx-auto space-y-8">
                
                {/* Active Lesson details */}
                <div className="border-b border-gray-200/50 dark:border-white/5 pb-6">
                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-widest inline-block mb-3">
                    Lesson {activeLessonIndex + 1} of {activeCourse.lessons.length}
                  </span>
                  <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
                    {activeCourse.lessons[activeLessonIndex].title}
                  </h1>
                </div>

                {/* VIDEO PLAYER VIEW */}
                {activeCourse.lessons[activeLessonIndex].type === "video" ? (
                  <div className="space-y-6">
                    <div className="relative rounded-3xl overflow-hidden bg-black aspect-video border border-gray-200/50 dark:border-white/5 shadow-2xl">
                      <video
                        ref={videoRef}
                        src={activeCourse.lessons[activeLessonIndex].content}
                        controls
                        onEnded={handleVideoEnded}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    
                    {/* Advanced Controls Utility Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5 p-4 rounded-2xl">
                      <div className="flex items-center space-x-3">
                        {/* Rewind 10s */}
                        <button
                          onClick={() => {
                            if (videoRef.current) {
                              videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
                            }
                          }}
                          className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-transparent hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition flex items-center gap-1.5 text-xs font-bold shadow-sm"
                          title="Rewind 10 seconds"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                          <span>-10s</span>
                        </button>

                        {/* Forward 10s */}
                        <button
                          onClick={() => {
                            if (videoRef.current) {
                              videoRef.current.currentTime = Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + 10);
                            }
                          }}
                          className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-transparent hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition flex items-center gap-1.5 text-xs font-bold shadow-sm"
                          title="Forward 10 seconds"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                          <span>+10s</span>
                        </button>

                        {/* Speed controller */}
                        <div className="flex items-center space-x-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-transparent px-2.5 py-1.5 rounded-xl shadow-sm">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Speed:</span>
                          <select
                            onChange={(e) => {
                              if (videoRef.current) {
                                videoRef.current.playbackRate = parseFloat(e.target.value);
                              }
                            }}
                            defaultValue="1.0"
                            className="bg-transparent text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none cursor-pointer pr-1"
                          >
                            <option value="0.5" className="bg-white dark:bg-[#0d0d12] text-gray-900 dark:text-white">0.5x</option>
                            <option value="1.0" className="bg-white dark:bg-[#0d0d12] text-gray-900 dark:text-white">1.0x (Normal)</option>
                            <option value="1.5" className="bg-white dark:bg-[#0d0d12] text-gray-900 dark:text-white">1.5x</option>
                            <option value="2.0" className="bg-white dark:bg-[#0d0d12] text-gray-900 dark:text-white">2.0x</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest hidden sm:inline">Auto-complete on end</span>
                        <Button
                          onClick={() => completeLesson(activeCourse.id, activeCourse.lessons[activeLessonIndex].id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition"
                        >
                          Mark as Completed
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* TEXT READER VIEW */
                  <div className="space-y-8">
                    <div className="p-8 md:p-12 bg-white/50 dark:bg-white/[0.02] backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl text-gray-800 dark:text-gray-300 space-y-6 shadow-xl leading-relaxed text-sm md:text-base font-light max-w-none">
                      {/* Render basic markdown/content text nicely */}
                      {activeCourse.lessons[activeLessonIndex].content.split("\n\n").map((para, i) => {
                        if (para.startsWith("###")) {
                          return <h3 key={i} className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mt-8 mb-3 tracking-tight">{para.replace("### ", "")}</h3>;
                        }
                        if (para.startsWith(">")) {
                          return (
                            <blockquote key={i} className="border-l-4 border-emerald-500 pl-4 py-2 italic text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 rounded-r-2xl my-6 font-normal">
                              {para.replace("> ", "")}
                            </blockquote>
                          );
                        }
                        if (para.startsWith("*") || para.startsWith("-")) {
                          return (
                            <ul key={i} className="list-disc list-inside space-y-2 pl-2">
                              {para.split("\n").map((li, idx) => (
                                <li key={idx} className="text-gray-750 dark:text-gray-300">
                                  {li.replace("* ", "").replace("- ", "")}
                                </li>
                              ))}
                            </ul>
                          );
                        }
                        if (para.startsWith("1.") || para.startsWith("2.")) {
                          return (
                            <ol key={i} className="list-decimal list-inside space-y-2 pl-2">
                              {para.split("\n").map((li, idx) => (
                                <li key={idx} className="text-gray-750 dark:text-gray-300">
                                  {li.replace(/^\d+\.\s*/, "")}
                                </li>
                              ))}
                            </ol>
                          );
                        }
                        return <p key={i} className="whitespace-pre-line">{para}</p>;
                      })}
                    </div>
                    
                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={() => completeLesson(activeCourse.id, activeCourse.lessons[activeLessonIndex].id)}
                        className="px-8 py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/10 flex items-center gap-2 animate-pulse"
                      >
                        <CheckCircle size={16} />
                        <span>Complete Lesson</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Navigation controls below */}
                <div className="mt-12 pt-6 border-t border-gray-200/50 dark:border-white/5 flex justify-between">
                  <button
                    disabled={activeLessonIndex === 0}
                    onClick={() => {
                      setActiveLessonIndex(activeLessonIndex - 1);
                      setShowCongrats(false);
                    }}
                    className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
                  >
                    &larr; Prev Lesson
                  </button>
                  
                  <button
                    disabled={activeLessonIndex === activeCourse.lessons.length - 1}
                    onClick={() => {
                      setActiveLessonIndex(activeLessonIndex + 1);
                      setShowCongrats(false);
                    }}
                    className="px-4 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest hover:text-emerald-700 dark:hover:text-emerald-400 disabled:opacity-30 disabled:pointer-events-none transition flex items-center"
                  >
                    <span>Next Lesson</span>
                    <ChevronRight size={14} className="ml-1" />
                  </button>
                </div>

              </div>
            </div>

          </div>

          {/* Immersive Celebratory Congratulations Modal Drawer */}
          {showCongrats && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
              <div className="relative max-w-md w-full bg-white dark:bg-[#0d0d12] border border-gray-200 dark:border-emerald-500/20 p-8 rounded-[2.5rem] shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center rounded-full mx-auto shadow-inner">
                  <Trophy size={40} className="animate-bounce" />
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase block mb-1">Course Complete</span>
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Congratulations!</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-light leading-relaxed">
                    You have successfully completed **"{activeCourse.title}"**! You've unlocked the badge for this course and expanded your ministerial capacities.
                  </p>
                </div>

                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Sparkles size={16} className="text-emerald-500 shrink-0" />
                  <span>Your achievements have been updated in your profile. Keep learning!</span>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    onClick={() => {
                      setShowCongrats(false);
                      setActiveCourse(null);
                    }}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition"
                  >
                    Return to Directory
                  </Button>
                </div>
              </div>
            </div>
          )}

        </div>
      ) : (
        
        /* 2. GENERAL LMS DIRECTORY SCREEN */
        <>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">LMS & Academy Courses</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 font-light leading-relaxed">
                Empower your ministerial development with curated video masterclasses and theological textbooks.
              </p>
            </div>

            {isAdmin && (
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-2xl shadow-xl shadow-emerald-500/10 flex items-center gap-2 shrink-0 transition"
              >
                <Plus size={16} />
                <span>Create Course</span>
              </Button>
            )}
          </div>

          {/* Courses Listing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => {
              const completedLessons = progress[course.id] || [];
              const progressPercentage = getCourseProgressPercentage(course.id, course.lessons.length);
              
              return (
                <div
                  key={course.id}
                  onClick={() => {
                    setActiveCourse(course);
                    setActiveLessonIndex(0);
                    setShowCongrats(false);
                  }}
                  className="group bg-white/40 dark:bg-[#080808]/40 backdrop-blur-2xl border border-gray-200/50 dark:border-white/5 rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl hover:border-emerald-500/30 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Course Banner Grid */}
                    <div className={`h-36 bg-gradient-to-br ${course.coverGradient} relative overflow-hidden flex items-center justify-center p-6 text-center`}>
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:16px_16px]" />
                      <h3 className="text-white text-lg font-black tracking-tight leading-snug drop-shadow-md">{course.title}</h3>
                      
                      {/* Trash action button for Admin */}
                      {isAdmin && (
                        <button
                          onClick={(e) => handleDeleteCourse(course.id, e)}
                          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-black/20 hover:bg-rose-600 text-white transition-colors"
                          title="Delete Course"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}

                      {/* Course badge */}
                      <span className="absolute bottom-4 left-4 px-2 py-0.5 bg-black/30 backdrop-blur-md text-[8px] font-bold tracking-widest text-white uppercase rounded-md flex items-center gap-1 border border-white/10">
                        {course.type === "video" ? (
                          <>
                            <Monitor size={8} />
                            <span>Video</span>
                          </>
                        ) : (
                          <>
                            <Book size={8} />
                            <span>Textbook</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Course Details */}
                    <div className="p-6 space-y-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-light leading-relaxed line-clamp-3">
                        {course.description}
                      </p>

                      <div className="flex items-center space-x-4 text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-1">
                          <BookOpen size={12} />
                          {course.lessons.length} Lessons
                        </span>
                        <span>•</span>
                        <span>
                          {course.type === "video" ? "Masterclass Series" : "Textbook Lecture"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bottom Bar */}
                  <div className="px-6 pb-6 pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <div className="w-full bg-gray-100 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full transition-all" 
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                      <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1 block">
                        {progressPercentage}% Complete
                      </span>
                    </div>
                    
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                      {progressPercentage === 100 ? "Review →" : "Learn →"}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Empty Fallback */}
          {courses.length === 0 && (
            <div className="text-center py-20 bg-white/40 dark:bg-[#080808]/40 backdrop-blur-md rounded-3xl border border-dashed border-gray-300 dark:border-gray-800">
              <BookOpen className="text-gray-350 dark:text-gray-600 w-16 h-16 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No academy courses available yet.</p>
              {isAdmin && <p className="text-xs text-gray-400 font-light mt-1">Create one using the button in the top right!</p>}
            </div>
          )}

          {/* 3. ADMINISTRATOR NEW COURSE CREATOR MODAL */}
          {showAddModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/45 backdrop-blur-md animate-in fade-in duration-300">
              <div className="relative max-w-2xl w-full bg-white dark:bg-[#0c0c10] border border-gray-200/50 dark:border-white/10 p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300 max-h-[85vh] overflow-y-auto">
                
                <h2 className="text-2xl font-extrabold text-gray-950 dark:text-white tracking-tight flex items-center gap-2">
                  <Plus className="text-emerald-500" /> Create Course Curriculum
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-light mt-1">
                  Design a dynamic learning module. Add individual text textbook chapters or stable video link feeds.
                </p>

                <form onSubmit={handleCreateCourse} className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Course Title</label>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="e.g. Theological Hermeneutics"
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-semibold text-gray-950 dark:text-white placeholder-gray-400 dark:placeholder-gray-650"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Course Type</label>
                      <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as any)}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-semibold text-gray-950 dark:text-white"
                      >
                        <option value="text" className="bg-white dark:bg-[#111] text-gray-950 dark:text-white">Textbook Based Course</option>
                        <option value="video" className="bg-white dark:bg-[#111] text-gray-950 dark:text-white">Video Lecture Series</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Short Description</label>
                    <textarea
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Brief summary of syllabus objectives..."
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-light text-gray-950 dark:text-white placeholder-gray-400 dark:placeholder-gray-650 min-h-[80px]"
                      required
                    />
                  </div>

                  {/* Dynamic Lessons Section */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Course Lessons</label>
                      <button
                        type="button"
                        onClick={addLessonField}
                        className="text-xs text-emerald-500 hover:text-emerald-400 font-bold flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Lesson
                      </button>
                    </div>

                    <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
                      {newLessons.map((lesson, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl space-y-3 relative">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Lesson {idx + 1}</span>
                            {newLessons.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setNewLessons(newLessons.filter((_, i) => i !== idx))}
                                className="text-[10px] text-rose-500 font-bold hover:underline"
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <input
                              type="text"
                              value={lesson.title}
                              onChange={(e) => updateLessonField(idx, "title", e.target.value)}
                              placeholder="Lesson Title"
                              className="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-xs font-semibold text-gray-950 dark:text-white placeholder-gray-400 dark:placeholder-gray-650"
                              required
                            />
                            <input
                              type="text"
                              value={lesson.duration}
                              onChange={(e) => updateLessonField(idx, "duration", e.target.value)}
                              placeholder={newType === "text" ? "10 mins read" : "15 mins"}
                              className="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-xs font-light text-gray-950 dark:text-white placeholder-gray-400 dark:placeholder-gray-650"
                              required
                            />
                          </div>

                          <textarea
                            value={lesson.content}
                            onChange={(e) => updateLessonField(idx, "content", e.target.value)}
                            placeholder={
                              newType === "text" 
                                ? "Enter full textbook lecture markdown text content here..." 
                                : "Enter video .mp4 direct link URL feed (e.g. https://www.w3schools.com/html/mov_bbb.mp4)"
                            }
                            className="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-xs font-light text-gray-950 dark:text-white placeholder-gray-400 dark:placeholder-gray-650 min-h-[80px]"
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-6 py-3 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 transition"
                    >
                      Cancel
                    </button>
                    <Button
                      type="submit"
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition"
                    >
                      Publish Course
                    </Button>
                  </div>

                </form>
              </div>
            </div>
          )}

        </>
      )}

    </div>
  );
}
