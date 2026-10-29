"use client";

import { useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import { 
  Shirt, 
  Sparkles, 
  Search, 
  Download, 
  CheckCircle2, 
  Loader2, 
  User, 
  MapPin, 
  CreditCard,
  Ruler,
  Footprints
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveMyCostumeSizes } from "./actions";
import { exportToRealExcel } from "@/lib/export-excel";
import { exportToCsv } from "@/lib/export-csv";
import { parseCampuses } from "@/lib/campuses";
import { IdCardModal } from "@/components/dashboard/id-card-modal";

export interface CostumeMember {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  role: string;
  leadershipRole?: string | null;
  memberId: string;
  campusZone: string;
  shoeSize: string | null;
  trouserSize: string | null;
  topSize: string | null;
  updatedAt: string | null;
}

interface CostumesClientProps {
  initialMySizes: {
    shoeSize: string;
    trouserSize: string;
    topSize: string;
  };
  membersRoster: CostumeMember[];
  canViewRoster: boolean;
  facultySlug: string;
}

export function CostumesClient({
  initialMySizes,
  membersRoster,
  canViewRoster,
  facultySlug,
}: CostumesClientProps) {
  // My Form State
  const [shoeSize, setShoeSize] = useState(initialMySizes.shoeSize || "");
  const [trouserSize, setTrouserSize] = useState(initialMySizes.trouserSize || "");
  const [topSize, setTopSize] = useState(initialMySizes.topSize || "Medium");
  const [isSaving, setIsSaving] = useState(false);

  // Roster Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [campusFilter, setCampusFilter] = useState("ALL");

  // ID Card Modal
  const [selectedMemberForId, setSelectedMemberForId] = useState<CostumeMember | null>(null);

  // Save My Sizes
  const handleSaveSizes = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const res = await saveMyCostumeSizes({
      shoeSize,
      trouserSize,
      topSize,
    });
    setIsSaving(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Costume sizes saved successfully!");
    }
  };

  // Available unique campuses
  const availableCampuses = useMemo(() => {
    const set = new Set<string>();
    membersRoster.forEach((m) => {
      if (m.campusZone) {
        parseCampuses(m.campusZone).forEach((c) => set.add(c));
      }
    });
    return Array.from(set).sort();
  }, [membersRoster]);

  // Filtered Roster
  const filteredMembers = useMemo(() => {
    return membersRoster.filter((m) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        if (!m.fullName.toLowerCase().includes(q) && !m.memberId.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (campusFilter !== "ALL") {
        const campuses = parseCampuses(m.campusZone);
        if (!campuses.includes(campusFilter)) {
          return false;
        }
      }
      return true;
    });
  }, [membersRoster, searchTerm, campusFilter]);

  // Sizing Stats
  const stats = useMemo(() => {
    const total = membersRoster.length;
    const completed = membersRoster.filter(
      (m) => m.shoeSize || m.trouserSize || m.topSize
    ).length;
    const topCounts: Record<string, number> = {};
    membersRoster.forEach((m) => {
      if (m.topSize) {
        topCounts[m.topSize] = (topCounts[m.topSize] || 0) + 1;
      }
    });
    return { total, completed, pending: total - completed, topCounts };
  }, [membersRoster]);

  // Export Sizing Sheet
  const handleExportExcel = () => {
    const columns = [
      { header: "S/N", key: "sn", width: 6 },
      { header: "Member ID", key: "memberId", width: 16 },
      { header: "Full Name", key: "fullName", width: 28 },
      { header: "Campus / Zone", key: "campus", width: 24 },
      { header: "Shoe Size", key: "shoeSize", width: 14 },
      { header: "Trouser Size", key: "trouserSize", width: 16 },
      { header: "Top Size", key: "topSize", width: 14 },
    ];
    const data = filteredMembers.map((m, idx) => ({
      sn: idx + 1,
      memberId: m.memberId,
      fullName: m.fullName,
      campus: m.campusZone ? parseCampuses(m.campusZone).join(", ") : "—",
      shoeSize: m.shoeSize || "Pending",
      trouserSize: m.trouserSize || "Pending",
      topSize: m.topSize || "Pending",
    }));

    exportToRealExcel({
      filename: `Eden_Costume_Sizing_${new Date().toISOString().split("T")[0]}`,
      sheetName: "Costumes",
      columns,
      data,
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 dark:border-white/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-2">
              <Shirt className="w-3.5 h-3.5" />
              <span>Dance Faculty Wardrobe</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Costume Sizing & Distribution
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-xl">
              Keep your measurements up to date so the Loveworld Arts Academy costume department can prepare custom attire for productions and events.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: Personal Measurements Form */}
      <div className="bg-white dark:bg-[#0c0f13] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Ruler className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              My Costume Measurements
            </h2>
            <p className="text-xs text-gray-500">
              Provide your sizes so costume coordinators can allocate matching outfits.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveSizes} className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          {/* Shoe Size */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Footprints className="w-3.5 h-3.5 text-emerald-500" />
              Shoe Size
            </label>
            <input
              type="text"
              value={shoeSize}
              onChange={(e) => setShoeSize(e.target.value)}
              placeholder="e.g. 40, 42, 44"
              className="w-full bg-gray-50 dark:bg-[#141920] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[10px] text-gray-400">EU or standard sizing</p>
          </div>

          {/* Trouser Size */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 text-emerald-500" />
              Trouser / Pant Size
            </label>
            <input
              type="text"
              value={trouserSize}
              onChange={(e) => setTrouserSize(e.target.value)}
              placeholder="e.g. 30, 32, 34 or M, L"
              className="w-full bg-gray-50 dark:bg-[#141920] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[10px] text-gray-400">Waist measurement or letter size</p>
          </div>

          {/* Top Size */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Shirt className="w-3.5 h-3.5 text-emerald-500" />
              Top / Shirt Size
            </label>
            <select
              value={topSize}
              onChange={(e) => setTopSize(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#141920] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Extra Small">Extra Small (XS)</option>
              <option value="Small">Small (S)</option>
              <option value="Medium">Medium (M)</option>
              <option value="Large">Large (L)</option>
              <option value="XL">Extra Large (XL)</option>
              <option value="XXL">Double XL (XXL)</option>
              <option value="3XL">Triple XL (3XL)</option>
            </select>
            <p className="text-[10px] text-gray-400">T-Shirt, Jacket, or Tunic size</p>
          </div>

          <div className="sm:col-span-3 pt-2">
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Save Measurements</span>
            </Button>
          </div>
        </form>
      </div>

      {/* SECTION 2: Leaders & Coordinators Roster Table */}
      {canViewRoster && (
        <div className="space-y-6 pt-4">
          {/* Summary Metric Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#0c0f13] border border-gray-200 dark:border-white/10 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Members</span>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="bg-white dark:bg-[#0c0f13] border border-gray-200 dark:border-white/10 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">Sizes Provided</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.completed}</p>
            </div>
            <div className="bg-white dark:bg-[#0c0f13] border border-gray-200 dark:border-white/10 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Pending Sizes</span>
              <p className="text-2xl font-black text-amber-500 mt-1">{stats.pending}</p>
            </div>
            <div className="bg-white dark:bg-[#0c0f13] border border-gray-200 dark:border-white/10 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Top Sizes Logged</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {Object.entries(stats.topCounts).slice(0, 3).map(([size, count]) => (
                  <span key={size} className="text-[10px] font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-300">
                    {size}: {count}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Roster Table Card */}
          <div className="bg-white dark:bg-[#0c0f13] border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Member Costume Roster
                </h3>
                <p className="text-xs text-gray-500">
                  Visible to Coordinators, Leaders, and Admins for uniform planning.
                </p>
              </div>

              {/* Export Button */}
              <Button
                onClick={handleExportExcel}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Export Sizing Excel (.xlsx)</span>
              </Button>
            </div>

            {/* Search and Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="relative sm:col-span-2">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by member name or ID..."
                  className="w-full bg-gray-50 dark:bg-[#141920] border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <select
                value={campusFilter}
                onChange={(e) => setCampusFilter(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#141920] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">All Campuses</option>
                {availableCampuses.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/10">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">ID Number</th>
                    <th className="py-3 px-4">Campus / Zone</th>
                    <th className="py-3 px-4">Shoe</th>
                    <th className="py-3 px-4">Trouser</th>
                    <th className="py-3 px-4">Top Size</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 font-bold flex items-center justify-center shrink-0">
                            {m.fullName.charAt(0)}
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {m.fullName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                        {m.memberId}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300 max-w-[180px] truncate">
                        {m.campusZone ? parseCampuses(m.campusZone).join(", ") : "—"}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {m.shoeSize ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                            {m.shoeSize}
                          </span>
                        ) : (
                          <span className="text-gray-400">Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {m.trouserSize ? (
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                            {m.trouserSize}
                          </span>
                        ) : (
                          <span className="text-gray-400">Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {m.topSize ? (
                          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold">
                            {m.topSize}
                          </span>
                        ) : (
                          <span className="text-gray-400">Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedMemberForId(m)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>ID Card</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredMembers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400 text-xs">
                        No members found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ID Card Modal */}
      {selectedMemberForId && (
        <IdCardModal
          isOpen={!!selectedMemberForId}
          onClose={() => setSelectedMemberForId(null)}
          member={{
            fullName: selectedMemberForId.fullName,
            memberId: selectedMemberForId.memberId,
            campusZone: selectedMemberForId.campusZone,
            avatarUrl: selectedMemberForId.avatarUrl,
            role: selectedMemberForId.role,
          }}
        />
      )}
    </div>
  );
}

