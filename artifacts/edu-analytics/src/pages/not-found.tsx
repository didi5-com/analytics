import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 text-center">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-display font-bold text-slate-900 mb-2">404</h1>
        <p className="text-lg font-medium text-slate-600 mb-8">Page not found</p>
        <p className="text-slate-500 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link 
          href="/dashboard" 
          className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
