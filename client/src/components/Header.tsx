import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

export default function Header() {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4"
    >
      <div className="flex items-center gap-1 p-1.5 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-black/20 rounded-full">
        {/* Logo Section */}
        <Link
          to="/"
          className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-slate-800/50 transition-colors"
        >
          <img src="/medlm-icon.svg" className="w-7 h-7 rounded-lg shadow-sm" alt="MedLM" />
          <span className="font-bold tracking-tight text-white text-sm">
            MedLM
          </span>
        </Link>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-700 mx-1"></div>

        {/* Nav Links */}
        {/*<nav className="hidden md:flex items-center">
          <Link
            to="/"
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Product
          </Link>
          <Link
            to="/"
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Science
          </Link>
          <Link
            to="/"
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Security
          </Link>
        </nav>*/}

        {/* Action Buttons */}
        <div className="flex items-center gap-1 pl-1">
          <Link
            to="/login"
            className="px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Log in
          </Link>
          <Link
            to="/login"
            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-full transition-all hover:shadow-lg hover:shadow-blue-600/30"
          >
            Get Started
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
