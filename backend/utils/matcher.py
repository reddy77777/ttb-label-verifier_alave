import re
import logging
from thefuzz import fuzz

logger = logging.getLogger("matcher")

import unicodedata

def strip_accents(text: str) -> str:
    """
    Decomposes Unicode characters and strips combining marks to convert
    accented characters (like â, é, ê) to their base ASCII form.
    """
    nfkd_form = unicodedata.normalize('NFKD', text)
    return "".join([c for c in nfkd_form if not unicodedata.combining(c)])

def normalize_text(text: str) -> str:
    """
    Normalizes spacing by replacing any consecutive whitespace (newlines, tabs, spaces)
    with a single space and stripping leading/trailing whitespace.
    Unicode accents are stripped to ensure robust matching.
    Casing and punctuation are strictly preserved.
    """
    if not text:
        return ""
    text_no_accents = strip_accents(text)
    return re.sub(r'\s+', ' ', text_no_accents).strip()

def parse_abv(text: str) -> list[float]:
    """
    Extracts potential ABV or Proof values from text and normalizes them to float percentages.
    E.g., "45% Alc./Vol." -> 45.0
          "90 Proof" -> 45.0 (Proof / 2)
          "6.5% ABV" -> 6.5
    """
    results = []
    # Match percentage patterns: 12%, 12.5%, 6.5 % abv, etc.
    pct_matches = re.findall(r'(\d+(?:\.\d+)?)\s*(?:%|pct|percent|alc|abv)', text, re.IGNORECASE)
    for val in pct_matches:
        try:
            results.append(float(val))
        except ValueError:
            pass

    # Match proof patterns: 90 proof, 90proof, etc.
    proof_matches = re.findall(r'(\d+(?:\.\d+)?)\s*proof', text, re.IGNORECASE)
    for val in proof_matches:
        try:
            results.append(float(val) / 2.0)
        except ValueError:
            pass

    # Generic numbers that are in common ABV ranges if no suffix is found (e.g. "Alc. 13.5 Vol")
    # Matches "alc 13.5", "vol 13.5", "13.5%vol"
    generic_matches = re.findall(r'(?:alc|vol|alc\.)\s*(\d+(?:\.\d+)?)', text, re.IGNORECASE)
    for val in generic_matches:
        try:
            results.append(float(val))
        except ValueError:
            pass

    return list(set(results))

def parse_net_contents(text: str) -> list[tuple[float, str]]:
    """
    Extracts potential volume measurements from text and normalizes to a standard pair (value, unit).
    Supported units: ml, l (liters), fl oz (fluid ounces)
    """
    results = []
    # Match volumes like "750 ml", "750ml", "1.5 L", "1.5L", "1.5 Liters", "12 fl oz", "12 FL. OZ."
    pattern = r'(\d+(?:\.\d+)?)\s*(ml|l|liters?|fl\s*oz|fl\.\s*oz\.|fluid\s*ounces?)'
    matches = re.findall(pattern, text, re.IGNORECASE)
    
    for val_str, unit_str in matches:
        try:
            val = float(val_str)
            unit = unit_str.lower().replace(".", "").replace(" ", "")
            if "ml" in unit:
                canonical_unit = "ml"
            elif "fl" in unit or "oz" in unit:
                canonical_unit = "floz"
            elif unit.startswith("l"):
                # Normalize Liters to mL
                val = val * 1000.0
                canonical_unit = "ml"
            else:
                continue
            
            results.append((val, canonical_unit))
        except ValueError:
            pass
            
    return list(set(results))

def verify_abv(expected_abv_str: str, ocr_text: str) -> bool:
    """
    Matches the database ABV against values extracted from OCR.
    At least one parsed ABV from OCR must match the expected ABV.
    """
    expected_values = parse_abv(expected_abv_str)
    ocr_values = parse_abv(ocr_text)

    if not expected_values:
        logger.warning(f"Could not parse expected ABV from: {expected_abv_str}")
        return False

    # Check if any expected value matches any OCR value (within a tiny floating point tolerance)
    for exp in expected_values:
        for ocr in ocr_values:
            if abs(exp - ocr) < 0.05: # Exact matching tolerance
                return True
    return False

