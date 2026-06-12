import pytest
from utils.matcher import (
    normalize_text,
    parse_abv,
    parse_net_contents,
    verify_abv,
    verify_net_contents,
    verify_warning_text,
    verify_fields
)

def test_normalize_text():
    assert normalize_text("  hello   world  \n new  line ") == "hello world new line"
    assert normalize_text("") == ""
    assert normalize_text(None) == ""

def test_parse_abv():
    # Percentage extraction
    assert 45.0 in parse_abv("Brand 45% Alc./Vol.")
    assert 6.5 in parse_abv("6.5 % ABV")
    assert 13.5 in parse_abv("Alc 13.5% Vol")
    
    # Proof extraction (Proof / 2 = ABV)
    assert 45.0 in parse_abv("90 Proof Whiskey")
    assert 40.0 in parse_abv("80 PROOF")

    # Generic number following alc/vol
    assert 12.0 in parse_abv("ALC. 12.0 VOL.")

def test_parse_net_contents():
    # standard ml
    assert (750.0, "ml") in parse_net_contents("750 ml")
    assert (750.0, "ml") in parse_net_contents("750ML")
    
    # Liter to ml conversion
    assert (1500.0, "ml") in parse_net_contents("1.5 L")
    assert (1000.0, "ml") in parse_net_contents("1 Liter")

    # Ounces
    assert (12.0, "floz") in parse_net_contents("12 FL OZ")
    assert (12.0, "floz") in parse_net_contents("12 fl. oz.")

def test_verify_abv():
    assert verify_abv("45% Alc./Vol. (90 Proof)", "This is a 45% Alc. Vol. bottle") is True
    assert verify_abv("45% Alc./Vol. (90 Proof)", "This is 90 proof whiskey") is True
    assert verify_abv("6.5% ABV", "Contains 6.5% abv beer") is True
    assert verify_abv("6.5% ABV", "Contains 5.0% abv beer") is False

def test_verify_net_contents():
    assert verify_net_contents("750 mL", "A bottle containing 750ml of liquid") is True
    assert verify_net_contents("750 mL", "A bottle containing 1.5 L of wine") is False
    assert verify_net_contents("12 FL OZ", "Can 12 FL. OZ. beer") is True

def test_verify_warning_text():
    warning_template = "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems."
    
    # Perfect match
    ocr_perfect = f"Other text... {warning_template} ...more text"
    matched, detail = verify_warning_text(warning_template, ocr_perfect)
    assert matched is True

    # Casing mismatch on GOVERNMENT WARNING
    ocr_lowercase = "Other text... government warning: (1) According to the Surgeon General... ...more text"
    matched, detail = verify_warning_text(warning_template, ocr_lowercase)
    assert matched is False
    assert "not in ALL CAPS" in detail

    # Missing warning statement entirely
    ocr_missing = "This label has no warning statement whatsoever"
    matched, detail = verify_warning_text(warning_template, ocr_missing)
    assert matched is False
    assert "not found" in detail

def test_verify_fields():
    app_data = {
        "brand_name": "Old Tom Distillery",
        "class_type": "Kentucky Straight Bourbon Whiskey",
        "abv": "45% Alc./Vol. (90 Proof)",
        "net_contents": "750 mL",
        "bottler_name_address": "Old Tom Distillery Co., Louisville, KY",
        "country_of_origin": "United States",
        "warning_text": "GOVERNMENT WARNING: (1) Surgeon General... (2) Impairs driving..."
    }

    # All match (including fuzzy matching of names)
    ocr_good = (
        "OLD TOM DISTILLERY\n"
        "Kentucky Straight Bourbon Whiskey\n"
        "45% Alc./Vol. (90 Proof) - 750 ml\n"
        "Bottled by Old Tom Distillery Co. in Louisville, KY. Product of United States.\n"
        "GOVERNMENT WARNING: (1) Surgeon General... (2) Impairs driving..."
    )
    result = verify_fields(app_data, ocr_good, 92.0)
    assert result["status"] == "matched"
    assert result["fields"]["brand_name"]["matched"] is True
    assert result["fields"]["abv"]["matched"] is True

    # Brand mismatch
    ocr_bad_brand = (
        "New Whiskey Distillery\n"
        "Kentucky Straight Bourbon Whiskey\n"
        "45% Alc./Vol. (90 Proof) - 750 ml\n"
        "Bottled by New Whiskey Distillery Co. in Louisville, KY. Product of United States.\n"
        "GOVERNMENT WARNING: (1) Surgeon General... (2) Impairs driving..."
    )
    result_mismatch = verify_fields(app_data, ocr_bad_brand, 92.0)
    assert result_mismatch["status"] == "mismatched"
    assert result_mismatch["fields"]["brand_name"]["matched"] is False
    assert result_mismatch["fields"]["abv"]["matched"] is True

    # Low OCR confidence triggers manual review
    result_low_conf = verify_fields(app_data, ocr_good, 35.0)
    assert result_low_conf["status"] == "manual_review"
