import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { encrypt, decrypt } from './crypto';

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
    const encryptedSession = {
        ...session,
        title: await encrypt(session.user_id, session.title)
    };
    await db.put('sessions', encryptedSession);
};

export const getSessions = async (userId: string) => {
    const db = await getDB();
    const encryptedSessions = await db.getAllFromIndex('sessions', 'by-user', userId);

    const decryptedSessions = await Promise.all(
        encryptedSessions.map(async (s) => ({
            ...s,
            title: await decrypt(userId, s.title)
        }))
    );

    return decryptedSessions;
};

export const deleteSession = async (id: string) => {
    const db = await getDB();
    const tx = db.transaction(['sessions', 'messages'], 'readwrite');
    await tx.objectStore('sessions').delete(id);

    const messages = await tx.objectStore('messages').index('by-session').getAllKeys(id);
    for (const msgId of messages) {
        await tx.objectStore('messages').delete(msgId);
    }
    await tx.done;
};

export const saveMessage = async (message: ChatMessage) => {
    const db = await getDB();
    const encryptedMessage = {
        ...message,
        content: await encrypt(message.user_id, message.content)
    };
    await db.put('messages', encryptedMessage);
};

export const getMessages = async (sessionId: string) => {
    const db = await getDB();
    const encryptedMessages = await db.getAllFromIndex('messages', 'by-session', sessionId);

    const decryptedMessages = await Promise.all(
        encryptedMessages.map(async (m) => ({
            ...m,
            content: await decrypt(m.user_id, m.content)
        }))
    );

    return decryptedMessages;
};
