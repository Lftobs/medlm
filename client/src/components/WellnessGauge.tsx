import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface WellnessGaugeProps {
    score: number;
}

export function WellnessGauge({ score }: WellnessGaugeProps) {
    // Data for the gauge
    // Value is the score, remaining is 100 - score
    const data = [
        { name: "Score", value: score },
        { name: "Remaining", value: 100 - score },
    ];

    // Colors: Gradient-like effect for the score part?
    // Using a solid color for now that matches the reference (yellow/green gradient conceptually)
    // We'll use a function to determine color based on score health
    const getColor = (value: number) => {
        if (value >= 80) return "#22c55e"; // Green
        if (value >= 50) return "#eab308"; // Yellow
        return "#ef4444"; // Red
    };

    const scoreColor = getColor(score);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-center h-full min-h-[300px]"
        >
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-zinc-800/20 to-transparent pointer-events-none" />

            <div className="relative z-10 w-full h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="100%"
                            startAngle={180}
                            endAngle={0}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={10}
                        >
                            <Cell key="score" fill={scoreColor} />
                            <Cell key="remaining" fill="#27272a" />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                {/* Score Display in Center - Positioned absolutely to sit in the semi-circle */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-5xl font-bold text-white mb-1"
                    >
                        {score}
                    </motion.div>
                </div>
            </div>

            <div className="text-center mt-6">
                <h3 className="text-lg font-semibold text-zinc-100">Wellness Score</h3>
                <p className="text-zinc-500 text-sm mt-1">Based on recent vitals</p>
            </div>

            {/* Major Ticks Mockup (Decorative) */}
            <div className="absolute bottom-24 w-[200px] flex justify-between px-4 opacity-30 pointer-events-none">

            </div>
        </motion.div>
    );
}
