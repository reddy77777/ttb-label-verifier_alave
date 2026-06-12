import os
from PIL import Image, ImageDraw, ImageFont

# Directory for test labels
LABEL_DIR = os.path.join(os.path.dirname(__file__), "..", "test_labels")
os.makedirs(LABEL_DIR, exist_ok=True)

# Find a system font on macOS
FONT_PATHS = [
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/Library/Fonts/Arial.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
]

font_path = None
for path in FONT_PATHS:
    if os.path.exists(path):
        font_path = path
        break

def create_label(filename: str, lines: list, bold_lines: list = None):
    # Create a 800x1000 canvas with cream/light-beige background
    img = Image.new("RGB", (800, 1000), "#fdfbf7")
    draw = ImageDraw.Draw(img)
    
    # Draw a thin black border
    draw.rectangle([20, 20, 780, 980], outline="#1e293b", width=4)
    
    # Load fonts
    try:
        title_font = ImageFont.truetype(font_path, 32) if font_path else ImageFont.load_default()
        body_font = ImageFont.truetype(font_path, 18) if font_path else ImageFont.load_default()
        bold_font = ImageFont.truetype(font_path, 18) if font_path else ImageFont.load_default()
    except Exception:
        title_font = ImageFont.load_default()
        body_font = ImageFont.load_default()
        bold_font = ImageFont.load_default()

    y = 60
    
    for i, line in enumerate(lines):
        # Determine if it's the brand header
        if i == 0:
            # Draw brand centered
            w = draw.textlength(line, font=title_font)
            x = (800 - w) // 2
            draw.text((x, y), line, fill="#0f172a", font=title_font)
            y += 80
        elif line.startswith("GOVERNMENT WARNING:") or line.startswith("government warning:"):
            # Draw warning paragraph
            y += 40
            # Wrap warning text to 700px width
            words = line.split()
            current_line = []
            wrapped_lines = []
            
            for word in words:
                test_line = " ".join(current_line + [word])
                test_w = draw.textlength(test_line, font=body_font)
                if test_w < 700:
                    current_line.append(word)
                else:
                    wrapped_lines.append(" ".join(current_line))
                    current_line = [word]
            if current_line:
                wrapped_lines.append(" ".join(current_line))
                
            for wl in wrapped_lines:
                # Highlight "GOVERNMENT WARNING:" in bold
                if "GOVERNMENT WARNING:" in wl:
                    parts = wl.split("GOVERNMENT WARNING:")
                    draw.text((50, y), "GOVERNMENT WARNING:", fill="#000000", font=bold_font)
                    w_prefix = draw.textlength("GOVERNMENT WARNING:", font=bold_font)
                    draw.text((50 + w_prefix, y), parts[1], fill="#000000", font=body_font)
                elif "government warning:" in wl:
                    parts = wl.split("government warning:")
                    draw.text((50, y), "government warning:", fill="#000000", font=body_font)
                    w_prefix = draw.textlength("government warning:", font=body_font)
                    draw.text((50 + w_prefix, y), parts[1], fill="#000000", font=body_font)
                else:
                    draw.text((50, y), wl, fill="#000000", font=body_font)
                y += 26
        else:
            # Draw regular fields left-aligned
            draw.text((50, y), line, fill="#334155", font=body_font)
            y += 35

    dest_path = os.path.join(LABEL_DIR, filename)
    img.save(dest_path)
    print(f"Generated: {dest_path}")

# --- Generate test label configurations ---

# 1. TTB-2024-001 Perfect Match
create_label("TTB-2024-001_perfect.png", [
    "Old Tom Distillery",
    "Class/Type: Kentucky Straight Bourbon Whiskey",
    "ABV: 45% Alc./Vol. (90 Proof)",
    "Volume: 750 mL",
    "Bottled by: Old Tom Distillery Co., Louisville, KY",
    "Origin: United States",
    "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems."
])

# 2. TTB-2024-002 Perfect Match
create_label("TTB-2024-002_perfect.png", [
    "Stone's Throw",
    "Class/Type: India Pale Ale",
    "ABV: 6.5% ABV",
    "Volume: 12 FL OZ",
    "Bottled by: Stone's Throw Brewing, Seattle, WA",
    "Origin: United States",
    "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems."
])

# 3. TTB-2024-003 Perfect Match
create_label("TTB-2024-003_perfect.png", [
    "Château de Valois",
    "Class/Type: Red Wine",
    "ABV: 13.5% ABV",
    "Volume: 750 mL",
    "Bottled by: Mis en bouteille au Château, Bordeaux, France",
    "Origin: France",
    "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems."
])

# 4. TTB-2024-002 Fuzzy Match (Brand name minor difference, still matches)
create_label("TTB-2024-002_fuzzy_match.png", [
    "Stone's Throw Craft Beer", # Expected: "Stone's Throw" - Fuzzy should match this (>80%)
    "Class/Type: India Pale Ale",
    "ABV: 6.5% ABV",
    "Volume: 12 FL OZ",
    "Bottled by: Stone's Throw Brewing, Seattle, WA",
    "Origin: United States",
    "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems."
])

# 5. TTB-2024-001 Mismatch (ABV is incorrect)
create_label("TTB-2024-001_mismatch_abv.png", [
    "Old Tom Distillery",
    "Class/Type: Kentucky Straight Bourbon Whiskey",
    "ABV: 52% Alc./Vol. (104 Proof)", # Expected: 45% Alc./Vol.
    "Volume: 750 mL",
    "Bottled by: Old Tom Distillery Co., Louisville, KY",
    "Origin: United States",
    "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems."
])

# 6. TTB-2024-001 Mismatch (Government Warning Case Violation)
create_label("TTB-2024-001_mismatch_warning_case.png", [
    "Old Tom Distillery",
    "Class/Type: Kentucky Straight Bourbon Whiskey",
    "ABV: 45% Alc./Vol. (90 Proof)",
    "Volume: 750 mL",
    "Bottled by: Old Tom Distillery Co., Louisville, KY",
    "Origin: United States",
    "government warning: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems." # Expected: GOVERNMENT WARNING: (ALL CAPS)
])
