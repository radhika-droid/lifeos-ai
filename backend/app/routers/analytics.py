from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone, timedelta, date
from app.db import get_db
from app.models.task import Task
from app.models.habit import Habit, HabitLog
from app.models.user import User
from app.models.interaction import Interaction
from app.services.auth_service import get_current_user
from app.services.decision_engine import _MODEL, _METADATA

router = APIRouter()

@router.get("/ml-status")
async def ml_status(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Return ML model observability metrics."""
    result = await db.execute(select(func.count(Interaction.id)))
    total_interactions = result.scalar() or 0
    
    # Calculate agreement rate
    agree_res = await db.execute(
        select(func.count(Interaction.id)).where(Interaction.ml_score.is_not(None))
    )
    ml_active_count = agree_res.scalar() or 0
    
    status = "learning"
    if ml_active_count > 0:
        status = "active (hybrid mode)"
    elif total_interactions >= 200:
        status = "ready for training"
        
    ml_weight = 0.0
    if _MODEL and _METADATA:
        auc = _METADATA.get("validation_auc", 0.5)
        if auc > 0.6:
            ml_weight = min(0.6, (auc - 0.5) * 1.5)

    return {
        "status": status,
        "total_interactions_logged": total_interactions,
        "ml_weight": round(ml_weight, 2),
        "metadata": _METADATA or {},
    }



@router.get("/habits")
async def habit_analytics(
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Return habit streaks and completion rates over the last N days."""
    result = await db.execute(
        select(Habit).where(Habit.user_id == user.id)
    )
    habits = result.scalars().all()

    since = datetime.now(timezone.utc) - timedelta(days=days)
    analytics = []

    for habit in habits:
        # Get logs for this period
        log_result = await db.execute(
            select(HabitLog).where(
                HabitLog.habit_id == habit.id,
                HabitLog.logged_at >= since,
            )
        )
        logs = log_result.scalars().all()

        completed_count = sum(1 for l in logs if l.completed)
        total_days = days
        completion_rate = round(completed_count / total_days * 100, 1) if total_days > 0 else 0

        # Build daily completion map
        daily_map = {}
        for log in logs:
            day_str = log.logged_at.strftime("%Y-%m-%d")
            if log.completed:
                daily_map[day_str] = True

        analytics.append({
            "habit_id": habit.id,
            "name": habit.name,
            "streak_count": habit.streak_count,
            "completion_rate": completion_rate,
            "completed_days": completed_count,
            "total_days": total_days,
            "daily_completions": daily_map,
        })

    return analytics


@router.get("/productivity")
async def productivity_analytics(
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Return productivity metrics over the last N days."""
    since = datetime.now(timezone.utc) - timedelta(days=days)

    # Tasks completed per day
    result = await db.execute(
        select(Task).where(
            Task.user_id == user.id,
            Task.status == "done",
            Task.completed_at >= since,
        )
    )
    completed_tasks = result.scalars().all()

    # Group by day
    daily_completions = {}
    priorities_tackled = []
    for task in completed_tasks:
        if task.completed_at:
            day_str = task.completed_at.strftime("%Y-%m-%d")
            daily_completions[day_str] = daily_completions.get(day_str, 0) + 1
            priorities_tackled.append(task.priority)

    # Fill in zero days
    daily_data = []
    for i in range(days):
        d = (datetime.now(timezone.utc) - timedelta(days=days - 1 - i)).strftime("%Y-%m-%d")
        daily_data.append({
            "date": d,
            "completed": daily_completions.get(d, 0),
        })

    avg_priority = round(sum(priorities_tackled) / len(priorities_tackled), 1) if priorities_tackled else 0

    # Total stats
    total_pending_result = await db.execute(
        select(func.count(Task.id)).where(
            Task.user_id == user.id,
            Task.status != "done",
        )
    )
    total_pending = total_pending_result.scalar() or 0

    return {
        "total_completed": len(completed_tasks),
        "total_pending": total_pending,
        "avg_priority_tackled": avg_priority,
        "daily_completions": daily_data,
        "period_days": days,
    }
