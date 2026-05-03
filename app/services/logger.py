import json
from datetime import datetime


def log_data(message, features):
    with open("logs/requests.jsonl", "a") as f:
        f.write(json.dumps({
            "time": str(datetime.now()),
            "message": message,
            "features": features
        }) + "\n")