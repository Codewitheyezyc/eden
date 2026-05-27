"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@/services/supabase/client";

interface SupportContextType {
  isOpen: boolean;
  openSupport: () => void;
  closeSupport: () => void;
  userEmail: string;
  userName: string;
}

const SupportContext = createContext<SupportContextType | undefined>(undefined);

export function SupportProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");

  const openSupport = () => setIsOpen(true);
  const closeSupport = () => setIsOpen(false);

  useEffect(() => {
    const supabase = createClient();

    const fetchSessionUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserEmail(session.user.email || "");
          
          // Try to fetch custom profile name if exists
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", session.user.id)
            .maybeSingle();
            
          if (profile?.full_name) {
            setUserName(profile.full_name);
          }
        }
      } catch (err) {
        console.error("Error fetching session user for support form:", err);
      }
    };

    fetchSessionUser();

    // Listen for auth state changes to update support info dynamically
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        try {
          if (session?.user) {
            setUserEmail(session.user.email || "");
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", session.user.id)
              .maybeSingle();
            if (profile?.full_name) {
              setUserName(profile.full_name);
            } else {
              setUserName("");
            }
          } else {
            setUserEmail("");
            setUserName("");
          }
        } catch (err) {
          console.error("Error in support-provider onAuthStateChange callback:", err);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SupportContext.Provider value={{ isOpen, openSupport, closeSupport, userEmail, userName }}>
      {children}
    </SupportContext.Provider>
  );
}

export function useSupport() {
  const context = useContext(SupportContext);
  if (!context) {
    throw new Error("useSupport must be used within a SupportProvider");
  }
  return context;
}
