import re

def regex_extract(text: str):
    text = text.lower()
    features = {}

    # Year
    year = re.search(r"\b(20\d{2})\b", text)
    if year:
        features["year"] = int(year.group())

    # KM driven
    km = re.search(r"(\d{1,6})\s?km", text)
    if km:
        features["km_driven"] = int(km.group(1))

    # Fuel
    if "petrol" in text:
        features["fuel"] = "Petrol"
    elif "diesel" in text:
        features["fuel"] = "Diesel"

    # Transmission
    if "manual" in text:
        features["transmission"] = "Manual"
    elif "automatic" in text:
        features["transmission"] = "Automatic"

    # Engine
    engine = re.search(r"(\d{3,4})\s?cc", text)
    if engine:
        features["engine"] = int(engine.group(1))

    return features

    