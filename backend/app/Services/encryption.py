from cryptography.fernet import Fernet
import os
import base64
import hashlib

class EncryptionService:
    _key = None
    _key_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'encryption.key')
    
    @classmethod
    def _get_key(cls):
        """Get or create encryption key"""
        if cls._key is None:
            if os.path.exists(cls._key_file):
                with open(cls._key_file, 'rb') as f:
                    cls._key = f.read()
            else:
                # Generate new key
                cls._key = Fernet.generate_key()
                with open(cls._key_file, 'wb') as f:
                    f.write(cls._key)
                print(f"🔑 New encryption key generated at: {cls._key_file}")
        return cls._key
    
    @classmethod
    def encrypt(cls, data: str) -> str:
        """Encrypt sensitive data"""
        if not data:
            return None
        try:
            f = Fernet(cls._get_key())
            encrypted = f.encrypt(data.encode())
            return base64.b64encode(encrypted).decode()
        except Exception as e:
            print(f"Encryption error: {e}")
            return None
    
    @classmethod
    def decrypt(cls, encrypted_data: str) -> str:
        """Decrypt sensitive data"""
        if not encrypted_data:
            return None
        try:
            f = Fernet(cls._get_key())
            decrypted = f.decrypt(base64.b64decode(encrypted_data))
            return decrypted.decode()
        except Exception as e:
            print(f"Decryption error: {e}")
            return None
    
    @classmethod
    def hash_password(cls, password: str) -> str:
        """Hash passwords (one-way)"""
        salt = "FinGuard-AI-Static-Salt-2024"
        return hashlib.sha256((password + salt).encode()).hexdigest()