import { supabase } from "../services/supabase";

export default function Login() {
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin, // change later if you want /app
      },
    });
    if (error) alert(error.message);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">PayOrPray</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Log in to split bills… with consequences.
          </p>
        </div>

        <button
          onClick={signInWithGoogle}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium hover:bg-muted transition"
        >
          Continue with Google
        </button>

        <p className="mt-4 text-xs text-muted-foreground">
          By continuing, you agree to our terms and acknowledge our privacy policy.
        </p>
      </div>
    </div>
  );
}
