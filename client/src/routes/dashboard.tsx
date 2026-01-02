import { createFileRoute, Outlet, Link, useLocation } from '@tanstack/react-router'
import {
  Layout,
  FileText,
  Activity,
  Clock,
  File,
  LogOut,
  Sparkles,
  Search,
  Bell,
  User as UserIcon,
  Loader2
} from 'lucide-react'
import { useSession, authClient } from '../lib/auth-client'

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
})

function DashboardLayout() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  // Auth redirect commented out for dev as requested
  /*
  if (!session) {
     window.location.href = '/login'
     return null
  }
  */

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 z-10 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white">
              <Sparkles size={16} fill="currentColor" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-slate-900">MedLM</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem to="/dashboard" icon={Layout} label="Overview" exact />
          <NavItem to="/dashboard/records" icon={FileText} label="Records" />
          <NavItem to="/dashboard/analysis" icon={Activity} label="Analysis" />
          <div className="pt-4 pb-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Workspace</div>
            <NavItem to="/dashboard/timeline" icon={Clock} label="Timeline" />
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
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10 w-full">
          <div className="relative w-full max-w-md hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Ask about your health history..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium text-sm border border-blue-200">
              {session?.user?.name?.[0] || <UserIcon size={16} />}
            </div>
          </div>
        </header>

        {/* Child Route Content */}
        <Outlet />
      </main>
    </div>
  )
}

function NavItem({ icon: Icon, label, to, exact }: { icon: any, label: string, to: string, exact?: boolean }) {
  const location = useLocation()
  // Simple active check for demo/dev speed, ideally use Link logic or robust matching
  const isActive = exact ? location.pathname === to : location.pathname.startsWith(to)

  return (
    <Link
      to={to}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
    >
      <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
      {label}
    </Link>
  )
}
