import { useAuth } from "@/hooks/use-auth";
import StudentDashboard from "@/components/StudentDashboard";
import TeacherDashboard from "@/components/TeacherDashboard";
import AdminDashboard from "@/components/AdminDashboard";
import PendingApproval from "./PendingApproval";
import { Activity, BadgeCheck, CalendarClock, Sparkles } from "lucide-react";

const roleCopy = {
  student: {
    eyebrow: "Student workspace",
    title: "Stay ahead of your academic trajectory.",
    description: "Track your latest scores, attendance, and risk indicators in one calmer, clearer view.",
    badge: "Progress-focused",
  },
  teacher: {
    eyebrow: "Teacher workspace",
    title: "Manage records and respond faster.",
    description: "Review course health, update performance data, and spot students who need support sooner.",
    badge: "Action-ready",
  },
  admin: {
    eyebrow: "Admin workspace",
    title: "See the institution at a glance.",
    description: "Monitor approvals, user activity, and overall academic health from a more polished control center.",
    badge: "Operations-ready",
  },
} as const;

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  if (user.status === "pending") {
    return <PendingApproval />;
  }

  const copy = roleCopy[user.role];
  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-6">
      <header className="surface-panel relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,116,144,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.12),transparent_24%)]" />
        <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white">
                {copy.eyebrow}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                <BadgeCheck className="h-3.5 w-3.5" />
                {copy.badge}
              </span>
            </div>
            <h2 className="font-display text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Welcome back, {firstName}
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-600 sm:text-base">
              {copy.title} {copy.description}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[420px]">
            <div className="rounded-[1.5rem] bg-white/80 p-4 shadow-sm ring-1 ring-slate-100">
              <Sparkles className="h-5 w-5 text-primary" />
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Role</p>
              <p className="mt-1 text-sm font-bold capitalize text-slate-950">{user.role}</p>
            </div>
            <div className="rounded-[1.5rem] bg-white/80 p-4 shadow-sm ring-1 ring-slate-100">
              <Activity className="h-5 w-5 text-amber-500" />
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Status</p>
              <p className="mt-1 text-sm font-bold capitalize text-slate-950">{user.status}</p>
            </div>
            <div className="rounded-[1.5rem] bg-white/80 p-4 shadow-sm ring-1 ring-slate-100">
              <CalendarClock className="h-5 w-5 text-cyan-600" />
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Today</p>
              <p className="mt-1 text-sm font-bold text-slate-950">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </header>

      {user.role === "student" && <StudentDashboard />}
      {user.role === "teacher" && <TeacherDashboard />}
      {user.role === "admin" && <AdminDashboard />}
    </div>
  );
}
