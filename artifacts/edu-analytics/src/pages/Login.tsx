import { useState } from "react";
import { Link } from "wouter";
import { useLoginUser } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowRight,
  GraduationCap,
  LineChart,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login } = useAuth();
  const loginMutation = useLoginUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await loginMutation.mutateAsync({
        data: { email, password },
      });

      login(response.access_token, {
        id: 0,
        name: response.name,
        email,
        role: response.role,
        status: response.status,
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.08fr_0.92fr]">
      <div className="hero-glow soft-grid relative hidden overflow-hidden lg:flex lg:min-h-screen lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_42%,rgba(255,255,255,0.08))]" />
        <div className="relative z-10 p-12 xl:p-16">
          <div className="mb-12 flex items-center gap-3 text-white/90">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="font-display text-3xl font-bold tracking-tight">EduMetrics</span>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Education Intelligence</p>
            </div>
          </div>

          <div className="max-w-xl">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.26em] text-white/80">
              Smarter academic operations
            </span>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.02] text-white xl:text-6xl">
              Turn attendance and performance into early action.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-white/72">
              Built for schools that want clearer signals, faster intervention, and a dashboard that actually feels trustworthy.
            </p>
          </div>
        </div>

        <div className="relative z-10 grid gap-4 p-12 pt-0 xl:grid-cols-3 xl:p-16 xl:pt-0">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur-md">
            <Sparkles className="h-5 w-5 text-amber-300" />
            <p className="mt-4 text-sm font-semibold text-white">Predictive visibility</p>
            <p className="mt-2 text-sm leading-6 text-white/68">Surface risk trends before they become retention problems.</p>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur-md">
            <LineChart className="h-5 w-5 text-cyan-300" />
            <p className="mt-4 text-sm font-semibold text-white">Live performance signals</p>
            <p className="mt-2 text-sm leading-6 text-white/68">Track course health, attendance, and engagement from one place.</p>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur-md">
            <ShieldCheck className="h-5 w-5 text-emerald-300" />
            <p className="mt-4 text-sm font-semibold text-white">Role-based workflows</p>
            <p className="mt-2 text-sm leading-6 text-white/68">Give students, teachers, and admins a cleaner focused experience.</p>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="surface-panel w-full max-w-xl rounded-[2rem] p-6 sm:p-8 lg:p-10">
          <div className="mb-10 flex items-center gap-3 text-primary">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display text-2xl font-bold text-slate-950">EduMetrics</span>
              <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Sign in</p>
            </div>
          </div>

          <div className="mb-10">
            <h2 className="mb-3 text-4xl font-bold text-slate-950">Welcome back</h2>
            <p className="max-w-md text-[15px] leading-7 text-slate-500">
              Sign in to continue managing interventions, monitoring outcomes, and keeping your school community aligned.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">Email Address</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-slate-900 transition-all placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                  placeholder="name@university.edu"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">Password</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-slate-900 transition-all placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-4 font-semibold text-white transition-all hover:bg-slate-800 disabled:opacity-70"
            >
              {loginMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Designed for a calmer, faster academic workflow.</span>
          </div>

          <p className="mt-8 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
