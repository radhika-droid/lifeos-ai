import random
from flask import Blueprint, request, jsonify
from models.database import SessionLocal
from models.schema import MoodEntry, ChatMessage
from utils.helpers import today_str

wellness_bp = Blueprint("wellness", __name__)

WELLNESS_RESPONSES = {
    5: [
        "That's wonderful! 🌟 You're glowing with great energy today. Keep riding this wave — consider tackling something you've been putting off!",
        "Amazing! 🎉 When we feel great, it's a perfect time to help others or dive into a passion project.",
        "Fantastic! 😊 Use this positive energy to connect with someone you care about today.",
    ],
    4: [
        "Good to hear you're doing well! 😊 Even on good days, a 5-minute mindfulness check helps maintain the momentum.",
        "Great! 💪 You're in a solid place. This is a great time for some focused deep work.",
        "Nice! 🌿 Take a moment to appreciate how far you've come. Progress deserves recognition.",
    ],
    3: [
        "It's okay to feel neutral — balance is part of life. 🌤️ Try a 5-minute walk outside to shift your energy.",
        "Neutral is fine! Sometimes the best thing is a glass of water, a stretch, and a fresh breath. 💧",
        "You're in 'maintenance mode' — that's valid. 😌 Be gentle with yourself and do what feels manageable.",
    ],
    2: [
        "I hear you — it's a tough day. 💙 Remember: tough days don't last. Take 3 deep breaths with me: in for 4 counts, hold for 7, out for 8.",
        "It's okay not to be okay. 🤗 Try journaling 3 things — no matter how small — that you're grateful for today.",
        "Low days are part of the journey. 💜 Be extra kind to yourself today. Rest is productive too.",
    ],
    1: [
        "I'm really sorry you're feeling this way. 💙 You matter, and your feelings are valid. Please consider reaching out to someone you trust, or call a mental health helpline.",
        "That sounds really hard. 🫂 Please don't go through this alone. iCall India: 9152987821 | Vandrevala Foundation: 1860-2662-345 (24/7)",
        "You're not alone in this. 💜 Take things one breath at a time. If you're in crisis, please reach out: iCall: 9152987821",
    ]
}

TOPIC_RESPONSES = {
    "stress": "Stress often signals that something important is being squeezed. 💨 Try the 5-4-3-2-1 grounding technique: name 5 things you see, 4 you hear, 3 you feel, 2 you smell, 1 you taste. It brings you back to now.",
    "sleep": "Sleep is your brain's maintenance window. 🌙 Try keeping a consistent wake time, reducing screens 1 hour before bed, and keeping your room cool. Small changes compound fast.",
    "anxiety": "Anxiety is your brain's alarm system misfiring. 🧠 Box breathing helps: breathe in for 4 counts, hold for 4, out for 4, hold for 4. Repeat 4 times.",
    "focus": "Trouble focusing? Try the 2-minute rule — if it takes less than 2 minutes, do it now. 🎯 Then use 25-minute Pomodoro blocks for deeper work.",
    "sad": "Sadness is a valid human emotion, not a weakness. 💙 Allow yourself to feel it. Gentle movement, sunlight, or a kind conversation can help shift things gently.",
    "lonely": "Loneliness can feel heavy. 🤝 Even a short text to someone you appreciate can create a meaningful connection. You matter to people, even when it doesn't feel that way.",
    "motivation": "Motivation follows action — not the other way around. 🔥 Start with just 2 minutes of the thing you're dreading. Momentum builds itself.",
    "happy": "Hold onto that happiness! 🌟 Joy is meant to be shared — tell someone what's making you smile today.",
    "tired": "Fatigue is a signal worth listening to. 🛌 Check: are you sleeping enough? Hydrated? Taking breaks? Sometimes rest IS the most productive thing.",
    "overwhelmed": "When everything feels like too much, pick just ONE thing. 🎯 Not the biggest thing — just the next small thing. Progress, not perfection.",
}

