# Deployment & Hosting Specification
**Author:** Vishnu Singhireddy

## 1. Dual Deployment Strategy
To satisfy the take-home project's conflicting requirements (a live accessible URL vs. strict local government firewall compliance), the deployment is split into two paradigms. It utilizes the Google Cloud Platform (GCP) ecosystem for the live demonstration to reflect an enterprise-grade cloud architecture.

### A. Evaluator Demo Deployment (Google Cloud)
* **Frontend (Next.js):** Deployed via Firebase Hosting. Firebase natively supports Next.js static exports and SSR. It connects to the backend via a configurable environment variable `NEXT_PUBLIC_API_URL`.
* **Backend (FastAPI + OCR):** Deployed via Google Cloud Run. 
    * **Implementation Detail:** Standard serverless functions (like Firebase Functions) often fail or require complex workarounds when running local OS binaries like Tesseract. Therefore, the backend must be deployed to Cloud Run using the exact same Docker container specified for the production environment. This ensures 1:1 parity between the demo and the final local build.
* **Constraint:** The live demo is strictly for evaluation access. The `README.md` must clearly state that this cloud deployment is for demonstration only, and that the core architecture is designed for the air-gapped production environment.

### B. Production Deployment (Local/Air-Gapped)
* **Containerization:** The entire application must be wrapped in a `docker-compose.yml` file.
* **Services:**
    * `web`: Next.js static export or standalone Node server.
    * `api`: FastAPI server with Tesseract binaries pre-installed in the Docker image.
* **Network Constraint:** The production Docker container must be configured to block all outbound external network requests to guarantee compliance with TTB IT security policies.

## 2. Environment Variables
* Ensure a `.env.example` is provided.
* **Strict Rule:** No secret keys for external AI APIs (OpenAI, Anthropic, Google Vision) are permitted in the environment setup.

## 3. Live Deployed Instances
For demonstration and evaluation, the prototype is active at the following endpoints:
* **Frontend App:** [https://alave-verifier.web.app](https://alave-verifier.web.app) (Firebase Hosting)
* **Backend API:** [https://ttb-verifier-api-896301636762.us-central1.run.app](https://ttb-verifier-api-896301636762.us-central1.run.app) (Cloud Run)