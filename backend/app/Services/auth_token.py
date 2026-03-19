import base64
import hmac
import json
import os
import time
import hashlib

SECRET = os.getenv("FINGUARD_SECRET", "finguard-dev-secret")


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def sign(payload: dict, ttl_seconds: int = 3600) -> str:
    payload = payload.copy()
    payload["exp"] = int(time.time()) + ttl_seconds
    body = _b64url(json.dumps(payload, separators=(",", ":")).encode())
    sig = hmac.new(SECRET.encode(), body.encode(), hashlib.sha256).hexdigest()
    return f"{body}.{sig}"


def verify(token: str) -> dict | None:
    try:
        body, sig = token.split(".")
        expected = hmac.new(SECRET.encode(), body.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None
        payload = json.loads(_b64url_decode(body).decode())
        if payload.get("exp") and int(time.time()) > int(payload["exp"]):
            return None
        return payload
    except Exception:
        return None
