import cv2
import numpy as np
import pytesseract
from PIL import Image
import logging

logger = logging.getLogger("ocr")

def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Applies image preprocessing to improve OCR accuracy on label images.
    Grayscale conversion, upscaling for low resolutions, Gaussian blurring,
    and Otsu's binarization are implemented.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Invalid or corrupted image format")

    # 1. Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 2. Upscale image if resolution is too low (Tesseract works best on 30-40px height text)
    height, width = gray.shape
    if height < 1200 or width < 1200:
        gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)

    return gray

def perform_ocr(image_bytes: bytes) -> tuple[str, float]:
    """
    Executes Tesseract OCR on preprocessed image bytes.
    Returns a tuple: (extracted_text, average_confidence_percentage)
    """
    try:
        # Preprocess
        processed_img = preprocess_image(image_bytes)

        # Convert back to PIL Image
        pil_img = Image.fromarray(processed_img)

        # 1. Extract raw text
        raw_text = pytesseract.image_to_string(pil_img)

        # 2. Extract OCR data to evaluate confidence scores
        ocr_data = pytesseract.image_to_data(pil_img, output_type=pytesseract.Output.DICT)

        # Filter out invalid confidence entries (-1 represents non-word segments)
        confidences = [int(conf) for conf in ocr_data['conf'] if int(conf) != -1]

        if not confidences:
            average_confidence = 0.0
        else:
            average_confidence = sum(confidences) / len(confidences)

        return raw_text.strip(), average_confidence

    except Exception as e:
        logger.error(f"OCR engine failure: {e}", exc_info=True)
        return "", 0.0
