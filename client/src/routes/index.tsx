import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Brain,
  FileText,
  Zap,
  Lock,
  CheckCircle2,
} from "lucide-react";
import Header from "../components/Header";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden">
      <Header />
      <HeroAccordionSection />
      <BentoGridFeatures />
      <Testimonials />
      <Footer />
    </div>
  );
}

// --- ANIMATED NOISE COMPONENT ---
function AnimatedNoise() {
  const [seed, setSeed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeed((prev) => (prev + 1) % 10);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.015]">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <filter id={`noise-${seed}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency={0.7 + seed * 0.02}
            numOctaves="4"
            seed={seed * 17}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#noise-${seed})`} />
      </svg>
    </div>
  );
}

const accordionFeatures = [
  {
    id: "dashboard",
    title: "Health Narrative",
    description:
      "Get an AI-generated summary of your complete medical history. MedLM reads thousands of pages and distills it into actionable insights you can share with your doctor.",
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
      "Ask questions in plain English like 'When was my last Tetanus shot?' or 'Show me all abnormal blood results.' Get instant, accurate answers with citations.",
    image: "/mockups/chat.png",
  },
];

function HeroAccordionSection() {
  const [activeId, setActiveId] = useState("dashboard");
  const activeFeature = accordionFeatures.find((f) => f.id === activeId);

  return (
    <section className="min-h-screen pt-32 pb-20 relative overflow-hidden">
      {/* Animated Noise Background */}
      <AnimatedNoise />

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
              The platform that <br />
              <span className="text-blue-400">understands you.</span>
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-lg text-slate-400 mb-10 max-w-lg leading-relaxed"
            >
              MedLM transforms your scattered medical records into an
              intelligent, interactive health narrative. Built with Gemini 3.0.
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
}

function AccordionItem({
  feature,
  isActive,
  onClick,
}: {
  feature: any;
  isActive: boolean;
  onClick: () => void;
}) {
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
}

// --- ENHANCED BENTO GRID FEATURES ---
function BentoGridFeatures() {
  return (
    <section className="py-32 bg-white text-slate-900 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />

      <div className="container mx-auto px-6 max-w-[1400px] relative z-10">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-24"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            Every Format. Just Works.
          </h2>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            From messy scanned PDFs to high-res DICOMs.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[350px]">
          {/* 10-Year Context - Large Card */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="md:col-span-2 row-span-2 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-[2.5rem] p-10 flex flex-col justify-between group hover:shadow-xl transition-all duration-500 border border-slate-100 relative overflow-hidden"
          >
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700" />

            <div className="relative z-10">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Brain size={28} className="text-blue-600" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                10-Year Context
              </h3>
              <p className="text-lg text-slate-500 leading-relaxed max-w-md">
                Gemini 3 analyzes your entire history at once. It finds
                connections a human doctor might miss across thousands of pages.
              </p>
            </div>

            {/* Visual Element - Animated Timeline */}
            <div className="relative z-10 mt-8 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm group-hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-600" />
                  <div className="w-0.5 h-10 bg-gradient-to-b from-blue-600 to-blue-200" />
                  <div className="w-3 h-3 rounded-full bg-blue-400" />
                  <div className="w-0.5 h-10 bg-gradient-to-b from-blue-400 to-blue-100" />
                  <div className="w-3 h-3 rounded-full bg-blue-200" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-700">
                      2024
                    </div>
                    <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      Latest
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "85%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
                    />
                  </div>
                  <div className="text-xs text-slate-400">
                    127 records analyzed
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Private by Design */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="md:col-span-2 bg-slate-900 rounded-[2.5rem] p-10 flex flex-col justify-between text-white relative overflow-hidden group"
          >
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: "20px 20px",
              }}
            />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Lock size={24} className="text-emerald-400" />
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-3">Private by Design</h3>
              <p className="text-slate-400 text-lg max-w-xs">
                Zero model training on your data. Your health information never
                leaves your control.
              </p>

              {/* Security badges */}
              <div className="flex gap-3 mt-6">
                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-2 rounded-full">
                  <CheckCircle2 size={14} className="text-emerald-400" /> HIPAA
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-2 rounded-full">
                  <CheckCircle2 size={14} className="text-emerald-400" /> SOC 2
                </div>
              </div>
            </div>

            <ShieldCheck
              size={180}
              className="absolute -bottom-12 -right-12 text-slate-800/50 group-hover:text-slate-700/50 transition-colors duration-500"
            />
          </motion.div>

          {/* 99% Accuracy */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="md:col-span-1 bg-gradient-to-br from-blue-600 to-blue-700 rounded-[2.5rem] p-8 text-white flex flex-col justify-center items-center text-center shadow-xl shadow-blue-600/25 relative overflow-hidden group"
          >
            {/* Animated rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.1, 0.2] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute w-40 h-40 border-2 border-white/20 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.05, 0.15] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                className="absolute w-56 h-56 border border-white/10 rounded-full"
              />
            </div>

            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.3 }}
                className="text-7xl font-bold mb-2"
              >
                99%
              </motion.div>
              <div className="text-blue-100 font-medium text-lg">Accuracy</div>
              <div className="text-blue-200/70 text-sm mt-1">
                OCR & NLP combined
              </div>
            </div>
          </motion.div>

          {/* OCR Built-in */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="md:col-span-1 bg-gradient-to-br from-slate-50 to-slate-100 rounded-[2.5rem] p-8 flex flex-col justify-center items-center text-center border border-slate-200 relative overflow-hidden group hover:shadow-lg transition-all"
          >
            {/* Icon with glow */}
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <FileText size={32} className="text-slate-600" />
              </div>
            </div>
            <div className="font-bold text-xl mb-2">OCR Built-in</div>
            <div className="text-sm text-slate-500">
              Scanned PDFs → Searchable text
            </div>

            {/* Format badges */}
            <div className="flex gap-2 mt-4">
              <div className="text-xs bg-white px-2 py-1 rounded-md text-slate-500 shadow-sm">
                .pdf
              </div>
              <div className="text-xs bg-white px-2 py-1 rounded-md text-slate-500 shadow-sm">
                .jpg
              </div>
              <div className="text-xs bg-white px-2 py-1 rounded-md text-slate-500 shadow-sm">
                .dcm
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="py-32 bg-slate-50 text-slate-900">
      <div className="container mx-auto px-6 max-w-[1400px]">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-12"
        >
          <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex gap-1.5 mb-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-5 h-5 bg-blue-500 rounded-full" />
              ))}
            </div>
            <p className="text-2xl font-medium leading-relaxed mb-10 text-slate-800">
              "I had 15 years of records in a shoebox. MedLM digitized and
              organized them in 10 minutes. It found a trend in my iron levels
              that explained my fatigue."
            </p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center font-bold">
                SJ
              </div>
              <div>
                <div className="font-bold text-lg">Sarah Jenkins</div>
                <div className="text-sm text-slate-500 font-medium">
                  Patient
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex gap-1.5 mb-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-5 h-5 bg-slate-900 rounded-full" />
              ))}
            </div>
            <p className="text-2xl font-medium leading-relaxed mb-10 text-slate-800">
              "Finally, a tool that speaks FHIR but acts like consumer tech. The
              timeline view is what every EMR should look like."
            </p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center font-bold text-white">
                DC
              </div>
              <div>
                <div className="font-bold text-lg">Dr. David Chen</div>
                <div className="text-sm text-slate-500 font-medium">
                  Internal Medicine
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-white pt-24 pb-12 border-t border-slate-800">
      <div className="container mx-auto px-6 max-w-[1400px] flex flex-col items-center text-center">
        <div className="text-[12vw] font-bold text-slate-700/20 leading-none select-none tracking-tighter hover:text-slate-800/20 transition-colors cursor-default">
          MEDLM
        </div>
        <div className="flex gap-8 mt-12 mb-20">
          <a
            href="#"
            className="font-bold text-white hover:text-blue-400 text-sm tracking-widest uppercase"
          >
            Twitter
          </a>
          <a
            href="#"
            className="font-bold text-white hover:text-blue-400 text-sm tracking-widest uppercase"
          >
            GitHub
          </a>
          <a
            href="#"
            className="font-bold text-white hover:text-blue-400 text-sm tracking-widest uppercase"
          >
            Email
          </a>
        </div>
        <div className="text-slate-500 text-sm font-medium">
          <div className="text-slate-500 text-sm font-medium">
            © {new Date().getFullYear()} MedLM Inc. Privacy First Health AI.
          </div>
        </div>
      </div>
    </footer>
  );
}
