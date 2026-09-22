from flask import Blueprint, jsonify
from models.database import SessionLocal
from models.schema import Notification
from services.notification_engine import generate_notifications

notifications_bp = Blueprint("notifications", __name__)

@notifications_bp.route("/api/notifications", methods=["GET"])
def get_notifications():
    generate_notifications()
    db = SessionLocal()
    try:
        notifs = db.query(Notification).order_by(Notification.created_at.desc()).limit(50).all()
        return jsonify([{
            "id": n.id, "title": n.title, "message": n.message,
            "type": n.type, "read": n.read, "source": n.source,
            "source_id": n.source_id, "created_at": n.created_at.isoformat()
        } for n in notifs])
    finally:
        db.close()

@notifications_bp.route("/api/notifications/unread-count", methods=["GET"])
def unread_count():
    db = SessionLocal()
    try:
        count = db.query(Notification).filter(Notification.read == False).count()
        return jsonify({"count": count})
    finally:
        db.close()

@notifications_bp.route("/api/notifications/<int:notif_id>/read", methods=["POST"])
def mark_read(notif_id):
    db = SessionLocal()
    try:
        n = db.query(Notification).filter(Notification.id == notif_id).first()
        if n:
            n.read = True
            db.commit()
        return jsonify({"message": "Marked as read"})
    finally:
        db.close()

@notifications_bp.route("/api/notifications/read-all", methods=["POST"])
def mark_all_read():
    db = SessionLocal()
    try:
        db.query(Notification).filter(Notification.read == False).update({"read": True})
        db.commit()
        return jsonify({"message": "All marked as read"})
    finally:
        db.close()
