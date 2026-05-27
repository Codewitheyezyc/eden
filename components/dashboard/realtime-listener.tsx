"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/services/supabase/client";

export function RealtimeDashboardListener({ facultyId }: { facultyId: string }) {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // We want to listen to changes in the database that affect the dashboard.
    // Specially user_faculties (new students joining, role changes), reports, and events.
    
    const channel = supabase.channel(`dashboard-realtime-${facultyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_faculties",
          filter: `faculty_id=eq.${facultyId}`
        },
        (payload: any) => {
          console.log("Realtime update (user_faculties):", payload);
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reports",
          filter: `faculty_id=eq.${facultyId}`
        },
        (payload: any) => {
          console.log("Realtime update (reports):", payload);
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
          filter: `faculty_id=eq.${facultyId}`
        },
        (payload: any) => {
          console.log("Realtime update (events):", payload);
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "announcements",
          filter: `faculty_id=eq.${facultyId}`
        },
        (payload: any) => {
          console.log("Realtime update (announcements):", payload);
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "courses",
          filter: `faculty_id=eq.${facultyId}`
        },
        (payload: any) => {
          console.log("Realtime update (courses):", payload);
          router.refresh();
        }
      )
      .subscribe((status: any) => {
        console.log("Realtime subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [facultyId, router, supabase]);

  return null; // This component doesn't render anything visually
}
