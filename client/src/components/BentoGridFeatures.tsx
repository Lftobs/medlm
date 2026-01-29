import { motion } from "framer-motion";
import { Brain, Lock, CheckCircle2, ShieldCheck, FileText } from "lucide-react";

export default function BentoGridFeatures() {
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
                Gemini 3 analyzes your entire history. It aggregates data spanning
                thousands of pages to build a complete chronology.
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

          {/* 99% Accuracy -> Verifiable */}
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
                className="text-2xl font-bold mb-2 break-all"
              >
                Citations
              </motion.div>
              <div className="text-blue-100 font-medium text-lg">Included</div>
              <div className="text-blue-200/70 text-sm mt-1">
                Every fact linked to source
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
