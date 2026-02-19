import { streamChat } from './api';
import * as db from './db';
import { v4 as uuidv4 } from 'uuid';

export interface StreamState {
    sessionId: string;
    messages: db.ChatMessage[];
    isTyping: boolean;
    status: string | null;
    error: string | null;
}

type Listener = (state: Record<string, StreamState>) => void;

class ChatCoordinator {
    private streams: Record<string, StreamState> = {};
    private listeners: Set<Listener> = new Set();
    private userId: string | null = null;

    setUserId(id: string | null) {
        this.userId = id;
    }

    subscribe(listener: Listener) {
        this.listeners.add(listener);
        listener(this.streams);
        return () => this.listeners.delete(listener);
    }

    private notify() {
        this.listeners.forEach((l) => l({ ...this.streams }));
    }

    private updateStream(sessionId: string, update: Partial<StreamState>) {
        if (!this.streams[sessionId]) return;
        this.streams[sessionId] = { ...this.streams[sessionId], ...update };
        this.notify();
    }

    private initializeStream(tempSessionId: string, sessionId: string | null, userMsg: db.ChatMessage, aiMsgId: string, userId: string, history: db.ChatMessage[] = []) {
        this.streams[tempSessionId] = {
            sessionId: sessionId || '',
            messages: [...history, userMsg, { id: aiMsgId, role: 'ai', content: '', session_id: sessionId || '', user_id: userId, created_at: Date.now() }],
            isTyping: true,
            status: 'Thinking...',
            error: null,
        };
        this.notify();
    }

    async sendMessage(sessionId: string | null, content: string, history: db.ChatMessage[] = []) {
        if (!this.userId) throw new Error("User ID not set in ChatCoordinator");

        const tempSessionId = sessionId || `temp-${uuidv4()}`;
        const userMsgId = uuidv4();
        const aiMsgId = uuidv4();

        const userMsg: db.ChatMessage = {
            id: userMsgId,
            session_id: sessionId || '',
            user_id: this.userId,
            role: 'user',
            content,
            created_at: Date.now(),
        };

        // Initialize stream state with current turn + history if provided
        this.initializeStream(tempSessionId, sessionId, userMsg, aiMsgId, this.userId, history);

        let fullAiResponse = "";
        let finalSessionId = sessionId;

        try {
            await streamChat(
                content,
                {
                    session_id: sessionId,
                    onSessionCreated: (newId: string) => {
                        finalSessionId = newId;
                        const state = this.streams[tempSessionId];
                        if (state) {
                            // Map temp state to real session ID if needed
                            if (!sessionId) {
                                this.streams[newId] = { ...state, sessionId: newId };
                                delete this.streams[tempSessionId];
                            }
                            this.updateStream(newId, { sessionId: newId });

                            // Persist user message with real session ID
                            userMsg.session_id = newId;
                            db.saveMessage(userMsg);

                            const newSession: db.ChatSession = {
                                id: newId,
                                user_id: this.userId!,
                                title: content.slice(0, 50),
                                created_at: Date.now(),
                                updated_at: Date.now(),
                            };
                            db.saveSession(newSession);
                        }
                    },
                    onStatus: (status: string) => {
                        this.updateStream(finalSessionId || tempSessionId, { status });
                    }
                },
                (chunk) => {
                    if (chunk && typeof chunk === "string") {
                        let text = chunk;
                        if (text.startsWith('"') && text.endsWith('"')) text = text.slice(1, -1);
                        text = text.replace(/\\n/g, "\n");
                        fullAiResponse += text;

                        const currentId = finalSessionId || tempSessionId;
                        const state = this.streams[currentId];
                        if (state) {
                            const newMsgs = [...state.messages];
                            const aiIdx = newMsgs.findIndex(m => m.id === aiMsgId);
                            if (aiIdx !== -1) {
                                newMsgs[aiIdx] = { ...newMsgs[aiIdx], content: fullAiResponse, session_id: currentId };
                            }
                            this.updateStream(currentId, { messages: newMsgs, status: null });
                        }
                    }
                },
                (err) => {
                    this.updateStream(finalSessionId || tempSessionId, { error: err, isTyping: false });
                }
            );

            // Final save
            const currentId = finalSessionId || tempSessionId;
            if (currentId && !currentId.startsWith('temp-')) {
                await db.saveMessage({
                    id: aiMsgId,
                    session_id: currentId,
                    user_id: this.userId,
                    role: 'ai',
                    content: fullAiResponse,
                    created_at: Date.now(),
                });

                // Update session timestamp
                const session = await db.getSessions(this.userId);
                const s = session.find(x => x.id === currentId);
                if (s) {
                    await db.saveSession({ ...s, updated_at: Date.now() });
                }
            }

            this.updateStream(currentId, { isTyping: false, status: null });

        } catch (error) {
            this.updateStream(finalSessionId || tempSessionId, { error: String(error), isTyping: false });
        }
    }

    getStream(sessionId: string | null): StreamState | undefined {
        if (!sessionId) return undefined;
        return this.streams[sessionId];
    }

    getAllStreams(): Record<string, StreamState> {
        return this.streams;
    }
}

export const chatCoordinator = new ChatCoordinator();
