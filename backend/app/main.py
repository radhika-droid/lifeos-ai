from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown (cleanup if needed)


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "ok", "app": settings.app_name}


@app.get("/debug-db")
async def debug_db():
    try:
        from sqlalchemy import text
        from app.db import async_session
        import sys
        import greenlet
        async with async_session() as session:
            res = await session.execute(text("SELECT 1"))
            val = res.scalar()
        return {
            "status": "success",
            "val": val,
            "python_version": sys.version,
            "greenlet_version": getattr(greenlet, "__version__", "unknown")
        }
    except Exception as e:
        import traceback
        return {
            "status": "error",
            "error": str(e),
            "traceback": traceback.format_exc(),
            "python_version": sys.version,
        }



# Import and include routers after app is created
from app.routers import auth, tasks, habits, goals, checkin, recommend, analytics, notifications  # noqa: E402

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
app.include_router(habits.router, prefix="/habits", tags=["habits"])
app.include_router(goals.router, prefix="/goals", tags=["goals"])
app.include_router(checkin.router, prefix="/checkin", tags=["checkin"])
app.include_router(recommend.router, prefix="/recommend", tags=["recommend"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
app.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
