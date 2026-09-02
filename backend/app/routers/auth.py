from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db import get_db
from app.models.user import User
from app.schemas.auth import SignupRequest, LoginRequest, TokenResponse, UserResponse
from app.services.auth_service import hash_password, verify_password, create_access_token, get_current_user

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


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(user: User = Depends(get_current_user)):
    return UserResponse.model_validate(user)

