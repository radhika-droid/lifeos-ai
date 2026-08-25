from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class TaskCreate(BaseModel):
    title: str
    description: str = ""
    priority: int = Field(default=3, ge=1, le=5)
    estimated_minutes: int = Field(default=30, ge=1)
    due_date: Optional[datetime] = None
    energy_required: str = "medium"
    goal_id: Optional[int] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[int] = Field(default=None, ge=1, le=5)
    estimated_minutes: Optional[int] = Field(default=None, ge=1)
    due_date: Optional[datetime] = None
    status: Optional[str] = None
    energy_required: Optional[str] = None
    goal_id: Optional[int] = None


class TaskResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: str
    priority: int
    estimated_minutes: int
    due_date: Optional[datetime]
    status: str
    energy_required: str
    goal_id: Optional[int]
    created_at: datetime
    completed_at: Optional[datetime]

    model_config = {"from_attributes": True}


class ScoredTaskResponse(TaskResponse):
    score: float = 0.0
    reason: str = ""
