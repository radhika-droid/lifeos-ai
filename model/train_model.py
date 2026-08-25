"""
LifeOS ML Training Pipeline

Trains a GradientBoostingClassifier to predict P(task completed | features)
using logged interaction data. Designed for small datasets and interpretability.

Usage:
    python -m model.train_model              # train from default DB
    python -m model.train_model --db-path path/to/lifeos.db
    python -m model.train_model --min-samples 100  # override threshold
"""

import json
import sys
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import joblib

# Ensure project root is on the path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

ARTIFACTS_DIR = Path(__file__).resolve().parent / "artifacts"
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

# ── Feature definitions ──────────────────────────────────────────────────────

ENERGY_MAP = {"low": 1, "medium": 2, "high": 3}

FEATURE_COLUMNS = [
    "priority",
    "urgency_score",
    "energy_required_ord",   # ordinal-encoded
    "estimated_minutes",
    "current_energy",
    "available_minutes",
    "hour_of_day",
    "day_of_week",
    "task_age_hours",
    "energy_match",          # derived: |task_energy - user_energy|
    "effort_ratio",          # derived: estimated / available
]

MIN_SAMPLES_DEFAULT = 200

# Human-readable names for feature importance explanations
FEATURE_NAMES_HUMAN = {
    "priority": "task priority",
    "urgency_score": "urgency / deadline proximity",
    "energy_required_ord": "task energy requirement",
    "estimated_minutes": "estimated effort",
    "current_energy": "your current energy level",
    "available_minutes": "your available time",
    "hour_of_day": "time of day",
    "day_of_week": "day of the week",
    "task_age_hours": "how long the task has been waiting",
    "energy_match": "energy level match",
    "effort_ratio": "effort-to-time fit",
}


def load_interactions(db_path: str) -> list[dict]:
    """Load interactions with outcomes from SQLite."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.execute(
        """
        SELECT priority, urgency_score, energy_required, estimated_minutes,
               current_energy, available_minutes, hour_of_day, day_of_week,
               task_age_hours, rule_score, outcome, created_at
        FROM interactions
        WHERE outcome IS NOT NULL
        ORDER BY created_at ASC
        """
    )
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows


def engineer_features(rows: list[dict]) -> tuple[np.ndarray, np.ndarray]:
    """
    Convert raw interaction rows into feature matrix X and labels y.

    Labels: 1 = completed, 0 = not completed (ignored/skipped/postponed/deleted)
    """
    X = []
    y = []
    for row in rows:
        energy_ord = ENERGY_MAP.get(row["energy_required"], 2)
        energy_match = abs(energy_ord - row["current_energy"])
        effort_ratio = row["estimated_minutes"] / max(row["available_minutes"], 1)

        features = [
            row["priority"],
            row["urgency_score"],
            energy_ord,
            row["estimated_minutes"],
            row["current_energy"],
            row["available_minutes"],
            row["hour_of_day"],
            row["day_of_week"],
            row.get("task_age_hours", 0) or 0,
            energy_match,
            round(effort_ratio, 4),
        ]
        X.append(features)
        y.append(1 if row["outcome"] == "completed" else 0)

    return np.array(X, dtype=np.float64), np.array(y, dtype=np.int32)


def train(db_path: str = None, min_samples: int = MIN_SAMPLES_DEFAULT) -> dict:
    """
    Main training function.

    Returns a dict with training results and metrics.
    """
    from sklearn.ensemble import GradientBoostingClassifier
    from sklearn.preprocessing import StandardScaler
    from sklearn.metrics import accuracy_score, roc_auc_score

    if db_path is None:
        # Default: look for lifeos.db relative to backend/
        db_path = str(PROJECT_ROOT / "backend" / "lifeos.db")

    if not os.path.exists(db_path):
        return {"status": "error", "message": f"Database not found: {db_path}"}

    rows = load_interactions(db_path)
    total = len(rows)

    if total < min_samples:
        return {
            "status": "insufficient_data",
            "message": f"Need {min_samples} interactions, have {total}. Using rules only.",
            "total_interactions": total,
        }

    X, y = engineer_features(rows)

    # Chronological split (80/20) — NOT random, to avoid temporal leakage
    split_idx = int(len(X) * 0.8)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]

    # Check for degenerate labels
    if len(set(y_train)) < 2:
        return {
            "status": "insufficient_variance",
            "message": "Training data has only one class. Need both completed and non-completed outcomes.",
            "total_interactions": total,
        }

    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Train model
    model = GradientBoostingClassifier(
        n_estimators=100,
        max_depth=3,
        learning_rate=0.1,
        min_samples_leaf=5,
        random_state=42,
    )
    model.fit(X_train_scaled, y_train)

    # Evaluate
    y_pred = model.predict(X_test_scaled)
    y_proba = model.predict_proba(X_test_scaled)[:, 1]

    accuracy = accuracy_score(y_test, y_pred)

    try:
        auc = roc_auc_score(y_test, y_proba)
    except ValueError:
        auc = 0.5  # only one class in test set

    # Feature importances
    importances = dict(zip(FEATURE_COLUMNS, model.feature_importances_.tolist()))

    # Check if new model is better than existing
    existing_meta = _load_existing_metadata()
    if existing_meta and existing_meta.get("validation_auc", 0) >= auc:
        return {
            "status": "not_promoted",
            "message": f"New AUC ({auc:.3f}) does not beat existing ({existing_meta['validation_auc']:.3f}). Keeping old model.",
            "validation_accuracy": round(accuracy, 4),
            "validation_auc": round(auc, 4),
            "total_interactions": total,
        }

    # Save model artifacts
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")

    joblib.dump(model, ARTIFACTS_DIR / "model_latest.joblib")
    joblib.dump(scaler, ARTIFACTS_DIR / "scaler_latest.joblib")

    metadata = {
        "model_version": now_str,
        "training_data_size": total,
        "train_size": len(X_train),
        "test_size": len(X_test),
        "validation_accuracy": round(accuracy, 4),
        "validation_auc": round(auc, 4),
        "feature_importances": importances,
        "feature_columns": FEATURE_COLUMNS,
        "last_trained": now_str,
        "completion_rate_train": round(float(y_train.mean()), 4),
        "completion_rate_test": round(float(y_test.mean()), 4),
    }

    with open(ARTIFACTS_DIR / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    return {
        "status": "promoted",
        "message": f"New model promoted! AUC: {auc:.3f}, Accuracy: {accuracy:.3f}",
        **metadata,
    }


def _load_existing_metadata() -> dict | None:
    """Load metadata of the currently deployed model, if any."""
    meta_path = ARTIFACTS_DIR / "metadata.json"
    if not meta_path.exists():
        return None
    try:
        with open(meta_path) as f:
            return json.load(f)
    except Exception:
        return None


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Train LifeOS ML model")
    parser.add_argument("--db-path", type=str, default=None, help="Path to SQLite database")
    parser.add_argument("--min-samples", type=int, default=MIN_SAMPLES_DEFAULT, help="Minimum interactions required")
    args = parser.parse_args()

    result = train(db_path=args.db_path, min_samples=args.min_samples)
    print(json.dumps(result, indent=2))
