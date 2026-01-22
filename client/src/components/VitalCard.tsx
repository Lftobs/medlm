import { motion } from "framer-motion";
import {
    Activity,
    Minus,
    TrendingDown,
    TrendingUp,
} from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface VitalCardProps {
    testName: string;
    data: Array<{ date: string; value: number }>;
    index?: number;
}

export function VitalCard({ testName, data, index = 0 }: VitalCardProps) {
    const getAverage = (data: Array<{ value: number | string }>) => {
        if (data.length === 0) return 0;
        const validData = data.map(d => {
            const valStr = String(d.value);
            const cleanVal = valStr.replace(/[^\d.-]/g, '');
            return parseFloat(cleanVal);
        }).filter(v => !isNaN(v));

        if (validData.length === 0) return 0;

        const sum = validData.reduce((acc, curr) => acc + curr, 0);
        return (sum / validData.length).toFixed(1);
    };

    const getTrend = (data: Array<{ value: number | string }>) => {
        if (data.length < 2) return null;

        const validValues = data.map(d => {
            const valStr = String(d.value);
            const cleanVal = valStr.replace(/[^\d.-]/g, '');
            return parseFloat(cleanVal);
        }).filter(v => !isNaN(v));

        if (validValues.length < 2) return null;

        const first = validValues[0];
        const last = validValues[validValues.length - 1];

        const change = ((last - first) / first) * 100;

        if (Math.abs(change) < 2)
            return { type: "stable", icon: Minus, color: "text-gray-500" };
        if (change > 0)
            return { type: "up", icon: TrendingUp, color: "text-green-500" };
        return { type: "down", icon: TrendingDown, color: "text-red-500" };
    };

    const getChartColor = (testName: string) => {
        let hash = 0;
        for (let i = 0; i < testName.length; i++) {
            hash = testName.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = Math.abs(hash % 360);
        return `hsl(${h}, 70%, 50%)`;
    };

    const trend = getTrend(data);
    const TrendIcon = trend?.icon || Minus;
    const chartColor = getChartColor(testName);
    const average = getAverage(data);

    const chartData = data.map(d => ({ ...d, value: Number(d.value) })).filter(d => !isNaN(d.value));


    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="break-inside-avoid mb-6 bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                        <Activity size={18} style={{ color: chartColor }} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 line-clamp-1">
                            {testName}
                        </h3>
                        {data.length > 0 && (
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                <p>
                                    Latest:{" "}
                                    <span className="font-medium text-slate-900 text-sm">
                                        {data[data.length - 1].value}
                                    </span>
                                </p>
                                <span className="text-slate-300">|</span>
                                <p>
                                    Avg:{" "}
                                    <span className="font-medium text-slate-700">{average}</span>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
                {trend && (
                    <div
                        className={`flex items-center gap-1 ${trend.color} bg-slate-50 px-2 py-1 rounded-lg border border-slate-100`}
                    >
                        <TrendIcon className="h-4 w-4" />
                        <span className="text-xs font-medium capitalize">{trend.type}</span>
                    </div>
                )}
            </div>

            <div className="h-[200px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f1f5f9"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="date"
                            stroke="#94a3b8"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => {
                                const date = new Date(value);
                                return `${date.getMonth() + 1}/${date.getDate()}`;
                            }}
                            dy={10}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickCount={5}
                            domain={['auto', 'auto']}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#fff",
                                border: "1px solid #e2e8f0",
                                borderRadius: "8px",
                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                padding: "8px 12px",
                            }}
                            itemStyle={{
                                color: "#334155",
                                fontSize: "12px",
                                fontWeight: 500,
                            }}
                            labelStyle={{
                                color: "#64748b",
                                fontSize: "11px",
                                marginBottom: "4px",
                            }}
                            labelFormatter={(label) => {
                                const date = new Date(label);
                                if (isNaN(date.getTime())) return label; // Default if not a valid date
                                return date.toLocaleDateString(undefined, {
                                    weekday: "short",
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                });
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke={chartColor}
                            strokeWidth={2.5}
                            dot={{ fill: "#fff", stroke: chartColor, strokeWidth: 2, r: 3 }}
                            activeDot={{ r: 5, strokeWidth: 0, fill: chartColor }}
                            animationDuration={1500}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
