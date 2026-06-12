# UI/UX Specification

## 1. Aesthetic
* **Theme:** "Enterprise Government". Use neutral tones (Slate, Navy Blue, White, crisp borders). Strictly forbid neon colors, purple gradients, or "sparkle" icons commonly associated with consumer AI. 
* **Typography:** Inter or standard system sans-serif. Large, legible.

## 2. Layout & Views
* **Login View:** Centralized login card with a government warning banner regarding unauthorized access.
* **Dashboard View:** * **Top:** Large, persistent "Upload Application" drag-and-drop zone. Clearly marked "Supports single or batch uploads (max 50)".
    * **Bottom/Main:** A data table showing recent uploads with clear status badges (Green "Match", Red "Mismatch", Yellow "Review").
* **Detail/Verification View:**
    * **Split Screen:** Left side displays the uploaded label image and raw text OCR readout. Right side displays the verification matrix.
    * **Visual Diff Matrix:** Renders **Expected (Database)** and **Extracted (Label OCR)** values side-by-side for each field to clearly demonstrate spelling or casing mismatches (e.g. lowercase warnings).
    * **Status Badges:** Green for exact matches, red for mismatches, gold/yellow for manual reviews.
    * **Action Bar:** Large, sticky buttons at the bottom: "Approve Application", "Reject Application", "Flag for Manual Review".