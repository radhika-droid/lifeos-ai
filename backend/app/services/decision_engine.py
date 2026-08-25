"""
LifeOS AI Decision Engine v2 — Hybrid ML + Rule-based scoring.

Uses rule-based heuristics as a fallback, blending in ML predictions
if a trained model is available.
"""

from datetime import datetime, timezone
import os
from pathlib import Path
import json
import joblib
import numpy as np

# Configurable weights for rules
WEIGHTS = {
    "priority": 0.30,
    "urgency": 0.30,
    "energy_match": 0.25,
    "effort_fit": 0.15,
}

ENERGY_MAP = {"low": 1, "medium": 2, "high": 3}

# ML paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
ARTIFACTS_DIR = PROJECT_ROOT / "model" / "artifacts"


def load_ml_model():
    """Load the latest trained model and metadata."""
    try:
        model = joblib.load(ARTIFACTS_DIR / "model_latest.joblib")
        scaler = joblib.load(ARTIFACTS_DIR / "scaler_latest.joblib")
        with open(ARTIFACTS_DIR / "metadata.json") as f:
            metadata = json.load(f)
        return model, scaler, metadata
    except Exception:
        return None, None, None


# Cache model in memory
_MODEL, _SCALER, _METADATA = load_ml_model()


def reload_model():
    """Reload model from disk (e.g. after training)."""
    global _MODEL, _SCALER, _METADATA
    _MODEL, _SCALER, _METADATA = load_ml_model()


def _urgency_score(due_date) -> float:
    if not due_date:
        return 0.0

    if isinstance(due_date, str):
        due_date = datetime.fromisoformat(due_date)

    now = datetime.now(timezone.utc)
    if due_date.tzinfo is None:
        due_date = due_date.replace(tzinfo=timezone.utc)

    hours_left = (due_date - now).total_seconds() / 3600

    if hours_left <= 0:
        return 5.0
    elif hours_left <= 6:
        return 4.5
    elif hours_left <= 24:
        return 4.0
    elif hours_left <= 48:
        return 3.0
    elif hours_left <= 72:
        return 2.0
    elif hours_left <= 168:
        return 1.0
    return 0.5


def _energy_match_score(task_energy: str, user_energy: int) -> float:
    task_level = ENERGY_MAP.get(task_energy, 2)
    diff = abs(task_level - user_energy)
    if diff == 0:
        return 5.0
    elif diff == 1:
        return 3.0
    return 1.0


def _effort_fit_score(estimated_minutes: int, available_minutes: int) -> float:
    if estimated_minutes <= 0:
        return 3.0
    ratio = estimated_minutes / max(available_minutes, 1)
    if ratio <= 0.5:
        return 4.0
    elif ratio <= 0.8:
        return 5.0
    elif ratio <= 1.0:
        return 3.5
    elif ratio <= 1.5:
        return 2.0
    return 0.5


def _extract_ml_features(task, context, urgency_s) -> list:
    """Extract features for the ML model matching the training pipeline."""
    energy_req = getattr(task, "energy_required", "medium")
    energy_ord = ENERGY_MAP.get(energy_req, 2)
    current_energy = context.get("energy_level", 3)
    available_minutes = context.get("available_minutes", 60)
    est_minutes = getattr(task, "estimated_minutes", 30)

    now = datetime.now(timezone.utc)
    hour = context.get("hour_of_day", now.hour)
    day_of_week = context.get("day_of_week", now.weekday())
    
    created_at = getattr(task, "created_at", None)
    task_age_hours = 0.0
    if created_at:
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        task_age_hours = (now - created_at).total_seconds() / 3600.0

    priority = getattr(task, "priority", 3)
    if isinstance(priority, str):
        priority = int(priority)
    
    energy_match = abs(energy_ord - current_energy)
    effort_ratio = est_minutes / max(available_minutes, 1)

    return [
        priority,
        urgency_s,
        energy_ord,
        est_minutes,
        current_energy,
        available_minutes,
        hour,
        day_of_week,
        task_age_hours,
        energy_match,
        round(effort_ratio, 4),
    ]


