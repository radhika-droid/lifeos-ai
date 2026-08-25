from sqlalchemy import Column, Integer, DateTime, ForeignKey, Date, func
from app.db import Base


class DailyCheckIn(Base):
    __tablename__ = "daily_checkins"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    energy_level = Column(Integer, nullable=False)  # 1-5
    mood = Column(Integer, nullable=False)  # 1-5
    available_minutes = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
