from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import config

engine = create_engine(config.SQLALCHEMY_DATABASE_URI, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from models import schema  # noqa: F401
    from werkzeug.security import generate_password_hash
    Base.metadata.create_all(bind=engine)

    # Seed default user if not exists
    db = SessionLocal()
    try:
        existing = db.query(schema.User).filter_by(username="radhika").first()
        if not existing:
            user = schema.User(
                username="radhika",
                email="rad@gmail.com",
                password_hash=generate_password_hash("radrad"),
                bio="LifeOS AI Power User & Administrator",
                avatar="👩‍💻"
            )
            db.add(user)
            db.commit()
            print("Seeded user credentials: username='radhika', email='rad@gmail.com'")
    finally:
        db.close()

