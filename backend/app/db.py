from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import get_settings


settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {},
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed or fix demo user so login is guaranteed to work
    try:
        from app.models.user import User
        from app.models.task import Task
        from app.models.habit import Habit
        from app.services.auth_service import hash_password
        from sqlalchemy import select

        async with async_session() as session:
            result = await session.execute(select(User).where(User.email == "demo@lifeos.ai"))
            demo_user = result.scalar_one_or_none()

            if not demo_user:
                demo_user = User(
                    email="demo@lifeos.ai",
                    hashed_password=hash_password("password123"),
                    name="Demo User",
                )
                session.add(demo_user)
                await session.commit()
                await session.refresh(demo_user)
            elif not demo_user.hashed_password or not demo_user.hashed_password.startswith("$2b$"):
                demo_user.hashed_password = hash_password("password123")
                await session.commit()

            # Seed sample tasks if user has none
            task_res = await session.execute(select(Task).where(Task.user_id == demo_user.id).limit(1))
            if not task_res.scalar_one_or_none():
                sample_tasks = [
                    Task(user_id=demo_user.id, title="Review Q3 Product Roadmap", priority=4, energy_required="high", estimated_minutes=45, status="pending"),
                    Task(user_id=demo_user.id, title="Clear inbox and reply to team", priority=2, energy_required="low", estimated_minutes=20, status="pending"),
                    Task(user_id=demo_user.id, title="Prepare presentation deck", priority=5, energy_required="high", estimated_minutes=60, status="in_progress"),
                    Task(user_id=demo_user.id, title="Review AI recommendations engine", priority=3, energy_required="medium", estimated_minutes=30, status="done"),
                ]
                session.add_all(sample_tasks)

                sample_habits = [
                    Habit(user_id=demo_user.id, name="Morning Meditation", target_frequency="daily", streak_count=5),
                    Habit(user_id=demo_user.id, name="Read 20 pages", target_frequency="daily", streak_count=12),
                    Habit(user_id=demo_user.id, name="Gym Workout", target_frequency="3x/week", streak_count=3),
                ]
                session.add_all(sample_habits)
                await session.commit()
    except Exception as e:
        print(f"Warning: Failed to seed demo data: {e}")

