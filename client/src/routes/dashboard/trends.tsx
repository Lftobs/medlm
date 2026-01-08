import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Activity,
  Heart,
  Droplet,
  Scale,
  ThermometerSun,
  Upload,
  Loader2,
  Sparkles,
  X,
  Calendar,
  FileText,
  AlertCircle,
  Stethoscope,
  User,
} from "lucide-react";
import { getTrendsLatest, uploadFiles } from "../../lib/api";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useEventStream } from "../../hooks/use-event-stream";

export const Route = createFileRoute("/dashboard/trends")({
  component: TrendsPage,
});

function TrendsPage() {
  const [trendData, setTrendData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedTrend, setSelectedTrend] = useState<any>(null);
  const [isSimplifyingSummary, setIsSimplifyingSummary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const fetchTrends = async () => {
    try {
      const data = await getTrendsLatest();
      setTrendData(data);
    } catch (err) {
      console.error("Failed to fetch trends:", err);
      setTrendData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  // Listen for SSE trend_complete events
  useEventStream((event) => {
    if (
      (typeof event === "object" && event.type === "trend_complete") ||
      (typeof event === "object" && event.status === "trend_complete")
    ) {
      console.log("🎉 Trend analysis complete, refreshing data...");
      toast.success("Trend analysis complete!");
      fetchTrends();
    }
  });

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      try {
        const files = Array.from(e.target.files);
        await uploadFiles(files);

        toast.success("Records uploaded successfully! Analysis queue started.");
        navigate({ to: "/dashboard/records" });
      } catch (error) {
        console.error("Upload failed", error);
        toast.error(
          `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  const handleSimplifySummary = () => {
    setIsSimplifyingSummary(true);
    // Simulate API call
    setTimeout(() => {
      toast.success("Summary simplified!");
      setIsSimplifyingSummary(false);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex bg-slate-50 min-h-screen items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // --- EMPTY STATE (New User) ---
  if (!trendData) {
    return (
      <div className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full flex flex-col items-center justify-center min-h-[80vh] text-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
          accept=".pdf,.jpg,.png,.dcm"
        />
        {isUploading && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center flex-col gap-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-slate-600 font-medium">
              Processing your records...
            </p>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm max-w-lg w-full"
        >
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
            <TrendingUp size={40} />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            No Health Trends Found
          </h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            We couldn't find any trend analysis data. Upload your clinical
            records to generate insights about your health patterns over time.
          </p>

          <button
            onClick={handleUploadClick}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Upload size={18} />
            Upload Clinical Records
          </button>

          <p className="text-xs text-slate-400 mt-6 bg-slate-50 py-2 px-3 rounded-lg inline-block border border-slate-100">
            <span className="font-semibold text-slate-500">Note:</span> Trend
            analysis may take between 5-30min or less.
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
}

function TrendCard({ trend, index, onViewDetails }: TrendCardProps) {
  const [isSimplifying, setIsSimplifying] = useState(false);

  // Handle different data structures
  const trendText =
    trend.trend || trend.description || trend.title || "Health trend";
  const isMajor = trend.is_major || trend.isMajor || false;

  const { icon, color, bgColor, borderColor } = getCategoryStyle(
    isMajor ? "major" : "general",
  );

  const handleSimplify = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSimplifying(true);
    setTimeout(() => {
      toast.success("Trend simplified!");
      setIsSimplifying(false);
    }, 1500);
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
        {trendText}
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

  const handleSimplify = () => {
    setIsSimplifying(true);
    setTimeout(() => {
      toast.success("Trend simplified!");
      setIsSimplifying(false);
    }, 1500);
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
                {trend.trend}
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
