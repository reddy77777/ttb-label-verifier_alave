# Coding Standards & Edge Case Management
**Author:** Vishnu Singhireddy

## 1. "Anti-Slop" Code Requirements
* **Strict Typing:** * Frontend: 100% TypeScript. No `any` types allowed. Interfaces must be defined for all application data payloads.
    * Backend: Python type hints must be used for all function arguments and return types. Pydantic models must validate all incoming Next.js requests.
* **Clean Architecture:** No dead code, orphaned commented-out blocks, or overly verbose generic AI comments (e.g., do not write `// This is a button that clicks`). Code must be self-documenting through precise naming conventions.
* **Error Handling (No Silent Failures):** All try/catch blocks must handle exceptions specifically. Catching generic exceptions without logging or returning a structured response to the frontend is prohibited.

## 2. Edge Case Definitions & Graceful Degradation
The system must never hallucinate data or crash when confronted with imperfect inputs.

* **Edge Case 1: Illegible or Blurry Labels**
    * *Trigger:* Tesseract OCR returns an empty string or a string with a confidence score below 40%.
    * *System Action:* Do NOT attempt to fuzzy-match garbage text. The backend must instantly return a `status: "manual_review"` payload.
    * *UI Action:* Display a yellow warning: "Label illegible. Manual review required."
* **Edge Case 2: Extreme Formatting (The "Jenny Park" Rule)**
    * *Trigger:* The Government Warning is present, but spacing is wildly irregular due to poor OCR line breaks.
    * *System Action:* The exact-match function must normalize whitespace (strip extra spaces and newlines) before comparing strings, but it must strictly preserve casing and punctuation.
* **Edge Case 3: Malformed Batch Uploads**
    * *Trigger:* A user drops a PDF or an unsupported file type into the batch image uploader.
    * *System Action:* The frontend must reject the specific file immediately before sending it to the backend, displaying a localized error ("Unsupported file type: PDF. Images only."), while continuing to process the valid files in the batch.
* **Edge Case 4: Missing Application Data**
    * *Trigger:* The UI sends an image, but the mocked JSON application data is missing a required field (e.g., ABV is null).
    * *System Action:* The backend must flag the specific missing field as an "Application Data Error" rather than failing the label match itself.
* **Edge Case 5: ABV & Net Contents Unit Variations**
    * *Trigger:* The OCR extracts units in a different format than the structured application data (e.g., `45% Alc./Vol.` vs `45% ABV`, or `750 mL` vs `750ml`).
    * *System Action:* The backend must parse and normalize both quantities to a canonical standard representation prior to evaluating the exact match.