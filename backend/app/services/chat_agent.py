"""
LifeOS AI Chat Agent — powered by Google Gemini.

Provides a conversational AI assistant that can read the user's tasks,
habits, goals, and check-ins from the database and take actions on
their behalf using function calling.
"""

from google import genai
from google.genai import types
from sqlalchemy import select, func as sql_func
from datetime import datetime, timezone

from app.config import get_settings
from app.db import async_session
from app.models.task import Task
from app.models.habit import Habit
from app.models.checkin import DailyCheckIn
from app.models.goal import Goal

settings = get_settings()

# ── System prompt that gives the AI its personality ─────────────────────────
SYSTEM_PROMPT = """You are LifeOS AI — a warm, intelligent personal productivity assistant.

You have access to the user's real tasks, habits, goals, and daily check-ins stored in their LifeOS database. Use the tools provided to look up real data before answering.

Personality:
- Friendly and encouraging, but concise. Don't write walls of text.
- Use emoji sparingly to feel modern (✅, 🔥, 💡, 🎯).
- Give actionable advice grounded in the user's actual data.
- If the user asks what they should work on, call get_pending_tasks first, then reason about priorities, deadlines, energy required, and time available.
- When the user asks to mark a task done or change a status, use update_task_status.
- You can reference habit streaks and mood data to give holistic advice.

Rules:
- ALWAYS call a tool to look up data before answering data questions. Never guess.
- Keep responses under 150 words unless the user asks for detail.
- If no Gemini API key is configured, tell the user to add GEMINI_API_KEY to their .env file.
"""


# ── Tool implementations (sync wrappers around async DB queries) ────────────

async def get_pending_tasks(user_id: int) -> list[dict]:
    """Fetch all pending and in-progress tasks for the user."""
    async with async_session() as session:
        result = await session.execute(
            select(Task)
            .where(Task.user_id == user_id, Task.status != "done")
            .order_by(Task.priority.desc(), Task.due_date.asc())
        )
        tasks = result.scalars().all()
        return [
            {
                "id": t.id,
                "title": t.title,
                "description": t.description or "",
                "priority": t.priority,
                "status": t.status,
                "energy_required": t.energy_required,
                "estimated_minutes": t.estimated_minutes,
                "due_date": t.due_date.isoformat() if t.due_date else None,
            }
            for t in tasks
        ]


async def get_completed_tasks(user_id: int) -> list[dict]:
    """Fetch recently completed tasks for the user."""
    async with async_session() as session:
        result = await session.execute(
            select(Task)
            .where(Task.user_id == user_id, Task.status == "done")
            .order_by(Task.completed_at.desc())
            .limit(10)
        )
        tasks = result.scalars().all()
        return [
            {
                "id": t.id,
                "title": t.title,
                "completed_at": t.completed_at.isoformat() if t.completed_at else None,
            }
            for t in tasks
        ]


async def update_task_status(user_id: int, task_id: int, new_status: str) -> dict:
    """Update a task's status (pending, in_progress, done)."""
    valid = {"pending", "in_progress", "done"}
    if new_status not in valid:
        return {"error": f"Invalid status. Must be one of: {valid}"}

    async with async_session() as session:
        result = await session.execute(
            select(Task).where(Task.id == task_id, Task.user_id == user_id)
        )
        task = result.scalar_one_or_none()
        if not task:
            return {"error": f"Task {task_id} not found."}

        task.status = new_status
        if new_status == "done":
            task.completed_at = datetime.now(timezone.utc)
        else:
            task.completed_at = None

        await session.commit()
        return {"success": True, "task_id": task_id, "title": task.title, "new_status": new_status}


async def get_habits_summary(user_id: int) -> list[dict]:
    """Fetch all habits and their streak counts."""
    async with async_session() as session:
        result = await session.execute(
            select(Habit).where(Habit.user_id == user_id)
        )
        habits = result.scalars().all()
        return [
            {
                "id": h.id,
                "name": h.name,
                "target_frequency": h.target_frequency,
                "streak_count": h.streak_count,
                "last_logged_at": h.last_logged_at.isoformat() if h.last_logged_at else None,
            }
            for h in habits
        ]


async def get_goals_summary(user_id: int) -> list[dict]:
    """Fetch all goals and their progress."""
    async with async_session() as session:
        result = await session.execute(
            select(Goal).where(Goal.user_id == user_id)
        )
        goals = result.scalars().all()
        return [
            {
                "id": g.id,
                "title": g.title,
                "description": g.description or "",
                "progress_percent": g.progress_percent,
                "target_date": g.target_date.isoformat() if g.target_date else None,
            }
            for g in goals
        ]


