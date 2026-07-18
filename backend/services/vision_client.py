import os
import json
import logging
import base64
import cv2
import numpy as np
from typing import Dict, Any
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage

logger = logging.getLogger(__name__)

class VisionError(Exception):
    """Custom exception raised when vision processing or classification fails."""
    pass

def _parse_json(text: str) -> dict:
    """Helper function to strip markdown code fences and load content as JSON."""
    text = text.strip()
    
    # Strip markdown code fences if present
    if text.startswith("```"):
        lines = text.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()
        
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Fallback: find the first '{' and last '}'
        start_idx = text.find("{")
        end_idx = text.rfind("}")
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            try:
                return json.loads(text[start_idx:end_idx+1])
            except json.JSONDecodeError as e:
                raise ValueError(f"Extracted block was not valid JSON: {e}") from e
        raise ValueError("Could not find a valid JSON object block in the LLM response.")

async def analyze_image(image_bytes: bytes) -> Dict[str, Any]:
    """
    Analyzes a product image using Groq's vision model (llama-3.2-11b-vision-preview) to retrieve metadata.
    Implements a 15-second timeout and a single-retry parsing logic on failure.
    
    Returns a dict with:
        detected_category: plain guess like "kurti", "saree", "footwear", etc.
        angle_detected: camera angle (e.g. front, side, flat-lay).
        background_quality: background rating (e.g. clean, cluttered).
        lighting_quality: lighting rating (e.g. good, overexposed).
        issues: list of visual issues.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise VisionError("GROQ_API_KEY environment variable is not set")
    
    try:
        llm = ChatGroq(
            model="llama-3.2-11b-vision-preview",
            groq_api_key=api_key,
            timeout=15.0,
            temperature=0.0,
            max_retries=0
        )
    except Exception as e:
        raise VisionError(f"Failed to initialize ChatGroq with llama-3.2-11b-vision-preview: {e}") from e

    # Simple mime-type detection
    mime_type = "image/jpeg"
    if image_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        mime_type = "image/png"
    elif image_bytes.startswith(b"GIF87a") or image_bytes.startswith(b"GIF89a"):
        mime_type = "image/gif"
    elif image_bytes.startswith(b"RIFF") and image_bytes[8:12] == b"WEBP":
        mime_type = "image/webp"

    base64_image = base64.b64encode(image_bytes).decode("utf-8")
    
    prompt = (
        "Analyze the product image and return a JSON object with the following fields:\n"
        "1. 'detected_category': A single-word/plain guess of the product type (e.g., 'kurti', 'saree', 'footwear', 't-shirt', 'sari', 'dress', 'jeans', etc.) based on what's visible.\n"
        "2. 'angle_detected': Camera angle (e.g., 'front', 'back', 'side', 'detail', 'flat-lay').\n"
        "3. 'background_quality': Quality of the background (e.g., 'clean', 'cluttered', 'noisy', 'distracting').\n"
        "4. 'lighting_quality': Quality of the lighting (e.g., 'good', 'shadowy', 'overexposed', 'underexposed').\n"
        "5. 'issues': A JSON list of any detected quality issues (e.g., ['wrinkles', 'reflection', 'poor focus'], or empty list if none).\n\n"
        "Ensure the response is ONLY a valid JSON object matching the requested schema."
    )
    
    # First attempt content blocks
    full_prompt = f"{prompt}\n\nOutput ONLY valid JSON, no other text."
    message = HumanMessage(
        content=[
            {"type": "text", "text": full_prompt},
            {
                "type": "image_url",
                "image_url": {"url": f"data:{mime_type};base64,{base64_image}"},
            },
        ]
    )
    
    try:
        response = await llm.ainvoke([message])
        content = str(response.content)
        return _parse_json(content)
    except Exception as first_error:
        logger.warning(f"First multimodal LLM attempt failed: {first_error}. Retrying with stricter constraints...")
        
        # Second attempt content blocks (stricter prompt)
        stricter_prompt = (
            f"{prompt}\n\n"
            "CRITICAL: You must return ONLY a raw JSON object. Do not include markdown code fences (like ```json ... ```), "
            "preamble, markdown formatting, or explanation. The response must start with '{' and end with '}' and be valid parseable JSON."
        )
        message_retry = HumanMessage(
            content=[
                {"type": "text", "text": stricter_prompt},
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:{mime_type};base64,{base64_image}"},
                },
            ]
        )
        try:
            response = await llm.ainvoke([message_retry])
            content = str(response.content)
            return _parse_json(content)
        except Exception as second_error:
            raise VisionError(
                f"Multimodal LLM generation failed after retry. "
                f"First error: {first_error}. Second error: {second_error}"
            ) from second_error

def blur_score(image_bytes: bytes) -> Dict[str, Any]:
    """
    Calculates the blur score of an image locally using OpenCV's Laplacian variance.
    
    Threshold is 100:
        score >= 100: Not blurry
        score < 100: Blurry
        
    Returns:
        dict: {'score': float, 'is_blurry': bool}
    """
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
        if img is None:
            raise VisionError("Failed to decode image. Invalid image bytes.")
        
        # Compute Laplacian variance
        val = cv2.Laplacian(img, cv2.CV_64F).var()
        is_blurry = val < 100.0
        
        return {
            "score": float(val),
            "is_blurry": bool(is_blurry)
        }
    except Exception as e:
        if not isinstance(e, VisionError):
            raise VisionError(f"Failed to process blur score: {e}") from e
        raise
