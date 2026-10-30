import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Dumbbell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/owner/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Owner login — Muscle’s War Gym" },
      { name: "description", content: "Secure sign-in for the gym owner." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Owner login — Muscle’s War Gym" },
      { property: "og:description", content: "Secure sign-in for the gym owner." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "setup">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) return void toast.error("Enter a valid email and a password of at least 8 characters");
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return void toast.error(error.message);
      nav({ to: "/owner/dashboard" });
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/owner/login` } });
      setBusy(false);
      if (error) return void toast.error(error.message);
      toast.success("Check your email to confirm the account, then sign in.");
      setMode("in");
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-hero px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-3xl glass p-8 shadow-depth">
        <div className="flex items-center gap-2"><span className="grid h-10 w-10 place-items-center rounded-full bg-brand-gradient text-primary-foreground"><Dumbbell className="h-5 w-5" /></span><h1 className="text-xl font-bold">Owner {mode === "in" ? "sign in" : "setup"}</h1></div>
        {mode === "setup" && <p className="text-xs text-muted-foreground">Only the very first account created becomes the owner. Accounts created later get no access.</p>}
        <div><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><Label htmlFor="pw">Password</Label><Input id="pw" type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>{busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create owner account"}</Button>
        <button type="button" className="w-full text-xs text-muted-foreground hover:underline" onClick={() => setMode(mode === "in" ? "setup" : "in")}>{mode === "in" ? "First time? Set up the owner account" : "Back to sign in"}</button>
        <Link to="/" className="block text-center text-xs text-primary hover:underline">← Back to website</Link>
      </form>
    </div>
  );
}