async def get_today_checkin(user_id: int) -> dict | None:
    """Get today's energy/mood check-in if it exists."""
    today = datetime.now(timezone.utc).date()
    async with async_session() as session:
        result = await session.execute(
            select(DailyCheckIn).where(
                DailyCheckIn.user_id == user_id,
                DailyCheckIn.date == today,
            )
        )
        checkin = result.scalar_one_or_none()
        if not checkin:
            return {"checked_in": False}
        return {
            "checked_in": True,
            "energy_level": checkin.energy_level,
            "mood": checkin.mood,
            "available_minutes": checkin.available_minutes,
        }


# ── Map of tool name → async handler ───────────────────────────────────────

TOOL_HANDLERS = {
    "get_pending_tasks": get_pending_tasks,
    "get_completed_tasks": get_completed_tasks,
    "update_task_status": update_task_status,
    "get_habits_summary": get_habits_summary,
    "get_goals_summary": get_goals_summary,
    "get_today_checkin": get_today_checkin,
}


# ── Tool declarations for Gemini ────────────────────────────────────────────

TOOLS = [
    types.Tool(function_declarations=[
        types.FunctionDeclaration(
            name="get_pending_tasks",
            description="Fetch all pending and in-progress tasks for the current user, sorted by priority and due date.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={},
            ),
        ),
        types.FunctionDeclaration(
            name="get_completed_tasks",
            description="Fetch the 10 most recently completed tasks for the current user.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={},
            ),
        ),
        types.FunctionDeclaration(
            name="update_task_status",
            description="Update a task's status. Use this when the user asks to start, complete, or reopen a task.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "task_id": types.Schema(type=types.Type.INTEGER, description="The ID of the task to update."),
                    "new_status": types.Schema(type=types.Type.STRING, description="The new status: 'pending', 'in_progress', or 'done'."),
                },
                required=["task_id", "new_status"],
            ),
        ),
        types.FunctionDeclaration(
            name="get_habits_summary",
            description="Fetch all of the user's habits with their current streak counts.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={},
            ),
        ),
        types.FunctionDeclaration(
            name="get_goals_summary",
            description="Fetch all of the user's goals with their progress percentages.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={},
            ),
        ),
        types.FunctionDeclaration(
            name="get_today_checkin",
            description="Get today's daily check-in (energy level, mood, available minutes) if the user has checked in.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={},
            ),
        ),
    ])
]


# ── Main chat function ─────────────────────────────────────────────────────

async def chat(user_id: int, messages: list[dict]) -> str:
    """
    Process a chat message. `messages` is a list of dicts with
    {"role": "user" | "model", "text": "..."} representing the conversation history.
    The last message should be the user's new message.

    Returns the assistant's text response.
    """
    if not settings.gemini_api_key:
        return "⚠️ The Gemini API key is not configured. Please add `GEMINI_API_KEY=your_key` to your `.env` file and restart the server."

    client = genai.Client(api_key=settings.gemini_api_key)

    # Build Gemini-compatible contents
    contents = []
    for msg in messages:
        contents.append(
            types.Content(
                role=msg["role"],
                parts=[types.Part.from_text(text=msg["text"])],
            )
        )

    # Call Gemini with tool declarations
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            tools=TOOLS,
            temperature=0.7,
        ),
    )

    # Handle tool calls in a loop (Gemini may chain multiple tool calls)
    max_iterations = 5
    iteration = 0

    while response.candidates and iteration < max_iterations:
        candidate = response.candidates[0]
        has_function_call = False

        for part in candidate.content.parts:
            if part.function_call:
                has_function_call = True
                fn_name = part.function_call.name
                fn_args = dict(part.function_call.args) if part.function_call.args else {}

                # Inject user_id into all tool calls for security
                fn_args["user_id"] = user_id

                handler = TOOL_HANDLERS.get(fn_name)
                if handler:
                    try:
                        result = await handler(**fn_args)
                    except Exception as e:
                        result = {"error": str(e)}
                else:
                    result = {"error": f"Unknown tool: {fn_name}"}

                # Add assistant's function call + our function response to contents
                contents.append(candidate.content)
                contents.append(
                    types.Content(
                        role="user",
                        parts=[types.Part.from_function_response(
                            name=fn_name,
                            response={"result": result},
                        )],
                    )
                )
                break  # Process one function call at a time

        if not has_function_call:
            break

        # Call Gemini again with the tool results
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                tools=TOOLS,
                temperature=0.7,
            ),
        )
        iteration += 1

    # Extract the final text response
    if response.candidates:
        parts = response.candidates[0].content.parts
        text_parts = [p.text for p in parts if p.text]
        if text_parts:
            return "\n".join(text_parts)

    return "I'm sorry, I couldn't generate a response. Please try again."
