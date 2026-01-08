import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Calendar,
  Syringe,
  FileText,
  Activity,
  Upload,
  Loader2,
  Plus,
} from "lucide-react";
import { getTimeline, uploadFiles } from "../../lib/api";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/timeline")({
  component: TimelinePage,
});

function TimelinePage() {
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getTimeline()
      .then((data) => {
        // API now returns { id, analysis_summary, timeline_summary, analysis_data: [...] }
        // Or null if no timeline exists
        if (data && data.analysis_data && data.analysis_data.length > 0) {
          const grouped = groupEventsByYear(data.analysis_data);
          setTimelineEvents(grouped);
        } else {
          setTimelineEvents([]);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch timeline:", err);
        setTimelineEvents([]);
      })
      .finally(() => setLoading(false));
  }, []);

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

  // --- EMPTY STATE (New User) ---
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
    <div className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">
          Health Timeline
        </h1>
        <p className="text-slate-500 mt-1">
          Chronological history of your medical journey.
        </p>
      </div>

      <div className="relative border-l-2 border-slate-200 ml-4 md:ml-8 space-y-12 pb-12">
        {timelineEvents.map((yearGroup, yIndex) => (
          <div key={yearGroup.year} className="relative">
            {/* Year Marker */}
            <div className="absolute -left-[45px] md:-left-[53px] top-0 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-md border border-blue-200">
              {yearGroup.year}
            </div>

            <div className="space-y-8 pt-2">
              {yearGroup.events.map((event: any, index: number) => (
                <Link
                  to="/dashboard/records/$recordId"
                  params={{ recordId: "1" }} // Using hardcoded ID 1 for mock demo
                  key={`${yearGroup.year}-${index}`}
                  className="block"
                >
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: yIndex * 0.1 + index * 0.1,
                    }}
                    className="relative pl-8 md:pl-10 group"
                  >
                    {/* Node */}
                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 bg-white border-4 border-blue-500 rounded-full shadow-sm z-10 group-hover:scale-110 transition-transform"></div>

                    {/* Content Card */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm group-hover:shadow-md group-hover:border-blue-300 transition-all relative">
                      {/* Connector Line */}
                      <div className="absolute top-3.5 left-[-32px] md:left-[-40px] w-8 h-[2px] bg-slate-200"></div>

                      <div className="flex justify-between items-start">
                        <div className="flex gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100 shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            {getIcon(event.type)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                              {event.title}
                            </h3>
                            <p className="text-sm text-slate-600 mt-0.5">
                              {event.desc}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
                          {event.date}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getIcon(type: string) {
  if (type === "Immunization") return <Syringe size={18} />;
  if (type === "Lab") return <Activity size={18} />;
  if (type === "Dental") return <Calendar size={18} />;
  return <FileText size={18} />;
}

function groupEventsByYear(events: any[]) {
  // events: analysis_data array from API
  // Format: [{ date: 'YYYY-MM-DD', event: '...', category: '...', description: '...' }]
  const grouped: Record<number, any[]> = {};

  events.forEach((event) => {
    // Parse the date - it might be a string or already a date
    const dateStr = event.date || event.created_at || new Date().toISOString();
    const year = new Date(dateStr).getFullYear();
    if (!grouped[year]) grouped[year] = [];

    // Format date to 'MMM DD'
    const dateObj = new Date(dateStr);
    const formattedDate = dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    grouped[year].push({
      ...event,
      title: event.event || event.title || "Medical Event",
      date: formattedDate,
      type: event.category || event.type || "Other",
      desc: event.description || event.details || "No details available",
    });
  });

  // Convert to array and sort desc (newest first)
  return Object.keys(grouped)
    .sort((a, b) => Number(b) - Number(a))
    .map((year) => ({
      year: Number(year),
      events: grouped[Number(year)],
    }));
}
