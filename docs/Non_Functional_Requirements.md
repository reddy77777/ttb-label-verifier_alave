# Non-Functional Requirements

## 1. Performance
* **Latency:** Processing a single label must take strictly less than 5 seconds. Optimize the OCR parameters to prioritize speed over exhaustive deep-learning extraction if necessary.

## 2. Security & Network
* **Air-Gapped Operation:** The application must function entirely offline once dependencies are installed. Do not use OpenAI, Google Vision, or AWS Textract APIs.
* **Ephemeral Data:** Uploaded images and parsed data must not be permanently written to disk. Use temporary memory blocks that clear upon session reset.

## 3. Accessibility & UX
* **Demographic Target:** UI must be designed for users with low technical literacy (ages 50-70+). 
* **Standards:** WCAG 2.1 AA compliant. Minimum font size of 16px for data fields. High contrast ratios (black text on white/gray backgrounds). No hidden menus, no hover-only interactions.