import React from 'react';
import { useChat } from '../contexts/ChatContext';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

export const MultiSessionIndicator: React.FC = () => {
    const { streams, setActiveSessionId } = useChat();
    const navigate = useNavigate();

    const activeStreams = Object.values(streams).filter(s => s.isTyping && s.sessionId);

    if (activeStreams.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
            {activeStreams.map((stream) => (
                <div
                    key={stream.sessionId}
                    onClick={() => {
                        setActiveSessionId(stream.sessionId);
                        navigate({ to: '/dashboard/chat' });
                    }}
                    className="bg-white border border-blue-100 shadow-lg rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:border-blue-300 transition-all animate-in slide-in-from-right-8"
                >
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    </div>
                    <div className="min-w-[150px] max-w-[250px]">
                        <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-0.5">
                            AI is processing
                        </div>
                        <div className="text-sm font-medium text-slate-900 truncate">
                            Session: {stream.sessionId.slice(0, 8)}...
                        </div>
                        {stream.status && (
                            <div className="text-[10px] text-slate-500 italic truncate mt-1">
                                {stream.status}
                            </div>
                        )}
                    </div>
                    <div className="shrink-0 bg-blue-600 p-2 rounded-lg text-white">
                        <MessageSquare size={16} />
                    </div>
                </div>
            ))}
        </div>
    );
};
