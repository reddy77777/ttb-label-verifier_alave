# Test Plan & QA

## 1. Unit Testing (Backend)
* **Framework:** `pytest`
* **Coverage:** * Test the `fuzzy_match` function against known minor variations (e.g., punctuation, casing).
    * Test the `exact_match` function to ensure it fails on minor discrepancies in the Government Warning (e.g., missing caps).

## 2. Functional Testing (Frontend)
* **Framework:** `Jest` / `React Testing Library`
* **Coverage:**
    * Verify the drag-and-drop zone accepts valid image formats (png, jpg).
    * Verify that clicking "Approve" removes the item from the pending queue.

## 3. Edge Cases
* **Poor Image Quality:** System should gracefully handle illegible text by returning a "Low Confidence - Manual Review Required" status rather than crashing or throwing unhandled exceptions.
* **Curved or Glared Surface Labels:** Verify that the image preprocessing pipeline corrects binarization and perspective issues to allow successful OCR parsing.
* **Unit Normalization Discrepancies:** Test that varying formats of ABV (e.g., `45% Alc./Vol.`, `45% ABV`, `90 Proof`) and Net Contents (e.g., `750 mL`, `750ml`, `750ML`) correctly normalize and resolve as matches.