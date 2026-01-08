import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Send, TrendingUp, Info, FileText } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useRef, useState, useEffect } from "react";
import { getTrends, streamChat, startTrendAnalysis } from "../../lib/api";
import { useEventStream } from "../../hooks/use-event-stream";

export const Route = createFileRoute("/dashboard/chat")({
  component: AnalysisPage,
});

function AnalysisPage() {
  const [messages, setMessages] = useState<any[]>([
    { role: "ai", content: "Hello! I'm analyzing your health records now..." },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen for real-time analysis updates
  useEventStream((event) => {
    console.log("Stream event:", event);
    if (typeof event === "string" && event.includes("Analysis complete")) {
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: "Analysis complete! Trends have been updated.",
        },
      ]);
      getTrends().then((res) => {
        // Update chart data logic here if we had state for it
      });
    }
  });

  useEffect(() => {
    getTrends()
      .then((res) => {
        if (res.trends && res.trends.length > 0) {
          setMessages((prev) => [
            ...prev,
            { role: "ai", content: "I've loaded your latest trend analysis." },
          ]);
        } else {
          startTrendAnalysis().then(() => {
            setMessages((prev) => [
              ...prev,
              {
                role: "ai",
                content:
                  "I've started a new deep trend analysis on your records.",
              },
            ]);
          });
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsTyping(true);

    let currentResponse = "";

    // Optimistic AI message placeholder
    setMessages((prev) => [...prev, { role: "ai", content: "" }]);

    await streamChat(
      userMsg,
      { page: "chat" },
      (chunk) => {
        if (chunk && typeof chunk === "string") {
          let text = chunk;
          if (text.startsWith('"') && text.endsWith('"')) {
            text = text.slice(1, -1);
          }
          text = text.replace(/\\n/g, "\n");

          currentResponse += text;

          setMessages((prev) => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1] = {
              role: "ai",
              content: currentResponse,
            };
            return newMsgs;
          });
        } else if (chunk && typeof chunk === "object" && (chunk as any).text) {
          // Handle specific object structure if needed
        }
      },
      (err) => {
        console.error(err);
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          { role: "system", content: `Error: ${err}` },
        ]);
      },
    );
    setIsTyping(false);
  };

  // Sample Chart Data
  const chartData = [
    { name: "Jan", value: 180 },
    { name: "Mar", value: 175 },
    { name: "May", value: 168 },
    { name: "Jul", value: 170 },
    { name: "Sep", value: 162 },
    { name: "Nov", value: 158 },
  ];

  return (
    <div className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <Sparkles size={24} className="text-blue-600" />
          Health IQ
        </h1>
        <p className="text-slate-500 mt-1">
          Deep dive into your medical data with AI.
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Chat Interface */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-0">
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-slate-200" : "bg-blue-100"}`}
                >
                  {msg.role === "user" ? (
                    <span className="text-xs font-bold text-slate-600">YO</span>
                  ) : (
                    <Sparkles size={16} className="text-blue-600" />
                  )}
                </div>
                <div
                  className={`p-3 rounded-2xl text-sm max-w-lg leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-none"
                  }`}
                >
                  {msg.content}
                  {msg.role === "ai" &&
                    idx === messages.length - 1 &&
                    isTyping && (
                      <span className="inline-block w-2 H-2 bg-blue-400 rounded-full animate-pulse ml-2"></span>
                    )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-slate-100 bg-white rounded-b-xl">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask a follow-up question..."
                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all placeholder:text-slate-400"
              />
              <button
                onClick={handleSend}
                disabled={isTyping}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Analyzed Sources */}
        <div className="hidden lg:flex flex-col gap-4 min-h-0 overflow-y-auto">
          {/* Interactive Chart Context */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 h-64 shadow-sm">
            <h4 className="text-xs font-semibold text-slate-500 mb-4 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={14} /> Total Cholesterol (mg/dL)
            </h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  domain={["dataMin - 10", "dataMax + 10"]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  itemStyle={{
                    color: "#0f172a",
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#2563eb",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info size={18} className="text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 text-sm">
                  AI Disclaimer
                </h4>
                <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                  MedLM provides summaries for informational purposes only.
                  Always consult a healthcare professional.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
