"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (size: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  className?: string;
}

export function TablePagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [15, 25, 50, 100],
  itemLabel = "items",
  className,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (validPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(validPage * itemsPerPage, totalItems);

  // Generate ellipsis page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (validPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (validPage >= totalPages - 3) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", validPage - 1, validPage, validPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  if (totalItems === 0) return null;

  return (
    <div
      className={cn(
        "bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-3.5 sm:p-4 md:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs",
        className
      )}
    >
      {/* Left: Summary Count & Page Size Selector */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-gray-500 dark:text-gray-400">
        <p className="font-medium">
          Showing <strong className="text-gray-900 dark:text-white font-bold">{startItem}</strong> to{" "}
          <strong className="text-gray-900 dark:text-white font-bold">{endItem}</strong> of{" "}
          <strong className="text-gray-900 dark:text-white font-bold">{totalItems}</strong> {itemLabel}
        </p>

        {onItemsPerPageChange && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200 dark:border-white/10">
            <span className="text-[11px] text-gray-400">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 rounded-lg px-2 py-1 text-[11px] font-bold text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-white dark:bg-[#111]">
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page Navigation Controls */}
      <div className="flex items-center gap-1">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(validPage - 1)}
          disabled={validPage <= 1}
          className="p-1.5 sm:p-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
          title="Previous Page"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Chips */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((pageNum, i) => {
            if (pageNum === "...") {
              return (
                <span key={`ellipsis-${i}`} className="px-1.5 py-1 text-xs text-gray-400 select-none">
                  ...
                </span>
              );
            }
            const num = Number(pageNum);
            const isActive = num === validPage;
            return (
              <button
                key={num}
                onClick={() => onPageChange(num)}
                className={cn(
                  "min-w-[32px] h-8 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center",
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-extrabold"
                    : "border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
                )}
              >
                {num}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={() => onPageChange(validPage + 1)}
          disabled={validPage >= totalPages}
          className="p-1.5 sm:p-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
          title="Next Page"
          aria-label="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

