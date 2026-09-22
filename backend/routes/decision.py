from flask import Blueprint, request, jsonify
from services.decision_engine import decision_engine

decision_bp = Blueprint("decision", __name__)

VALID_ENERGY = {"low", "medium", "high"}

@decision_bp.route("/decide", methods=["POST"])
def decide():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid or missing JSON body"}), 400

    tasks = data.get("tasks", [])
    energy = data.get("energy", "medium").lower()

    if energy not in VALID_ENERGY:
        return jsonify({"error": f"Invalid energy level. Use one of: {', '.join(VALID_ENERGY)}"}), 400

    if not isinstance(tasks, list):
        return jsonify({"error": "'tasks' must be a list"}), 400

    result = decision_engine(tasks, energy)
    return jsonify(result)