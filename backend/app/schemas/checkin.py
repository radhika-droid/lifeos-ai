from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional


class CheckInCreate(BaseModel):
    energy_level: int = Field(ge=1, le=5)
    mood: int = Field(ge=1, le=5)
    available_minutes: int = Field(ge=0)


class CheckInResponse(BaseModel):
    id: int
    user_id: int
    date: date
    energy_level: int
    mood: int
    available_minutes: int
    created_at: datetime

    model_config = {"from_attributes": True}


class RecommendRequest(BaseModel):
    energy_level: int = Field(default=3, ge=1, le=5)
    available_minutes: int = Field(default=60, ge=0)
    time_of_day: str = "12:00"
