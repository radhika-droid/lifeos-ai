from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from typing import Optional
from app.db import get_db
from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.services.auth_service import get_current_user
from app.services.interaction_logger import log_outcome

router = APIRouter()


@router.get("", response_model=list[TaskResponse])
async def list_tasks(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = select(Task).where(Task.user_id == user.id)
    if status:
        query = query.where(Task.status == status)
    query = query.order_by(Task.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=TaskResponse, status_code=201)
async def create_task(
    req: TaskCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = Task(user_id=user.id, **req.model_dump())
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    req: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(Task).where(Task.id == task_id, Task.user_id == user.id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = req.model_dump(exclude_unset=True)
    old_status = task.status

    # Track completion time
    if update_data.get("status") == "done" and task.status != "done":
        update_data["completed_at"] = datetime.now(timezone.utc)
    elif update_data.get("status") and update_data["status"] != "done":
        update_data["completed_at"] = None

    for key, value in update_data.items():
        setattr(task, key, value)

    # Log outcome for ML training
    new_status = update_data.get("status")
    if new_status and new_status != old_status:
        outcome_map = {"done": "completed", "in_progress": "skipped", "pending": "postponed"}
        outcome = outcome_map.get(new_status, new_status)
        try:
            await log_outcome(db, task_id=task_id, user_id=user.id, outcome=outcome)
        except Exception:
            pass  # Don't let logging failures break the update

    await db.commit()
    await db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
async def delete_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(Task).where(Task.id == task_id, Task.user_id == user.id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Log deletion outcome for ML training
    try:
        await log_outcome(db, task_id=task_id, user_id=user.id, outcome="deleted")
    except Exception:
        pass

    await db.delete(task)
    await db.commit()


@router.get("/ranked", response_model=list[TaskResponse])
async def ranked_tasks(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Return pending tasks ranked by the decision engine."""
    from app.services.decision_engine import score_tasks

    result = await db.execute(
        select(Task).where(Task.user_id == user.id, Task.status != "done")
    )
    tasks = result.scalars().all()

    context = {"energy_level": 3, "available_minutes": 60, "time_of_day": "12:00"}
    scored = score_tasks(tasks, context)
    return [s["task"] for s in scored]
