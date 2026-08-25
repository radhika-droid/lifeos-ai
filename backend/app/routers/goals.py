from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db import get_db
from app.models.goal import Goal
from app.models.task import Task
from app.models.user import User
from app.schemas.goal import GoalCreate, GoalUpdate, GoalResponse
from app.services.auth_service import get_current_user

router = APIRouter()


async def _enrich_goal(goal: Goal, db: AsyncSession) -> dict:
    """Add task counts to a goal."""
    result = await db.execute(
        select(func.count(Task.id)).where(Task.goal_id == goal.id)
    )
    task_count = result.scalar() or 0

    result = await db.execute(
        select(func.count(Task.id)).where(Task.goal_id == goal.id, Task.status == "done")
    )
    completed_count = result.scalar() or 0

    data = {
        "id": goal.id,
        "user_id": goal.user_id,
        "title": goal.title,
        "description": goal.description,
        "target_date": goal.target_date,
        "progress_percent": goal.progress_percent,
        "created_at": goal.created_at,
        "task_count": task_count,
        "completed_task_count": completed_count,
    }
    return data


@router.get("", response_model=list[GoalResponse])
async def list_goals(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Goal).where(Goal.user_id == user.id).order_by(Goal.created_at.desc())
    )
    goals = result.scalars().all()
    return [await _enrich_goal(g, db) for g in goals]


@router.post("", response_model=GoalResponse, status_code=201)
async def create_goal(
    req: GoalCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    goal = Goal(user_id=user.id, **req.model_dump())
    db.add(goal)
    await db.commit()
    await db.refresh(goal)
    return await _enrich_goal(goal, db)


@router.patch("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: int,
    req: GoalUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Goal).where(Goal.id == goal_id, Goal.user_id == user.id)
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    for key, value in req.model_dump(exclude_unset=True).items():
        setattr(goal, key, value)

    await db.commit()
    await db.refresh(goal)
    return await _enrich_goal(goal, db)


@router.delete("/{goal_id}", status_code=204)
async def delete_goal(
    goal_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Goal).where(Goal.id == goal_id, Goal.user_id == user.id)
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    await db.delete(goal)
    await db.commit()

