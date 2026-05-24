"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { createClient } from "@/services/supabase/client";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { CAMPUSES, parseCampuses, formatCampusesForDb } from "@/lib/campuses";
import { LEADERSHIP_ROLES } from "@/lib/leadership-roles";

interface ProfileData {
  id: string;
  phone: string | null;
  gender: string | null;
  kingschat_handle: string | null;
  campus_zone: string | null;
  date_of_birth: string | null;
  bio: string | null;
  is_verified: boolean | null;
  leadership_role?: string | null;
}

interface ProfileContainerProps {
  userId: string;
  userEmail: string;
  initialProfile: ProfileData | null;
  initialFullName: string | null;
  initialAvatar: string | null;
  role?: string;
}

export function ProfileContainer({ userId, userEmail, initialProfile, initialFullName, initialAvatar, role = "STUDENT" }: ProfileContainerProps) {
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [formData, setFormData] = useState({
    fullName: initialFullName || "",
    phone: initialProfile?.phone || "",
    gender: initialProfile?.gender || "",
    kingschat: initialProfile?.kingschat_handle || "",
    campus: initialProfile?.campus_zone || "",
    dob: initialProfile?.date_of_birth || "",
    bio: initialProfile?.bio || "",
    leadershipRole: initialProfile?.leadership_role || "",
  });

  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatar);
  const [hasCelebrated, setHasCelebrated] = useState(initialProfile?.is_verified || false);
  const [selectedCampuses, setSelectedCampuses] = useState<string[]>(() => {
    return parseCampuses(initialProfile?.campus_zone);
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [completedTour, setCompletedTour] = useState(false);
  const [isCustomRole, setIsCustomRole] = useState(() => {
    const roleVal = initialProfile?.leadership_role || "";
    if (roleVal === "") return false;
    return !LEADERSHIP_ROLES.includes(roleVal as any);
  });
  const [selectedRoleOption, setSelectedRoleOption] = useState(() => {
    const roleVal = initialProfile?.leadership_role || "";
    if (roleVal === "") return "";
    return LEADERSHIP_ROLES.includes(roleVal as any) ? roleVal : "CUSTOM";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setCompletedTour(params.get("completed_tour") === "true");
    }
  }, []);

  // Calculate Progress
  const progress = useMemo(() => {
    let filled = 0;
    const total = 8; // fullName, phone, gender, kingschat, campus, dob, bio, avatarUrl

    if (formData.fullName.trim() !== "") filled++;
    if (formData.phone.trim() !== "") filled++;
    if (formData.gender !== "") filled++;
    if (formData.kingschat.trim() !== "") filled++;
    if (selectedCampuses.length > 0) filled++;
    if (formData.dob !== "") filled++;
    if (formData.bio.trim() !== "") filled++;
    if (avatarUrl) filled++;

    return Math.round((filled / total) * 100);
  }, [formData, selectedCampuses, avatarUrl]);

  // Trigger Confetti
  useEffect(() => {
    if (progress === 100 && !hasCelebrated) {
      setHasCelebrated(true);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
      });
      
      // Silently update database verification status
      supabase.from("profiles").update({ is_verified: true }).eq("id", userId).then();
    }
  }, [progress, hasCelebrated, supabase, userId]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true);
      setMessage(null);
      const file = e.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}-${Math.random()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);

      // Save to users table immediately so overview gets it
      await supabase.from("users").update({ avatar_url: publicUrl }).eq("id", userId);
      
      // Update Auth session so Navbar gets it
      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      setMessage({ type: 'success', text: 'Avatar uploaded successfully!' });
      router.refresh();

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error uploading avatar' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Update basic user info (full_name)
      await supabase.from("users").update({ full_name: formData.fullName }).eq("id", userId);
      
      // Update auth user so navbar name updates
      await supabase.auth.updateUser({
        data: { full_name: formData.fullName }
      });

      // Upsert profile info
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userId,
        phone: formData.phone,
        gender: formData.gender,
        kingschat_handle: formData.kingschat,
        campus_zone: formatCampusesForDb(selectedCampuses),
        date_of_birth: formData.dob || null,
        bio: formData.bio,
        is_verified: progress === 100,
        leadership_role: role === "ADMIN" ? formData.leadershipRole : null,
      });

      if (profileError) throw profileError;

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      router.refresh();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Progress Bar */}
      <div className="bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-6 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Profile Completeness</h3>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{progress}%</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-white/5 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-emerald-500 h-3 rounded-full transition-all duration-1000 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        {progress < 100 && (
          <p className="text-xs text-gray-700 dark:text-gray-400 mt-3 font-normal">Complete all fields to unlock the full Eden experience.</p>
        )}
      </div>

      {/* Onboarding Welcome / Checklist Panel */}
      {(completedTour || progress < 100) && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              ✨
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-gray-900 dark:text-white">
                {completedTour ? "Welcome from Onboarding! Let's complete your profile 🚀" : "Onboarding Checklist"}
              </h4>
              <p className="text-xs text-gray-700 dark:text-gray-300 font-normal mt-0.5">
                Complete these quick tasks to verify your account and customize your campus experience.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Full Name", checked: formData.fullName.trim() !== "" },
              { label: "Profile Picture", checked: !!avatarUrl },
              { label: "Campus Selected", checked: selectedCampuses.length > 0 },
              { label: "Biography", checked: formData.bio.trim() !== "" },
            ].map((item, idx) => (
              <div 
                key={idx}
                className={`flex items-center space-x-2 p-3 rounded-2xl border transition-all ${
                  item.checked 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold" 
                    : "bg-white/40 dark:bg-black/25 border-gray-200 dark:border-white/5 text-gray-700 dark:text-gray-400 font-semibold"
                }`}
              >
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                  item.checked ? "bg-emerald-500 text-white" : "border-2 border-gray-300 dark:border-gray-700"
                }`}>
                  {item.checked && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  )}
                </div>
                <span className="text-[11px] font-bold">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-[1fr_2.5fr] gap-8 items-start">
        {/* Left Side: Avatar Upload */}
        <div className="bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAvatarUpload} 
            accept="image/*" 
            className="hidden" 
          />
          <div 
            className="relative group cursor-pointer mb-4"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className={`w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-[#0a0a0a] shadow-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center ${uploadingAvatar ? 'opacity-50' : ''}`}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formData.fullName?.charAt(0).toUpperCase() || userEmail.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </div>
            {uploadingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">{formData.fullName || "Student"}</h3>
            {progress === 100 && <VerifiedBadge />}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate w-full px-2" title={userEmail}>{userEmail}</p>
          
          <div className="mt-6 w-full p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
            <p className="text-xs text-emerald-800 dark:text-emerald-400 font-medium">Keep your profile updated to help coordinators assign you to the right events and classes.</p>
          </div>
        </div>

        {/* Right Side: Profile Form */}
        <div className="bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm">
          <form onSubmit={handleSave} className="space-y-6">
            {message && (
              <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                {message.text}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                <input 
                  type="text" 
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-gray-900 dark:text-white"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-gray-900 dark:text-white"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kingschat Handle</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                  <input 
                    type="text" 
                    value={formData.kingschat}
                    onChange={(e) => setFormData({...formData, kingschat: e.target.value.replace('@', '')})}
                    className="w-full bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-gray-900 dark:text-white"
                    placeholder="username"
                  />
                </div>
              </div>

              <div className="space-y-2 relative" id="tour-campus-select">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 font-bold flex items-center justify-between">
                  <span>Campuses / Zones</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase font-extrabold tracking-widest">Scalable dropdown</span>
                </label>
                
                {/* Visual select field */}
                <div 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full min-h-[46px] bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus-within:ring-2 focus-within:ring-emerald-500/50 outline-none transition-all flex flex-wrap gap-2 items-center cursor-pointer select-none"
                >
                  {selectedCampuses.length === 0 ? (
                    <span className="text-gray-400">Select campuses...</span>
                  ) : (
                    selectedCampuses.map((c) => (
                      <span 
                        key={c}
                        className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold px-2 py-0.5 rounded-md"
                      >
                        {c}
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCampuses(selectedCampuses.filter(item => item !== c));
                          }}
                          className="hover:text-rose-500 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {dropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div className="absolute z-20 w-full mt-1.5 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-2 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-200">
                      {CAMPUSES.map((c) => {
                        const isSelected = selectedCampuses.includes(c);
                        return (
                          <div 
                            key={c}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedCampuses(selectedCampuses.filter(item => item !== c));
                              } else {
                                setSelectedCampuses([...selectedCampuses, c]);
                              }
                            }}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer select-none transition-all
                              ${isSelected 
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold" 
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                              }
                            `}
                          >
                            <span>{c}</span>
                            {isSelected && (
                              <svg xmlns="http://www.w3.org/255" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-600 dark:text-emerald-400"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                <select 
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  className="w-full bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-gray-900 dark:text-white"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</label>
                <input 
                  type="date" 
                  value={formData.dob}
                  onChange={(e) => setFormData({...formData, dob: e.target.value})}
                  className="w-full bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-gray-900 dark:text-white"
                />
              </div>

              {role === "ADMIN" && (
                <div className="space-y-4 sm:col-span-2 bg-emerald-500/[0.02] border border-emerald-500/10 p-5 rounded-2xl">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                      <span>HQ Leadership Position</span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-widest">Admin Only</span>
                    </label>
                    <select
                      value={selectedRoleOption}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedRoleOption(val);
                        if (val === "CUSTOM") {
                          setIsCustomRole(true);
                          setFormData({ ...formData, leadershipRole: "" });
                        } else {
                          setIsCustomRole(false);
                          setFormData({ ...formData, leadershipRole: val });
                        }
                      }}
                      className="w-full bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-gray-900 dark:text-white"
                    >
                      <option value="">No HQ Leadership Position</option>
                      {LEADERSHIP_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                      <option value="CUSTOM">Custom Position / Predefined (Scalable)</option>
                    </select>
                  </div>

                  {isCustomRole && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <label className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Custom Position Name</label>
                      <input 
                        type="text" 
                        value={formData.leadershipRole}
                        onChange={(e) => setFormData({...formData, leadershipRole: e.target.value})}
                        className="w-full bg-white dark:bg-[#0a0a0a] border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-gray-900 dark:text-white font-medium"
                        placeholder="Enter the HQ leadership position name..."
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
                <span className="text-xs text-gray-400">{formData.bio.length} / 500</span>
              </div>
              <textarea 
                value={formData.bio}
                maxLength={500}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                className="w-full bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all resize-none min-h-[120px] text-gray-900 dark:text-white"
                placeholder="Tell us a bit about yourself, your interests, and your goals..."
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-emerald-600/20 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : "Save Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
