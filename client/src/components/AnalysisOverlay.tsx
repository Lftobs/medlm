import { motion, AnimatePresence } from "framer-motion";
import {
    BrainCircuit,
    CheckCircle2,
    Loader2,
    Terminal,
    Search
} from "lucide-react";
import { useEffect, useRef } from "react";

interface AnalysisOverlayProps {
    status: "IDLE" | "UPLOADING" | "PROCESSING_RECORDS" | "ANALYZING_TIMELINE";
    message: string;
    logs: string[];
}

export function AnalysisOverlay({ status, message, logs }: AnalysisOverlayProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logs
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    // Determine current stage info
    const getStageInfo = () => {
        switch (status) {
            case "UPLOADING":
                return {
                    icon: <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />,
                    title: "Securing Files",
                    color: "bg-blue-500"
                };
            case "PROCESSING_RECORDS":
                return {
                    icon: <Search className="w-12 h-12 text-indigo-500 animate-pulse" />,
                    title: "Reading Documents",
                    color: "bg-indigo-500"
                };
            case "ANALYZING_TIMELINE":
                return {
                    icon: <BrainCircuit className="w-12 h-12 text-purple-500 animate-pulse" />,
                    title: "AI Analysis",
                    color: "bg-purple-500"
                };
            default:
                return {
                    icon: <CheckCircle2 className="w-12 h-12 text-green-500" />,
                    title: "Complete",
                    color: "bg-green-500"
                };
        }
    };

    const stage = getStageInfo();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
            <motion.div
                layout
                className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
            >
                {/* Header / Graphic Area */}
                <div className="relative h-48 bg-slate-50 flex flex-col items-center justify-center border-b border-slate-100 overflow-hidden">
                    {/* Background Animations */}
                    <div className="absolute inset-0 z-0">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                            className="absolute -top-20 -right-20 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50"
                        />
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                            className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-50"
                        />
                    </div>

                    {/* Main Icon */}
                    <div className="relative z-10 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-4">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={status}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                            >
                                {stage.icon}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <h3 className="relative z-10 text-xl font-semibold text-slate-800">
                        {stage.title}
                    </h3>
                </div>

                {/* Dynamic Progress Content */}
                <div className="p-6">
                    <div className="flex items-center justify-between text-sm font-medium text-slate-500 mb-2">
                        <span>Current Step</span>
                        <span className="text-xs px-2 py-0.5 bg-slate-100 rounded-full uppercase tracking-wider">{status.replace("_", " ")}</span>
                    </div>

                    <p className="text-lg text-slate-800 font-medium mb-6">
                        {message}
                    </p>

                    {/* Terminal / Live Logs */}
                    <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-slate-300 shadow-inner h-48 flex flex-col">
                        <div className="flex items-center gap-2 border-b border-slate-700 pb-2 mb-2 text-slate-500">
                            <Terminal size={14} />
                            <span>Live Output</span>
                        </div>
                        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1 scrollbar-hide">
                            {logs.length === 0 && (
                                <span className="text-slate-600 italic">Waiting for events...</span>
                            )}
                            {logs.map((log, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex gap-2"
                                >
                                    <span className="text-blue-500">➜</span>
                                    <span>{log}</span>
                                </motion.div>
                            ))}
                            {status !== "IDLE" && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.8 }}
                                    className="flex gap-2"
                                >
                                    <span className="text-blue-500">➜</span>
                                    <span className="w-2 h-4 bg-slate-500 inline-block align-middle" />
                                </motion.div>
                            )}
                        </div>
                    </div>

                    <p className="text-center text-xs text-slate-400 mt-4">
                        This process is end-to-end encrypted. Don't close this window.
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
}
