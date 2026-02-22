import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { chatCoordinator, StreamState } from '../lib/ChatCoordinator';
import { useSession } from '../lib/auth-client';

interface ChatContextType {
    streams: Record<string, StreamState>;
    sendMessage: (sessionId: string | null, content: string) => Promise<void>;
    activeSessionId: string | null;
    setActiveSessionId: (id: string | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [streams, setStreams] = useState<Record<string, StreamState>>({});
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const { data: sessionData } = useSession();
    const userId = sessionData?.user?.id;

    useEffect(() => {
        chatCoordinator.setUserId(userId || null);
    }, [userId]);

    useEffect(() => {
        const unsubscribe = chatCoordinator.subscribe((newStreams) => {
            setStreams(newStreams);
        });
        return () => {
            unsubscribe();
        };
    }, []);

    const sendMessage = async (sessionId: string | null, content: string, history: any[] = []) => {
        await chatCoordinator.sendMessage(sessionId, content, history);
    };

    return (
        <ChatContext.Provider value={{ streams, sendMessage, activeSessionId, setActiveSessionId }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};
