from app.services.regex import regex_extract
from app.services.llm import llm_extract
from app.services.car_knowledge import CAR_KNOWLEDGE
from app.services.fuzzy import fuzzy_correct
from app.services.logger import log_data


def extract_car_and_brand(text: str):
    text = text.lower()

    import re
    for key, (brand, model) in CAR_KNOWLEDGE.items():
        # Match whole word only
        if re.search(rf"\b{re.escape(key)}\b", text):
            return brand, model

    return None, None


def extract_features(text: str):

    # STEP 1: fix typos
    text = fuzzy_correct(text)

    features = {}

    # STEP 2: regex
    features.update(regex_extract(text))

    # STEP 3: dataset matching
    brand, model = extract_car_and_brand(text)

    if brand:
        features["brand"] = brand
    if model:
        features["car_name"] = model

    # STEP 4: LLM fallback
    required = ["year", "km_driven", "car_name"]

    if any(k not in features for k in required):
        llm_data = llm_extract(text)

        for k, v in llm_data.items():
            if k not in features or features[k] is None:
                features[k] = v

    # STEP 5: defaults
    features.setdefault("fuel", None)
    features.setdefault("transmission", None)
    features.setdefault("engine", None)
    features.setdefault("city", None)
    features.setdefault("owner", "First Owner")
    features.setdefault("seller_type", "Dealer")

    return features