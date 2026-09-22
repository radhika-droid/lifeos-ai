import os, uuid
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from utils.helpers import allowed_file
import config

uploads_bp = Blueprint("uploads", __name__)

@uploads_bp.route("/api/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    if not allowed_file(file.filename, config.ALLOWED_EXTENSIONS):
        return jsonify({"error": "File type not allowed"}), 400
    ext = file.filename.rsplit(".", 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    os.makedirs(config.UPLOAD_FOLDER, exist_ok=True)
    file.save(os.path.join(config.UPLOAD_FOLDER, filename))
    return jsonify({"url": f"/uploads/{filename}", "filename": filename}), 201

@uploads_bp.route("/uploads/<filename>")
def serve_upload(filename):
    return send_from_directory(config.UPLOAD_FOLDER, filename)
