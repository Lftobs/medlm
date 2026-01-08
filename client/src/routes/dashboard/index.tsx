import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { uploadFiles, getTimeline } from "../../lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Upload,
  Sparkles,
  ChevronRight,
  Plus,
  Loader2,
  Activity,
  FileText,
  File,
  TrendingUp,
} from "lucide-react";
import { User as UserIcon } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useEventStream } from "../../hooks/use-event-stream";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardOverview,
});

function DashboardOverview() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [timelineData, setTimelineData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();

  const fetchTimeline = () => {
    setLoading(true);
    getTimeline()
      .then((data) => {
        // data can be null (no timeline yet) or timeline object
        if (data && (data.timeline_summary || data.analysis_summary)) {
          setTimelineData(data);
        } else {
          setTimelineData(null);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch timeline:", err);
        setTimelineData(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  // Listen for SSE events to refetch timeline when complete
  useEventStream((data) => {
    if (typeof data === "object" && data.type === "timeline_complete") {
      console.log("🔄 Timeline complete event received, refetching data...");
      setIsAnalyzing(false);
      toast.success(
        "Timeline analysis complete! Loading your health narrative...",
      );
      // Refetch timeline data to show populated dashboard
      fetchTimeline();
    } else if (
      typeof data === "object" &&
      data.status === "timeline_complete"
    ) {
      // Handle status-based events from worker
      console.log("🔄 Timeline analysis status update:", data);
      setIsAnalyzing(false);
      fetchTimeline();
    } else if (
      typeof data === "object" &&
      data.message &&
      data.message.includes("Timeline")
    ) {
      // Handle progress messages
      if (
        data.message.includes("started") ||
        data.message.includes("analyzing")
      ) {
        setIsAnalyzing(true);
      }
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
        // In a real app we would invalidate queries here to refresh the list
        navigate({ to: "/dashboard/records" });
      } catch (error) {
        console.error("Upload failed", error);
        toast.error(
          `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      } finally {
        setIsUploading(false);
        // Reset input value so same file can be selected again if needed
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  // Transform backend events to UI model
  // Backend: analysis_data array with event objects
  // We need: { id, date, title, type, summary, docType }
  const events =
    timelineData?.analysis_data?.slice(0, 3).map((e: any, idx: number) => ({
      id: idx,
      date: e.date
        ? new Date(e.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "N/A",
      title: e.event || e.title || "Medical Event",
      type: e.type || e.category || "Other",
      summary: e.description || e.details || "No details available",
      docType: e.category || "Record",
    })) || [];

  if (loading) {
    return (
      <div className="flex bg-slate-50 min-h-screen items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // --- EMPTY STATE (New User) ---
  if (!timelineData) {
    return (
      <div className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full flex flex-col items-center justify-center min-h-[80vh] text-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple // Enable multi-file
          accept=".pdf,.jpg,.png,.dcm"
        />
        {(isUploading || isAnalyzing) && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center flex-col gap-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-slate-600 font-medium">
              {isAnalyzing
                ? "Analyzing your medical timeline..."
                : "Processing your records..."}
            </p>
            {isAnalyzing && (
              <p className="text-slate-500 text-sm">
                This may take a few minutes
              </p>
            )}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm max-w-lg w-full"
        >
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
            <Upload size={40} />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            Welcome to MedLM
          </h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            To generate your health narrative and timeline, please upload your
            clinical records (PDFs, Images, DICOM).
          </p>

          <button
            onClick={handleUploadClick}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Upload size={18} />
            Upload Clinical Records
          </button>

          <p className="text-xs text-slate-400 mt-6 bg-slate-50 py-2 px-3 rounded-lg inline-block border border-slate-100">
            <span className="font-semibold text-slate-500">Note:</span> Timeline
            scan may take between 5-30min or less.
          </p>
        </motion.div>
      </div>
    );
  }

  // --- POPULATED DASHBOARD ---
  return (
    <div className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full">
      {/* Hidden Input for Simulation (Multi-file enabled) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
        accept=".pdf,.jpg,.png,.dcm"
      />

      {/* Upload overlay */}
      {(isUploading || isAnalyzing) && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center flex-col gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-slate-600 font-medium">
            {isAnalyzing
              ? "Analyzing your medical timeline..."
              : "Processing your records..."}
          </p>
          {isAnalyzing && (
            <p className="text-slate-500 text-sm">
              This may take a few minutes
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
              Health Narrative
            </h1>
            <p className="text-slate-500 mt-1">
              AI-generated summary based on your records.
            </p>
          </div>
          <button
            onClick={handleUploadClick}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm active:transform active:scale-95"
          >
            <Upload size={18} />
            <span>Upload More</span>
          </button>
        </motion.div>

        {/* AI Insight Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Sparkles size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                <Sparkles size={16} />
              </div>
              <h2 className="font-semibold text-slate-800">
                Latest Health Insight
              </h2>
            </div>
            <p className="text-slate-600 leading-relaxed max-w-3xl whitespace-pre-line">
              {timelineData.timeline_summary ||
                timelineData.analysis_summary ||
                "Your records have been processed. Review the timeline below for detailed events."}
            </p>
            {/*
                If we had specific trends extracted in the summary object (e.g. tags), we could map them here.
                For now we keep static badges or remove them if dynamic data isn't structured for tags yet.
            */}
          </div>
        </motion.div>

        {/* Timeline & Trends Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Timeline Feed */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Recent Timeline
              </h3>
              <Link
                to="/dashboard/timeline"
                className="text-sm text-blue-600 font-medium hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="space-y-4">
              {events.length > 0 ? (
                events.map((event: any, index: number) => (
                  <Link
                    to="/dashboard/records/$recordId"
                    params={{ recordId: "1" }} // Fallback if no specific record link
                    key={index}
                    className="block"
                  >
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                      className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-blue-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            {getIconForType(event.type)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900 text-sm md:text-base group-hover:text-blue-700 transition-colors">
                              {event.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span>{event.date}</span>
                              <span>•</span>
                              <span className="font-medium text-slate-600">
                                {event.docType}
                              </span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight
                          size={18}
                          className="text-slate-300 group-hover:text-blue-500 transition-colors"
                        />
                      </div>
                      <p className="text-slate-600 text-sm ml-13 pl-0.5 leading-relaxed line-clamp-2">
                        {event.summary}
                      </p>
                    </motion.div>
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                  No recent events found.
                </div>
              )}
            </div>
          </div>

          {/* Trends Section */}
          <div className="space-y-6">
            {/* Health Trends Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-blue-600" />
                  <h4 className="font-medium text-slate-900 text-sm">
                    Health Trends
                  </h4>
                </div>
                <Link
                  to="/dashboard/trends"
                  className="text-xs text-blue-600 hover:underline"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-slate-500 leading-relaxed">
                  View patterns and insights from your medical history,
                  including vital signs and health metrics over time.
                </p>
                <Link to="/dashboard/trends">
                  <button className="w-full py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors">
                    View Trends
                  </button>
                </Link>
              </div>
            </div>

            {/* Quick Upload */}
            <div
              onClick={handleUploadClick}
              className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-100 hover:border-blue-400 transition-all group active:scale-[0.98]"
            >
              <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Plus size={24} className="text-blue-600" />
              </div>
              <h4 className="font-medium text-slate-900 text-sm group-hover:text-blue-700">
                Add New Record
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Drag & drop PDF or Image
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 -mx-2 px-2 rounded-md transition-colors cursor-default">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function getIconForType(type: string) {
  switch (type) {
    case "Visit":
      return <UserIcon size={18} />;
    case "Lab":
      return <Activity size={18} />;
    case "Specialist":
      return <FileText size={18} />;
    default:
      return <File size={18} />;
  }
}
