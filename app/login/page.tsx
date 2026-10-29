"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Landmark, Loader2, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setSession } from "@/lib/storage";
import { sleep } from "@/lib/utils";
import { BRAND } from "@/components/layout/nav";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@grantos.local");
  const [password, setPassword] = useState("demo-password");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await sleep(700);
    setSession(email || "demo@grantos.local");
    router.push("/dashboard");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-12 text-white lg:flex">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
        <div className="relative flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
            <Landmark className="size-5" />
          </div>
          <div>
            <div className="text-lg font-semibold">{BRAND.name}</div>
            <div className="text-xs text-sidebar-muted">{BRAND.subtitle}</div>
          </div>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">The operating system for grant consultancies.</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-sidebar-foreground">
            Discover federal funding, evaluate eligibility, manage applications, and coordinate every document and review — from first match to Grants.gov handoff.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-sidebar-border pt-6">
            {[
              ["Discovery", "Client ↔ grant matching"],
              ["Preparation", "Writing, budget & compliance"],
              ["Handoff", "Grants.gov submission tracking"],
            ].map(([t, d]) => (
              <div key={t}>
                <div className="text-sm font-medium text-white">{t}</div>
                <div className="mt-1 text-xs text-sidebar-muted">{d}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative flex items-center gap-2 text-xs text-sidebar-muted">
          <ShieldCheck className="size-4" /> Demo environment · sample data only
        </div>
      </div>
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
              <Landmark className="size-4" />
            </div>
            <span className="text-lg font-semibold">{BRAND.name}</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">Welcome back. Sign in to your funding operations workspace.</p>
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <span className="text-xs text-muted-foreground">Any password works</span>
              </div>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Lock />}
              {loading ? "Signing in…" : "Sign in"}
              {!loading && <ArrowRight className="ml-auto" />}
            </Button>
          </form>
          <div className="mt-6 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Demo credentials:</span> demo@grantos.local · any password
          </div>
        </div>
      </div>
    </div>
  );
}