def verify_net_contents(expected_vol_str: str, ocr_text: str) -> bool:
    """
    Matches the database volume against values extracted from OCR.
    """
    expected_values = parse_net_contents(expected_vol_str)
    ocr_values = parse_net_contents(ocr_text)

    if not expected_values:
        logger.warning(f"Could not parse expected volume from: {expected_vol_str}")
        return False

    # Check if any expected volume matches any OCR volume
    for exp_val, exp_unit in expected_values:
        for ocr_val, ocr_unit in ocr_values:
            if exp_unit == ocr_unit and abs(exp_val - ocr_val) < 0.5:
                return True
    return False

def verify_warning_text(expected_warning: str, ocr_text: str) -> tuple[bool, str]:
    """
    Verifies that the warning text matches exactly.
    Rules:
    1. The prefix "GOVERNMENT WARNING:" must be verified as ALL CAPS in the OCR text.
    2. The rest of the warning text must match word-for-word (whitespace normalized).
    """
    normalized_expected = normalize_text(expected_warning)
    normalized_ocr = normalize_text(ocr_text)

    # 1. Verify that 'GOVERNMENT WARNING:' prefix exists in ALL CAPS in the OCR
    # Check if the text actually contains "GOVERNMENT WARNING:" as written
    if "GOVERNMENT WARNING:" not in normalized_ocr:
        # Check if it exists in another casing (which is a violation)
        if "government warning:" in normalized_ocr.lower():
            return False, "Prefix 'GOVERNMENT WARNING:' is present but not in ALL CAPS."
        else:
            return False, "Warning statement prefix 'GOVERNMENT WARNING:' not found."

    # 2. Verify exact substring match for the rest of the warning text
    if normalized_expected not in normalized_ocr:
        # Run a fuzzy ratio to see if it's close or completely missing
        ratio = fuzz.partial_ratio(normalized_expected, normalized_ocr)
        if ratio > 85:
            return False, f"Warning text has minor discrepancies (Fuzzy score: {ratio}%)."
        else:
            return False, "Warning text is missing or has significant discrepancies."

    return True, "Match"

def find_best_matching_line(expected: str, ocr_text: str) -> str:
    """
    Finds the line in ocr_text that best matches the expected text using fuzzy matching.
    """
    if not ocr_text or not expected:
        return ""
    normalized_expected = normalize_text(expected)
    best_line = ""
    best_score = -1
    for line in ocr_text.split('\n'):
        line_stripped = line.strip()
        if not line_stripped:
            continue
        score = fuzz.token_set_ratio(normalized_expected, normalize_text(line_stripped))
        if score > best_score:
            best_score = score
            best_line = line_stripped
    return best_line if best_score >= 40 else ""

def extract_actual_warning(ocr_text: str) -> str:
    """
    Extracts the actual government warning paragraph from the OCR text.
    """
    if not ocr_text:
        return ""
    
    # Try regex matching government warning
    match = re.search(r'(government\s+warning\s*:.*)', ocr_text, re.IGNORECASE | re.DOTALL)
    if match:
        return match.group(1).strip()
    
    # Fallback to search for just "warning"
    match = re.search(r'(warning\s*:.*)', ocr_text, re.IGNORECASE | re.DOTALL)
    if match:
        return match.group(1).strip()
        
    return ""

