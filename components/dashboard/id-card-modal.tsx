"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck, Download, Printer, X, Sparkles, Award, Loader2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
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

  const displayName = member.fullName?.trim() || "Official Member";

  // Format campus nicely
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
    setIsDownloading(true);

    try {
      const canvas = document.createElement("canvas");
      const scale = 2; // High-DPI 2x retina
      const width = 380 * scale; // 760px
      const height = 570 * scale; // 1140px
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create canvas context");

      ctx.scale(scale, scale);
      const w = 380;
      const h = 570;

      // Helper: rounded rectangle path
      const roundRect = (x: number, y: number, rw: number, rh: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + rw, y, x + rw, y + rh, r);
        ctx.arcTo(x + rw, y + rh, x, y + rh, r);
        ctx.arcTo(x, y + rh, x, y, r);
        ctx.arcTo(x, y, x + rw, y, r);
        ctx.closePath();
      };

      // 1. Background with rounded corners
      roundRect(0, 0, w, h, 28);
      ctx.save();
      ctx.clip();

      // Deep dark gradient fill
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, "#111720");
      bgGrad.addColorStop(0.5, "#0b0f15");
      bgGrad.addColorStop(1, "#06090d");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Card Glow Highlights
      const glow = ctx.createRadialGradient(w - 20, 20, 10, w - 20, 20, 160);
      glow.addColorStop(0, "rgba(16, 185, 129, 0.25)");
      glow.addColorStop(1, "rgba(16, 185, 129, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      // Outer Emerald Border
      roundRect(1, 1, w - 2, h - 2, 28);
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 2. Header
      ctx.textAlign = "center";
      ctx.font = "bold 15px sans-serif";
      ctx.fillStyle = "#34d399";
      ctx.fillText("LOVEWORLD ARTS ACADEMY", w / 2, 38);

      ctx.font = "bold 11px sans-serif";
      ctx.fillStyle = "#9ca3af";
      ctx.fillText("DANCE FACULTY", w / 2, 54);

      // Divider
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(24, 68);
      ctx.lineTo(w - 24, 68);
      ctx.stroke();

      // 3. Avatar
      const avSize = 96;
      const avX = (w - avSize) / 2;
      const avY = 82;

      let avatarLoaded = false;
      if (member.avatarUrl) {
        try {
          const img = new window.Image();
          img.crossOrigin = "anonymous";
          img.src = member.avatarUrl;
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            setTimeout(reject, 2500); // 2.5s safe timeout
          });

          ctx.save();
          roundRect(avX, avY, avSize, avSize, 20);
          ctx.clip();
          ctx.drawImage(img, avX, avY, avSize, avSize);
          ctx.restore();
          avatarLoaded = true;
        } catch {
          avatarLoaded = false;
        }
      }

      if (!avatarLoaded) {
        ctx.save();
        roundRect(avX, avY, avSize, avSize, 20);
        ctx.fillStyle = "#16202c";
        ctx.fill();
        ctx.restore();

        ctx.font = "bold 38px sans-serif";
        ctx.fillStyle = "#34d399";
        const initial = displayName.charAt(0).toUpperCase();
        ctx.fillText(initial, w / 2, avY + 62);
      }

      // Avatar Border
      roundRect(avX, avY, avSize, avSize, 20);
      ctx.strokeStyle = "#34d399";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Verified Badge on Avatar
      const badgeX = avX + avSize - 6;
      const badgeY = avY + avSize - 6;
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, 11, 0, Math.PI * 2);
      ctx.fillStyle = "#10b981";
      ctx.fill();
      ctx.strokeStyle = "#0b0f15";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("✓", badgeX, badgeY + 4);

      // 4. Member Full Name
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(displayName, w / 2, avY + avSize + 32);

      // 5. Designation Pill
      const pillW = 150;
      const pillH = 26;
      const pillX = (w - pillW) / 2;
      const pillY = avY + avSize + 44;
      roundRect(pillX, pillY, pillW, pillH, 13);
      ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
      ctx.fill();
      ctx.strokeStyle = "rgba(16, 185, 129, 0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#6ee7b7";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("★ Loveworld Dancers", w / 2, pillY + 17);

      // 6. Member Details Box
      const boxX = 24;
      const boxY = pillY + pillH + 12;
      const boxW = w - 48;
      const boxH = 68;
      roundRect(boxX, boxY, boxW, boxH, 14);
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // ID Number Row
      ctx.textAlign = "left";
      ctx.fillStyle = "#9ca3af";
      ctx.font = "11px sans-serif";
      ctx.fillText("ID Number:", boxX + 14, boxY + 26);

      ctx.textAlign = "right";
      ctx.fillStyle = "#34d399";
      ctx.font = "bold 13px monospace";
      ctx.fillText(member.memberId || "LAA-DNC-PENDING", boxX + boxW - 14, boxY + 26);

      // Campus Row
      ctx.textAlign = "left";
      ctx.fillStyle = "#9ca3af";
      ctx.font = "11px sans-serif";
      ctx.fillText("Campus:", boxX + 14, boxY + 52);

      ctx.textAlign = "right";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px sans-serif";
      const displayCampusTrimmed =
        campusDisplay.length > 25 ? campusDisplay.substring(0, 23) + "..." : campusDisplay;
      ctx.fillText(displayCampusTrimmed, boxX + boxW - 14, boxY + 52);

      // 7. QR Code
      const qrContainerSize = 100;
      const qrBoxX = (w - qrContainerSize) / 2;
      const qrBoxY = boxY + boxH + 12;

      roundRect(qrBoxX, qrBoxY, qrContainerSize, qrContainerSize, 14);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Render QR code from SVG element
      const qrSvgEl = document.getElementById("official-id-card-qr-svg");
      if (qrSvgEl) {
        try {
          const svgData = new XMLSerializer().serializeToString(qrSvgEl);
          const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
          const DOMURL = window.URL || window.webkitURL || window;
          const url = DOMURL.createObjectURL(svgBlob);
          const qrImg = new window.Image();
          await new Promise((resolve, reject) => {
            qrImg.onload = resolve;
            qrImg.onerror = reject;
            qrImg.src = url;
          });
          ctx.drawImage(qrImg, qrBoxX + 8, qrBoxY + 8, qrContainerSize - 16, qrContainerSize - 16);
          DOMURL.revokeObjectURL(url);
        } catch {
          ctx.fillStyle = "#000000";
          ctx.font = "bold 9px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("SCAN TO VERIFY", w / 2, qrBoxY + 55);
        }
      }

      // 8. Scan text
      ctx.textAlign = "center";
      ctx.fillStyle = "#9ca3af";
      ctx.font = "bold 9px sans-serif";
      ctx.fillText("SCAN TO VERIFY CREDENTIALS", w / 2, qrBoxY + qrContainerSize + 14);

      // 9. Footer
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(24, h - 30);
      ctx.lineTo(w - 24, h - 30);
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.fillStyle = "#6b7280";
      ctx.font = "8px sans-serif";
      ctx.fillText("OFFICIAL CREDENTIAL", 26, h - 14);

      ctx.textAlign = "right";
      ctx.fillStyle = "#10b981";
      ctx.font = "bold 9px monospace";
      ctx.fillText("EDEN-VERIFIED", w - 26, h - 14);

      // Generate high-resolution PNG blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/png", 1.0);
      });

      if (!blob) throw new Error("Canvas export produced empty blob");

      const cleanName = displayName.replace(/[^a-zA-Z0-9]/g, "_");
      const cleanId = (member.memberId || "ID").replace(/[^a-zA-Z0-9]/g, "-");
      const filename = `LAA_ID_${cleanName}_${cleanId}.png`;
      const file = new File([blob], filename, { type: "image/png" });

      // If mobile supports native Web Share API with images (iOS Safari / Android Chrome)
      if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `${displayName} ID Card`,
            text: `Loveworld Arts Academy Official Member ID Card for ${displayName}`,
          });
          toast.success("Ready! Saved or shared to gallery.");
          setIsDownloading(false);
          return;
        } catch (shareErr: any) {
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
        className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      >
        <div className="relative w-full max-w-lg bg-[#0b0e12] border border-white/10 rounded-3xl p-5 sm:p-8 shadow-2xl text-white flex flex-col items-center my-auto max-h-[94vh] overflow-y-auto pb-10">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all print:hidden"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-5 print:hidden">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official Identity Badge</span>
            </div>
          </div>

          {/* ================= Printable ID Card Container ================= */}
          <div
            ref={cardRef}
            id="official-id-card"
            className="w-full max-w-[360px] bg-gradient-to-b from-[#111720] via-[#0b0f15] to-[#06090d] border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden text-center flex flex-col items-center"
          >
            {/* Subtle Card Glow Highlights */}
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="w-full pb-3.5 border-b border-white/10 mb-4">
              <div className="text-[14px] font-black uppercase tracking-wider text-emerald-400">
                Loveworld Arts Academy
              </div>
              <div className="text-[11px] uppercase font-bold tracking-widest text-gray-400 mt-0.5">
                Dance Faculty
              </div>
            </div>

            {/* Member Photo */}
            <div className="relative mb-3.5">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-emerald-400 bg-[#16202c] flex items-center justify-center shadow-lg shadow-emerald-500/15">
                {member.avatarUrl ? (
                  <Image
                    src={member.avatarUrl}
                    alt={displayName}
                    width={112}
                    height={112}
                    unoptimized
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center font-bold text-3xl sm:text-4xl text-emerald-400">
                    {displayName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 text-black p-1.5 rounded-full shadow-md">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            {/* Member Full Name */}
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight line-clamp-1 px-1">
              {displayName}
            </h3>

            {/* Designation Title */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold mt-2 mb-4 shadow-xs">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>Loveworld Dancers</span>
            </div>

            {/* Member Details */}
            <div className="w-full bg-white/[0.04] border border-white/10 rounded-2xl p-3.5 sm:p-4 mb-4 text-left space-y-2 text-xs sm:text-[13px]">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-gray-400 font-medium">ID Number:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {member.memberId || "LAA-DNC-PENDING"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Campus:</span>
                <span className="text-gray-200 font-bold truncate max-w-[200px]">
                  {campusDisplay}
                </span>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="flex flex-col items-center justify-center bg-white p-3 rounded-2xl shadow-md mb-2">
              {verificationUrl ? (
                <QRCodeSVG
                  id="official-id-card-qr-svg"
                  value={verificationUrl}
                  size={92}
                  level="M"
                  includeMargin={false}
                />
              ) : (
                <div className="w-[92px] h-[92px] bg-gray-100 flex items-center justify-center text-[10px] text-gray-500">
                  Generating...
                </div>
              )}
            </div>
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
              Scan to Verify Credentials
            </span>

            {/* Card Holographic Security Footer */}
            <div className="w-full mt-4 pt-2.5 border-t border-white/10 flex items-center justify-between text-[9px] text-gray-400 uppercase tracking-widest font-semibold">
              <span>Official Credential</span>
              <span className="text-emerald-400 font-mono">EDEN-VERIFIED</span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="w-full max-w-[360px] flex flex-col gap-2.5 mt-6 print:hidden">
            {/* Primary Action: Save to Gallery */}
            <Button
              onClick={handleDownloadImage}
              disabled={isDownloading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl py-3.5 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 text-sm transition-all"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating High-Res Image...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Save to Gallery (Image)</span>
                </>
              )}
            </Button>

            {/* Secondary Actions Row */}
            <div className="flex gap-2.5 w-full">
              <Button
                onClick={handlePrint}
                variant="outline"
                className="flex-1 border-white/10 hover:bg-white/5 text-gray-200 rounded-xl py-2.5 flex items-center justify-center gap-2 text-xs font-bold"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>Print / Save PDF</span>
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                className="px-5 hover:bg-white/5 text-gray-400 hover:text-white rounded-xl text-xs font-bold"
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

