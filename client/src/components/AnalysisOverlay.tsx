import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2,
    Circle,
    Loader2,
    FileText,
    Activity,
    Brain,
    ShieldCheck,
    TrendingUp,
} from "lucide-react";
import { useState, useEffect } from "react";

interface AnalysisOverlayProps {
    status: "IDLE" | "UPLOADING" | "PROCESSING_RECORDS" | "ANALYZING_TIMELINE";
    message: string;
    logs: string[];
}

const STEPS = [
    {
        id: "UPLOADING",
        label: "Secure Transfer",
        description: "Encrypting and uploading records",
        icon: ShieldCheck,
    },
    {
        id: "PROCESSING_RECORDS",
        label: "Document Extraction",
        description: "OCR & Entity Recognition",
        icon: FileText,
    },
    {
        id: "ANALYZING_TIMELINE",
        label: "Clinical Analysis",
        description: "identifying trends & patterns",
        icon: Brain,
    },
];

export function AnalysisOverlay({
    status,
    message,
    logs,
}: AnalysisOverlayProps) {
    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        switch (status) {
            case "UPLOADING":
                setActiveStepIndex(0);
                break;
            case "PROCESSING_RECORDS":
                setActiveStepIndex(1);
                break;
            case "ANALYZING_TIMELINE":
                setActiveStepIndex(2);
                break;
            default:
                setActiveStepIndex(0);
        }
    }, [status]);

    if (status === "IDLE") return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-white/95 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-8"
            >
                <div className="w-full max-w-6xl aspect-[16/9] bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row">
                    {/* LEFT PANEL: Checklist & Story */}
                    <div className="w-full md:w-2/5 p-8 md:p-12 bg-slate-50 border-r border-slate-100 flex flex-col justify-between relative overflow-hidden">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-30 pointer-events-none">
                            <div className="absolute top-0 left-0 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 -translate-x-1/2 -translate-y-1/2"></div>
                            <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 translate-x-1/2 translate-y-1/2"></div>
                        </div>

                        <div className="relative z-10">
                            <h2 className="text-3xl font-bold text-slate-800 mb-2">
                                Analyzing Records
                            </h2>
                            <p className="text-slate-500 mb-10">
                                Building your comprehensive health profile.
                            </p>

                            <div className="space-y-6">
                                {STEPS.map((step, index) => {
                                    const isActive = index === activeStepIndex;
                                    const isCompleted = index < activeStepIndex;
                                    const isPending = index > activeStepIndex;

                                    return (
                                        <motion.div
                                            key={step.id}
                                            initial={false}
                                            animate={{
                                                opacity: isPending ? 0.5 : 1,
                                                x: isActive ? 10 : 0,
                                            }}
                                            className="flex items-start gap-4"
                                        >
                                            <div className="mt-1">
                                                {isCompleted ? (
                                                    <div className="bg-green-500 rounded-full p-1">
                                                        <CheckCircle2 size={20} className="text-white" />
                                                    </div>
                                                ) : isActive ? (
                                                    <div className="relative">
                                                        <div className="absolute inset-0 bg-blue-500 rounded-full blur animate-pulse opacity-50"></div>
                                                        <div className="bg-white rounded-full p-1 border-2 border-blue-500 relative z-10">
                                                            <Loader2
                                                                size={20}
                                                                className="text-blue-600 animate-spin"
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="bg-slate-200 rounded-full p-1">
                                                        <Circle size={20} className="text-slate-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h3
                                                    className={`text-lg font-semibold ${isActive ? "text-blue-600" : "text-slate-700"
                                                        }`}
                                                >
                                                    {step.label}
                                                </h3>
                                                <p className="text-sm text-slate-500">
                                                    {step.description}
                                                </p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                                <span>Progress</span>
                                <span>
                                    {activeStepIndex === 0
                                        ? "10%"
                                        : activeStepIndex === 1
                                            ? "45%"
                                            : "85%"}
                                </span>
                            </div>
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                                    animate={{
                                        width:
                                            activeStepIndex === 0
                                                ? "10%"
                                                : activeStepIndex === 1
                                                    ? "45%"
                                                    : "90%",
                                    }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-4 font-mono">
                                {message}
                            </p>
                        </div>
                    </div>

                    {/* RIGHT PANEL: Dynamic Visuals */}
                    <div className="w-full md:w-3/5 bg-white relative overflow-hidden flex flex-col">
                        <div className="absolute top-4 right-4 z-20">
                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                className="text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-full border border-slate-200 transition-colors"
                            >
                                {showDetails ? "Hide Logs" : "Show Logs"}
                            </button>
                        </div>

                        {/* Visual Content Container */}
                        <div className="flex-1 relative flex items-center justify-center p-8">
                            <AnimatePresence mode="wait">
                                {status === "UPLOADING" && (
                                    <UploadVisual key="upload" />
                                )}
                                {status === "PROCESSING_RECORDS" && (
                                    <ProcessingVisual key="processing" logs={logs} showLogs={showDetails} />
                                )}
                                {status === "ANALYZING_TIMELINE" && (
                                    <AnalysisVisual key="analysis" logs={logs} showLogs={showDetails} />
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}


function UploadVisual() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center text-center space-y-6 max-w-sm"
        >
            <div className="relative w-40 h-40">
                {/* Ripples */}
                {[1, 2, 3].map((i) => (
                    <motion.div
                        key={i}
                        className="absolute inset-0 border border-blue-500/20 rounded-full"
                        animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.5,
                            ease: "easeOut",
                        }}
                    />
                ))}
                {/* Center Icon */}
                <div className="absolute inset-0 flex items-center justify-center bg-blue-50 rounded-full z-10 shadow-inner">
                    <ShieldCheck size={64} className="text-blue-500" />
                </div>
            </div>
            <div>
                <h4 className="text-xl font-bold text-slate-700">Securing Data</h4>
                <p className="text-slate-500 mt-2">Your files are being encrypted (AES-256) and safely transmitted.</p>
            </div>
        </motion.div>
    );
}

function ProcessingVisual({ logs, showLogs }: { logs: string[]; showLogs: boolean }) {
    const MOCK_DATA = [
        "Patient: John Doe",
        "DOB: 12/04/1985",
        "BP: 118/72 mmHg",
        "Hgb A1C: 5.7%",
        "Medication: Lisinopril 10mg",
        "Allergies: Penicillin",
        "Visit Date: 10/24/2023",
        "Diagnosis: Hypertension"
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full relative"
        >
            {/* Document Scanner Effect */}
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 pointer-events-none overflow-hidden select-none">
                {Array.from({ length: 10 }).map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ y: 500 }}
                        animate={{ y: -500 }}
                        transition={{
                            duration: 10,
                            repeat: Infinity,
                            ease: "linear",
                            delay: i * 1.5
                        }}
                        className="text-4xl font-serif text-slate-800 whitespace-nowrap opacity-50 my-8"
                    >
                        {MOCK_DATA[i % MOCK_DATA.length]}
                    </motion.div>
                ))}
            </div>

            {/* Active Extraction Highlight */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-32 bg-gradient-to-b from-transparent via-blue-50/80 to-transparent flex items-center justify-center backdrop-blur-[1px]">
                <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-xl shadow-xl border border-blue-100 animate-bounce-slight">
                    <FileText className="text-blue-600" />
                    <span className="font-mono text-blue-900 font-semibold">Extracting Vitals...</span>
                </div>
            </div>

            {/* Real Logs Overlay (if enabled) */}
            {showLogs && (
                <div className="absolute inset-4 bg-slate-900/90 rounded-xl p-4 font-mono text-xs text-green-400 overflow-y-auto">
                    {logs.map((log, i) => (
                        <div key={i} className="mb-1">{"> "}{log}</div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}

function AnalysisVisual({ logs, showLogs }: { logs: string[]; showLogs: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex flex-col items-center justify-center relative"
        >
            {/* Graph Animation Background */}
            <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
                <motion.path
                    d="M0,50 Q25,30 50,50 T100,50"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="0.5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                <motion.path
                    d="M0,70 Q25,50 50,70 T100,70"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="0.5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 0.5 }}
                />
            </svg>

            {/* Central Node */}
            <div className="relative z-10 w-64 h-64">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 bg-white rounded-full shadow-2xl flex items-center justify-center border-4 border-purple-100 z-20">
                        <Brain size={48} className="text-purple-600" />
                    </div>
                    {/* Orbiting nodes */}
                    {[0, 1, 2, 3].map((i) => (
                        <motion.div
                            key={i}
                            className="absolute w-full h-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10 + i * 2, repeat: Infinity, ease: "linear", delay: i * 2 }}
                        >
                            <div className="w-8 h-8 bg-white border border-slate-200 shadow-md rounded-full absolute top-0 left-1/2 -translate-x-1/2 flex items-center justify-center">
                                {i === 0 ? <Activity size={14} className="text-red-500" /> :
                                    i === 1 ? <TrendingUp size={14} className="text-green-500" /> :
                                        i === 2 ? <FileText size={14} className="text-blue-500" /> :
                                            <ShieldCheck size={14} className="text-slate-500" />
                                }
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="mt-8 text-center relative z-20 bg-white/50 backdrop-blur-sm px-6 py-2 rounded-full">
                <h4 className="font-semibold text-purple-900">Discovering Insights</h4>
                <p className="text-sm text-purple-700/70">Connecting distinct medical events</p>
            </div>

            {/* Real Logs Overlay (if enabled) */}
            {showLogs && (
                <div className="absolute inset-4 bg-slate-900/90 rounded-xl p-4 font-mono text-xs text-green-400 overflow-y-auto z-30">
                    {logs.map((log, i) => (
                        <div key={i} className="mb-1">{"> "}{log}</div>
                    ))}
                </div>
            )}

        </motion.div>
    );
}
