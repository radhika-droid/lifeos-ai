from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from models.database import Base

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    category = Column(String, default="general")  # study, work, health, fun, chores
    priority = Column(Integer, default=1)
    urgency = Column(Integer, default=1)
    difficulty = Column(Integer, default=1)
    time_estimate = Column(Float, default=1.0)  # hours
    due_date = Column(DateTime, nullable=True)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Habit(Base):
    __tablename__ = "habits"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    emoji = Column(String, default="✅")
    description = Column(Text, default="")
    target_value = Column(Float, default=1.0)
    unit = Column(String, default="times")  # steps, glasses, pages, minutes
    frequency = Column(String, default="daily")  # daily, weekly
    auto_tracked = Column(Boolean, default=False)
    streak = Column(Integer, default=0)
    best_streak = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    logs = relationship("HabitLog", back_populates="habit", cascade="all, delete-orphan")

class HabitLog(Base):
    __tablename__ = "habit_logs"
    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id"))
    value = Column(Float, default=1.0)
    completed = Column(Boolean, default=False)
    logged_at = Column(DateTime, default=datetime.utcnow)
    date_str = Column(String, nullable=False)  # YYYY-MM-DD
    habit = relationship("Habit", back_populates="logs")

class MoodEntry(Base):
    __tablename__ = "mood_entries"
    id = Column(Integer, primary_key=True, index=True)
    mood = Column(Integer, nullable=False)  # 1-5 scale
    emoji = Column(String, default="😊")
    note = Column(Text, default="")
    gratitude = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    date_str = Column(String, nullable=False)

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    role = Column(String, nullable=False)  # user | assistant
    content = Column(Text, nullable=False)
    media_url = Column(String, nullable=True)
    chat_type = Column(String, default="wellness")  # wellness | decision
    created_at = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, default="info")  # warning, danger, info, success
    read = Column(Boolean, default=False)
    source = Column(String, default="system")  # task | habit | system
    source_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
