from app.utils.loader import get_final_price
import copy

def predict_price(features: dict):
    return get_final_price(features)

def get_price_insights(features: dict, user_price: float = None):
    suggested_price = get_final_price(features)
    
    insights = {
        "suggested_price": suggested_price,
        "confidence_score": 85.0, 
        "market_position": "Fair",
        "difference_percentage": 0.0,
        "explanations": get_price_explanation(features)
    }

    if user_price:
        diff = ((user_price - suggested_price) / suggested_price) * 100
        insights["difference_percentage"] = round(diff, 2)
        
        if diff > 10:
            insights["market_position"] = "High"
        elif diff < -10:
            insights["market_position"] = "Low"
        else:
            insights["market_position"] = "Competitive"
            
    return insights

def get_price_explanation(features: dict):
    """Explains why the price is what it is (Explainable AI)."""
    base_price = get_final_price(features)
    explanations = []

    # 1. Year Impact (Compare with 1 year older)
    f_older = copy.deepcopy(features)
    f_older["year"] = features["year"] - 1
    price_older = get_final_price(f_older)
    year_impact = base_price - price_older
    if year_impact > 0:
        explanations.append(f"Model year {features['year']} added approx {year_impact/100000:.1f} lac to value")

    # 2. Mileage Impact (Impact of 10,000 km)
    f_more_miles = copy.deepcopy(features)
    f_more_miles["mileage_km"] = features["mileage_km"] + 10000
    price_more_miles = get_final_price(f_more_miles)
    mileage_impact = price_more_miles - base_price
    if mileage_impact < 0:
        explanations.append(f"Mileage level decreased price by {abs(mileage_impact)/100000:.1f} lac per 10k km")

    # 3. Engine size impact
    if features.get("engine_cc", 0) > 1000:
        explanations.append(f"Powerful {features['engine_cc']}cc engine significantly boosts market demand")
    else:
        explanations.append(f"Fuel-efficient {features['engine_cc']}cc engine maintains high resale value")

    return explanations