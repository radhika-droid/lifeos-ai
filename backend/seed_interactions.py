"""
Seed synthetic interaction data for testing the ML pipeline.

Generates realistic patterns:
- Morning users prefer high-energy tasks
- Tired users complete low-effort tasks
- High priority + urgent tasks are usually completed
- Random noise for realism

Usage:
    python -m backend.seed_interactions
    python seed_interactions.py --count 400
"""

import random
import sqlite3
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


def seed(db_path: str = None, count: int = 400):
    """Generate synthetic interaction data."""
    if db_path is None:
        db_path = str(PROJECT_ROOT / "backend" / "lifeos.db")

    conn = sqlite3.connect(db_path)

    # Make sure the interactions table exists
    conn.execute("""
        CREATE TABLE IF NOT EXISTS interactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            task_id INTEGER NOT NULL,
            priority INTEGER NOT NULL,
            urgency_score REAL NOT NULL,
            energy_required TEXT NOT NULL,
            estimated_minutes INTEGER NOT NULL,
            current_energy INTEGER NOT NULL,
            available_minutes INTEGER NOT NULL,
            hour_of_day INTEGER NOT NULL,
            day_of_week INTEGER NOT NULL,
            task_age_hours REAL DEFAULT 0.0,
            rule_score REAL NOT NULL,
            rule_rank INTEGER NOT NULL,
            ml_score REAL,
            blended_score REAL NOT NULL,
            outcome TEXT,
            time_to_action_mins REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Also ensure users table has at least one user for FK
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Check if a user exists, create a demo user if not
    user = conn.execute("SELECT id FROM users LIMIT 1").fetchone()
    if user is None:
        conn.execute(
            "INSERT INTO users (email, hashed_password, name) VALUES (?, ?, ?)",
            ("demo@lifeos.ai", "not-a-real-hash", "Demo User"),
        )
        conn.commit()
        user = conn.execute("SELECT id FROM users LIMIT 1").fetchone()
    user_id = user[0]

    energy_levels = ["low", "medium", "high"]
    energy_map = {"low": 1, "medium": 2, "high": 3}
    outcomes = ["completed", "ignored", "skipped", "postponed", "deleted"]

    now = datetime.now(timezone.utc)
    rows = []

    for i in range(count):
        # Spread interactions over last 60 days
        created_at = now - timedelta(days=random.uniform(0, 60))
        hour = random.randint(6, 23)
        day_of_week = created_at.weekday()

        priority = random.randint(1, 5)
        urgency_score = random.uniform(0, 5)
        energy_required = random.choice(energy_levels)
        estimated_minutes = random.choice([15, 30, 45, 60, 90, 120])
        current_energy = random.randint(1, 5)
        available_minutes = random.choice([30, 60, 90, 120, 180, 240])
        task_age_hours = random.uniform(1, 720)  # 1 hour to 30 days

        energy_ord = energy_map[energy_required]
        energy_match = abs(energy_ord - current_energy)
        effort_ratio = estimated_minutes / max(available_minutes, 1)

        # Rule-based score (simplified)
        rule_score = round(
            0.30 * min(priority, 5)
            + 0.30 * urgency_score
            + 0.25 * max(0, 5 - energy_match * 2)
            + 0.15 * max(0, 5 - effort_ratio * 3),
            2,
        )

        # ── Realistic outcome generation with patterns ──
        # Base completion probability
        p_complete = 0.35

        # Pattern 1: High priority + urgent → almost always completed
        if priority >= 4 and urgency_score >= 3.5:
            p_complete += 0.35

        # Pattern 2: Morning + high energy task → more likely completed
        if hour < 12 and energy_required == "high" and current_energy >= 3:
            p_complete += 0.15

        # Pattern 3: Low energy user → completes low-effort tasks
        if current_energy <= 2 and estimated_minutes <= 30:
            p_complete += 0.20

        # Pattern 4: Energy match → more likely completed
        if energy_match <= 1:
            p_complete += 0.10

        # Pattern 5: Task fits available time → more likely completed
        if effort_ratio <= 0.8:
            p_complete += 0.10

        # Pattern 6: Old tasks get ignored
        if task_age_hours > 336:  # > 2 weeks
            p_complete -= 0.15

        # Pattern 7: Weekend slack
        if day_of_week >= 5:  # Weekend
            p_complete -= 0.10

        p_complete = max(0.05, min(0.95, p_complete))

        if random.random() < p_complete:
            outcome = "completed"
            time_to_action = random.uniform(5, 180)
        else:
            outcome = random.choice(["ignored", "skipped", "postponed", "deleted"])
            weights = [0.50, 0.25, 0.20, 0.05]
            outcome = random.choices(
                ["ignored", "skipped", "postponed", "deleted"], weights=weights, k=1
            )[0]
            time_to_action = random.uniform(30, 1440)

        rows.append((
            user_id,
            random.randint(1, 50),  # fake task_id
            priority,
            round(urgency_score, 2),
            energy_required,
            estimated_minutes,
            current_energy,
            available_minutes,
            hour,
            day_of_week,
            round(task_age_hours, 2),
            rule_score,
            random.randint(1, 3),  # rule_rank
            None,  # ml_score (not applicable for historical data)
            rule_score,  # blended_score = rule_score for historical
            outcome,
            round(time_to_action, 2),
            created_at.strftime("%Y-%m-%d %H:%M:%S"),
        ))

    conn.executemany(
        """INSERT INTO interactions
           (user_id, task_id, priority, urgency_score, energy_required,
            estimated_minutes, current_energy, available_minutes, hour_of_day,
            day_of_week, task_age_hours, rule_score, rule_rank, ml_score,
            blended_score, outcome, time_to_action_mins, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        rows,
    )
    conn.commit()

    # Print summary
    completed = sum(1 for r in rows if r[15] == "completed")
    print(f"✅ Seeded {count} interactions into {db_path}")
    print(f"   Completed: {completed} ({completed/count*100:.1f}%)")
    print(f"   Not completed: {count - completed} ({(count-completed)/count*100:.1f}%)")

    conn.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Seed synthetic interaction data")
    parser.add_argument("--count", type=int, default=400, help="Number of interactions to generate")
    parser.add_argument("--db-path", type=str, default=None, help="Path to SQLite database")
    args = parser.parse_args()

    seed(db_path=args.db_path, count=args.count)
