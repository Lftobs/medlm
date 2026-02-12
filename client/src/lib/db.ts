import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface ChatMessage {
    id: string;
    session_id: string;
    user_id: string;
    role: 'user' | 'ai' | 'system';
    content: string;
    created_at: number;
}

export interface ChatSession {
    id: string;
    user_id: string;
    title: string;
    created_at: number;
    updated_at: number;
}

interface MedLMDB extends DBSchema {
    sessions: {
        key: string;
        value: ChatSession;
        indexes: { 'by-user': string };
    };
    messages: {
        key: string;
        value: ChatMessage;
        indexes: { 'by-session': string };
    };
}

let dbPromise: Promise<IDBPDatabase<MedLMDB>> | null = null;

export const getDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<MedLMDB>('medlm-chat-db', 1, {
            upgrade(db) {
                const sessionStore = db.createObjectStore('sessions', {
                    keyPath: 'id',
                });
                sessionStore.createIndex('by-user', 'user_id');

                const messageStore = db.createObjectStore('messages', {
                    keyPath: 'id',
                });
                messageStore.createIndex('by-session', 'session_id');
            },
        });
    }
    return dbPromise;
};

export const saveSession = async (session: ChatSession) => {
    const db = await getDB();
    await db.put('sessions', session);
};

export const getSessions = async (userId: string) => {
    const db = await getDB();
    return db.getAllFromIndex('sessions', 'by-user', userId);
};

export const deleteSession = async (id: string) => {
    const db = await getDB();
    const tx = db.transaction(['sessions', 'messages'], 'readwrite');
    await tx.objectStore('sessions').delete(id);

    // Also delete all messages in this session
    const messages = await tx.objectStore('messages').index('by-session').getAllKeys(id);
    for (const msgId of messages) {
        await tx.objectStore('messages').delete(msgId);
    }
    await tx.done;
};

export const saveMessage = async (message: ChatMessage) => {
    const db = await getDB();
    await db.put('messages', message);
};

export const getMessages = async (sessionId: string) => {
    const db = await getDB();
    return db.getAllFromIndex('messages', 'by-session', sessionId);
};