def _generate_reason(
    task,
    priority_s,
    urgency_s,
    energy_s,
    effort_s,
    ml_contrib=False,
    top_feature=None
) -> str:
    """Generate human-readable reason, using ML insights if applicable."""
    reasons = []

    # If ML had a strong contribution, prioritize its top feature explanation
    if ml_contrib and top_feature:
        if top_feature == "hour_of_day":
            reasons.append("You tend to complete tasks like this at this time of day")
        elif top_feature == "day_of_week":
            reasons.append("You usually tackle this type of task on this day of the week")
        elif top_feature == "energy_match":
            reasons.append("This matches your historical energy patterns")
        elif top_feature == "effort_ratio":
            reasons.append("This fits perfectly into your typical time blocks")
        elif top_feature == "task_age_hours":
            reasons.append("You often clear tasks like this after this much time")
        else:
            reasons.append("Based on your historical completion patterns")
            
        # Add one rule-based reason as a secondary
        if urgency_s >= 4.0:
            reasons.append("it's due soon")
        elif priority_s >= 4.0:
            reasons.append("it's high priority")

        return " and ".join(reasons) + "."

    # Fallback to pure rules
    task_priority = getattr(task, "priority", 3)
    if task_priority >= 4:
        reasons.append("High priority task")
    elif task_priority <= 2:
        reasons.append("Lower priority — good for a lighter moment")

    if urgency_s >= 4.0:
        if urgency_s >= 5.0:
            reasons.append("overdue!")
        else:
            reasons.append("due very soon")
    elif urgency_s >= 3.0:
        reasons.append("due within a couple of days")

    if energy_s >= 4.5:
        reasons.append("matches your current energy level well")
    elif energy_s <= 2.0:
        reasons.append("energy mismatch — consider your state")

    if effort_s >= 4.5:
        reasons.append("fits well within your available time")
    elif effort_s <= 1.5:
        reasons.append("may take longer than you have right now")

    if not reasons:
        reasons.append("A balanced choice for right now")

    return ". ".join(reasons) + "."


def score_tasks(tasks: list, context: dict) -> list[dict]:
    """Score and rank tasks using a blend of rules and ML."""
    global _MODEL, _SCALER, _METADATA
    
    # Reload model if missing, just in case training finished recently
    if not _MODEL:
        reload_model()

    energy_level = context.get("energy_level", 3)
    available_minutes = context.get("available_minutes", 60)
    
    if "hour_of_day" not in context:
        now = datetime.now(timezone.utc)
        if "time_of_day" in context:
            try:
                context["hour_of_day"] = int(context["time_of_day"].split(":")[0])
            except (ValueError, IndexError):
                context["hour_of_day"] = now.hour
        else:
            context["hour_of_day"] = now.hour
            
    if "day_of_week" not in context:
        context["day_of_week"] = datetime.now(timezone.utc).weekday()

    # Determine ML weight based on confidence/metadata
    ml_weight = 0.0
    if _MODEL and _METADATA:
        # Scale ML weight based on validation AUC (0.5 is random, 1.0 is perfect)
        auc = _METADATA.get("validation_auc", 0.5)
        if auc > 0.6:
            ml_weight = min(0.6, (auc - 0.5) * 1.5)  # Max 60% weight for ML

    scored = []
    
    # Prepare batch prediction if ML is active
    if ml_weight > 0:
        ml_features = []
        for task in tasks:
            priority = getattr(task, "priority", None) or task.get("priority", 3) if isinstance(task, dict) else task.priority
            priority_s = min(priority, 5)
            due_date = getattr(task, "due_date", None)
            urgency_s = _urgency_score(due_date)
            ml_features.append(_extract_ml_features(task, context, urgency_s))
            
        ml_features_scaled = _SCALER.transform(np.array(ml_features))
        ml_probs = _MODEL.predict_proba(ml_features_scaled)[:, 1]
    else:
        ml_probs = [0.0] * len(tasks)

    for i, task in enumerate(tasks):
        priority = getattr(task, "priority", None) or task.get("priority", 3) if isinstance(task, dict) else task.priority
        priority_s = min(priority, 5)
        due_date = getattr(task, "due_date", None)
        energy_req = getattr(task, "energy_required", "medium")
        est_minutes = getattr(task, "estimated_minutes", 30)

        urgency_s = _urgency_score(due_date)
        energy_s = _energy_match_score(energy_req, energy_level)
        effort_s = _effort_fit_score(est_minutes, available_minutes)

        rule_total = (
            WEIGHTS["priority"] * priority_s
            + WEIGHTS["urgency"] * urgency_s
            + WEIGHTS["energy_match"] * energy_s
            + WEIGHTS["effort_fit"] * effort_s
        )

        # Blend ML prediction (0-1 scale) converted to (0-5 scale)
        ml_pred_5 = ml_probs[i] * 5.0
        ml_score_val = float(ml_pred_5) if ml_weight > 0 else None
        
        blended_score = (1.0 - ml_weight) * rule_total + (ml_weight * ml_pred_5)
        
        # Determine top ML feature if ML is driving the score
        ml_contrib = ml_weight > 0 and ml_pred_5 > 3.0
        top_feature = None
        if ml_contrib and _METADATA:
            importances = _METADATA.get("feature_importances", {})
            if importances:
                top_feature = max(importances.items(), key=lambda x: x[1])[0]

        reason = _generate_reason(
            task, priority_s, urgency_s, energy_s, effort_s, ml_contrib, top_feature
        )

        scored.append({
            "task": task,
            "score": round(blended_score, 2),
            "rule_score": round(rule_total, 2),
            "ml_score": round(ml_score_val, 2) if ml_score_val is not None else None,
            "reason": reason,
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored
