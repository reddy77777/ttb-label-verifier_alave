# TTB Label Compliance Verification Engine (Prototype)
**Author:** Vishnu Singhireddy

## Overview
This repository contains a proof-of-concept application designed to automate the routine data-entry verification of TTB alcohol label applications. It allows compliance agents to batch-upload labels and instantly verify critical fields against application data, freeing them to focus on nuanced edge cases.

## Addressing Stakeholder Needs
* **Sub-5-Second Processing:** By utilizing optimized in-container OCR rather than heavy cloud ML models, the system returns results rapidly.
* **Firewall & Security:** This application is designed to be completely air-gapped. It does not rely on external AI APIs. 
* **Fuzzy vs. Exact Matching:** The backend employs semantic matching for brand names while strictly enforcing exact word-for-word and capitalization matching for the Government Warning.
* **Batch Processing:** Users can drag and drop up to 50 labels at once for rapid queue processing.

## Evaluator Live Demo
To satisfy the evaluation requirement for a deployed application, a live prototype is hosted in GCP project `digitaldesk-288402`:
* **🌐 Live Frontend Client:** [https://alave-verifier.web.app](https://alave-verifier.web.app) *(Firebase Hosting)*
* **⚡ Live Backend API:** [https://ttb-verifier-api-896301636762.us-central1.run.app](https://ttb-verifier-api-896301636762.us-central1.run.app) *(Cloud Run)*
* **📖 Live Swagger Documentation:** [https://ttb-verifier-api-896301636762.us-central1.run.app/docs](https://ttb-verifier-api-896301636762.us-central1.run.app/docs)
* *Note on Compliance:* Cloud Run is executing the exact same isolated Docker container provided for the local production build, ensuring strict 1:1 parity with the air-gapped system.


## Local Setup Instructions (Production Parity)
1.  Clone this repository.
2.  Ensure Docker and Docker Compose are installed on your machine.
3.  Run `docker-compose up --build`. This will spin up both the Next.js frontend and the FastAPI backend with all required system-level OCR binaries completely isolated from your host machine network.