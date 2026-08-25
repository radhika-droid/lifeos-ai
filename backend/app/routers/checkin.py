from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date
from app.db import get_db
from app.models.checkin import DailyCheckIn
from app.models.user import User
from app.schemas.checkin import CheckInCreate, CheckInResponse
from app.services.auth_service import get_current_user

router = APIRouter()


@router.post("", response_model=CheckInResponse, status_code=201)
async def create_checkin(
    req: CheckInCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    today = date.today()

    # Upsert: replace today's check-in if it exists
    result = await db.execute(
        select(DailyCheckIn).where(
            DailyCheckIn.user_id == user.id,
            DailyCheckIn.date == today,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.energy_level = req.energy_level
        existing.mood = req.mood
        existing.available_minutes = req.available_minutes
        await db.commit()
        await db.refresh(existing)
        return existing

    checkin = DailyCheckIn(
        user_id=user.id,
        date=today,
        energy_level=req.energy_level,
        mood=req.mood,
        available_minutes=req.available_minutes,
    )
    db.add(checkin)
    await db.commit()
    await db.refresh(checkin)
    return checkin


@router.get("/today", response_model=CheckInResponse | None)
async def get_today_checkin(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(DailyCheckIn).where(
            DailyCheckIn.user_id == user.id,
            DailyCheckIn.date == date.today(),
        )
    )
    return result.scalar_one_or_none()
