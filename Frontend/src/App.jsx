import React from "react";
import { useEffect, useState } from "react";
import { supabase } from "./services/supabase";
import Login from "./pages/Login";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) return null;

  if (!session) return <Login/>;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-xl mx-auto rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xl font-semibold">You’re in ✅</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Signed in as <span className="font-medium">{session.user.email}</span>
        </p>

        <button
          onClick={() => supabase.auth.signOut()}
          className="mt-6 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}