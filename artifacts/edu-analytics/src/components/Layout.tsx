import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  MessageSquare, 
  LogOut, 
  User,
  GraduationCap,
  ChevronRight,
  Bell,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Messages", href: "/messages", icon: MessageSquare },
  ];

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen flex bg-transparent">
      {/* Sidebar */}
      <aside className="hidden h-screen w-72 shrink-0 flex-col border-r border-slate-200/70 bg-[#f7f3ec]/80 px-5 py-6 backdrop-blur md:flex">
        <div className="mb-8 flex items-center gap-3 px-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-lg font-bold tracking-tight text-slate-950">EduMetrics</p>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">Insight Hub</p>
          </div>
        </div>

        <div className="surface-panel hero-glow mb-6 overflow-hidden rounded-[1.75rem] border-none p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">Workspace</p>
          <h2 className="mt-3 font-display text-2xl font-bold leading-tight">Plan, monitor, and respond faster.</h2>
          <p className="mt-3 text-sm leading-6 text-white/75">
            A cleaner control center for attendance, outcomes, and messaging.
          </p>
        </div>

        <div className="flex-1 space-y-2">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Navigation</p>
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-200 font-medium",
                  isActive 
                    ? "bg-slate-950 text-white shadow-lg shadow-slate-950/10" 
                    : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="flex-1">{item.name}</span>
                <ChevronRight className={cn(
                  "h-4 w-4 transition-transform",
                  isActive ? "translate-x-0 text-white/70" : "translate-x-[-4px] opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                )} />
              </Link>
            );
          })}
        </div>

        <div className="surface-panel rounded-[1.5rem] p-3">
          <div className="mb-3 flex items-center gap-3 rounded-2xl bg-slate-50/80 px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{user.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-medium text-slate-600 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-5 w-5" />
            <span className="flex-1">Log Out</span>
            <ChevronRight className="h-4 w-4 opacity-60" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/70 bg-[#f7f3ec]/90 px-4 backdrop-blur md:hidden">
          <div className="flex items-center gap-2 font-display text-lg font-bold text-primary">
            <GraduationCap className="h-5 w-5" />
            <span>EduMetrics</span>
          </div>
          <button onClick={logout} className="rounded-xl p-2 text-slate-600 hover:bg-white">
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mx-auto max-w-7xl"
          >
            <div className="mb-6 hidden items-center justify-between gap-4 md:flex">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Academic Analytics Platform</p>
                <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950">Operational overview</h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="surface-panel hidden min-w-[240px] items-center gap-3 rounded-2xl px-4 py-3 lg:flex">
                  <Search className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-400">Search students, courses, or alerts</span>
                </div>
                <button className="surface-panel flex h-12 w-12 items-center justify-center rounded-2xl text-slate-600 transition-colors hover:text-slate-950">
                  <Bell className="h-5 w-5" />
                </button>
              </div>
            </div>
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
