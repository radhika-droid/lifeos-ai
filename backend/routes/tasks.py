from flask import Blueprint, request, jsonify
from models.database import SessionLocal
from models.schema import Task, Notification
from utils.helpers import parse_date, is_past_due, today_str
from datetime import datetime

tasks_bp = Blueprint("tasks", __name__)

def serialize_task(t):
    return {
        "id": t.id, "name": t.name, "description": t.description,
        "category": t.category, "priority": t.priority, "urgency": t.urgency,
        "difficulty": t.difficulty, "time_estimate": t.time_estimate,
        "due_date": t.due_date.isoformat() if t.due_date else None,
        "completed": t.completed,
        "is_overdue": is_past_due(t.due_date) and not t.completed,
        "created_at": t.created_at.isoformat()
    }

@tasks_bp.route("/api/tasks", methods=["GET"])
def get_tasks():
    db = SessionLocal()
    try:
        tasks = db.query(Task).order_by(Task.created_at.desc()).all()
        return jsonify([serialize_task(t) for t in tasks])
    finally:
        db.close()

@tasks_bp.route("/api/tasks", methods=["POST"])
def create_task():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Task name is required"}), 400
    db = SessionLocal()
    try:
        task = Task(
            name=name,
            description=data.get("description", ""),
            category=data.get("category", "general"),
            priority=int(data.get("priority", 1)),
            urgency=int(data.get("urgency", 1)),
            difficulty=int(data.get("difficulty", 1)),
            time_estimate=float(data.get("time_estimate", 1.0)),
            due_date=parse_date(data.get("due_date"))
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return jsonify(serialize_task(task)), 201
    finally:
        db.close()

@tasks_bp.route("/api/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    data = request.get_json(silent=True) or {}
    db = SessionLocal()
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return jsonify({"error": "Task not found"}), 404
        for field in ["name","description","category","priority","urgency","difficulty","time_estimate","completed"]:
            if field in data:
                setattr(task, field, data[field])
        if "due_date" in data:
            task.due_date = parse_date(data["due_date"])
        db.commit()
        db.refresh(task)
        return jsonify(serialize_task(task))
    finally:
        db.close()

@tasks_bp.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    db = SessionLocal()
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return jsonify({"error": "Task not found"}), 404
        db.delete(task)
        db.commit()
        return jsonify({"message": "Task deleted"})
    finally:
        db.close()

@tasks_bp.route("/api/tasks/<int:task_id>/complete", methods=["POST"])
def complete_task(task_id):
    db = SessionLocal()
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return jsonify({"error": "Task not found"}), 404
        task.completed = True
        db.commit()
        return jsonify({"message": "Task marked complete", "task": serialize_task(task)})
    finally:
        db.close()
