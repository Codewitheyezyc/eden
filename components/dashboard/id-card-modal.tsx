"use client";

import { useState, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck, Download, Printer, X, Sparkles, Award, User, Building2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface IdCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: {
    fullName: string;
    memberId: string;
    campusZone?: string | null;
    avatarUrl?: string | null;
    role?: string;
  };
}

export function IdCardModal({ isOpen, onClose, member }: IdCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [verificationUrl, setVerificationUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const origin = window.location.origin.includes("localhost")
        ? "https://eden-ten-indol.vercel.app"
        : window.location.origin;
      setVerificationUrl(`${origin}/verify/${encodeURIComponent(member.memberId || "")}`);
    }
  }, [member.memberId]);

  if (!isOpen) return null;

  // Format campus
  let campusDisplay = "Dance Faculty Member";
  if (member.campusZone) {
    try {
      const parsed = JSON.parse(member.campusZone);
      campusDisplay = Array.isArray(parsed) ? parsed.join(", ") : member.campusZone;
    } catch {
      campusDisplay = member.campusZone;
    }
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0b0e12] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-white flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5 print:hidden">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3 h-3" />
            <span>Official Identity Badge</span>
          </div>
        </div>

        {/* ================= Printable ID Card Container ================= */}
        <div
          ref={cardRef}
          id="official-id-card"
          className="w-full max-w-[340px] bg-gradient-to-b from-[#11161d] via-[#0d1117] to-[#07090c] border-2 border-emerald-500/40 rounded-3xl p-5 shadow-2xl relative overflow-hidden text-center flex flex-col items-center"
        >
          {/* Subtle Card Glow Highlights */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="w-full pb-3 border-b border-white/10 mb-4">
            <div className="text-[13px] font-black uppercase tracking-wider text-emerald-400">
              Loveworld Arts Academy
            </div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
              Dance Faculty
            </div>
          </div>

          {/* Member Photo */}
          <div className="relative mb-3">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-emerald-400 bg-[#171f28] flex items-center justify-center shadow-lg shadow-emerald-500/10">
              {member.avatarUrl ? (
                <Image
                  src={member.avatarUrl}
                  alt={member.fullName}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center font-bold text-3xl text-emerald-400">
                  {member.fullName.charAt(0)}
                </div>
              )}
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 text-black p-1 rounded-full shadow-md">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Member Full Name */}
          <h3 className="text-xl font-extrabold text-white tracking-tight line-clamp-1">
            {member.fullName}
          </h3>

          {/* Designation Title */}
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold mt-1 mb-3">
            <Award className="w-3 h-3 text-emerald-400" />
            <span>Loveworld Dancers</span>
          </div>

          {/* Member Details */}
          <div className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 mb-3 text-left space-y-1 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">ID Number:</span>
              <span className="font-mono font-bold text-emerald-400">
                {member.memberId || "LAA-DNC-PENDING"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Campus:</span>
              <span className="text-gray-200 font-medium truncate max-w-[170px]">
                {campusDisplay}
              </span>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col items-center justify-center bg-white p-2.5 rounded-2xl shadow-md mb-2">
            {verificationUrl ? (
              <QRCodeSVG
                value={verificationUrl}
                size={84}
                level="M"
                includeMargin={false}
              />
            ) : (
              <div className="w-[84px] h-[84px] bg-gray-100 flex items-center justify-center text-[9px] text-gray-500">
                Generating...
              </div>
            )}
          </div>
          <span className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">
            Scan to Verify Credentials
          </span>

          {/* Card Holographic Security Footer */}
          <div className="w-full mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[8px] text-gray-500 uppercase tracking-widest">
            <span>Official Credential</span>
            <span className="text-emerald-500/80 font-mono">EDEN-VERIFIED</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="w-full flex gap-3 mt-6 print:hidden">
          <Button
            onClick={handlePrint}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl py-2.5 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            <Printer className="w-4 h-4" />
            Print ID Card
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="px-5 border-white/10 hover:bg-white/5 text-gray-300 rounded-xl"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

