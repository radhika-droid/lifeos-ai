from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone, timedelta
from app.db import get_db
from app.models.habit import Habit, HabitLog
from app.models.user import User
from app.schemas.habit import HabitCreate, HabitResponse, HabitLogCreate, HabitLogResponse
from app.services.auth_service import get_current_user

router = APIRouter()


@router.get("", response_model=list[HabitResponse])
async def list_habits(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Habit).where(Habit.user_id == user.id).order_by(Habit.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=HabitResponse, status_code=201)
async def create_habit(
    req: HabitCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    habit = Habit(user_id=user.id, **req.model_dump())
    db.add(habit)
    await db.commit()
    await db.refresh(habit)
    return habit


@router.post("/{habit_id}/log", response_model=HabitLogResponse, status_code=201)
async def log_habit(
    habit_id: int,
    req: HabitLogCreate = HabitLogCreate(),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Habit).where(Habit.id == habit_id, Habit.user_id == user.id)
    )
    habit = result.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    now = datetime.now(timezone.utc)
    log = HabitLog(habit_id=habit.id, logged_at=now, completed=req.completed)
    db.add(log)

    # Update streak — guard against same-day double-logging
    if req.completed:
        if habit.last_logged_at:
            days_since = (now.date() - habit.last_logged_at.date()).days
            if days_since == 0:
                # Already logged today — don't change streak, just update timestamp
                pass
            elif days_since == 1:
                habit.streak_count += 1
            else:
                # Streak broken — reset to 1
                habit.streak_count = 1
        else:
            habit.streak_count = 1
        habit.last_logged_at = now

    await db.commit()
    await db.refresh(log)
    return log


@router.delete("/{habit_id}", status_code=204)
async def delete_habit(
    habit_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Habit).where(Habit.id == habit_id, Habit.user_id == user.id)
    )
    habit = result.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    await db.delete(habit)
    await db.commit()


@router.get("/{habit_id}/logs", response_model=list[HabitLogResponse])
async def get_habit_logs(
    habit_id: int,
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Verify ownership
    result = await db.execute(
        select(Habit).where(Habit.id == habit_id, Habit.user_id == user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Habit not found")

    since = datetime.now(timezone.utc) - timedelta(days=days)
    result = await db.execute(
        select(HabitLog)
        .where(HabitLog.habit_id == habit_id, HabitLog.logged_at >= since)
        .order_by(HabitLog.logged_at.desc())
    )
    return result.scalars().all()
