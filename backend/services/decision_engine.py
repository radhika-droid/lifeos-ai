def decision_engine(tasks, energy):
    """
    Scores a list of tasks based on user energy and task attributes.
    Returns a rich result object with the best task, score, reason, and all scores.
    """
    if not tasks:
        return {
            "recommended_task": None,
            "reason": "No tasks provided.",
            "all_scores": []
        }

    # Check if any high-priority task exists globally
    has_high_priority = any(t.get("priority", 1) >= 4 for t in tasks)

    scored_tasks = []

    for task in tasks:
        priority = task.get("priority", 1)
        time_est = task.get("time", 1)
        difficulty = task.get("difficulty", 1)
        urgency = task.get("urgency", 1)
        task_type = task.get("type", "general")
        name = task.get("name", "Unnamed Task")

        # Base score
        score = (priority * 2) + (urgency * 2)

        # Energy effect
        if energy == "low":
            score -= (time_est * 2 + difficulty * 2)
        elif energy == "medium":
            score -= (time_est + difficulty)
        elif energy == "high":
            score -= (time_est * 0.5)

        # Task type bonus
        if task_type == "health":
            score += 2
        elif task_type == "study":
            score += 3
        elif task_type == "work":
            score += 2
        elif task_type == "fun":
            score += 1

        # Penalize fun tasks only if high-priority tasks exist globally
        if task_type == "fun" and has_high_priority:
            score -= 3

        scored_tasks.append({
            "name": name,
            "score": round(score, 2),
            "type": task_type,
            "priority": priority,
            "urgency": urgency
        })

    # Sort all tasks by score descending (fix: was returning inside loop before)
    scored_tasks.sort(key=lambda x: x["score"], reverse=True)
    best = scored_tasks[0]

    # Build human-readable reason
    energy_labels = {"low": "low energy", "medium": "moderate energy", "high": "high energy"}
    energy_label = energy_labels.get(energy, "current energy")

    reason = (
        f"'{best['name']}' has the highest impact score ({best['score']}) "
        f"given your {energy_label}. "
    )
    if best["priority"] >= 4:
        reason += "It's a high-priority task that needs your attention. "
    if best["urgency"] >= 4:
        reason += "It's also highly urgent — tackle it first!"
    elif best["type"] == "study":
        reason += "Study tasks give a cognitive bonus — great time to learn."
    elif best["type"] == "health":
        reason += "Taking care of your health keeps everything else on track."

    return {
        "recommended_task": best,
        "reason": reason.strip(),
        "all_scores": scored_tasks
    }