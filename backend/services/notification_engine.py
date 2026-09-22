from models.database import SessionLocal
from models.schema import Task, Habit, HabitLog, Notification
from utils.helpers import today_str, is_past_due
from datetime import datetime, timedelta

def generate_notifications():
    """Scan tasks and habits, create notification records for issues found."""
    db = SessionLocal()
    notifications = []
    today = today_str()
    now = datetime.utcnow()

    try:
        # --- Overdue tasks ---
        tasks = db.query(Task).filter(Task.completed == False).all()
        for t in tasks:
            if t.due_date and is_past_due(t.due_date):
                notif = Notification(
                    title=f"⚠️ Overdue: {t.name}",
                    message=f"This task was due on {t.due_date.strftime('%b %d, %Y')} and hasn't been completed.",
                    type="danger", source="task", source_id=t.id
                )
                db.add(notif)
                notifications.append(notif)
            elif t.due_date:
                # Due today
                if t.due_date.date() == now.date():
                    notif = Notification(
                        title=f"📅 Due Today: {t.name}",
                        message=f"This task is due today! Make time to complete it.",
                        type="warning", source="task", source_id=t.id
                    )
                    db.add(notif)
                    notifications.append(notif)

        # --- Habit streaks about to break ---
        habits = db.query(Habit).filter(Habit.auto_tracked == True).all()
        for h in habits:
            today_log = db.query(HabitLog).filter(
                HabitLog.habit_id == h.id,
                HabitLog.date_str == today,
                HabitLog.completed == True
            ).first()
            if not today_log and h.streak > 0:
                notif = Notification(
                    title=f"🔥 Streak Alert: {h.name}",
                    message=f"Your {h.streak}-day streak is at risk! Log '{h.name}' before midnight.",
                    type="warning", source="habit", source_id=h.id
                )
                db.add(notif)
                notifications.append(notif)

        db.commit()
        return len(notifications)
    finally:
        db.close()
