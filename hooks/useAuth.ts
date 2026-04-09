"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@/types";

/**
 * Hook for managing auth state.
 * Replace placeholder logic with Supabase Auth listener.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Subscribe to Supabase auth state changes
    // const { data: { subscription } } = supabase.auth.onAuthStateChange(...)
    setLoading(false);

    return () => {
      // subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    // TODO: Implement sign in
    console.log("signIn", email, password);
  };

  const signUp = async (email: string, password: string, metadata: Record<string, string>) => {
    // TODO: Implement sign up
    console.log("signUp", email, metadata);
  };

  const signOut = async () => {
    // TODO: Implement sign out
    await supabase.auth.signOut();
    setUser(null);
  };

  return { user, loading, signIn, signUp, signOut };
}
