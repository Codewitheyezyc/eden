import { createClient } from "@/services/supabase/server";
import { ShieldCheck, AlertTriangle, Sparkles, Building2, User, Award, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Member Verification - Loveworld Arts Academy",
  description: "Official Member Credentials Verification Portal",
};

interface VerifyPageProps {
  params: {
    memberId: string;
  };
}

export default async function MemberVerificationPage({ params }: VerifyPageProps) {
  const memberIdClean = decodeURIComponent(params.memberId).trim().toUpperCase();
  const supabase = createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      id,
      member_id,
      campus_zone,
      avatar_url,
      is_verified,
      leadership_role,
      updated_at,
      users:id (
        full_name,
        email,
        avatar_url
      )
    `)
    .eq("member_id", memberIdClean)
    .maybeSingle();

  const user = Array.isArray(profile?.users) ? profile.users[0] : profile?.users;
  const fullName = user?.full_name || "Official Member";
  const avatarUrl = profile?.avatar_url || user?.avatar_url || null;
  const isValid = !!profile;

  // Format campus zone nicely if stored as JSON array string or plain text
  let campusDisplay = "Dance Faculty Member";
  if (profile?.campus_zone) {
    try {
      const parsed = JSON.parse(profile.campus_zone);
      campusDisplay = Array.isArray(parsed) ? parsed.join(", ") : profile.campus_zone;
    } catch {
      campusDisplay = profile.campus_zone;
    }
  }

  return (
    <div className="min-h-screen bg-[#060809] text-white flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-emerald-500/30">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-emerald-500/10 blur-[130px] rounded-full" />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-amber-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Academy Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Loveworld Arts Academy</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Official Member Verification
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Eden Registry Verification System
          </p>
        </div>

        {isValid ? (
          /* Member Card */
          <div className={`bg-[#0e1216] border ${profile.is_verified ? "border-emerald-500/30" : "border-amber-500/40"} rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl`}>
            {/* Top Verification Ribbon */}
            <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
              {profile.is_verified ? (
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-xs uppercase font-extrabold tracking-wider">
                    Verified Active Member
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  <span className="text-xs uppercase font-extrabold tracking-wider">
                    Profile Incomplete • Unverified
                  </span>
                </div>
              )}
              <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
                LAA-REGISTRY
              </span>
            </div>

            {/* Avatar & Main Info */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative mb-4">
                <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 ${profile.is_verified ? "border-emerald-400/50 shadow-emerald-500/10" : "border-amber-400/50 shadow-amber-500/10"} bg-[#161c22] flex items-center justify-center shadow-lg`}>
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={fullName}
                      width={112}
                      height={112}
                      unoptimized
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full flex flex-col items-center justify-center ${profile.is_verified ? "text-emerald-400" : "text-amber-400"} font-bold text-2xl`}>
                      {fullName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className={`absolute -bottom-2 -right-2 ${profile.is_verified ? "bg-emerald-500 text-[#060809]" : "bg-amber-500 text-black"} p-1.5 rounded-full shadow-md`}>
                  {profile.is_verified ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                </div>
              </div>

              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                {fullName}
              </h2>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mt-2">
                <Award className="w-3.5 h-3.5" />
                <span>Loveworld Dancers</span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="space-y-3 bg-[#131920] border border-white/5 rounded-2xl p-4 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-500" /> Member ID
                </span>
                <span className="font-mono font-bold text-white tracking-wider">
                  {profile.member_id}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-gray-500" /> Faculty
                </span>
                <span className="font-semibold text-emerald-300">
                  Dance Faculty
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-gray-500" /> Campus / Zone
                </span>
                <span className="font-medium text-gray-200 text-right max-w-[200px] truncate">
                  {campusDisplay}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-gray-400">Membership Status</span>
                {profile.is_verified ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Active & Authenticated
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    Pending Profile Completion
                  </span>
                )}
              </div>
            </div>

            {!profile.is_verified && (
              <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed text-center">
                This member is registered in Eden but has not yet completed full profile verification. Official ID badges are only valid for verified profiles.
              </div>
            )}

            {/* Official Footer Note */}
            <div className="mt-6 text-center text-[11px] text-gray-500 leading-relaxed">
              This credential was verified directly against the live Eden Registry database for the Loveworld Arts Academy.
            </div>
          </div>
        ) : (
          /* Invalid ID Card */
          <div className="bg-[#140d0e] border border-red-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Unrecognized Member ID
            </h2>
            <p className="text-xs text-red-300/80 mb-4 leading-relaxed">
              The ID <span className="font-mono font-bold text-white bg-red-950/60 px-2 py-0.5 rounded border border-red-500/30">{memberIdClean}</span> could not be verified in the Loveworld Arts Academy registry.
            </p>
            <p className="text-[11px] text-gray-500">
              Please confirm the ID number with the coordinator or member.
            </p>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Loveworld Arts Academy
          </Link>
        </div>
      </div>
    </div>
  );
}

