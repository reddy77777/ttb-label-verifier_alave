# Compliance & Security Posture
**Author:** Vishnu Singhireddy

## 1. Architecture Rationale
* **No Cloud ML APIs:** To comply with the TTB's strict outbound firewall rules, this prototype utilizes 100% local/in-container inference. Even though the live demo is hosted on Google Cloud Run, it strictly uses the containerized Tesseract binaries and **does not** route data to Google Cloud Vision or any external AI endpoints.
* **Data Retention:** No PII or proprietary trade secrets from importer labels are written to persistent storage. All OCR extraction and matching occur in volatile memory and are purged post-transaction.

## 2. UI/UX Accessibility Compliance
* The interface conforms to Section 508 of the Rehabilitation Act, ensuring that federal employees of all technical backgrounds and visual abilities can operate the software without penalty to their processing times.