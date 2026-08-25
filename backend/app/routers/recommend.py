from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from app.db import get_db
from app.models.task import Task
from app.models.user import User
from app.schemas.checkin import RecommendRequest
from app.schemas.task import ScoredTaskResponse, TaskResponse
from app.services.auth_service import get_current_user
from app.services.decision_engine import score_tasks
from app.services.interaction_logger import log_recommendation

router = APIRouter()


@router.post("", response_model=list[ScoredTaskResponse])
async def get_recommendations(
    req: RecommendRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get top-3 recommended tasks based on current context."""
    result = await db.execute(
        select(Task).where(Task.user_id == user.id, Task.status != "done")
    )
    tasks = result.scalars().all()

    context = {
        "energy_level": req.energy_level,
        "available_minutes": req.available_minutes,
        "time_of_day": req.time_of_day,
    }

    scored = score_tasks(tasks, context)[:3]

    # Parse hour from time_of_day string
    try:
        hour = int(req.time_of_day.split(":")[0])
    except (ValueError, IndexError):
        hour = datetime.now().hour

    now = datetime.now(timezone.utc)
    day_of_week = now.weekday()

    # Log each recommendation to the interactions table
    for rank, s in enumerate(scored, start=1):
        task = s["task"]
        task_created = getattr(task, "created_at", None)
        task_age_hours = 0.0
        if task_created:
            if task_created.tzinfo is None:
                task_created = task_created.replace(tzinfo=timezone.utc)
            task_age_hours = (now - task_created).total_seconds() / 3600.0

        try:
            await log_recommendation(
                db,
                user_id=user.id,
                task_id=task.id,
                priority=task.priority,
                urgency_score=s.get("urgency_score", 0.0),
                energy_required=getattr(task, "energy_required", "medium"),
                estimated_minutes=getattr(task, "estimated_minutes", 30),
                current_energy=req.energy_level,
                available_minutes=req.available_minutes,
                hour_of_day=hour,
                day_of_week=day_of_week,
                task_age_hours=round(task_age_hours, 2),
                rule_score=s.get("rule_score", s["score"]),
                rule_rank=rank,
                ml_score=s.get("ml_score"),
                blended_score=s["score"],
            )
        except Exception:
            pass  # Don't let logging failures break recommendations

    await db.commit()

    return [
        ScoredTaskResponse(
            **TaskResponse.model_validate(s["task"]).model_dump(),
            score=s["score"],
            reason=s["reason"],
        )
        for s in scored
    ]
