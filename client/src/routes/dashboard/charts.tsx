import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Loader2,
  BarChart,
  Sparkles,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useEventStream } from "../../hooks/use-event-stream";
import { VitalCard } from "../../components/VitalCard";

import { getVitals, startVitalsAnalysis } from "../../lib/api";

export const Route = createFileRoute("/dashboard/charts")({
  component: ChartsPage,
});

interface VitalData {
  test_name: string;
  data: Array<{ date: string; value: number }>;
}

function ChartsPage() {
  const [vitalsData, setVitalsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState(
    "Initializing vitals analysis...",
  );

  const fetchData = async () => {
    try {
      const data = await getVitals();
      setVitalsData(data);
    } catch (error) {
      console.error("Error fetching vitals data:", error);
      setVitalsData(null);
    } finally {
      setLoading(false);
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Listen for SSE vitals events
  useEventStream((event) => {
    if (typeof event !== "object") return;

    if (event.type === "vitals" && event.status === "in_progress") {
      setAnalysisMessage(event.message || "Analyzing vital signs...");
      setIsAnalyzing(true);
    }

    if (event.type === "vitals" && event.status === "success") {
      console.log("🎉 Vitals analysis complete, refreshing data...");
      setIsAnalyzing(false);
      toast.success("Vitals analysis complete!");
      fetchData();
    }

    if (event.type === "vitals" && event.status === "error") {
      setIsAnalyzing(false);
      toast.error(event.message || "Vitals analysis failed.");
    }
  });

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisMessage("Starting vitals analysis...");
    try {
      await startVitalsAnalysis();
      setAnalysisMessage("Gemini is reading your records...");
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to start analysis");
      setIsAnalyzing(false);
    }
  };

  const AnalysisOverlay = () => (
    <AnimatePresence>
      {isAnalyzing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-white/95 backdrop-blur-md z-50 flex items-center justify-center flex-col gap-8"
        >
          {/* Animated Pulsing Ring */}
          <div className="relative">
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 bg-gradient-to-r from-blue-300 to-cyan-300 rounded-full blur-2xl"
            />
            <motion.div
              animate={{
                scale: [1.1, 1, 1.1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
              className="absolute inset-[-20px] bg-gradient-to-r from-teal-200 to-blue-200 rounded-full blur-3xl"
            />
            <div className="bg-white p-8 rounded-3xl shadow-2xl relative z-10 border border-blue-100">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Activity className="w-16 h-16 text-blue-600" />
              </motion.div>
            </div>
          </div>

          <div className="text-center space-y-4 max-w-md px-6">
            <motion.h3
              key={analysisMessage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600"
            >
              Scanning Vitals
            </motion.h3>

            <motion.p
              key={analysisMessage + "-desc"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-slate-500 text-lg leading-relaxed"
            >
              {analysisMessage}
            </motion.p>
          </div>

          <div className="w-full max-w-sm space-y-4">
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full"
                initial={{ width: "5%" }}
                animate={{ width: "85%" }}
                transition={{ duration: 60, ease: "easeOut" }}
              />
            </div>
            <p className="text-center text-xs text-slate-400 animate-pulse">
              Extracting structured data from your clinical notes...
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (loading) {
    return (
      <div className="flex bg-slate-50 min-h-screen items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // --- EMPTY STATE ---
  if (!vitalsData || !vitalsData.analysis_data || vitalsData.analysis_data.length === 0) {
    return (
      <div className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full flex flex-col items-center justify-center min-h-[80vh] text-center">
        <AnalysisOverlay />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm max-w-lg w-full"
        >
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
            <BarChart size={40} />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            No Vital Signs Analyzed
          </h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Your clinical records are ready. Start the analysis to visualize your vital signs and health metrics over time.
          </p>

          <button
            onClick={handleStartAnalysis}
            disabled={isAnalyzing}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Start Vitals Analysis
              </>
            )}
          </button>
        </motion.div>
      </div>
    );
  }

  const vitalsList: VitalData[] = vitalsData.analysis_data;

  return (
    <div className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full">
      <AnalysisOverlay />

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold text-slate-900">
              Vital Signs & Metrics
            </h1>
            {vitalsData.created_at && (
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                {new Date(vitalsData.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
            <button
              onClick={handleStartAnalysis}
              disabled={isAnalyzing}
              className="ml-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg transition-all"
              title="Re-run Analysis"
            >
              {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Rescan
            </button>
          </div>
          <p className="text-slate-500">
            Tracked health markers from your clinical history.
          </p>
        </div>
      </div>

      <div className="columns-1 md:columns-2 gap-6 space-y-6">
        {vitalsList.map((vital, index) => (
          <VitalCard
            key={index}
            testName={vital.test_name}
            data={vital.data}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
