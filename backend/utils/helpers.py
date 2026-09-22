from datetime import datetime, date

def today_str():
    return date.today().isoformat()

def parse_date(date_str):
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str)
    except Exception:
        return None

def is_past_due(dt):
    if not dt:
        return False
    return dt < datetime.utcnow()

def allowed_file(filename, allowed_extensions):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed_extensions
