import React, { createContext, useEffect, useState } from "react";
import { supabase } from "./services/supabase";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { meApi, setAuthFromSupabase } from "./services/api";

export const UserContext = createContext(null);

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);

  useEffect(() => {
    let mounted = true;
    // initialize session and user
    async function init() {
      try {
        const { data } = await supabase.auth.getSession();
        const initialSession = data?.session ?? null;
        if (!mounted) return;
        setSession(initialSession);
        setLoading(false);

        if (initialSession) {
          // configure API auth and load current user
          try {
            await setAuthFromSupabase();
            const userInfo = await meApi.get();
            if (mounted) setMe(userInfo ?? null);
          } catch (err) {
            console.error("Failed to fetch /me on init:", err);
            if (mounted) setMe(null);
          }
        } else {
          if (mounted) setMe(null);
        }
      } catch (err) {
        console.error("Failed to get initial session:", err);
        if (mounted) {
          setSession(null);
          setMe(null);
          setLoading(false);
        }
      }
    }

    init();

    // subscribe to auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      const sess = newSession ?? null;
      if (!mounted) return;
      setSession(sess);

      if (sess) {
        try {
          await setAuthFromSupabase();
          const userInfo = await meApi.get();
          if (mounted) setMe(userInfo ?? null);
        } catch (err) {
          console.error("Failed to fetch /me on auth change:", err);
          if (mounted) setMe(null);
        }
      } else {
        if (mounted) setMe(null);
      }
    });

    return () => {
      mounted = false;
      try {
        listener?.subscription?.unsubscribe?.();
      } catch (e) {
        // ignore
      }
    };
  }, []);

  if (loading) return null;

  if (!session) {
    return <Login />;
  }

  return (
    <UserContext.Provider value={{ user: me, setUser: setMe }}>
      <Dashboard session={session} onSignOut={() => supabase.auth.signOut()} />
    </UserContext.Provider>
  );
}