def verify_fields(app_data: dict, ocr_text: str, ocr_confidence: float) -> dict:
    """
    Coordinates matching of all fields and determines verification status.
    """
    # If OCR confidence is too low or text is empty, trigger manual review
    if not ocr_text.strip() or ocr_confidence < 40.0:
        return {
            "status": "manual_review",
            "reason": f"Low OCR quality (Confidence: {ocr_confidence:.1f}%)" if ocr_text.strip() else "No text extracted from label",
            "confidence": ocr_confidence,
            "fields": {
                "brand_name": {"expected": app_data.get("brand_name"), "actual": "", "matched": False, "score": 0},
                "class_type": {"expected": app_data.get("class_type"), "actual": "", "matched": False, "score": 0},
                "bottler_name_address": {"expected": app_data.get("bottler_name_address"), "actual": "", "matched": False, "score": 0},
                "country_of_origin": {"expected": app_data.get("country_of_origin"), "actual": "", "matched": False, "score": 0},
                "abv": {"expected": app_data.get("abv"), "actual": "", "matched": False},
                "net_contents": {"expected": app_data.get("net_contents"), "actual": "", "matched": False},
                "warning_text": {"expected": app_data.get("warning_text"), "actual": "", "matched": False, "detail": "N/A"}
            }
        }

    # Normalize OCR text for search
    normalized_ocr = normalize_text(ocr_text)

    # 1. Fuzzy Matches
    brand_expected = app_data.get("brand_name", "")
    brand_score = fuzz.token_set_ratio(normalize_text(brand_expected), normalized_ocr)
    brand_matched = brand_score >= 80

    class_expected = app_data.get("class_type", "")
    class_score = fuzz.token_set_ratio(normalize_text(class_expected), normalized_ocr)
    class_matched = class_score >= 80

    bottler_expected = app_data.get("bottler_name_address", "")
    bottler_score = fuzz.token_set_ratio(normalize_text(bottler_expected), normalized_ocr)
    bottler_matched = bottler_score >= 80

    country_expected = app_data.get("country_of_origin", "")
    country_score = fuzz.token_set_ratio(normalize_text(country_expected), normalized_ocr)
    country_matched = country_score >= 80

    # 2. Exact Matches
    abv_expected = app_data.get("abv", "")
    abv_matched = verify_abv(abv_expected, ocr_text)

    net_expected = app_data.get("net_contents", "")
    net_matched = verify_net_contents(net_expected, ocr_text)

    warning_expected = app_data.get("warning_text", "")
    warning_matched, warning_detail = verify_warning_text(warning_expected, ocr_text)

    # 3. Overall Verification Status
    all_matched = (
        brand_matched and 
        class_matched and 
        bottler_matched and 
        country_matched and 
        abv_matched and 
        net_matched and 
        warning_matched
    )

    if all_matched:
        status = "matched"
        reason = "All fields matched successfully."
    else:
        # Determine if it's a critical warning discrepancy or general mismatch
        if not warning_matched:
            status = "mismatched"
            reason = f"Government warning failure: {warning_detail}"
        else:
            status = "mismatched"
            mismatched_fields = []
            if not brand_matched: mismatched_fields.append("Brand Name")
            if not class_matched: mismatched_fields.append("Class/Type")
            if not bottler_matched: mismatched_fields.append("Bottler Info")
            if not country_matched: mismatched_fields.append("Country of Origin")
            if not abv_matched: mismatched_fields.append("ABV")
            if not net_matched: mismatched_fields.append("Net Contents")
            reason = f"Mismatch in fields: {', '.join(mismatched_fields)}"

    return {
        "status": status,
        "reason": reason,
        "confidence": ocr_confidence,
        "fields": {
            "brand_name": {"expected": brand_expected, "actual": find_best_matching_line(brand_expected, ocr_text), "matched": brand_matched, "score": brand_score},
            "class_type": {"expected": class_expected, "actual": find_best_matching_line(class_expected, ocr_text), "matched": class_matched, "score": class_score},
            "bottler_name_address": {"expected": bottler_expected, "actual": find_best_matching_line(bottler_expected, ocr_text), "matched": bottler_matched, "score": bottler_score},
            "country_of_origin": {"expected": country_expected, "actual": find_best_matching_line(country_expected, ocr_text), "matched": country_matched, "score": country_score},
            "abv": {"expected": abv_expected, "actual": find_best_matching_line(abv_expected, ocr_text), "matched": abv_matched},
            "net_contents": {"expected": net_expected, "actual": find_best_matching_line(net_expected, ocr_text), "matched": net_matched},
            "warning_text": {"expected": warning_expected, "actual": extract_actual_warning(ocr_text), "matched": warning_matched, "detail": warning_detail}
        }
    }

