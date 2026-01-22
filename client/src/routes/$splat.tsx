import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Home, Sparkles } from "lucide-react";

export const Route = createFileRoute("/$splat")({
  component: NotFoundPage,
});

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans overflow-x-hidden relative">
      {/* Animated Noise Background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Gradient Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.25, 0.2],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-600 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2"
      />
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.15, 0.2, 0.15],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3"
      />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="max-w-2xl mx-auto text-center">
          {/* 404 Number */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative mb-8"
          >
            <div className="text-[12vw] md:text-[8vw] font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 leading-none tracking-tighter">
              404
            </div>
            {/* Floating sparkles */}
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -top-4 -right-4 text-blue-400"
            >
              <Sparkles size={32} />
            </motion.div>
            <motion.div
              animate={{
                y: [0, 10, 0],
                rotate: [0, -5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
              className="absolute -bottom-4 -left-4 text-indigo-400"
            >
              <Sparkles size={24} />
            </motion.div>
          </motion.div>

          {/* Error Message */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              Page Not Found
            </h1>
            <p className="text-lg text-slate-400 max-w-lg mx-auto leading-relaxed">
              The page you're looking for doesn't exist or has been moved.
              Let's get you back on track with your health journey.
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-500 transition-all hover:scale-105 shadow-lg shadow-blue-600/25"
            >
              <Home size={16} />
              Back to Home
            </Link>

            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-8 py-4 bg-slate-800 text-white rounded-full font-bold text-sm hover:bg-slate-700 transition-all hover:scale-105 border border-slate-700"
            >
              <ArrowLeft size={16} />
              Go Back
            </button>
          </motion.div>

          {/* Additional Help */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-16 pt-8 border-t border-slate-800"
          >
            <p className="text-sm text-slate-500 mb-4">
              Need help finding something specific?
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                to="/dashboard"
                className="px-4 py-2 bg-slate-800/50 text-slate-300 rounded-full text-sm hover:bg-slate-800 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/dashboard/chat"
                className="px-4 py-2 bg-slate-800/50 text-slate-300 rounded-full text-sm hover:bg-slate-800 hover:text-white transition-colors"
              >
                Health Chat
              </Link>
              <Link
                to="/dashboard/records"
                className="px-4 py-2 bg-slate-800/50 text-slate-300 rounded-full text-sm hover:bg-slate-800 hover:text-white transition-colors"
              >
                Records
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="text-[8vw] font-bold text-slate-700/20 leading-none select-none tracking-tighter">
          MedLM
        </div>
      </motion.div>
    </div>
  );
}
