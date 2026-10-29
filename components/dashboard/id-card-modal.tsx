"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck, Download, Printer, X, Sparkles, Award, User, Loader2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toPng } from "html-to-image";
import { saveAs } from "file-saver";
import { toast } from "react-hot-toast";

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
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const origin = window.location.origin.includes("localhost")
        ? "https://eden-ten-indol.vercel.app"
        : window.location.origin;
      setVerificationUrl(`${origin}/verify/${encodeURIComponent(member.memberId || "")}`);
    }
  }, [member.memberId]);

  if (!isOpen || typeof window === "undefined") return null;

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

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);

    try {
      // Capture element as high-definition PNG
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
        skipFonts: true,
      });

      const cleanName = (member.fullName || "Member").replace(/[^a-zA-Z0-9]/g, "_");
      const cleanId = (member.memberId || "ID").replace(/[^a-zA-Z0-9]/g, "-");
      const filename = `LAA_ID_${cleanName}_${cleanId}.png`;

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], filename, { type: "image/png" });

      // If mobile supports native Web Share API with images (iOS Safari / Android Chrome)
      if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `${member.fullName} ID Card`,
            text: `Loveworld Arts Academy Official Member ID Card for ${member.fullName}`,
          });
          toast.success("Ready! Saved or shared to gallery.");
          setIsDownloading(false);
          return;
        } catch (shareErr: any) {
          // If user cancels the share drawer, don't show error
          if (shareErr?.name === "AbortError") {
            setIsDownloading(false);
            return;
          }
        }
      }

      // Direct download to Gallery / Downloads
      saveAs(blob, filename);
      toast.success("ID card downloaded to your device gallery!");
    } catch (err) {
      console.error("Failed to generate image:", err);
      toast.error("Could not capture image. Please use 'Print / Save PDF' instead.");
    } finally {
      setIsDownloading(false);
    }
  };

  return createPortal(
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #official-id-card-print-container,
          #official-id-card-print-container * {
            visibility: visible !important;
          }
          #official-id-card-print-container {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            z-index: 999999 !important;
          }
          #official-id-card {
            box-shadow: none !important;
            border: 2px solid #10b981 !important;
            background: #0d1117 !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
      <div
        id="official-id-card-print-container"
        className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      >
        <div className="relative w-full max-w-md bg-[#0b0e12] border border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl text-white flex flex-col items-center my-auto max-h-[92vh] overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all print:hidden"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-4 print:hidden">
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
                    unoptimized
                    crossOrigin="anonymous"
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
          <div className="w-full flex flex-col gap-2 mt-5 print:hidden">
            {/* Primary Action: Save to Gallery */}
            <Button
              onClick={handleDownloadImage}
              disabled={isDownloading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl py-3 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 text-xs sm:text-sm"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving to Gallery...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Save to Gallery (Image)</span>
                </>
              )}
            </Button>

            {/* Secondary Actions Row */}
            <div className="flex gap-2 w-full">
              <Button
                onClick={handlePrint}
                variant="outline"
                className="flex-1 border-white/10 hover:bg-white/5 text-gray-200 rounded-xl py-2 flex items-center justify-center gap-2 text-xs"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>Print / PDF</span>
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                className="px-4 hover:bg-white/5 text-gray-400 hover:text-white rounded-xl text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

