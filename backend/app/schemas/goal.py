from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class GoalCreate(BaseModel):
    title: str
    description: str = ""
    target_date: Optional[datetime] = None


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_date: Optional[datetime] = None
    progress_percent: Optional[float] = None


class GoalResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: str
    target_date: Optional[datetime]
    progress_percent: float
    created_at: datetime
    task_count: int = 0
    completed_task_count: int = 0

    model_config = {"from_attributes": True}
