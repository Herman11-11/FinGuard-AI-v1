import os
import json
import firebase_admin
from firebase_admin import credentials, auth

_app = None


def init_firebase():
    global _app
    if _app:
        return _app
    raw_json = os.getenv("FIREBASE_ADMIN_JSON")
    if raw_json:
        cred = credentials.Certificate(json.loads(raw_json))
        _app = firebase_admin.initialize_app(cred)
        return _app
    key_path = os.getenv("FIREBASE_ADMIN_KEY", "backend/keys/firebase-admin.json")
    if not os.path.exists(key_path):
        # Try relative to repo root
        alt = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "keys", "firebase-admin.json")
        if os.path.exists(alt):
            key_path = alt
    cred = credentials.Certificate(key_path)
    _app = firebase_admin.initialize_app(cred)
    return _app


def verify_id_token(id_token: str) -> dict:
    init_firebase()
    return auth.verify_id_token(id_token)


def set_admin_claim(email: str, is_admin: bool = True):
    init_firebase()
    user = auth.get_user_by_email(email)
    auth.set_custom_user_claims(user.uid, {"admin": is_admin})
    return user.uid
