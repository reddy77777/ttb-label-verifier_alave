# Functional Requirements

## 1. Core Verification Engine
The backend must verify specific fields between the submitted Application Data and the uploaded Label Image.
* **Fuzzy Matching (Tolerance Allowed):** Brand Name, Class/Type Designation, Name/Address of Bottler, Country of Origin (for imports). (e.g., "STONE'S THROW" matches "Stone's Throw").
* **Exact Matching (Strict Enforcement):** 
    * Alcohol Content (ABV).
    * Net Contents.
    * **Government Warning:** Must be an exact word-for-word match. The prefix "GOVERNMENT WARNING:" must be verified as ALL CAPS. Font-weight (BOLD) verification is flagged for manual confirmation during officer review, as raw OCR is plain text.

## 2. Batch Processing Module
* The system must accept multiple images simultaneously.
* The system must queue these images and process them sequentially or in parallel, returning a summarized table view of "Approved", "Rejected", and "Manual Review Required" statuses.

## 3. Mock Authentication
* Implement a dummy credential login screen displaying "TTB Compliance Portal - Authorized Personnel Only". Accepts any email/password combination and initiates session verification locally in the browser (protecting offline parity).