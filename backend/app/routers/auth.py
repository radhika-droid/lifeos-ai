from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db import get_db
from app.models.user import User
from app.schemas.auth import (
    SignupRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
)
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    create_reset_token,
    get_current_user,
)

router = APIRouter()


@router.post("/signup", response_model=TokenResponse)
async def signup(req: SignupRequest, db: AsyncSession = Depends(get_db)):
    email = req.email.strip().lower()
    # Check existing
    result = await db.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(email=email, hashed_password=hash_password(req.password), name=req.name.strip())
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Automatically provision default starter tasks & habits for new users so friends get instant setup
    from app.models.task import Task
    from app.models.habit import Habit
    from app.models.goal import Goal

    starter_tasks = [
        Task(user_id=user.id, title="✨ Explore LifeOS Dashboard & AI Assistant", priority=4, energy_required="low", estimated_minutes=15, status="pending"),
        Task(user_id=user.id, title="🎯 Define your first personal goal", priority=5, energy_required="medium", estimated_minutes=25, status="pending"),
        Task(user_id=user.id, title="🔋 Complete daily energy & mood check-in", priority=3, energy_required="low", estimated_minutes=5, status="pending"),
    ]
    session_habits = [
        Habit(user_id=user.id, name="Morning Meditation & Mindset", target_frequency="daily", streak_count=1),
        Habit(user_id=user.id, name="Daily Focus Deep Work Session", target_frequency="daily", streak_count=1),
    ]
    session_goals = [
        Goal(user_id=user.id, title="Master Personal Productivity", description="Use LifeOS AI daily to optimize tasks and habits", progress_percent=10),
    ]
    db.add_all(starter_tasks + session_habits + session_goals)
    await db.commit()

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    email = req.email.strip().lower()
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    email = req.email.strip().lower()
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        # For security, don't disclose whether email exists or return standard message
        return ForgotPasswordResponse(
            message="If an account exists for this email, password reset instructions have been generated."
        )

    # Generate token valid for 1 hour
    token = create_reset_token()
    user.reset_token = token
    user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
    await db.commit()

    return ForgotPasswordResponse(
        message="Password reset link generated successfully.",
        reset_token=token,
    )


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(
            User.reset_token == req.token,
            User.reset_token_expires > datetime.now(timezone.utc),
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset token. Please request a new password reset.",
        )

    user.hashed_password = hash_password(req.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    await db.commit()

    return {"message": "Password reset successfully. You can now log in with your new password."}


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(user: User = Depends(get_current_user)):
    return UserResponse.model_validate(user)
