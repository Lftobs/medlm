import { createFileRoute } from "@tanstack/react-router";
import { Send, TrendingUp, Info } from "lucide-react";
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
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
          <img src="/medlm-icon.svg" className="w-8 h-8 rounded-lg shadow-sm" alt="MedLM" />
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
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-slate-200" : "bg-blue-100"}`}
                >
                  {msg.role === "user" ? (
                    <span className="text-xs font-bold text-slate-600">YO</span>
                  ) : (
                    <img src="/medlm-icon.svg" className="w-5 h-5" alt="MedLM" />
                  )}
                </div>
                <div
                  className={`p-3 rounded-2xl text-sm max-w-lg leading-relaxed ${msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-none whitespace-pre-wrap"
                    : "bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-none prose prose-sm prose-slate max-w-none"
                    }`}
                >
                  {msg.role === "ai" ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ ...props }) => (
                          <p className="mb-2 last:mb-0" {...props} />
                        ),
                        ul: ({ ...props }) => (
                          <ul className="list-disc pl-4 mb-2" {...props} />
                        ),
                        ol: ({ ...props }) => (
                          <ol className="list-decimal pl-4 mb-2" {...props} />
                        ),
                        li: ({ ...props }) => (
                          <li className="mb-1" {...props} />
                        ),
                        code: ({ inline, ...props }: any) =>
                          inline ? (
                            <code
                              className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono"
                              {...props}
                            />
                          ) : (
                            <code
                              className="block bg-slate-800 text-slate-100 p-3 rounded-lg text-xs overflow-x-auto font-mono my-2"
                              {...props}
                            />
                          ),
                        pre: ({ ...props }) => (
                          <pre className="my-2" {...props} />
                        ),
                        strong: ({ ...props }) => (
                          <strong
                            className="font-semibold text-slate-900"
                            {...props}
                          />
                        ),
                        em: ({ ...props }) => (
                          <em className="italic" {...props} />
                        ),
                        h1: ({ ...props }) => (
                          <h1
                            className="text-lg font-bold mb-2 mt-3 first:mt-0 text-slate-900"
                            {...props}
                          />
                        ),
                        h2: ({ ...props }) => (
                          <h2
                            className="text-base font-bold mb-2 mt-3 first:mt-0 text-slate-900"
                            {...props}
                          />
                        ),
                        h3: ({ ...props }) => (
                          <h3
                            className="text-sm font-bold mb-1 mt-2 first:mt-0 text-slate-800"
                            {...props}
                          />
                        ),
                        blockquote: ({ ...props }) => (
                          <blockquote
                            className="border-l-4 border-blue-400 pl-4 py-2 my-2 bg-blue-50 rounded-r text-slate-700 italic"
                            {...props}
                          />
                        ),
                        a: ({ ...props }) => (
                          <a
                            className="text-blue-600 hover:text-blue-700 underline font-medium"
                            target="_blank"
                            rel="noopener noreferrer"
                            {...props}
                          />
                        ),
                        table: ({ ...props }) => (
                          <div className="overflow-x-auto my-2">
                            <table
                              className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded"
                              {...props}
                            />
                          </div>
                        ),
                        thead: ({ ...props }) => (
                          <thead className="bg-slate-100" {...props} />
                        ),
                        tbody: ({ ...props }) => (
                          <tbody
                            className="bg-white divide-y divide-slate-200"
                            {...props}
                          />
                        ),
                        tr: ({ ...props }) => (
                          <tr className="hover:bg-slate-50" {...props} />
                        ),
                        th: ({ ...props }) => (
                          <th
                            className="px-3 py-2 text-left text-xs font-semibold text-slate-700"
                            {...props}
                          />
                        ),
                        td: ({ ...props }) => (
                          <td
                            className="px-3 py-2 text-xs text-slate-600"
                            {...props}
                          />
                        ),
                        hr: ({ ...props }) => (
                          <hr className="my-3 border-slate-200" {...props} />
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                  {msg.role === "ai" &&
                    idx === messages.length - 1 &&
                    isTyping && (
                      <div className="flex items-center gap-2 mt-2 text-blue-600">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium">
                          AI is thinking...
                        </span>
                      </div>
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
