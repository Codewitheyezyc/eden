"use client";

import { useState } from "react";
import { X, Sparkles, User, MapPin, Phone, Shirt, CheckCircle2, Loader2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CAMPUSES } from "@/lib/campuses";
import { enrollMemberByCoordinator } from "@/app/dashboard/[facultySlug]/costumes/actions";
import { IdCardModal } from "./id-card-modal";

interface EnrollMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  facultyId: string;
  eventId?: string; // If enrolling directly from event attendance page
  onSuccess?: (createdMember: any) => void;
}

export function EnrollMemberModal({
  isOpen,
  onClose,
  facultyId,
  eventId,
  onSuccess,
}: EnrollMemberModalProps) {
  const [fullName, setFullName] = useState("");
  const [campusZone, setCampusZone] = useState<string>(CAMPUSES[0]);
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("Female");
  const [shoeSize, setShoeSize] = useState("");
  const [trouserSize, setTrouserSize] = useState("");
  const [topSize, setTopSize] = useState("Medium");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success ID Card view
  const [createdMember, setCreatedMember] = useState<any>(null);
  const [showIdCard, setShowIdCard] = useState(false);

  if (!isOpen) return null;

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
      setCreatedMember(res.member);
      setShowIdCard(true);
      if (onSuccess) {
        onSuccess(res.member);
      }
    }
  };

  const handleIdCardClose = () => {
    setShowIdCard(false);
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
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0e1216] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-white my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Assisted Enrollment</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Enroll Member {eventId ? "& Register for Event" : ""}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Official registration for dancers without smartphones. Generates an official Member ID and ID Card.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
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
              {CAMPUSES.map((c) => (
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
                  className="w-full bg-[#161c24] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                  className="w-full bg-[#161c24] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-gray-400 text-[10px] uppercase font-bold block mb-1">
                  Top Size
                </label>
                <select
                  value={topSize}
                  onChange={(e) => setTopSize(e.target.value)}
                  className="w-full bg-[#161c24] border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Small">Small</option>
                  <option value="Medium">Medium</option>
                  <option value="Large">Large</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-4 flex gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-600/20 text-xs flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enrolling Member...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Enroll & Generate ID Card</span>
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-white/10 hover:bg-white/5 text-gray-300 rounded-xl text-xs px-4"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
