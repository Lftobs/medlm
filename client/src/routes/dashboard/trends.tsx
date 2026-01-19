import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Activity,
  Heart,
  Droplet,
  Scale,
  ThermometerSun,
  Loader2,
  Sparkles,
  X,
  Calendar,
  FileText,
  AlertCircle,
  Stethoscope,
  User,
} from "lucide-react";
import { getTrendsLatest, simplifyText } from "../../lib/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useEventStream } from "../../hooks/use-event-stream";

export const Route = createFileRoute("/dashboard/trends")({
  component: TrendsPage,
});

function TrendsPage() {
  const [trendData, setTrendData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState(
    "Initializing analysis...",
  );
  const [selectedTrend, setSelectedTrend] = useState<any>(null);
  const [isSimplifyingSummary, setIsSimplifyingSummary] = useState(false);

  const fetchTrends = async () => {
    try {
      const data = await getTrendsLatest();
      setTrendData(data);
    } catch (err) {
      console.error("Failed to fetch trends:", err);
      setTrendData(null);
    } finally {
      setLoading(false);
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  // Listen for SSE trend events
  useEventStream((event) => {
    if (typeof event !== "object") return;

    // Handle trends_started event
    if (event.type === "trends_started" || event.status === "trends_started") {
      setIsAnalyzing(true);
      setAnalysisMessage("Gathering your health records...");
    }

    // Handle progress updates (if backend sends them)
    if (event.type === "trend_update" || event.status === "trend_update") {
      setAnalysisMessage(event.message || "Analyzing patterns...");
    }

    // Handle completion
    if (event.type === "trend_complete" || event.status === "trend_complete") {
      console.log("🎉 Trend analysis complete, refreshing data...");
      setIsAnalyzing(false);
      toast.success("Trend analysis complete!");
      fetchTrends();
    }

    // Handle failure
    if (event.type === "trend_failed" || event.status === "trend_failed") {
      setIsAnalyzing(false);
      toast.error(event.message || "Trend analysis failed.");
    }
  });

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisMessage("Starting trend analysis...");
    try {
      const { startTrendAnalysis } = await import("../../lib/api");
      await startTrendAnalysis();
      setAnalysisMessage("Gemini is reading your records...");
      // The SSE listener will handle further updates and completion
    } catch (e) {
      console.error(e);
      toast.error("Failed to start analysis");
      setIsAnalyzing(false);
    }
  };

  const handleSimplifySummary = async () => {
    if (!trendData?.trend_summary) return;
    setIsSimplifyingSummary(true);
    try {
      const result = await simplifyText(trendData.trend_summary);
      if (result.simplified) {
        setTrendData((prev: any) => ({
          ...prev,
          trend_summary: result.simplified,
        }));
        toast.success("Summary simplified!");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to simplify summary");
    } finally {
      setIsSimplifyingSummary(false);
    }
  };

  if (loading) {
    return (
      <div className="flex bg-slate-50 min-h-screen items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

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
              className="absolute inset-0 bg-gradient-to-r from-indigo-300 to-purple-300 rounded-full blur-2xl"
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
              className="absolute inset-[-20px] bg-gradient-to-r from-blue-200 to-indigo-200 rounded-full blur-3xl"
            />
            <div className="bg-white p-8 rounded-3xl shadow-2xl relative z-10 border border-indigo-100">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <TrendingUp className="w-16 h-16 text-indigo-600" />
              </motion.div>
            </div>
          </div>

          <div className="text-center space-y-4 max-w-md px-6">
            <motion.h3
              key={analysisMessage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              Analyzing Trends
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

          {/* Progress Steps */}
          <div className="w-full max-w-sm space-y-4">
            <div className="flex justify-between text-xs text-slate-400 font-medium uppercase tracking-wider px-2">
              <span className="text-indigo-600 font-bold">Collecting</span>
              <span>Processing</span>
              <span>Insights</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                initial={{ width: "5%" }}
                animate={{ width: "85%" }}
                transition={{ duration: 60, ease: "easeOut" }}
              />
            </div>
            <p className="text-center text-xs text-slate-400 animate-pulse">
              This may take a few minutes...
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // --- EMPTY STATE (New User or No Trends) ---
  if (!trendData) {
    return (
      <div className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full flex flex-col items-center justify-center min-h-[80vh] text-center">
        <AnalysisOverlay />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm max-w-lg w-full"
        >
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
            <TrendingUp size={40} />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            No Health Trends Analyzed
          </h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Your clinical records are uploaded, but we haven't analyzed them for
            trends yet. Start the analysis to uncover patterns in your health
            history.
          </p>

          <button
            onClick={handleStartAnalysis}
            disabled={isAnalyzing}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Start Trend Analysis
              </>
            )}
          </button>

          <p className="text-xs text-slate-400 mt-6 bg-slate-50 py-2 px-3 rounded-lg inline-block border border-slate-100">
            <span className="font-semibold text-slate-500">Note:</span> Trend
            analysis may take ~5 minutes.
          </p>
        </motion.div>
      </div>
    );
  }

  // Parse trends - handle both array and object formats
  let trends: any[] = [];
  if (trendData.analysis_data) {
    if (Array.isArray(trendData.analysis_data)) {
      trends = trendData.analysis_data;
    } else if (typeof trendData.analysis_data === "object") {
      // Convert object to array (keys are indices)
      trends = Object.values(trendData.analysis_data);
    }
  }

  return (
    <div className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full">
      {/* Header with Analysis Date Pill */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold text-slate-900">
              Health Trends
            </h1>
            {trendData.created_at && (
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                {new Date(trendData.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
            {/* Rescan Button (Only if > 30 days) */}
            {trendData.created_at && (new Date().getTime() - new Date(trendData.created_at).getTime() > 30 * 24 * 60 * 60 * 1000) && (
              <button
                onClick={handleStartAnalysis}
                disabled={isAnalyzing}
                className="ml-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg transition-all"
                title="Data is older than 30 days. Click to rescan."
              >
                {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Rescan
              </button>
            )}
          </div>
          <p className="text-slate-500">
            Patterns and insights from your medical history.
          </p>
        </div>
      </div>

      {/* Summary Card with Simplify Button */}
      {trendData.trend_summary && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 mb-8"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Activity size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-slate-900">
                  Overall Summary
                </h2>
                <button
                  onClick={handleSimplifySummary}
                  disabled={isSimplifyingSummary}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSimplifyingSummary ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  Simplify
                </button>
              </div>
              <p className="text-slate-700 leading-relaxed">
                {trendData.trend_summary}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Trends Grid */}
      {trends.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trends.map((trend: any, index: number) => (
            <TrendCard
              key={index}
              trend={trend}
              index={index}
              onViewDetails={() => setSelectedTrend(trend)}
              onSimplified={(simplifiedText) => {
                // Update the trend in the local state
                const updatedTrends = [...trends];
                updatedTrends[index] = { ...trend, trend: simplifiedText };
                setTrendData((prev: any) => ({
                  ...prev,
                  analysis_data: updatedTrends,
                }));
              }}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">
            No specific trends identified yet. More data may be needed.
          </p>
        </div>
      )}

      {/* Trend Detail Modal */}
      <TrendDetailModal
        trend={selectedTrend}
        onClose={() => setSelectedTrend(null)}
      />
    </div>
  );
}

interface TrendCardProps {
  trend: any;
  index: number;
  onViewDetails: () => void;
  onSimplified?: (simplifiedText: string) => void;
}

function TrendCard({
  trend,
  index,
  onViewDetails,
  onSimplified,
}: TrendCardProps) {
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [displayText, setDisplayText] = useState(
    trend.trend || trend.description || trend.title || "Health trend",
  );
  const isMajor = trend.is_major || trend.isMajor || false;

  const { icon, color, bgColor, borderColor } = getCategoryStyle(
    isMajor ? "major" : "general",
  );

  const handleSimplify = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSimplifying(true);
    try {
      const result = await simplifyText(displayText);
      if (result.simplified) {
        setDisplayText(result.simplified);
        onSimplified?.(result.simplified);
        toast.success("Trend simplified!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to simplify");
    } finally {
      setIsSimplifying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      onClick={onViewDetails}
      className={`bg-white p-6 rounded-xl border ${borderColor} shadow-sm hover:shadow-md transition-all cursor-pointer group`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 ${bgColor} rounded-full flex items-center justify-center ${color}`}
          >
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
              Trend #{index + 1}
            </h3>
            <p className="text-xs text-slate-500 capitalize">
              {isMajor ? "Major Finding" : "Minor Finding"}
            </p>
          </div>
        </div>

        {/* Major Badge */}
        {isMajor && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">
            <AlertCircle size={12} />
            <span className="text-xs font-medium">Major</span>
          </div>
        )}
      </div>

      {/* Trend Description */}
      <p className="text-sm text-slate-600 leading-relaxed mb-4 line-clamp-3">
        {displayText}
      </p>

      {/* Event Count & Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {trend.event_dates && (
            <>
              <Calendar size={14} />
              <span>{trend.event_dates.length} events</span>
            </>
          )}
        </div>
        <button
          onClick={handleSimplify}
          disabled={isSimplifying}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
        >
          {isSimplifying ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Sparkles size={12} />
          )}
          Simplify
        </button>
      </div>
    </motion.div>
  );
}

interface TrendDetailModalProps {
  trend: any;
  onClose: () => void;
}

function TrendDetailModal({ trend, onClose }: TrendDetailModalProps) {
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [displayTrendText, setDisplayTrendText] = useState(trend?.trend || "");


  useEffect(() => {
    if (trend?.trend) {
      setDisplayTrendText(trend.trend);
    }
  }, [trend?.trend]);

  const handleSimplify = async () => {
    if (!displayTrendText) return;
    setIsSimplifying(true);
    try {
      const result = await simplifyText(displayTrendText);
      if (result.simplified) {
        setDisplayTrendText(result.simplified);
        toast.success("Trend simplified!");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to simplify");
    } finally {
      setIsSimplifying(false);
    }
  };

  if (!trend) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                <TrendingUp size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Trend Details
                </h2>
                <p className="text-sm text-slate-500">
                  {trend.is_major ? "Major Finding" : "Minor Finding"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Trend Description */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <FileText size={16} className="text-blue-600" />
                  Trend Analysis
                </h3>
                <button
                  onClick={handleSimplify}
                  disabled={isSimplifying}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSimplifying ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} />
                  )}
                  Simplify
                </button>
              </div>
              <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200">
                {displayTrendText}
              </p>
            </div>

            {/* Patient Tip */}
            {trend.patient_tip && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <User size={16} className="text-green-600" />
                  Patient Guidance
                </h3>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-slate-700 leading-relaxed">
                    {trend.patient_tip}
                  </p>
                </div>
              </div>
            )}

            {/* Medical Team Tip */}
            {trend.medical_team_tip && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Stethoscope size={16} className="text-blue-600" />
                  Medical Team Notes
                </h3>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-slate-700 leading-relaxed">
                    {trend.medical_team_tip}
                  </p>
                </div>
              </div>
            )}

            {/* Event Dates */}
            {trend.event_dates && trend.event_dates.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Calendar size={16} className="text-purple-600" />
                  Event Timeline
                </h3>
                <div className="flex flex-wrap gap-2">
                  {trend.event_dates.map((date: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-lg border border-purple-200"
                    >
                      {new Date(date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Citation */}
            {trend.citation && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-orange-600" />
                  Clinical Evidence
                </h3>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line font-mono">
                    {trend.citation}
                  </p>
                </div>
              </div>
            )}

            {/* Record IDs */}
            {trend.record_ids && trend.record_ids.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-slate-600" />
                  Related Records
                </h3>
                <div className="flex flex-wrap gap-2">
                  {trend.record_ids.map((recordId: string, idx: number) => (
                    <Link
                      key={idx}
                      to="/dashboard/records/$recordId"
                      params={{ recordId }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors"
                    >
                      Record {recordId.slice(0, 8)}...
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-6 border-t border-slate-200 bg-slate-50">
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function getCategoryStyle(category: string) {
  const normalized = category.toLowerCase();

  if (normalized.includes("major")) {
    return {
      icon: <AlertCircle size={18} />,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    };
  }

  if (normalized.includes("heart") || normalized.includes("cardio")) {
    return {
      icon: <Heart size={18} />,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-100",
    };
  }

  if (normalized.includes("blood") || normalized.includes("lab")) {
    return {
      icon: <Droplet size={18} />,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
    };
  }

  if (normalized.includes("weight") || normalized.includes("bmi")) {
    return {
      icon: <Scale size={18} />,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-100",
    };
  }

  if (
    normalized.includes("temp") ||
    normalized.includes("vital") ||
    normalized.includes("pressure")
  ) {
    return {
      icon: <ThermometerSun size={18} />,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-100",
    };
  }

  // Default
  return {
    icon: <Activity size={18} />,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-100",
  };
}
