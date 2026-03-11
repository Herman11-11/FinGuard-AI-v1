from models.database import SessionLocal, Officer
import hashlib


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def seed():
    db = SessionLocal()
    try:
        if db.query(Officer).count() > 0:
            print("Officers already exist. Skipping seed.")
            return

        officers = [
            Officer(name="Officer Sarah", role="Registrar", password_hash=hash_password("sarah123")),
            Officer(name="Officer Michael", role="Verifier", password_hash=hash_password("michael123")),
            Officer(name="Supervisor David", role="Supervisor", password_hash=hash_password("david123")),
        ]
        db.add_all(officers)
        db.commit()
        print("Seeded 3 officers.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
