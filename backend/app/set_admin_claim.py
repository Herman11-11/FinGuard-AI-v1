import sys
try:
    from services.firebase_admin import set_admin_claim
except ModuleNotFoundError:
    from Services.firebase_admin import set_admin_claim


def main():
    if len(sys.argv) < 2:
        print("Usage: python app/set_admin_claim.py admin@example.com")
        sys.exit(1)
    email = sys.argv[1]
    uid = set_admin_claim(email, True)
    print(f"Admin claim set for {email} (uid: {uid})")


if __name__ == "__main__":
    main()
