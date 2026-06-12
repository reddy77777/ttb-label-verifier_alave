# TTB Alcohol Label Verification Portal (ALAVE)

An enterprise-grade, high-compliance prototype designed for the **Alcohol and Tobacco Tax and Trade Bureau (TTB)** to automate routine data-entry verification of label applications. This application is designed to verify critical label fields against application data while strictly conforming to federal security guidelines and air-gapped network restrictions.

---

## 🚀 Local Run Instructions (Production Parity)

To run the entire system locally inside a secure, air-gapped containerized network:

### Prerequisites
* [Docker](https://www.docker.com/) (Ensure the Docker Desktop/Daemon is running)
* [Docker Compose](https://docs.docker.com/compose/)

### Execution
1. Navigate to the root directory of the project.
2. Run the following command:
   ```bash
   docker-compose up --build
   ```
3. Once running, access the services:
   * **Frontend Application:** [http://localhost:3000](http://localhost:3000)
   * **Backend API Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)

*Note: The containers execute inside an isolated private bridge network (`internal: true`) with no outbound external network access, fully simulating the TTB firewall.*

---

## 🧪 Step-by-Step Verification & Testing Guide

This guide describes how to run a complete end-to-end audit using the included test label images.

### Step 1: Access the Portal & Log In
1. Navigate to the live deployment URL: **[https://alave-verifier.web.app](https://alave-verifier.web.app)**
   *(Or, if running locally, start the containers with `docker-compose up --build` and navigate to [http://localhost:3000](http://localhost:3000)).*
2. On the Government SSO Sign-in screen:
   * **Federal Email Address**: Enter agent@ttb.gov
   * **SSO Password**: password
   * **Terms of Access**: Check the box acknowledging the U.S. Government warning banner.
3. Click **Authenticate & Enter**.

### Step 2: Dashboard & Batch Uploading
1. Once logged in, you will see a list of active TTB applications:
   * `TTB-2024-001` (Old Tom Distillery Bourbon)
   * `TTB-2024-002` (Stone's Throw IPA)
   * `TTB-2024-003` (Château de Valois Wine)
2. Drag and drop (or click to upload) the test images from the [test_labels/] directory into the file uploader at the top of the dashboard.
3. The matching engine will automatically associate each label image with its corresponding database application using the filename prefix (e.g., `TTB-2024-001_perfect.png` maps to application `TTB-2024-001`).

### Step 3: Run the Test Pack Scenarios

Test the compliance engine with these 5 scenarios from the [test_labels/] folder:

| Test Case | Label Image | Expected Result | Why? |
| :--- | :--- | :--- | :--- |
| **1. Perfect Match** | `TTB-2024-001_perfect.png` | **Compliant** (Green) | Extracted text matches database expected values exactly. |
| **2. ABV Mismatch** | `TTB-2024-001_mismatch_abv.png` | **Non-Compliant** (Red) | Label has **40% ALC/VOL** but database expects **45% Alc./Vol. (90 Proof)**. |
| **3. Government Warning Casing** | `TTB-2024-001_mismatch_warning_case.png` | **Non-Compliant** (Red) | Label text uses `"Government warning:"` prefix, failing strict TTB policy requiring `"GOVERNMENT WARNING:"` in ALL CAPS. |
| **4. Fuzzy String Matching** | `TTB-2024-002_fuzzy_match.png` | **Compliant** (Green with Fuzzy Tag) | Gracefully matches lowercase/capitalization variations (`STONE'S THROW` vs `Stone's Throw`). |
| **5. Perfect Match (Wine)** | `TTB-2024-003_perfect.png` | **Compliant** (Green) | Extracted wine label fields match database values exactly. |

### Step 4: Reviewing Discrepancies & Overrides
1. Click on any row in the applications table to open the split-screen audit view.
2. Review the **Expected (Database)** vs. **Extracted (Label OCR)** comparison matrix. Casing warnings and unit mismatches are highlighted in yellow/red.
3. If a scan was imperfect, you can perform a **Manual Audit Override**:
   * Change the compliance status using the status toggle at the bottom of the audit pane.
   * Add comments in the **Audit Notes** text field (e.g., *"Manually verified ABV matches database despite OCR resolution error"*).
   * Click **Submit Audit Decision** to persist the decision in browser state.

---

## 💻 Local Testing Suite (Automated API Tests)

The backend contains a test suite verifying fuzzy string matching, ABV/volume unit normalizations, and strict warning text checks.

To run the tests locally on your host machine:

1. Setup virtual environment:
   ```bash
   python3 -m venv backend/.venv
   source backend/.venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
3. Run `pytest`:
   ```bash
   PYTHONPATH=backend pytest backend/tests
   ```


---

## ☁️ Live Google Cloud Platform (GCP) Deployment

The prototype is deployed live on Google Cloud Platform and Firebase under project `digitaldesk-288402`:

* **🌐 Live Frontend Client:** [https://alave-verifier.web.app](https://alave-verifier.web.app) *(Firebase Hosting)*
* **⚡ Live Backend API:** [https://ttb-verifier-api-896301636762.us-central1.run.app](https://ttb-verifier-api-896301636762.us-central1.run.app) *(Cloud Run)*
* **📖 Live Swagger Documentation:** [https://ttb-verifier-api-896301636762.us-central1.run.app/docs](https://ttb-verifier-api-896301636762.us-central1.run.app/docs)

### A. Backend Container Deployment (Cloud Run)
The backend container is cross-compiled locally for the `linux/amd64` architecture (required by Cloud Run) and hosted on Artifact Registry:
1. Configure credentials helper for Artifact Registry:
   ```bash
   gcloud auth configure-docker us-central1-docker.pkg.dev
   ```
2. Build the image locally for `amd64` platform:
   ```bash
   docker build --platform linux/amd64 -t us-central1-docker.pkg.dev/digitaldesk-288402/ttb-verifier-repo/api:latest ./backend
   ```
3. Push to Artifact Registry:
   ```bash
   docker push us-central1-docker.pkg.dev/digitaldesk-288402/ttb-verifier-repo/api:latest
   ```
4. Deploy container to Google Cloud Run:
   ```bash
   gcloud run deploy ttb-verifier-api \
     --image us-central1-docker.pkg.dev/digitaldesk-288402/ttb-verifier-repo/api:latest \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --port 8000
   ```

### B. Frontend Deployment (Firebase Hosting)
Next.js client compiled as static export and deployed to the custom target site:
1. Configure environment file `frontend/.env.production` pointing to the deployed Cloud Run API:
   ```env
   NEXT_PUBLIC_API_URL=https://ttb-verifier-api-896301636762.us-central1.run.app
   ```
2. Build the project:
   ```bash
   cd frontend
   npm run build
   ```
3. Initialize and deploy:
   ```bash
   npx firebase-tools projects:addfirebase digitaldesk-288402
   npx firebase-tools hosting:sites:create alave-verifier
   npx firebase-tools deploy --only hosting
   ```


---

## 🛡️ Key Architectural & Design Decisions

### 1. 100% Offline/Air-Gapped OCR
To prevent government outbound firewall blocks (encountered in previous vendor pilots), we use **Tesseract OCR** compiled directly into the backend Docker image. The backend makes **no external API calls** during inference.

### 2. High-UX Matching Engine
* **Fuzzy Matcher:** Uses `thefuzz` (token-set-ratio) for Brand Name, Class/Type, and Bottler information to handle casing, punctuation, and ordering variances gracefully (e.g. matching `"STONE'S THROW"` to `"Stone's Throw"`).
* **Exact Matcher:** Implements custom regex parsing to extract and standardize ABV/volumes (e.g. normalizing `"45% Alc./Vol. (90 Proof)"` and `"90 Proof"` to `45.0` to allow strict matching).
* **Warning Text Matcher:** Normalizes whitespace while strictly enforcing casing and verifying that the prefix `GOVERNMENT WARNING:` is in ALL CAPS.

### 3. Accessible "Enterprise Government" UI
The UI is styled with high-contrast neutral slate/navy colors (WCAG 2.1 AA compliant) and minimum $16\text{px}$ font sizes for legibility. It features an SSO dummy credentials screen, batch upload grid with automatic application ID matching, and a split-screen compliance diff viewer.
