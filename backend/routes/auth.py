from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
from models.database import SessionLocal
from models.schema import User

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username_or_email = data.get("username", "").strip() or data.get("email", "").strip()
    password = data.get("password", "").strip()

    if not username_or_email or not password:
        return jsonify({"error": "Username/email and password required"}), 400

    db = SessionLocal()
    try:
        user = db.query(User).filter(
            (User.username == username_or_email) | (User.email == username_or_email)
        ).first()

        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({"error": "Invalid username or password"}), 401

        return jsonify({
            "message": "Login successful",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "bio": user.bio,
                "avatar": user.avatar
            }
        })
    finally:
        db.close()

@auth_bp.route("/api/auth/me", methods=["GET"])
def get_current_user():
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(username="radhika").first()
        if not user:
            return jsonify({"error": "User not found"}), 404
        return jsonify({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "bio": user.bio,
            "avatar": user.avatar
        })
    finally:
        db.close()
