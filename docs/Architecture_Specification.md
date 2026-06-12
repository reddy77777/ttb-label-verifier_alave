# Architecture Specification: TTB Label Verification Prototype
**Author:** Vishnu Singhireddy

## 1. Tech Stack
* **Frontend:** Next.js (React), custom Vanilla CSS & Tailwind styling (eliminating NPM dependencies to guarantee complete offline execution), Firebase Hosting.
* **Backend:** Python 3.10+ with FastAPI. 
* **Containerization:** Docker (Ensuring 1:1 parity between local execution and Google Cloud Run).
* **AI/ML Engine (Local/In-Container Execution Only):**
* **OCR:** Tesseract OCR (via `pytesseract`) compiled directly into the Docker image.
* **Text Matching:** `TheFuzz` (token-set-ratio) for fuzzy matches; regex parsing, standardization of ABV/volumes, and casing checks for exact matches.
* **Storage:** In-memory `mock_db.json` on backend; client-side state durability using `sessionStorage` and global `fileCache` on frontend.


## 2. System Design & Data Flow
1.  **Authentication:** User lands on a mock SSO page.
2.  **Upload:** User uploads an image via a drag-and-drop zone.
3.  **Processing:** Frontend sends the image(s) and associated mock application JSON to the FastAPI backend container.
4.  **Extraction:** FastAPI uses the containerized Tesseract binaries to parse text. **NO OUTBOUND API CALLS ALLOWED.**
5.  **Comparison:** The engine compares OCR output against the application JSON using Dual-Matching Logic.
6.  **Response:** Backend returns a JSON payload with matched fields, mismatched fields, and confidence scores within 5 seconds.

## 3. Technical Challenges & Gotchas

### A. Detecting "BOLD" in Plain Text OCR
* **Challenge:** Standard Tesseract OCR returns plain text (`.txt`) which does not preserve font weight or styling (like Bold).
* **Mitigation:** The system will verify the exact character sequence and capitalization (`GOVERNMENT WARNING:`). A disclaimer must be included in the UI indicating that font-weight verification requires visual confirmation during the manual review step.

### B. Tesseract OCR Accuracy on Curved/Can Surfaces
* **Challenge:** Tesseract struggles with curved surfaces, glare, perspective distortion, and varied fonts.
* **Mitigation:** Implement a basic image preprocessing pipeline in the backend using OpenCV or PIL (grayscale conversion, binarization, and deskewing) before passing images to Tesseract.

### C. Normalizing Units (ABV & Net Contents)
* **Challenge:** Application data and OCR outputs may format ABV and volume units differently (e.g., `45% Alc./Vol.` vs `45% ABV`, or `750 mL` vs `750ml`).
* **Mitigation:** Implement Regex-based normalization utilities to extract and standardize numerical percentages and volume measurements prior to exact-match evaluation.