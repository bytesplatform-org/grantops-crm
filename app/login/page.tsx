"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileCheck2, Landmark, Loader2, Search, Send, ShieldCheck, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setSession } from "@/lib/storage";
import { sleep } from "@/lib/utils";
import { BRAND } from "@/components/layout/nav";

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Search, title: "Discover", body: "Match clients to federal opportunities with explainable fit scores." },
  { icon: FileCheck2, title: "Prepare", body: "Writing, budgets, documents and compliance in one workspace." },
  { icon: Send, title: "Hand off", body: "Track the Grants.gov submission your team files — through award." },
];

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-9 items-center justify-center rounded-full bg-brand text-brand-foreground">
        <Landmark className="size-[18px]" />
      </div>
      <div className="leading-tight">
        <div className={dark ? "text-[19px] font-bold tracking-tight text-white" : "text-[19px] font-bold tracking-tight"}>{BRAND.name}</div>
        <div className={dark ? "text-[11px] text-sidebar-muted" : "text-[11px] text-muted-foreground"}>{BRAND.subtitle}</div>
      </div>
    </div>
  );
}

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
    <div className="flex min-h-screen bg-frame p-3">
      <aside className="hidden flex-1 flex-col justify-between px-9 py-8 text-white lg:flex">
        <Logo dark />
        <div className="max-w-lg">
          <h1 className="text-[34px] font-semibold leading-[1.15] tracking-tight">
            The operating system for <span className="text-brand">grant consultancies</span>.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-sidebar-foreground">
            Find federal funding, evaluate eligibility, and run every application from first match to Grants.gov handoff.
          </p>
          <ul className="mt-9 space-y-2.5">
            {STEPS.map((s) => (
              <li key={s.title} className="flex items-start gap-3.5 rounded-2xl bg-sidebar-accent/70 p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
                  <s.icon className="size-[18px]" />
                </span>
                <div>
                  <div className="text-[15px] font-medium text-white">{s.title}</div>
                  <div className="mt-0.5 text-[13px] leading-snug text-sidebar-foreground">{s.body}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-sidebar-muted">
          <ShieldCheck className="size-4" /> Demo environment · sample data only
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center rounded-[24px] bg-background px-6 py-12 lg:max-w-[600px]">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          <h2 className="text-[28px] font-bold tracking-tight">Sign in</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">Welcome back to your funding operations workspace.</p>
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="h-11 bg-zinc-50 px-3.5" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <span className="text-xs text-muted-foreground">Any password works</span>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="h-11 bg-zinc-50 px-3.5"
              />
            </div>
            <Button type="submit" className="h-11 w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  Sign in <ArrowRight />
                </>
              )}
            </Button>
          </form>
          <div className="mt-6 flex items-center gap-2.5 rounded-xl bg-zinc-50 px-3.5 py-3 text-[13px] text-muted-foreground">
            <span className="size-2 shrink-0 rounded-full bg-brand ring-2 ring-brand/30" />
            <span>
              <span className="font-medium text-foreground">Demo credentials:</span> demo@grantos.local · any password
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
