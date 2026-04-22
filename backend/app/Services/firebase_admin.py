import os
import json
import base64
import firebase_admin
from firebase_admin import credentials, auth

_app = None


def init_firebase():
    global _app
    if _app:
        return _app

    raw_b64 = os.getenv("FIREBASE_ADMIN_JSON_B64")
    if raw_b64:
        decoded = base64.b64decode(raw_b64).decode("utf-8")
        cred = credentials.Certificate(json.loads(decoded))
        _app = firebase_admin.initialize_app(cred)
        return _app

    raw_json = os.getenv("FIREBASE_ADMIN_JSON")
    if raw_json:
        cred = credentials.Certificate(json.loads(raw_json))
        _app = firebase_admin.initialize_app(cred)
        return _app

    project_id = os.getenv("FIREBASE_PROJECT_ID")
    client_email = os.getenv("FIREBASE_CLIENT_EMAIL")
    private_key = os.getenv("FIREBASE_PRIVATE_KEY")
    if project_id and client_email and private_key:
        cred = credentials.Certificate(
            {
                "type": "service_account",
                "project_id": project_id,
                "client_email": client_email,
                "private_key": private_key.replace("\\n", "\n"),
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        )
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
