import { Link } from '@tanstack/react-router'
import { Activity } from 'lucide-react'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-slate-200/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group transition-all">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-premium group-hover:scale-105 transition-transform">
            <Activity className="text-white" size={18} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Med<span className="text-primary">LM</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
            activeProps={{ className: 'text-primary' }}
          >
            Product
          </Link>
          <Link
            to="/"
            className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
          >
            Science
          </Link>
          <Link
            to="/"
            className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
          >
            Security
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-full transition-all"
          >
            Log in
          </Link>
          <Link
            to="/"
            className="px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-brand-600 rounded-full shadow-premium transition-all hover:translate-y-[-1px]"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  )
}
