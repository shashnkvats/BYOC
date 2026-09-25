"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "./supabase/browser";

/** Client-side hook exposing the current Supabase session + access token,
 * kept in sync via onAuthStateChange. Used by client components to call
 * the FastAPI backend with `Authorization: Bearer <access_token>`. */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return { session, loading, user: session?.user ?? null };
}
