import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))

SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(ROOT_DIR, 'data', 'lifeos.db')}"
UPLOAD_FOLDER = os.path.join(ROOT_DIR, "uploads")
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp", "mp4", "mp3", "m4a", "pdf"}
