from rapidfuzz import process
from app.services.car_knowledge import CAR_KNOWLEDGE

CAR_MODELS = list(CAR_KNOWLEDGE.keys())

def fuzzy_correct(text: str):
    words = text.lower().split()
    corrected = []

    for w in words:
        if len(w) < 4 or any(c.isdigit() for c in w):
            corrected.append(w)
            continue
            
        match, score, _ = process.extractOne(w, CAR_MODELS)

        if score > 85:
            corrected.append(match)
        else:
            corrected.append(w)

    return " ".join(corrected)