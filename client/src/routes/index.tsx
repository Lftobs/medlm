import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState, lazy, Suspense, useEffect, memo } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import Header from "../components/Header";
import Skeleton from "../components/Skeleton";

const BentoGridFeatures = lazy(() => import("../components/BentoGridFeatures"));
const Testimonials = lazy(() => import("../components/Testimonials"));
const Footer = lazy(() => import("../components/Footer"));

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  useEffect(() => {
    const domains = ["fonts.googleapis.com", "fonts.gstatic.com"];
    domains.forEach((domain) => {
      const link = document.createElement("link");
      link.rel = "dns-prefetch";
      link.href = `//${domain}`;
      document.head.appendChild(link);
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden">
      <Header />
      <HeroAccordionSection />
      <Suspense
        fallback={
          <div className="py-32">
            <Skeleton className="h-64 w-full max-w-4xl mx-auto" />
          </div>
        }
      >
        <BentoGridFeatures />
        <Testimonials />
        <Footer />
      </Suspense>
    </div>
  );
}

const accordionFeatures = [
  {
    id: "dashboard",
    title: "Health Narrative",
    description:
      "Get a comprehensive summary of your medical history. MedLM organizes your records into a clear narrative to facilitate discussion with your clinician.",
    image: "/mockups/dashboard.png",
  },
  {
    id: "timeline",
    title: "Timeline View",
    description:
      "Every doctor's visit, lab result, and prescription organized chronologically. Navigate through years of health history with an intuitive vertical timeline.",
    image: "/mockups/timeline.png",
  },
  {
    id: "chat",
    title: "Health IQ Chat",
    description:
      "Ask questions like 'When was my last Tetanus shot?' or 'Show me recent blood results.' Get answers based strictly on your uploaded records, with citations.",
    image: "/mockups/chat.png",
  },
];

const HeroAccordionSection = memo(() => {
  const [activeId, setActiveId] = useState("dashboard");
  const activeFeature = accordionFeatures.find((f) => f.id === activeId);

  useEffect(() => {
    const img = new Image();
    img.src = activeFeature?.image || "";
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = activeFeature?.image || "";
    link.fetchPriority = "high";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, [activeId]);

  return (
    <section className="min-h-screen pt-32 pb-20 relative overflow-hidden">
      {/* Animated Noise Background */}

      {/* Gradient Orbs */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-600 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 opacity-20" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[80px] translate-x-1/3 translate-y-1/3 opacity-10" />

      <div className="container mx-auto px-6 max-w-[1400px] relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-start">
          {/* LEFT: Header + Accordion */}
          <div className="pt-8">
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.05] tracking-tight"
            >
              Understand your health <br />
              <span className="text-blue-400">in plain language.</span>
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-lg text-slate-400 mb-10 max-w-lg leading-relaxed"
            >
              MedLM transforms your scattered medical records into a clear,
              organized summary. Built with Gemini 3.0.
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-7 py-4 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-500 transition-all hover:scale-105 shadow-lg shadow-blue-600/25 mb-16"
              >
                Start Your Narrative <ArrowRight size={16} />
              </Link>
            </motion.div>

            {/* Accordion Items */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="space-y-1"
            >
              {accordionFeatures.map((feature) => (
                <AccordionItem
                  key={feature.id}
                  feature={feature}
                  isActive={activeId === feature.id}
                  onClick={() => setActiveId(feature.id)}
                />
              ))}
            </motion.div>
          </div>

          {/* RIGHT: Dynamic Mockup Image */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative lg:sticky lg:top-32"
          >
            {/* Browser Frame */}
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
              {/* Toolbar */}
              <div className="h-11 bg-slate-800 border-b border-slate-700/50 flex items-center px-4 gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-700/50 rounded-lg text-xs text-slate-400">
                    <span className="text-green-400 text-[10px]">●</span>{" "}
                    medlm.app/dashboard
                  </div>
                </div>
              </div>

              {/* Image Content */}
              <div className="relative aspect-[4/3] bg-slate-900 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeId}
                    src={activeFeature?.image}
                    alt={activeFeature?.title}
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.4 }}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </AnimatePresence>
              </div>
            </div>

            {/* Floating Badge */}
            <motion.div
              animate={{
                y:
                  activeId === "dashboard"
                    ? 0
                    : activeId === "timeline"
                      ? 8
                      : 16,
              }}
              transition={{ duration: 0.5 }}
              className="absolute -bottom-6 -right-6 bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-xl z-20"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    activeId === "dashboard"
                      ? "bg-blue-500/20 text-blue-400"
                      : activeId === "timeline"
                        ? "bg-indigo-500/20 text-indigo-400"
                        : "bg-violet-500/20 text-violet-400"
                  }`}
                >
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">AI-Powered</div>
                  <div className="text-xs text-slate-400">
                    Gemini 3.0 Vision
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
});

const AccordionItem = memo(
  ({
    feature,
    isActive,
    onClick,
  }: {
    feature: any;
    isActive: boolean;
    onClick: () => void;
  }) => {
    return (
      <div
        onClick={onClick}
        className={`border-l-2 pl-6 py-5 cursor-pointer transition-all duration-300 ${
          isActive
            ? "border-blue-500 bg-slate-800/40"
            : "border-slate-700 hover:border-slate-500 hover:bg-slate-800/20"
        }`}
      >
        <h3
          className={`font-bold text-lg transition-colors ${isActive ? "text-white" : "text-slate-400"}`}
        >
          {feature.title}
        </h3>
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <p className="text-slate-400 text-sm leading-relaxed mt-3 pr-4">
                {feature.description}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  },
);
