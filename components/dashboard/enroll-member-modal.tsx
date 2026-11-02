"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Sparkles, User, MapPin, Phone, Shirt, CheckCircle2, Loader2, Award, Camera, Image as ImageIcon, Trash2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CAMPUSES, getActiveCampuses } from "@/lib/campuses";
import { enrollMemberByCoordinator } from "@/app/dashboard/[facultySlug]/costumes/actions";
import { IdCardModal } from "./id-card-modal";
import { compressImage } from "@/lib/image-compress";
import { createClient } from "@/services/supabase/client";

interface EnrollMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  facultyId: string;
  eventId?: string; // If enrolling directly from event attendance page
  onSuccess?: (createdMember: any) => void;
}

const DRAFT_STORAGE_KEY = "eden_assisted_enroll_draft";

export function EnrollMemberModal({
  isOpen,
  onClose,
  facultyId,
  eventId,
  onSuccess,
}: EnrollMemberModalProps) {
  const [campusList, setCampusList] = useState<string[]>([...CAMPUSES]);
  const [fullName, setFullName] = useState("");
  const [campusZone, setCampusZone] = useState<string>(CAMPUSES[0]);
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("Female");
  const [shoeSize, setShoeSize] = useState("");
  const [trouserSize, setTrouserSize] = useState("");
  const [topSize, setTopSize] = useState("Medium");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // File Inputs
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success ID Card view
  const [createdMember, setCreatedMember] = useState<any>(null);
  const [showIdCard, setShowIdCard] = useState(false);

  // Load dynamic campuses
  useEffect(() => {
    getActiveCampuses().then((campuses) => {
      if (campuses && campuses.length > 0) {
        setCampusList(campuses);
      }
    });
  }, []);

  // Restore draft if available
  useEffect(() => {
    if (typeof window === "undefined" || !isOpen) return;
    try {
      const saved = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.fullName) setFullName(parsed.fullName);
        if (parsed.campusZone) setCampusZone(parsed.campusZone);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.gender) setGender(parsed.gender);
        if (parsed.shoeSize) setShoeSize(parsed.shoeSize);
        if (parsed.trouserSize) setTrouserSize(parsed.trouserSize);
        if (parsed.topSize) setTopSize(parsed.topSize);
        if (parsed.avatarUrl) setAvatarUrl(parsed.avatarUrl);
      }
    } catch (e) {
      // Ignore sessionStorage parsing errors
    }
  }, [isOpen]);

  // Persist draft on changes
  useEffect(() => {
    if (typeof window === "undefined" || !isOpen) return;
    try {
      if (fullName || phone || shoeSize || trouserSize || avatarUrl) {
        sessionStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({
            fullName,
            campusZone,
            phone,
            gender,
            shoeSize,
            trouserSize,
            topSize,
            avatarUrl,
          })
        );
      }
    } catch (e) {
      // Ignore quota errors
    }
  }, [fullName, campusZone, phone, gender, shoeSize, trouserSize, topSize, avatarUrl, isOpen]);

  const clearDraft = () => {
    try {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (e) {}
  };

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      setError(null);

      // Compress client-side
      const compressedBlob = await compressImage(file, 800, 0.85);
      const supabase = createClient();
      const filePath = `assisted-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(filePath, compressedBlob, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
    } catch (err: any) {
      console.error("Photo upload error:", err);
      setError("Failed to upload photo. You can still enroll and add it later.");
    } finally {
      setUploadingPhoto(false);
      // Reset input value so same file can be re-selected if desired
      if (e.target) e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Please enter the member's full name.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await enrollMemberByCoordinator({
      facultyId,
      fullName,
      campusZone,
      phone,
      gender,
      shoeSize,
      trouserSize,
      topSize,
      avatarUrl,
      eventId,
    });

    setLoading(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    if (res.success && res.member) {
      clearDraft();
      setCreatedMember(res.member);
      setShowIdCard(true);
      if (onSuccess) {
        onSuccess(res.member);
      }
    }
  };

  const handleIdCardClose = () => {
    setShowIdCard(false);
    clearDraft();
    onClose();
  };

  const handleModalClose = () => {
    clearDraft();
    onClose();
  };

  if (showIdCard && createdMember) {
    return (
      <IdCardModal
        isOpen={showIdCard}
        onClose={handleIdCardClose}
        member={{
          fullName: createdMember.fullName,
          memberId: createdMember.memberId,
          campusZone: createdMember.campusZone,
          avatarUrl: createdMember.avatarUrl,
          role: "STUDENT",
          isVerified: true,
        }}
      />
    );
  }

  if (typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0e1216] border border-white/10 rounded-3xl p-5 sm:p-8 shadow-2xl text-white my-auto max-h-[90vh] overflow-y-auto pb-10">
        {/* Close Button */}
        <button
          onClick={handleModalClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Assisted Enrollment</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Enroll Member
          </h2>
          <p className="text-gray-400 text-xs mt-1 leading-relaxed">
            Official registration for dancers without smartphones. Generates an official Member ID and ID Card.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Member Photo Picker */}
          <div className="bg-[#141920] border border-white/10 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-500/40 bg-[#1b222c] flex items-center justify-center shrink-0 shadow-inner">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Member Preview"
                  width={80}
                  height={80}
                  unoptimized
                  className="w-full h-full object-cover"
                />
              ) : uploadingPhoto ? (
                <Loader2 className="w-7 h-7 animate-spin text-emerald-400" />
              ) : (
                <Camera className="w-7 h-7 text-gray-500" />
              )}
            </div>

            <div className="flex-1 w-full text-center sm:text-left">
              <label className="text-xs font-bold text-white block mb-0.5">
                Member ID Photo (Optional)
              </label>
              <p className="text-[11px] text-gray-400 mb-2.5">
                Choose from gallery or snap a photo for their official ID card.
              </p>

              {/* Hidden file inputs */}
              {/* 1. Gallery input: NO capture attribute ensures gallery picker opens */}
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              {/* 2. Camera input: with capture attribute for snapping immediately */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {uploadingPhoto ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-300 font-bold text-[11px]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-[11px] transition-all"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>{avatarUrl ? "Replace from Gallery" : "Choose from Gallery"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-gray-200 font-bold text-[11px] transition-all"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Take Photo</span>
                    </button>

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl("")}
                        className="inline-flex items-center p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="font-bold text-gray-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" /> Full Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Grace Adebayo"
              className="w-full bg-[#161c24] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Campus / Zone */}
          <div className="space-y-1.5">
            <label className="font-bold text-gray-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Campus / Zone *
            </label>
            <select
              value={campusZone}
              onChange={(e) => setCampusZone(e.target.value)}
              className="w-full bg-[#161c24] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {campusList.map((c) => (
                <option key={c} value={c} className="bg-[#161c24] text-white">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Phone & Gender Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-gray-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" /> Contact Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Parent/Guardian/Member"
                className="w-full bg-[#161c24] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-300 uppercase tracking-wider text-[11px]">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-[#161c24] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>
          </div>

          {/* Costume Sizes Sub-Section */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase tracking-wider text-[11px] mb-3">
              <Shirt className="w-3.5 h-3.5" />
              <span>Costume Measurements (Optional)</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-gray-400 text-[10px] uppercase font-bold block mb-1">
                  Shoe Size
                </label>
                <input
                  type="text"
                  value={shoeSize}
                  onChange={(e) => setShoeSize(e.target.value)}
                  placeholder="e.g. 39, 42"
                  className="w-full bg-[#161c24] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-gray-400 text-[10px] uppercase font-bold block mb-1">
                  Trouser Size
                </label>
                <input
                  type="text"
                  value={trouserSize}
                  onChange={(e) => setTrouserSize(e.target.value)}
                  placeholder="e.g. 30, M"
                  className="w-full bg-[#161c24] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-gray-400 text-[10px] uppercase font-bold block mb-1">
                  Top Size
                </label>
                <select
                  value={topSize}
                  onChange={(e) => setTopSize(e.target.value)}
                  className="w-full bg-[#161c24] border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Extra Small">Extra Small</option>
                  <option value="Small">Small</option>
                  <option value="Medium">Medium</option>
                  <option value="Large">Large</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                  <option value="3XL">3XL</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleModalClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 font-semibold transition-all"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={loading || uploadingPhoto}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/30"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enrolling...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Enroll & Generate ID Card</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
