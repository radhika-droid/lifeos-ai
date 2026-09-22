import os, sys
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, send_from_directory
from flask_cors import CORS
import config
from models.database import init_db

from routes.decision import decision_bp
from routes.tasks import tasks_bp
from routes.habits import habits_bp
from routes.wellness import wellness_bp
from routes.notifications import notifications_bp
from routes.uploads import uploads_bp
from routes.auth import auth_bp

FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
app.config["MAX_CONTENT_LENGTH"] = config.MAX_CONTENT_LENGTH
CORS(app)

# Register all blueprints
app.register_blueprint(decision_bp)
app.register_blueprint(tasks_bp)
app.register_blueprint(habits_bp)
app.register_blueprint(wellness_bp)
app.register_blueprint(notifications_bp)
app.register_blueprint(uploads_bp)
app.register_blueprint(auth_bp)


# Serve frontend SPA
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path and os.path.exists(os.path.join(FRONTEND_DIR, path)):
        return send_from_directory(FRONTEND_DIR, path)
    return send_from_directory(FRONTEND_DIR, "index.html")

if __name__ == "__main__":
    init_db()
    app.run(debug=True)