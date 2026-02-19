import { createFileRoute } from "@tanstack/react-router";
import { Send, Info } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import {
  getChatSessions,
  getChatMessages,
  deleteChatSession as deleteRemoteSession,
} from "../../lib/api";
import { useSession } from "../../lib/auth-client";
import * as db from "../../lib/db";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Plus, MessageSquare, Trash2, History } from "lucide-react";
import { useChat } from "../../contexts/ChatContext";

export const Route = createFileRoute("/dashboard/chat")({
  component: AnalysisPage,
});

function AnalysisPage() {
  const { data: sessionData } = useSession();
  const userId = sessionData?.user?.id;

  const { streams, sendMessage, activeSessionId, setActiveSessionId } = useChat();

  const [sessions, setSessions] = useState<db.ChatSession[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentSessionId = activeSessionId;
  const setCurrentSessionId = setActiveSessionId;

  // Load all sessions
  useEffect(() => {
    if (!userId) return;

    const loadSessions = async () => {
      try {
        const localSessions = await db.getSessions(userId);
        setSessions(localSessions.sort((a, b) => b.updated_at - a.updated_at));

        const remoteSessions = await getChatSessions();
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

    // If there's an active stream for this session, we'll use its messages
    if (streams[currentSessionId]) {
      setMessages(streams[currentSessionId].messages);
      return;
    }

    const loadMessages = async () => {
      setIsLoadingHistory(true);
      try {
        const localMsgs = await db.getMessages(currentSessionId);
        setMessages(localMsgs.sort((a, b) => a.created_at - b.created_at));

        const remoteMsgs = await getChatMessages(currentSessionId);
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

  // Sync state if a stream is active
  useEffect(() => {
    if (currentSessionId && streams[currentSessionId]) {
      setMessages(streams[currentSessionId].messages);
    }
  }, [streams, currentSessionId]);

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

    await sendMessage(currentSessionId, userMsg, messages);
  };

  const isTyping = currentSessionId ? streams[currentSessionId]?.isTyping : false;
  const currentStatus = currentSessionId ? streams[currentSessionId]?.status : null;

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
                      <div className="flex flex-col gap-2 mt-2 text-blue-600">
                        {currentStatus && (
                          <div className="text-xs font-medium italic animate-pulse">
                            {currentStatus}
                          </div>
                        )}
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
