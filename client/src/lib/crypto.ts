

const SALT = process.env.ENCRYPTION_SALT;

async function getKey(userId: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(userId + SALT),
        "PBKDF2",
        false,
        ["deriveBits", "deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: enc.encode(SALT),
            iterations: 100000,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function encrypt(userId: string, text: string): Promise<string> {
    if (!text) return "";

    const enc = new TextEncoder();
    const key = await getKey(userId);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const ciphertext = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        enc.encode(text)
    );

    // Combine IV and ciphertext
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    // Return as Base64 string
    return btoa(String.fromCharCode(...combined));
}

export async function decrypt(userId: string, encryptedBase64: string): Promise<string> {
    if (!encryptedBase64) return "";

    try {
        const combined = new Uint8Array(
            atob(encryptedBase64)
                .split("")
                .map((char) => char.charCodeAt(0))
        );

        const iv = combined.slice(0, 12);
        const ciphertext = combined.slice(12);
        const key = await getKey(userId);

        const decrypted = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            ciphertext
        );

        return new TextDecoder().decode(decrypted);
    } catch (error) {
        console.error("Decryption failed:", error);
        return "[DECRYPTION_ERROR]";
    }
}
