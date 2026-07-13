import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { BookOpen, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot" | "otp-request" | "otp-verify";

function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<Mode>("signin");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user && mode !== "forgot") navigate({ to: "/" });
  }, [user, navigate, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created! You are now signed in.");
        navigate({ to: "/" });
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
        navigate({ to: "/" });
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Password reset link sent. Check your email.");
        setMode("signin");
      } else if (mode === "otp-request") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false },
        });
        if (error) throw error;
        toast.success("Verification code sent to your email.");
        setMode("otp-verify");
      } else if (mode === "otp-verify") {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token: code,
          type: "email",
        });
        if (error) throw error;
        toast.success("Verified. Welcome back.");
        navigate({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<Mode, { h: string; sub: string; btn: string }> = {
    signin: { h: "Welcome back", sub: "Sign in to manage the library", btn: "Sign in" },
    signup: { h: "Create account", sub: "For the author only", btn: "Create account" },
    forgot: { h: "Reset password", sub: "We'll email you a reset link", btn: "Send reset link" },
    "otp-request": { h: "Sign in with code", sub: "We'll email a 6-digit verification code", btn: "Send code" },
    "otp-verify": { h: "Enter code", sub: `Code sent to ${email}`, btn: "Verify & sign in" },
  };
  const t = titles[mode];
  const showPasswordField = mode === "signin" || mode === "signup";
  const showEmailField = mode !== "otp-verify";
  const showCodeField = mode === "otp-verify";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-up">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <BookOpen className="h-6 w-6 text-accent" />
          <span className="font-serif text-xl font-semibold">Stanley Samson Library</span>
        </Link>
        <Card className="p-8 shadow-[var(--shadow-elegant)] border-border/60">
          <div className="text-center mb-6">
            <h1 className="font-serif text-3xl font-semibold mb-1">{t.h}</h1>
            <p className="text-sm text-muted-foreground">{t.sub}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {showEmailField && (
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
              </div>
            )}
            {showPasswordField && (
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "signin" && (
                    <button type="button" onClick={() => setMode("forgot")} className="text-xs text-accent hover:underline font-medium">
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input id="password" type={showPassword ? "text" : "password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" />
                <label className="mt-2 flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                  <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} className="h-4 w-4 rounded border-border accent-accent" />
                  Show password
                </label>
              </div>
            )}
            {showCodeField && (
              <div>
                <Label htmlFor="code">6-digit code</Label>
                <Input id="code" inputMode="numeric" pattern="[0-9]*" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="mt-1.5 text-center tracking-[0.5em] text-lg font-mono" placeholder="000000" />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t.btn}
            </Button>
            {mode === "otp-verify" && (
              <button type="button" onClick={() => setMode("otp-request")} className="w-full text-xs text-muted-foreground hover:text-accent hover:underline">
                Use a different email
              </button>
            )}
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground space-y-2">
            {mode === "signin" && (
              <>
                <div>
                  <button onClick={() => setMode("otp-request")} className="text-accent hover:underline font-medium">
                    Sign in with email code instead
                  </button>
                </div>
                <div>New here? <button onClick={() => setMode("signup")} className="text-accent hover:underline font-medium">Create account</button></div>
              </>
            )}
            {mode === "signup" && (
              <>Already have an account? <button onClick={() => setMode("signin")} className="text-accent hover:underline font-medium">Sign in</button></>
            )}
            {(mode === "forgot" || mode === "otp-request" || mode === "otp-verify") && (
              <button onClick={() => setMode("signin")} className="text-accent hover:underline font-medium">
                ← Back to sign in
              </button>
            )}
          </div>
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-6">
          Visitors can browse the shelf without an account.{" "}
          <Link to="/" className="hover:underline">Back to library →</Link>
        </p>
      </div>
    </div>
  );
}
