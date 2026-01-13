import { createFileRoute, Link } from "@tanstack/react-router";
import { uploadFiles, getTimeline } from "../../lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
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
import { AnalysisOverlay } from "../../components/AnalysisOverlay";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardOverview,
});

function DashboardOverview() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<
    "IDLE" | "UPLOADING" | "PROCESSING_RECORDS" | "ANALYZING_TIMELINE"
  >("IDLE");
  const [processingMessage, setProcessingMessage] = useState("Initializing...");
  const [logs, setLogs] = useState<string[]>([]);
  const [timelineData, setTimelineData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchTimeline = () => {
    setLoading(true);
    getTimeline()
      .then((data) => {
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

  // Listen for SSE events to handle the granular analysis flow
  useEventStream((data) => {
    if (typeof data !== "object") return;

    // Handle file processing events
    if (data.type === "file-operation") {
      if (data.status === "error") {
        console.error("File operation error:", data.message);
        toast.error(data.message || "Error processing file");
        setStatus("IDLE");
        setLogs((prev) => [...prev, `❌ Error: ${data.message}`]);
      } else {
        setStatus("PROCESSING_RECORDS");
        setProcessingMessage(data.message || "Processing your documents...");
        setLogs((prev) => [...prev, `📄 ${data.message}`]);
      }
    }

    // Handle timeline/trend analysis events
    if (data.type === "timeline" || data.type === "trend") {
      if (data.status === "error") {
        console.error("Analysis error:", data.message);
        toast.error(data.message || "Analysis failed");
        setStatus("IDLE");
        setLogs((prev) => [...prev, `❌ Error: ${data.message}`]);
      } else if (data.status === "success") {
        console.log("🔄 Analysis complete:", data);
        setStatus("IDLE");
        toast.success(data.message);
        setLogs([]); // Clear logs
        fetchTimeline();
      } else if (data.status === "started" || data.status === "in_progress") {
        // In progress
        setStatus("ANALYZING_TIMELINE");
        setProcessingMessage(data.message || "Analyzing health patterns...");
        setLogs((prev) => [...prev, `🩺 ${data.message}`]);
      }
    }
  });

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setStatus("UPLOADING");
      setLogs(["🚀 Starting secure upload..."]);
      try {
        const files = Array.from(e.target.files);
        await uploadFiles(files);

        toast.success("Upload complete. Starting analysis...");
        setLogs((prev) => [
          ...prev,
          "✅ Upload complete",
          "🔄 Initializing analysis queue...",
        ]);
        // Transition to processing state immediately after upload success
        // The SSE events will refine this state shortly
        setStatus("PROCESSING_RECORDS");
      } catch (error) {
        console.error("Upload failed", error);
        toast.error(
          `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        setStatus("IDLE");
        setLogs([]);
      } finally {
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
        <AnimatePresence>
          {status !== "IDLE" && (
            <AnalysisOverlay
              status={status}
              message={processingMessage}
              logs={logs}
            />
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-12 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 max-w-lg w-full relative overflow-hidden group"
        >
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-8 text-blue-600 shadow-lg shadow-blue-100"
          >
            <Upload size={48} strokeWidth={1.5} />
          </motion.div>

          <h1 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">
            Welcome to MedLM
          </h1>
          <p className="text-slate-600 mb-10 leading-relaxed text-lg">
            Let's build your health timeline. Upload your clinical records
            (PDFs, Images, DICOM) to get started.
          </p>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleUploadClick}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20"
          >
            <Upload size={20} />
            Upload Clinical Records
          </motion.button>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400 bg-slate-50 py-3 px-4 rounded-full inline-flex border border-slate-100"
          >
            <Sparkles size={14} className="text-amber-400" />
            <span>
              <span className="font-semibold text-slate-500">Pro Tip:</span>{" "}
              Analysis takes ~5 minutes.
            </span>
          </motion.div>
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
      <AnimatePresence>
        {status !== "IDLE" && (
          <AnalysisOverlay
            status={status}
            message={processingMessage}
            logs={logs}
          />
        )}
      </AnimatePresence>

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
                search={{ eventTitle: undefined }}
                className="text-sm text-blue-600 font-medium hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="space-y-4">
              {events.length > 0 ? (
                events.map((event: any, index: number) => (
                  <Link
                    to="/dashboard/timeline"
                    search={{ eventTitle: event.title }}
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
