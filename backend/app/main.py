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
        from app.services.auth_service import hash_password
        from app.models.user import User
        from sqlalchemy import select
        from app.db import async_session
        import sys
        import greenlet
        import bcrypt

        hashed = hash_password("testpassword123")
        
        async with async_session() as session:
            # Check if table exists by doing a simple select
            res = await session.execute(select(User).limit(1))
            val = res.scalar_one_or_none()
            
        return {
            "status": "success",
            "hashed_prefix": hashed[:10],
            "table_ok": True,
            "python_version": sys.version,
            "bcrypt_version": getattr(bcrypt, "__version__", "unknown")
        }
    except Exception as e:
        import traceback
        return {
            "status": "error",
            "error": str(e),
            "traceback": traceback.format_exc(),
            "python_version": sys.version,
        }




# Import and include routers under /api
from app.routers import auth, tasks, habits, goals, checkin, recommend, analytics, notifications, chat  # noqa: E402

# Mount /api routes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(habits.router, prefix="/api/habits", tags=["habits"])
app.include_router(goals.router, prefix="/api/goals", tags=["goals"])
app.include_router(checkin.router, prefix="/api/checkin", tags=["checkin"])
app.include_router(recommend.router, prefix="/api/recommend", tags=["recommend"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])

# Aliases for backwards compatibility on endpoints that do not conflict with SPA page routes
app.include_router(auth.router, prefix="/auth", tags=["auth-compat"])
app.include_router(checkin.router, prefix="/checkin", tags=["checkin-compat"])
app.include_router(recommend.router, prefix="/recommend", tags=["recommend-compat"])
app.include_router(chat.router, prefix="/chat", tags=["chat-compat"])

# --- Serve Frontend (Monolith) ---
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# In docker: /app/backend/app/main.py -> dist is at /app/frontend/dist
dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))

if os.path.isdir(dist_dir):
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Don't serve frontend for API routes that 404
        if full_path.startswith("api/") or full_path.startswith("health"):
            return {"detail": "API endpoint not found"}
            
        file_path = os.path.join(dist_dir, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        
        # SPA routing: return index.html for all non-file client routes
        index_path = os.path.join(dist_dir, "index.html")
        if os.path.isfile(index_path):
            return FileResponse(index_path)
        
        return {"detail": "Frontend index.html not found"}

