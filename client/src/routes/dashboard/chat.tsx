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
import { useRef, useState, useEffect, useMemo } from "react";
import {
  getChatSessions,
  getChatMessages,
  deleteChatSession as deleteRemoteSession,
  streamChat,
} from "../../lib/api";
import { useSession } from "../../lib/auth-client";
import * as db from "../../lib/db";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Plus, MessageSquare, Trash2, History } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

export const Route = createFileRoute("/dashboard/chat")({
  component: AnalysisPage,
});

function AnalysisPage() {
  const { data: sessionData } = useSession();
  const userId = sessionData?.user?.id;

  const [sessions, setSessions] = useState<db.ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load all sessions
  useEffect(() => {
    if (!userId) return;

    const loadSessions = async () => {
      try {
        // Load from local DB first for instant UI
        const localSessions = await db.getSessions(userId);
        setSessions(localSessions.sort((a, b) => b.updated_at - a.updated_at));

        // Sync from server
        const remoteSessions = await getChatSessions();
        // Update local DB with remote sessions
        for (const s of remoteSessions) {
          await db.saveSession({
            id: s.id,
            user_id: s.user_id,
            title: s.title,
            created_at: new Date(s.created_at).getTime(),
            updated_at: new Date(s.updated_at).getTime(),
          });
        }
        const syncedSessions = await db.getSessions(userId);
        setSessions(syncedSessions.sort((a, b) => b.updated_at - a.updated_at));
      } catch (err) {
        console.error("Failed to load sessions:", err);
      }
    };

    loadSessions();
  }, [userId]);

  // Load messages when session changes
  useEffect(() => {
    if (!currentSessionId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setIsLoadingHistory(true);
      try {
        // Try local first
        const localMsgs = await db.getMessages(currentSessionId);
        if (localMsgs.length > 0) {
          setMessages(localMsgs.sort((a, b) => a.created_at - b.created_at));
        }

        // Fetch from server to ensure sync
        const remoteMsgs = await getChatMessages(currentSessionId);
        // Update local with remote
        for (const m of remoteMsgs) {
          await db.saveMessage({
            id: m.id,
            session_id: m.session_id,
            user_id: m.user_id,
            role: m.role,
            content: m.content,
            created_at: new Date(m.created_at).getTime(),
          });
        }
        const syncedMsgs = await db.getMessages(currentSessionId);
        setMessages(syncedMsgs.sort((a, b) => a.created_at - b.created_at));
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadMessages();
  }, [currentSessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !userId) return;

    const userMsg = input;
    setInput("");

    // New message setup
    const userMsgObj: db.ChatMessage = {
      id: uuidv4(),
      session_id: currentSessionId || '', // Temporary if no session
      user_id: userId,
      role: 'user',
      content: userMsg,
      created_at: Date.now(),
    };

    if (currentSessionId) {
      setMessages((prev) => [...prev, userMsgObj]);
      await db.saveMessage(userMsgObj);
    } else {
      // Create a temporary session in state if none selected
      setMessages([userMsgObj]);
    }

    setIsTyping(true);
    let currentResponse = "";

    // Placeholder for AI message
    const aiMsgId = uuidv4();
    setMessages((prev) => [...prev, { id: aiMsgId, role: "ai", content: "" }]);

    await streamChat(
      userMsg,
      {
        page: "chat",
        session_id: currentSessionId,
        onSessionCreated: (newId: string) => {
          if (!currentSessionId) {
            setCurrentSessionId(newId);
            // Update the user message session_id in DB
            userMsgObj.session_id = newId;
            db.saveMessage(userMsgObj);

            // Create session in local DB
            const newSession: db.ChatSession = {
              id: newId,
              user_id: userId,
              title: userMsg.slice(0, 50),
              created_at: Date.now(),
              updated_at: Date.now(),
            };
            db.saveSession(newSession);
            setSessions(prev => [newSession, ...prev]);
          }
        }
      },
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
            const aiIdx = newMsgs.findIndex(m => m.id === aiMsgId);
            if (aiIdx !== -1) {
              newMsgs[aiIdx] = {
                ...newMsgs[aiIdx],
                content: currentResponse,
              };
            }
            return newMsgs;
          });
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

    // Save AI response to local DB
    if (currentSessionId) {
      await db.saveMessage({
        id: aiMsgId,
        session_id: currentSessionId,
        user_id: userId,
        role: 'ai',
        content: currentResponse,
        created_at: Date.now(),
      });
      // Update session timestamp
      const session = sessions.find(s => s.id === currentSessionId);
      if (session) {
        const updated = { ...session, updated_at: Date.now() };
        await db.saveSession(updated);
        setSessions(prev => prev.map(s => s.id === currentSessionId ? updated : s).sort((a, b) => b.updated_at - a.updated_at));
      }
    }

    setIsTyping(false);
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this chat?")) return;

    try {
      await deleteRemoteSession(id);
      await db.deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (currentSessionId === id) {
        handleNewChat();
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const chartData = [
    { name: "Jan", value: 180 },
    { name: "Mar", value: 175 },
    { name: "May", value: 168 },
    { name: "Jul", value: 170 },
    { name: "Sep", value: 162 },
    { name: "Nov", value: 158 },
  ];

  return (
    <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <img src="/medlm-icon.svg" className="w-8 h-8 rounded-lg shadow-sm" alt="MedLM" />
            Health IQ
          </h1>
          <p className="text-slate-500 mt-1">
            Deep dive into your medical data with AI.
          </p>
        </div>
        <button
          onClick={handleNewChat}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          New Chat
        </button>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Sidebar: Chat History */}
        <div className="hidden md:flex flex-col w-64 shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2 text-slate-900 font-semibold">
            <History size={18} className="text-slate-400" />
            Recent Chats
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => setCurrentSessionId(s.id)}
                className={`group flex items-center gap-3 p-3 rounded-lg text-sm cursor-pointer transition-all ${currentSessionId === s.id
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
                <div className="shrink-0">
                  <MessageSquare size={16} className={currentSessionId === s.id ? "text-blue-500" : "text-slate-400"} />
                </div>
                <span className="flex-1 truncate font-medium">
                  {s.title || "Untitled Chat"}
                </span>
                <button
                  onClick={(e) => handleDeleteSession(e, s.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-all"
                >
                  <Trash2 size={14} className="text-slate-400 hover:text-red-500" />
                </button>
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                No recent chats
              </div>
            )}
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col min-w-0 bg-white rounded-xl border border-slate-200 shadow-sm min-h-0">
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {isLoadingHistory && (
              <div className="flex justify-center py-4">
                <div className="animate-spin h-5 w-5 text-blue-500 border-2 border-current border-t-transparent rounded-full" />
              </div>
            )}

            {!isLoadingHistory && messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-slate-900 font-semibold mb-2">Start a new conversation</h3>
                <p className="text-slate-500 text-sm max-w-xs">
                  Ask me anything about your medical records, trends, or health history.
                </p>
              </div>
            )}

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
                    ? "bg-blue-600 text-white rounded-tr-none whitespace-pre-wrap shadow-sm"
                    : "bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-none prose prose-sm prose-slate max-w-none shadow-sm"
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
                      </div>
                    )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-slate-100 bg-white rounded-b-xl shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your message..."
                disabled={isTyping}
                className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all placeholder:text-slate-400 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={isTyping || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:bg-slate-400"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Analyzed Sources */}
        <div className="hidden xl:flex flex-col w-72 shrink-0 gap-4 min-h-0">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info size={18} className="text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 text-sm">
                  Personal Health Assistant
                </h4>
                <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                  I can analyze your uploaded records, track trends, and explain complex medical terms in simple language.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h4 className="font-medium text-slate-900 text-sm mb-3">Suggested Topics</h4>
            <div className="space-y-2">
              <Suggestion text="Analyze my latest labs" />
              <Suggestion text="Explain my symptoms" />
              <Suggestion text="Summary of my history" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Suggestion({ text }: { text: string }) {
  return (
    <button className="w-full text-left p-2 text-xs text-slate-600 hover:bg-white hover:text-blue-600 hover:shadow-sm rounded-lg border border-transparent hover:border-slate-100 transition-all">
      {text}
    </button>
  );
}
