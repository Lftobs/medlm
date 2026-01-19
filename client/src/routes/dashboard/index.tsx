import { createFileRoute, Link } from "@tanstack/react-router";
import { uploadFiles, getTimeline } from "../../lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Sparkles,
  Loader2,
  Activity,
  FileText,
  User as UserIcon,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useRef, useState, useEffect } from "react";
import { useEventStream } from "../../hooks/use-event-stream";
import { AnalysisOverlay } from "../../components/AnalysisOverlay";
import { HealthFocusCard } from "../../components/HealthFocusCard";
import { VitalCard } from "../../components/VitalCard";

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
  const [vitals, setVitals] = useState<any[]>([]);

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

    // Fetch vitals
    import("../../lib/api").then(({ getVitals }) => {
      getVitals().then(data => {
        if (data && data.analysis_data) {
          setVitals(data.analysis_data);
        }
      });
    });
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

  // Calculated values for the dashboard
  const vitalsCount = vitals.length;
  // const trendsCount = timelineData?.analysis_data?.length || 0; // Unused in new layout
  const summaryText = timelineData?.timeline_summary || timelineData?.analysis_summary || "No health summary available yet. Upload records to generate insights.";

  // Calculate trend distribution
  const trendStats = vitals.reduce(
    (acc, vital) => {
      const data = vital.data || [];
      if (data.length < 2) {
        acc.Stable++; // Default to stable if not enough data
        return acc;
      }
      const first = data[0].value;
      const last = data[data.length - 1].value;
      const change = ((last - first) / first) * 100;

      if (Math.abs(change) < 2) acc.Stable++;
      else if (change > 0) acc.Up++;
      else acc.Down++;
      return acc;
    },
    { Stable: 0, Up: 0, Down: 0 }
  );

  const pieData = [
    { name: "Stable", value: trendStats.Stable, color: "#94a3b8" }, // slate-400
    { name: "Up Trend", value: trendStats.Up, color: "#10b981" },   // emerald-500
    { name: "Down Trend", value: trendStats.Down, color: "#ef4444" }, // red-500
  ].filter(d => d.value > 0);

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

  return (
    <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
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

      {/* Top Row: Hero Card & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <HealthFocusCard summary={summaryText} />
        </div>
        <div className="lg:col-span-1">
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-zinc-100 font-semibold flex items-center gap-2">
                <Activity size={16} className="text-emerald-400" />
                Vitals Status
              </h3>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-full h-[180px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={4}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: '#e4e4e7' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Stats */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold text-white">{vitalsCount}</span>
                  <span className="text-xs text-zinc-500 uppercase tracking-wider">Total Vitals</span>
                </div>
              </div>

              {/* Legend / Stats Grid */}
              <div className="w-full grid grid-cols-2 gap-3 mt-6">
                {pieData.map((item) => (
                  <div key={item.name} className="flex flex-col items-center p-2 bg-zinc-800/30 rounded-lg border border-zinc-800/50">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] text-zinc-400 uppercase">{item.name}</span>
                    </div>
                    <span className="text-zinc-200 font-semibold">{item.value}</span>
                  </div>
                ))}
                <div className="flex flex-col items-center p-2 bg-zinc-800/30 rounded-lg border border-zinc-800/50">
                  <span className="text-[10px] text-zinc-400 uppercase mb-1">Trends</span>
                  <span className="text-zinc-200 font-semibold">{timelineData?.analysis_data?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Vital Cards */}
      <div>
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-800">Key Biomarkers</h2>
          <Link to="/dashboard/charts" className="text-sm text-blue-600 font-medium hover:underline">View All Charts</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {vitals.length === 0 ? (
            <div className="col-span-full text-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No vital signs recorded yet. Upload records to analyze.
            </div>
          ) : (
            vitals.slice(0, 4).map((v, i) => (
              <VitalCard key={i} testName={v.test_name} data={v.data} index={i} />
            ))
          )}
        </div>
      </div>

      {/* Bottom Row: Timeline & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Recent Timeline</h3>
            <Link to="/dashboard/timeline" search={{ eventTitle: undefined }} className="text-sm text-blue-600 font-medium hover:underline">View Full History</Link>
          </div>

          {/* Timeline Feed directly here */}
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
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all flex gap-4 group"
                  >
                    <div className="mt-1">
                      <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-colors">
                        {/* Quick icon mapping based on type */}
                        {event.type === 'Lab' ? <Activity size={18} /> :
                          event.type === 'Visit' ? <UserIcon size={18} /> :
                            <FileText size={18} />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-slate-900 truncate group-hover:text-blue-700 transition-colors">{event.title}</h4>
                        <span className="text-xs text-slate-500 whitespace-nowrap ml-2">{event.date}</span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 mt-1">{event.summary}</p>
                    </div>
                  </motion.div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500">
                No recent events found.
              </div>
            )}
          </div>

          {/* 
             {/* Commented out Suggested Next Steps as requested
             <div className="space-y-6">
                 <ActionItem ... />
             </div>
             */}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button onClick={handleUploadClick} className="w-full py-3 px-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-sm transition-all flex items-center gap-3 text-left group">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                  <Upload size={20} />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Upload Records</p>
                  <p className="text-xs text-slate-500">PDF, JPG, DICOM supported</p>
                </div>
              </button>
              <Link to="/dashboard/chat" className="w-full py-3 px-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-sm transition-all flex items-center gap-3 text-left group">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Ask MedLM</p>
                  <p className="text-xs text-slate-500">Chat with your health data</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* 
// Moved logic inline to DashboardOverview
function VitalCardsSection() { ... } 
// Commented out ActionItem
function ActionItem(...) { ... }
*/
