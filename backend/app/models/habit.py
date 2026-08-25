from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, func
from app.db import Base


class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    target_frequency = Column(String, default="daily")  # "daily", "3x/week", etc.
    streak_count = Column(Integer, default=0)
    last_logged_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class HabitLog(Base):
    __tablename__ = "habit_logs"

    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id"), nullable=False)
    logged_at = Column(DateTime(timezone=True), server_default=func.now())
    completed = Column(Boolean, default=True)
