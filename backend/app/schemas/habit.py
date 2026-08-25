from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class HabitCreate(BaseModel):
    name: str
    target_frequency: str = "daily"


class HabitResponse(BaseModel):
    id: int
    user_id: int
    name: str
    target_frequency: str
    streak_count: int
    last_logged_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class HabitLogCreate(BaseModel):
    completed: bool = True


class HabitLogResponse(BaseModel):
    id: int
    habit_id: int
    logged_at: datetime
    completed: bool

    model_config = {"from_attributes": True}
