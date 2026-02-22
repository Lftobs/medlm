import {
  createFileRoute,
  Outlet,
  Link,
  useLocation,
} from "@tanstack/react-router";
import {
  Layout,
  FileText,
  Activity,
  Clock,
  File,
  LogOut,
  Loader2,
  TrendingUp,
  BarChart,
} from "lucide-react";
import { useSession, authClient } from "../lib/auth-client";
import { DashboardHeader } from "../components/DashboardHeader";
import { MultiSessionIndicator } from "../components/MultiSessionIndicator";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!session) {
    window.location.href = "/login";
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 z-10 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-3">
            <img src="/medlm-icon.svg" className="w-9 h-9 shadow-sm hover:scale-105 transition-transform" alt="MedLM" />
            <span className="text-xl font-semibold tracking-tight text-slate-900">
              MedLM
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem to="/dashboard" icon={Layout} label="Overview" exact />
          <NavItem to="/dashboard/records" icon={FileText} label="Records" />
          <NavItem to="/dashboard/chat" icon={Activity} label="Chat medlm" />
          <div className="pt-4 pb-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Workspace
            </div>
            <NavItem to="/dashboard/timeline" icon={Clock} label="Timeline" />
            <NavItem to="/dashboard/trends" icon={TrendingUp} label="Trends" />
            <NavItem to="/dashboard/charts" icon={BarChart} label="Charts" />
            <NavItem to="/dashboard/shared" icon={File} label="Shared Docs" />
          </div>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => authClient.signOut()}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
        {/* Header */}
        <DashboardHeader />

        {/* Child Route Content */}
        <Outlet />
        <MultiSessionIndicator />
      </main>
    </div>
  );
}

function NavItem({
  icon: Icon,
  label,
  to,
  exact,
}: {
  icon: any;
  label: string;
  to: string;
  exact?: boolean;
}) {
  const location = useLocation();
  const isActive = exact
    ? location.pathname === to
    : location.pathname.startsWith(to);

  return (
    <Link
      to={to}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
    >
      <Icon
        size={18}
        className={isActive ? "text-blue-600" : "text-slate-400"}
      />
      {label}
    </Link>
  );
}
