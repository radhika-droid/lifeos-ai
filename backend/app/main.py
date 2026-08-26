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

# --- Serve Frontend (Monolith) ---
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Assuming running from backend/ directory inside docker: /app/backend/app/main.py
# The frontend dist is copied to /app/frontend/dist
dist_dir = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")

if os.path.isdir(dist_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_dir, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        path = os.path.join(dist_dir, full_path)
        if os.path.isfile(path):
            return FileResponse(path)
        
        # SPA routing: return index.html for all non-file paths
        index_path = os.path.join(dist_dir, "index.html")
        if os.path.isfile(index_path):
            return FileResponse(index_path)
        
        return {"detail": "Not Found"}

