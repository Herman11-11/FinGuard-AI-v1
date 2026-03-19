from models.database import SessionLocal, User
import hashlib


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def seed():
    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == "admin@finguard.ai").first():
            print("Admin already exists. Skipping seed.")
            return

        admin = User(
            email="admin@finguard.ai",
            password_hash=hash_password("admin123"),
            role="admin",
            is_active=True
        )
        db.add(admin)
        db.commit()
        print("Seeded admin user: admin@finguard.ai / admin123")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
