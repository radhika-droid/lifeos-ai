from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class InteractionResponse(BaseModel):
    id: int
    user_id: int
    task_id: int
    priority: int
    urgency_score: float
    energy_required: str
    estimated_minutes: int
    current_energy: int
    available_minutes: int
    hour_of_day: int
    day_of_week: int
    task_age_hours: float
    rule_score: float
    rule_rank: int
    ml_score: Optional[float]
    blended_score: float
    outcome: Optional[str]
    time_to_action_mins: Optional[float]
    created_at: datetime

    model_config = {"from_attributes": True}


class OutcomeUpdate(BaseModel):
    outcome: str  # completed, ignored, skipped, postponed, deleted
