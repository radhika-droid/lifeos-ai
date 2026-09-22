from flask import Blueprint, request, jsonify
from models.database import SessionLocal
from models.schema import Habit, HabitLog
from services.habit_engine import DEFAULT_HABITS, calculate_streak, should_auto_track
from utils.helpers import today_str
from datetime import date, timedelta

habits_bp = Blueprint("habits", __name__)

def serialize_habit(h, logs_today=None, logs_all=None):
    completed_dates = [l.date_str for l in (logs_all or []) if l.completed]
    streak = calculate_streak(completed_dates)
    auto = should_auto_track(set(completed_dates))
    today_log = next((l for l in (logs_today or []) if l.date_str == today_str()), None)
    return {
        "id": h.id, "name": h.name, "emoji": h.emoji,
        "description": h.description, "target_value": h.target_value,
        "unit": h.unit, "frequency": h.frequency,
        "auto_tracked": auto, "streak": streak,
        "best_streak": max(h.best_streak, streak),
        "today_completed": today_log.completed if today_log else False,
        "today_value": today_log.value if today_log else 0,
        "created_at": h.created_at.isoformat()
    }

@habits_bp.route("/api/habits", methods=["GET"])
def get_habits():
    db = SessionLocal()
    try:
        habits = db.query(Habit).all()
        result = []
        for h in habits:
            logs_all = db.query(HabitLog).filter(HabitLog.habit_id == h.id).all()
            today_logs = [l for l in logs_all if l.date_str == today_str()]
            result.append(serialize_habit(h, today_logs, logs_all))
        return jsonify(result)
    finally:
        db.close()

@habits_bp.route("/api/habits/seed", methods=["POST"])
def seed_habits():
    """Seed the default habits if none exist."""
    db = SessionLocal()
    try:
        existing = db.query(Habit).count()
        if existing > 0:
            return jsonify({"message": "Habits already seeded", "count": existing})
        for h in DEFAULT_HABITS:
            db.add(Habit(**h))
        db.commit()
        return jsonify({"message": f"Seeded {len(DEFAULT_HABITS)} default habits"}), 201
    finally:
        db.close()

@habits_bp.route("/api/habits", methods=["POST"])
def create_habit():
    data = request.get_json(silent=True) or {}
    if not data.get("name"):
        return jsonify({"error": "Habit name required"}), 400
    db = SessionLocal()
    try:
        h = Habit(
            name=data["name"], emoji=data.get("emoji", "✅"),
            description=data.get("description", ""),
            target_value=float(data.get("target_value", 1)),
            unit=data.get("unit", "times"),
            frequency=data.get("frequency", "daily")
        )
        db.add(h)
        db.commit()
        db.refresh(h)
        return jsonify(serialize_habit(h)), 201
    finally:
        db.close()

@habits_bp.route("/api/habits/<int:habit_id>/log", methods=["POST"])
def log_habit(habit_id):
    data = request.get_json(silent=True) or {}
    db = SessionLocal()
    try:
        habit = db.query(Habit).filter(Habit.id == habit_id).first()
        if not habit:
            return jsonify({"error": "Habit not found"}), 404
        today = today_str()
        existing = db.query(HabitLog).filter(
            HabitLog.habit_id == habit_id, HabitLog.date_str == today
        ).first()
        value = float(data.get("value", habit.target_value))
        completed = value >= habit.target_value
        if existing:
            existing.value = value
            existing.completed = completed
        else:
            db.add(HabitLog(habit_id=habit_id, value=value, completed=completed, date_str=today))
        # Update streak & auto-track
        all_logs = db.query(HabitLog).filter(HabitLog.habit_id == habit_id).all()
        completed_dates = [l.date_str for l in all_logs if l.completed]
        streak = calculate_streak(completed_dates)
        habit.streak = streak
        if streak > habit.best_streak:
            habit.best_streak = streak
        habit.auto_tracked = should_auto_track(set(completed_dates))
        db.commit()
        return jsonify({"message": "Logged", "streak": streak, "auto_tracked": habit.auto_tracked})
    finally:
        db.close()

@habits_bp.route("/api/habits/<int:habit_id>", methods=["DELETE"])
def delete_habit(habit_id):
    db = SessionLocal()
    try:
        h = db.query(Habit).filter(Habit.id == habit_id).first()
        if not h:
            return jsonify({"error": "Not found"}), 404
        db.delete(h)
        db.commit()
        return jsonify({"message": "Deleted"})
    finally:
        db.close()

@habits_bp.route("/api/habits/history", methods=["GET"])
def habit_history():
    """Return last 30 days of habit completion heatmap data."""
    db = SessionLocal()
    try:
        today = date.today()
        result = {}
        for i in range(30):
            d = (today - timedelta(days=i)).isoformat()
            logs = db.query(HabitLog).filter(HabitLog.date_str == d, HabitLog.completed == True).count()
            total = db.query(HabitLog).filter(HabitLog.date_str == d).count()
            result[d] = {"completed": logs, "total": total}
        return jsonify(result)
    finally:
        db.close()
