import json
import os
import sys
import urllib.request


GOOGLE_CERT_URLS = [
    "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",
    "https://www.googleapis.com/oauth2/v1/certs",
]


def check_url(url: str):
    print(f"\nChecking: {url}")
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            status = response.status
            body = response.read().decode("utf-8")
            print(f"Status: {status}")
            print(f"Body preview: {body[:200]}")
            json.loads(body)
            print("JSON parse: OK")
            return True
    except Exception as exc:
        print(f"FAILED: {exc}")
        return False


def check_service_account():
    key_path = os.getenv("FIREBASE_ADMIN_KEY", "backend/keys/firebase-admin.json")
    print(f"\nService account path: {key_path}")
    if not os.path.exists(key_path):
        alt = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "keys",
            "firebase-admin.json",
        )
        print(f"Default path missing. Trying alt path: {alt}")
        key_path = alt

    if not os.path.exists(key_path):
        print("FAILED: firebase-admin.json not found")
        return False

    try:
        with open(key_path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        print("Service account JSON: OK")
        print(f"Project ID: {data.get('project_id')}")
        print(f"Client email: {data.get('client_email')}")
        return True
    except Exception as exc:
        print(f"FAILED: {exc}")
        return False


def check_firebase_admin_import():
    print("\nChecking firebase_admin import")
    try:
        import firebase_admin  # noqa: F401
        from firebase_admin import auth, credentials  # noqa: F401
        print("firebase_admin import: OK")
        return True
    except Exception as exc:
        print(f"FAILED: {exc}")
        return False


def main():
    print("Firebase Diagnostics")
    print("====================")

    ok = True
    ok &= check_firebase_admin_import()
    ok &= check_service_account()

    for url in GOOGLE_CERT_URLS:
        ok &= check_url(url)

    print("\nSummary")
    print("-------")
    print("PASS" if ok else "FAIL")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