def get_wellness_response(message, mood=None):
    msg_lower = message.lower()
    for keyword, response in TOPIC_RESPONSES.items():
        if keyword in msg_lower:
            return response
    if mood and mood in WELLNESS_RESPONSES:
        return random.choice(WELLNESS_RESPONSES[mood])
    return random.choice([
        "I'm here for you. 💙 Tell me more about what's on your mind — sometimes just expressing it helps.",
        "That's worth exploring. 🌿 What do you think is the root of what you're feeling right now?",
        "Thank you for sharing that. 🤗 You're taking a positive step by reflecting on your wellbeing.",
        "I hear you. 💜 How long have you been feeling this way? Noticing patterns is the first step.",
    ])

# --- Mood ---
@wellness_bp.route("/api/mood", methods=["POST"])
def log_mood():
    data = request.get_json(silent=True) or {}
    mood = data.get("mood")
    if not mood or mood not in range(1, 6):
        return jsonify({"error": "mood must be 1-5"}), 400
    emoji_map = {1: "😢", 2: "😕", 3: "😐", 4: "🙂", 5: "😄"}
    db = SessionLocal()
    try:
        entry = MoodEntry(
            mood=mood, emoji=emoji_map[mood],
            note=data.get("note", ""),
            gratitude=data.get("gratitude", ""),
            date_str=today_str()
        )
        db.add(entry)
        db.commit()
        return jsonify({"message": "Mood logged", "response": random.choice(WELLNESS_RESPONSES[mood])})
    finally:
        db.close()

@wellness_bp.route("/api/mood/history", methods=["GET"])
def mood_history():
    db = SessionLocal()
    try:
        entries = db.query(MoodEntry).order_by(MoodEntry.created_at.desc()).limit(30).all()
        return jsonify([{"id": e.id, "mood": e.mood, "emoji": e.emoji, "note": e.note,
                        "gratitude": e.gratitude, "date_str": e.date_str,
                        "created_at": e.created_at.isoformat()} for e in entries])
    finally:
        db.close()

# --- Chat ---
@wellness_bp.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    message = data.get("message", "").strip()
    mood = data.get("mood")
    chat_type = data.get("chat_type", "wellness")
    media_url = data.get("media_url")
    if not message and not media_url:
        return jsonify({"error": "message or media_url required"}), 400
    db = SessionLocal()
    try:
        # Save user message
        user_msg = ChatMessage(role="user", content=message or "[media]",
                               media_url=media_url, chat_type=chat_type)
        db.add(user_msg)
        # Generate response
        response_text = get_wellness_response(message, mood)
        ai_msg = ChatMessage(role="assistant", content=response_text, chat_type=chat_type)
        db.add(ai_msg)
        db.commit()
        return jsonify({"response": response_text, "user_message_id": user_msg.id, "ai_message_id": ai_msg.id})
    finally:
        db.close()

@wellness_bp.route("/api/chat/history", methods=["GET"])
def chat_history():
    chat_type = request.args.get("type", "wellness")
    limit = int(request.args.get("limit", 50))
    db = SessionLocal()
    try:
        msgs = db.query(ChatMessage).filter(ChatMessage.chat_type == chat_type)\
                 .order_by(ChatMessage.created_at.asc()).limit(limit).all()
        return jsonify([{"id": m.id, "role": m.role, "content": m.content,
                        "media_url": m.media_url, "created_at": m.created_at.isoformat()} for m in msgs])
    finally:
        db.close()

@wellness_bp.route("/api/chat/clear", methods=["POST", "DELETE"])
def clear_chat():
    data = request.get_json(silent=True) or {}
    chat_type = data.get("chat_type", "wellness")
    db = SessionLocal()
    try:
        db.query(ChatMessage).filter(ChatMessage.chat_type == chat_type).delete()
        db.commit()
        return jsonify({"message": "Chat history cleared"})
    finally:
        db.close()
