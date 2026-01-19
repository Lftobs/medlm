import { motion } from "framer-motion";
import { Scan, Brain, Activity, Zap } from "lucide-react";

export function HealthFocusCard({ summary }: { summary?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="col-span-1 md:col-span-2 bg-zinc-950 rounded-2xl p-8 relative overflow-hidden min-h-[400px] flex flex-col"
        >
            {/* Background Grid & Effects */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

            {/* Header / Content Split */}
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start mb-8 gap-8">
                <div className="max-w-lg">
                    <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2 mb-3">
                        Health Intelligence Map
                    </h2>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                        {summary || "System-wide analysis of your latest clinical data. Upload more records to enhance the resolution of your health map."}
                    </p>
                </div>
                <div className="flex gap-2 self-start md:self-auto">
                    <span className="px-3 py-1 bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-full flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Analysis
                    </span>
                </div>
            </div>

            {/* Main Visual - Abstract Brain/Body Map */}
            <div className="flex-1 relative flex items-center justify-center">
                {/* Central visual placeholder - CSS Art representing complex data */}
                <div className="relative w-64 h-64">
                    {/* Pulsing Core */}
                    <motion.div
                        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-gradient-to-tr from-blue-600/30 to-purple-600/30 rounded-full blur-3xl"
                    />

                    {/* Rotating Rings */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border border-blue-500/20 rounded-full border-dashed"
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-4 border border-purple-500/20 rounded-full border-dotted"
                    />

                    {/* Icon in Center */}
                    <div className="absolute inset-0 flex items-center justify-center text-white/10">
                        <Brain size={120} strokeWidth={0.5} />
                    </div>

                    {/* Scanning Line */}
                    <motion.div
                        animate={{ top: ["0%", "100%", "0%"] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50 shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                    />
                </div>

                {/* Floating Data Points */}
                <DataPoint top="10%" left="20%" label="Neuro" value="98%" delay={0} color="text-emerald-400" />
                <DataPoint top="20%" right="15%" label="Cardio" value="Normal" delay={1} color="text-blue-400" />
                <DataPoint bottom="15%" left="25%" label="Metabolic" value="Stable" delay={2} color="text-purple-400" />
            </div>

            {/* Legend / Key Stats Bottom */}
            <div className="relative z-10 grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-zinc-800/50">
                <StatItem label="Scan Depth" value="Deep Tissue" icon={Scan} />
                <StatItem label="Neural Load" value="Optimal" icon={Zap} />
                <StatItem label="Bio-Rhythm" value="Synced" icon={Activity} />
            </div>
        </motion.div>
    );
}

function DataPoint({ top, left, right, bottom, label, value, delay, color }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.5 }}
            className="absolute flex flex-col items-center gap-1"
            style={{ top, left, right, bottom }}
        >
            <div className={`w-3 h-3 rounded-full bg-current ${color} shadow-[0_0_10px_currentColor]`} />
            <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 px-3 py-1.5 rounded-lg text-xs">
                <span className="text-zinc-400 mr-2">{label}</span>
                <span className="text-white font-medium">{value}</span>
            </div>
        </motion.div>
    )
}

function StatItem({ label, value, icon: Icon }: any) {
    return (
        <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-900 rounded-lg text-zinc-400">
                <Icon size={16} />
            </div>
            <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-medium text-zinc-200">{value}</p>
            </div>
        </div>
    )
}
