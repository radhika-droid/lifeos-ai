from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from app.db import Base


class Interaction(Base):
    """Logs every task recommendation event and its outcome.

    This table is the training data for the ML model. Every time the engine
    recommends a task, we capture the task features, context, scores, and
    later the user's outcome (completed, ignored, skipped, etc.).
    """
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False, index=True)

    # ── Task features at time of recommendation ──
    priority = Column(Integer, nullable=False)
    urgency_score = Column(Float, nullable=False)
    energy_required = Column(String, nullable=False)      # "low", "medium", "high"
    estimated_minutes = Column(Integer, nullable=False)

    # ── User context at time of recommendation ──
    current_energy = Column(Integer, nullable=False)       # 1-5
    available_minutes = Column(Integer, nullable=False)
    hour_of_day = Column(Integer, nullable=False)          # 0-23
    day_of_week = Column(Integer, nullable=False)          # 0=Mon, 6=Sun

    # ── Derived features ──
    task_age_hours = Column(Float, default=0.0)            # hours since task created

    # ── Scores ──
    rule_score = Column(Float, nullable=False)
    rule_rank = Column(Integer, nullable=False)            # 1-based rank in recommendation list
    ml_score = Column(Float, nullable=True)                # null if ML was not active
    blended_score = Column(Float, nullable=False)

    # ── Outcome (filled in later when user acts) ──
    outcome = Column(String, nullable=True)                # completed, ignored, skipped, postponed, deleted
    time_to_action_mins = Column(Float, nullable=True)     # minutes from recommendation to action

    created_at = Column(DateTime(timezone=True), server_default=func.now())
