"""
Interaction Logger — records every recommendation event and outcome.

This is the data pipeline that feeds the ML training loop.
"""

from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.interaction import Interaction


async def log_recommendation(
    db: AsyncSession,
    *,
    user_id: int,
    task_id: int,
    priority: int,
    urgency_score: float,
    energy_required: str,
    estimated_minutes: int,
    current_energy: int,
    available_minutes: int,
    hour_of_day: int,
    day_of_week: int,
    task_age_hours: float,
    rule_score: float,
    rule_rank: int,
    ml_score: float | None,
    blended_score: float,
) -> Interaction:
    """Log a single recommendation event. Called once per task per recommendation request."""
    interaction = Interaction(
        user_id=user_id,
        task_id=task_id,
        priority=priority,
        urgency_score=urgency_score,
        energy_required=energy_required,
        estimated_minutes=estimated_minutes,
        current_energy=current_energy,
        available_minutes=available_minutes,
        hour_of_day=hour_of_day,
        day_of_week=day_of_week,
        task_age_hours=task_age_hours,
        rule_score=rule_score,
        rule_rank=rule_rank,
        ml_score=ml_score,
        blended_score=blended_score,
    )
    db.add(interaction)
    await db.flush()  # get the ID without committing yet
    return interaction


async def log_outcome(
    db: AsyncSession,
    *,
    task_id: int,
    user_id: int,
    outcome: str,
) -> int:
    """
    Update the most recent interaction for this task with the outcome.

    Returns the number of rows updated (0 if no matching interaction found).
    """
    # Find the most recent interaction for this task (without an outcome yet)
    result = await db.execute(
        select(Interaction)
        .where(
            and_(
                Interaction.task_id == task_id,
                Interaction.user_id == user_id,
                Interaction.outcome.is_(None),
            )
        )
        .order_by(Interaction.created_at.desc())
        .limit(1)
    )
    interaction = result.scalar_one_or_none()

    if not interaction:
        return 0

    now = datetime.now(timezone.utc)
    created = interaction.created_at
    if created and created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)

    interaction.outcome = outcome
    if created:
        interaction.time_to_action_mins = (now - created).total_seconds() / 60.0

    return 1
