from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.models.user import User
from app.services.auth_service import get_current_user
from app.services.chat_agent import chat

router = APIRouter()


class ChatMessage(BaseModel):
    role: str  # "user" or "model"
    text: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


class ChatResponse(BaseModel):
    reply: str


@router.post("/message", response_model=ChatResponse)
async def send_message(
    req: ChatRequest,
    user: User = Depends(get_current_user),
):
    """Send a message to the AI chatbot and get a response."""
    messages = [{"role": m.role, "text": m.text} for m in req.messages]
    reply = await chat(user_id=user.id, messages=messages)
    return ChatResponse(reply=reply)
