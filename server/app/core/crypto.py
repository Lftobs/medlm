import base64
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import settings


_raw_key = settings.ENCRYPTION_KEY.encode()
if len(_raw_key) < 32:
    _raw_key = _raw_key.ljust(32, b"0")
else:
    _raw_key = _raw_key[:32]

_aesgcm = AESGCM(_raw_key)

def encrypt_content(text: str) -> str:
    """
    Encrypts text using AES-256-GCM.
    Returns a string in the format "nonce:ciphertext" (base64 encoded).
    """
    if not text:
        return ""
    
    nonce = os.urandom(12)
    ciphertext = _aesgcm.encrypt(nonce, text.encode(), None)
    
    blob = nonce + ciphertext
    return base64.b64encode(blob).decode('utf-8')

def decrypt_content(encrypted_blob: str) -> str:
    """
    Decrypts a base64 encoded "nonce+ciphertext" blob.
    """
    if not encrypted_blob:
        return ""
    
    try:
        data = base64.b64decode(encrypted_blob)
        nonce = data[:12]
        ciphertext = data[12:]
        
        decrypted = _aesgcm.decrypt(nonce, ciphertext, None)
        return decrypted.decode('utf-8')
    except Exception:
        return "[ENCRYPTION_ERROR or UNENCRYPTED_DATA]"
