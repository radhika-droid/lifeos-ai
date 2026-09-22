from datetime import date, timedelta

DEFAULT_HABITS = [
    {"name": "10,000 Steps", "emoji": "🚶", "target_value": 10000, "unit": "steps", "description": "Walk 10,000 steps today"},
    {"name": "Drink 8 Glasses of Water", "emoji": "💧", "target_value": 8, "unit": "glasses", "description": "Stay hydrated throughout the day"},
    {"name": "30 Min Exercise", "emoji": "🏋️", "target_value": 30, "unit": "minutes", "description": "Workout or physical activity"},
    {"name": "Read 20 Pages", "emoji": "📚", "target_value": 20, "unit": "pages", "description": "Reading builds knowledge daily"},
    {"name": "Meditate 10 Min", "emoji": "🧘", "target_value": 10, "unit": "minutes", "description": "Clear your mind and reduce stress"},
    {"name": "Sleep 7+ Hours", "emoji": "😴", "target_value": 7, "unit": "hours", "description": "Quality sleep is essential for recovery"},
    {"name": "No Junk Food", "emoji": "🥗", "target_value": 1, "unit": "times", "description": "Eat clean and avoid processed foods"},
    {"name": "Practice Gratitude", "emoji": "🙏", "target_value": 3, "unit": "things", "description": "Write 3 things you are grateful for"},
    {"name": "Screen-Free Hour", "emoji": "📵", "target_value": 60, "unit": "minutes", "description": "Disconnect from screens before bed"},
    {"name": "Learn Something New", "emoji": "🎓", "target_value": 1, "unit": "times", "description": "Study a new skill, word, or concept"},
    {"name": "Connect with Someone", "emoji": "🤝", "target_value": 1, "unit": "times", "description": "Call or message a friend or family member"},
    {"name": "Spend Time Outdoors", "emoji": "🌿", "target_value": 20, "unit": "minutes", "description": "Fresh air and sunlight boost mood"},
]

def calculate_streak(logs_by_date):
    """Calculate current streak given a list of date strings (YYYY-MM-DD) that were completed."""
    if not logs_by_date:
        return 0
    completed_dates = sorted(set(logs_by_date), reverse=True)
    today = date.today()
    streak = 0
    check = today
    for d_str in completed_dates:
        d = date.fromisoformat(d_str)
        if d == check or d == check - timedelta(days=1):
            streak += 1
            check = d
        else:
            break
    return streak

def should_auto_track(logs_by_date):
    """Mark as auto-tracked if completed for 3+ consecutive days ending today or yesterday."""
    today = date.today()
    consecutive = 0
    for i in range(3):
        check = (today - timedelta(days=i)).isoformat()
        if check in logs_by_date:
            consecutive += 1
        else:
            break
    return consecutive >= 3
