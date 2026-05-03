import pytest
from app.services.regex import regex_extract
from app.services.fuzzy import fuzzy_correct
from app.services.extractor import extract_features, extract_car_and_brand

def test_regex_extract_full():
    text = "2022 Suzuki Cultus 50000km Petrol Manual 1000cc"
    features = regex_extract(text)
    assert features["year"] == 2022
    assert features["km_driven"] == 50000
    assert features["fuel"] == "Petrol"
    assert features["transmission"] == "Manual"
    assert features["engine"] == 1000

def test_regex_extract_partial():
    text = "Automatic diesel car"
    features = regex_extract(text)
    assert features["fuel"] == "Diesel"
    assert features["transmission"] == "Automatic"
    assert "year" not in features

def test_fuzzy_correct_typos():
    # 'cltus' should match 'cultus' (score > 85)
    text = "I have a Cltus"
    corrected = fuzzy_correct(text)
    assert "cultus" in corrected

def test_fuzzy_correct_skip_numeric():
    text = "2018 model 50000km"
    corrected = fuzzy_correct(text)
    assert "2018" in corrected
    assert "50000km" in corrected

def test_extract_car_and_brand_exact():
    brand, model = extract_car_and_brand("I love my Honda Civic")
    assert brand == "Honda"
    assert model == "Civic"

def test_extract_features_combined():
    text = "Selling my 2015 Toyota Corolla 80000km"
    features = extract_features(text)
    assert features["year"] == 2015
    assert features["brand"] == "Toyota"
    assert features["car_name"] == "Corolla"
    assert features["km_driven"] == 80000
