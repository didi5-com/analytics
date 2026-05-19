import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useRegisterUser } from "@workspace/api-client-react";
import {
  ArrowRight,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  Shield,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher" | "admin">("student");
  const [error, setError] = useState("");

  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegisterUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await registerMutation.mutateAsync({
        data: { name, email, password, role },
      });
      toast({ title: "Account created! Please log in." });
      setLocation("/login");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[0.94fr_1.06fr]">
      <div className="flex w-full items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="surface-panel w-full max-w-xl rounded-[2rem] p-6 sm:p-8 lg:p-10">
          <div className="mb-10 flex items-center gap-3 text-primary">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display text-2xl font-bold text-slate-950">EduMetrics</span>
              <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Create account</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="mb-3 text-4xl font-bold text-slate-950">Create an account</h2>
            <p className="max-w-md text-[15px] leading-7 text-slate-500">
              Join the platform to monitor progress, collaborate across roles, and act on the signals that matter sooner.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">Full Name</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-slate-900 transition-all placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                  placeholder="John Doe"
                />
              </div>
            </div>

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
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-slate-900 transition-all placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                  placeholder="Use at least 6 characters"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">Role</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  <Shield className="h-5 w-5" />
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "student" | "teacher" | "admin")}
                  className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-slate-900 transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher (Requires Approval)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-4 font-semibold text-white transition-all hover:bg-slate-800 disabled:opacity-70"
            >
              {registerMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Teachers can register now and wait for admin approval after signup.</span>
          </div>

          <p className="mt-8 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <div className="hero-glow soft-grid relative hidden overflow-hidden lg:flex lg:min-h-screen lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.16),transparent_18%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_55%)]" />
        <div className="relative z-10 p-12 xl:p-16">
          <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.26em] text-white/80">
            Multi-role collaboration
          </span>
          <h1 className="mt-6 max-w-xl font-display text-5xl font-bold leading-[1.02] text-white xl:text-6xl">
            Build a shared view of student progress from day one.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-white/72">
            Students, teachers, and admins all start from the same insight system, but each gets a cleaner workflow tailored to what they need to do.
          </p>
        </div>

        <div className="relative z-10 grid gap-4 p-12 pt-0 xl:grid-cols-2 xl:p-16 xl:pt-0">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-6 backdrop-blur-md">
            <Users className="h-5 w-5 text-cyan-300" />
            <p className="mt-4 text-sm font-semibold text-white">Clearer coordination</p>
            <p className="mt-2 text-sm leading-6 text-white/68">Messaging and dashboards stay connected so interventions happen sooner.</p>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-6 backdrop-blur-md">
            <Shield className="h-5 w-5 text-amber-300" />
            <p className="mt-4 text-sm font-semibold text-white">Safer onboarding</p>
            <p className="mt-2 text-sm leading-6 text-white/68">Approval workflows help schools keep teacher access controlled and auditable.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
