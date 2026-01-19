import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Syringe,
  FileText,
  Activity,
  Upload,
  Loader2,
  X,
  Sparkles,
  AlertCircle,
  Clock,
} from "lucide-react";
import {
  getTimeline,
  uploadFiles,
  simplifyText,
  startTimelineAnalysis,
} from "../../lib/api";
import { useEventStream } from "../../hooks/use-event-stream";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/timeline")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      eventTitle: (search.eventTitle as string) || undefined,
    };
  },
  component: TimelinePage,
});

function TimelinePage() {
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [yearSortDesc, setYearSortDesc] = useState(true); // true = newest first, false = oldest first
  const [isAnalyzing, setIsAnalyzing] = useState(false); // New state (AnalysisOverlay logic needed if I want the full UI, or just simple loading)
  // For consistency with Trends, I should probably add the overlay, but user only asked for the button.
  // I'll stick to simple loading or just toast for now since Timeline didn't have the overlay code. 
  // Actually, I should probably use `isUploading` style overlay or add a message.
  // Let's keep it simple: Button shows spinner.
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { eventTitle } = Route.useSearch();

  useEffect(() => {
    if (eventTitle && timelineEvents.length > 0 && !selectedEvent) {
      // Flatten the grouped events to find the match
      for (const group of timelineEvents) {
        const found = group.events.find((e: any) => e.title === eventTitle);
        if (found) {
          setSelectedEvent(found);
          break;
        }
      }
    }
  }, [timelineEvents, eventTitle]);

  useEffect(() => {
    getTimeline()
      .then((data) => {
        // API now returns { id, analysis_summary, timeline_summary, analysis_data: [...] }
        // Or null if no timeline exists
        if (data && data.analysis_data && data.analysis_data.length > 0) {
          const grouped = groupEventsByYear(data.analysis_data, yearSortDesc);
          setTimelineEvents(grouped);
          if (data.created_at) setLastAnalyzedAt(data.created_at);
        } else {
          setTimelineEvents([]);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch timeline:", err);
        setTimelineEvents([]);
      })
      .finally(() => setLoading(false));
  }, [yearSortDesc]);

  const toggleYearSort = () => {
    setYearSortDesc(!yearSortDesc);
  };

  // Listen for SSE timeline events
  useEventStream((event) => {
    if (typeof event !== "object") return;
    if (event.type === "timeline_started") setIsAnalyzing(true);
    if (event.type === "timeline_complete") {
      setIsAnalyzing(false);
      toast.success("Timeline analysis complete!");
      // Refresh logic would go here - for now user can reload or I can re-fetch
      // Let's re-fetch
      getTimeline().then((data) => {
        if (data && data.analysis_data) {
          setTimelineEvents(groupEventsByYear(data.analysis_data, yearSortDesc));
          if (data.created_at) setLastAnalyzedAt(data.created_at);
        }
      });
    }
    if (event.type === "timeline_failed") {
      setIsAnalyzing(false);
      toast.error("Timeline analysis failed");
    }
  });

  const handleRescan = async () => {
    setIsAnalyzing(true);
    try {
      await startTimelineAnalysis();
      toast.info("Timeline analysis started...");
    } catch (e) {
      console.error(e);
      toast.error("Failed to start analysis");
      setIsAnalyzing(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex bg-slate-50 min-h-screen items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (timelineEvents.length === 0) {
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
            <Activity size={40} />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            No Health History Found
          </h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            We couldn't find any analyzed events. Upload your clinical records
            to generate your health timeline.
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

  return (
    <div className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Health Timeline
            </h1>
            <p className="text-slate-500 mt-1">
              Chronological history of your medical journey.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleYearSort}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Clock size={16} />
              {yearSortDesc ? "Newest First" : "Oldest First"}
            </button>
            {/* Rescan Button (Only if > 30 days) */}
            {lastAnalyzedAt && (new Date().getTime() - new Date(lastAnalyzedAt).getTime() > 30 * 24 * 60 * 60 * 1000) && (
              <button
                onClick={handleRescan}
                disabled={isAnalyzing}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center gap-2 shadow-sm"
                title="Data is older than 30 days. Click to rescan."
              >
                {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Rescan
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="relative space-y-12 pb-12">
        {/* Central Timeline */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 -translate-x-1/2"></div>
        {timelineEvents.map((yearGroup, yIndex) => (
          <div key={yearGroup.year} className="relative">
            {/* Year Marker - Centered */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-white shadow-md z-20">
              {yearGroup.year}
            </div>

            <div className="space-y-8 pt-8">
              {yearGroup.events.map((event: any, index: number) => (
                <motion.div
                  key={`${yearGroup.year}-${index}`}
                  initial={{ opacity: 0, x: event.is_major ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: yIndex * 0.1 + index * 0.1,
                  }}
                  className={`relative group cursor-pointer flex ${event.is_major
                    ? "justify-start pl-[calc(50%+2rem)]"
                    : "justify-end pr-[calc(50%+2rem)]"
                    }`}
                  onClick={() => setSelectedEvent(event)}
                >
                  {/* Node - positioned at center */}
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 top-3 w-4 h-4 bg-white rounded-full shadow-md z-10 group-hover:scale-125 transition-transform ${event.is_major
                      ? "border-4 border-blue-500"
                      : "border-2 border-slate-400"
                      }`}
                  ></div>

                  {/* Content Card */}
                  <div
                    className={`bg-white p-5 rounded-xl border shadow-sm group-hover:shadow-md transition-all relative max-w-md w-full ${event.is_major
                      ? "border-slate-200 group-hover:border-blue-300"
                      : "border-slate-200 group-hover:border-slate-300 opacity-90"
                      }`}
                  >
                    {/* Connector Line from center to card */}
                    <div
                      className={`absolute top-5 h-0.5 bg-slate-200 w-6 ${event.is_major ? "left-[-1.5rem]" : "right-[-1.5rem]"
                        }`}
                    ></div>

                    <div className="flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 transition-colors ${event.is_major
                            ? "bg-slate-50 text-slate-500 border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600"
                            : "bg-slate-50 text-slate-400 border-slate-100 group-hover:bg-slate-100 group-hover:text-slate-500"
                            }`}
                        >
                          {getIcon(event.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3
                              className={`font-semibold transition-colors ${event.is_major
                                ? "text-slate-900 group-hover:text-blue-700"
                                : "text-slate-700 group-hover:text-slate-900"
                                }`}
                            >
                              {event.title}
                            </h3>
                            {event.is_major && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold uppercase rounded">
                                Major
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-medium text-slate-400 block mt-1">
                            {event.date}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {event.desc}
                      </p>
                      <p className="text-xs text-blue-600 flex items-center gap-1">
                        <span>Click for details</span>
                        <span>→</span>
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}

interface EventDetailModalProps {
  event: any;
  onClose: () => void;
}

function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [simplifiedText, setSimplifiedText] = useState<string | null>(null);
  const [showSimplifiedModal, setShowSimplifiedModal] = useState(false);

  const handleSimplify = async () => {
    const textToSimplify = event?.event || "";
    if (!textToSimplify) return;
    setIsSimplifying(true);
    try {
      const result = await simplifyText(textToSimplify);
      if (result.simplified_text) {
        setSimplifiedText(result.simplified_text);
        setShowSimplifiedModal(true);
        toast.success("Text simplified!");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to simplify");
    } finally {
      setIsSimplifying(false);
    }
  };

  if (!event) return null;

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
                {getIcon(event.type)}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {event.title}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-slate-500 flex items-center gap-1">
                    <Clock size={14} />
                    {event.fullDate || event.date}
                  </span>
                  {event.is_major && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold uppercase rounded">
                      Major Event
                    </span>
                  )}
                </div>
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
            {/* Event Description */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <FileText size={16} className="text-blue-600" />
                  Event Details
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
                {event.event}
              </p>
            </div>

            {/* Severity Badge */}
            {event.is_major && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-600" />
                  Significance
                </h3>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-slate-700 leading-relaxed">
                    This is marked as a <strong>major health event</strong> in
                    your medical timeline. Major events are significant
                    milestones or critical findings that may have long-term
                    impact on your health journey.
                  </p>
                </div>
              </div>
            )}

            {/* Citation */}
            {event.citation && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-orange-600" />
                  Source Document
                </h3>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <p className="text-sm text-slate-700 leading-relaxed font-mono">
                    {event.citation}
                  </p>
                </div>
              </div>
            )}

            {/* Record IDs */}
            {event.record_ids && event.record_ids.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-slate-600" />
                  Related Records
                </h3>
                <div className="flex flex-wrap gap-2">
                  {event.record_ids.map((recordId: string, idx: number) => (
                    <Link
                      key={idx}
                      to="/dashboard/records/$recordId"
                      params={{ recordId }}
                      onClick={onClose}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors"
                    >
                      Record {recordId.slice(0, 8)}...
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong className="text-slate-700">Note:</strong> This
                information is extracted from your medical records using AI
                analysis. Always consult with your healthcare provider for
                medical advice and verification of any health information.
              </p>
            </div>
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

      {/* Simplified Text Modal */}
      {showSimplifiedModal && (
        <SimplifiedTextModal
          originalText={event.event}
          simplifiedText={simplifiedText || ""}
          onClose={() => setShowSimplifiedModal(false)}
        />
      )}
    </AnimatePresence>
  );
}

interface SimplifiedTextModalProps {
  originalText: string;
  simplifiedText: string;
  onClose: () => void;
}

function SimplifiedTextModal({
  originalText,
  simplifiedText,
  onClose,
}: SimplifiedTextModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Simplified Explanation
              </h2>
              <p className="text-sm text-slate-600">
                AI-powered plain language version
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Simplified Version */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Sparkles size={16} className="text-green-600" />
                </div>
                <h3 className="font-semibold text-slate-900">
                  Easy to Understand
                </h3>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border-2 border-green-200 shadow-sm">
                <p className="text-slate-800 leading-relaxed text-lg">
                  {simplifiedText}
                </p>
              </div>
            </div>

            {/* Original Version */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <FileText size={16} className="text-slate-600" />
                </div>
                <h3 className="font-semibold text-slate-900">
                  Original Medical Text
                </h3>
              </div>
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <p className="text-slate-700 leading-relaxed text-sm">
                  {originalText}
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex items-start gap-3">
              <AlertCircle
                size={18}
                className="text-blue-600 mt-0.5 shrink-0"
              />
              <div className="text-xs text-slate-700 leading-relaxed">
                <strong className="text-slate-800">Note:</strong> This
                simplified explanation is generated by AI to help you understand
                medical terminology. For medical advice or clarification, please
                consult with your healthcare provider.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors"
          >
            Got it, thanks!
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function getIcon(type: string) {
  if (type === "Immunization") return <Syringe size={18} />;
  if (type === "Lab") return <Activity size={18} />;
  if (type === "Dental") return <Calendar size={18} />;
  return <FileText size={18} />;
}

function groupEventsByYear(events: any[], sortDesc: boolean = true) {
  // events: analysis_data array from API
  // Format: [{ date: 'YYYY-MM-DD', event: '...', category: '...', description: '...' }]
  const grouped: Record<number, any[]> = {};

  events.forEach((event) => {
    // Parse the date - it might be a string or already a date
    const dateStr =
      event.event_date ||
      event.date ||
      event.created_at ||
      new Date().toISOString();
    const dateObj = new Date(dateStr);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth(); // 0-11

    if (!grouped[year]) grouped[year] = [];

    // Format date to 'MMM DD'
    const formattedDate = dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    const fullDate = dateObj.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    grouped[year].push({
      ...event,
      title: event.event || event.title || "Medical Event",
      date: formattedDate,
      fullDate: fullDate,
      type: event.category || event.type || "Other",
      desc:
        event.event ||
        event.description ||
        event.details ||
        "No details available",
      dateObj: dateObj,
      month: month,
    });
  });

  // Sort events within each year by month (Dec to Jan: 11 to 0)
  Object.keys(grouped).forEach((year) => {
    grouped[Number(year)].sort((a, b) => {
      return b.month - a.month; // December (11) first, January (0) last
    });
  });

  // Convert to array and sort by year based on sortDesc parameter
  return Object.keys(grouped)
    .sort((a, b) => (sortDesc ? Number(b) - Number(a) : Number(a) - Number(b)))
    .map((year) => ({
      year: Number(year),
      events: grouped[Number(year)],
    }));
}
