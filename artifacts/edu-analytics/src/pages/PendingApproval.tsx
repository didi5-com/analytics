import { useAuth } from "@/hooks/use-auth";
import { Clock, LogOut, ShieldCheck } from "lucide-react";

export default function PendingApproval() {
  const { logout } = useAuth();

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <div className="surface-panel max-w-xl w-full rounded-[2rem] p-8 text-center">
        <div className="mx-auto mb-6 flex h-18 w-18 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <Clock className="h-8 w-8" />
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
          <ShieldCheck className="h-3.5 w-3.5" />
          Approval workflow active
        </span>
        <h1 className="mb-3 mt-5 text-3xl font-bold text-slate-950">Account Pending Approval</h1>
        <p className="mb-8 leading-8 text-slate-600">
          Your teacher account has been created and is currently awaiting administrator approval.
          You will be able to access the dashboard once your account is activated.
        </p>
        <button
          onClick={logout}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 font-semibold text-white transition-colors hover:bg-slate-800"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </button>
      </div>
    </div>
  );
}
