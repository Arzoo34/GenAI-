import os
import json
import logging
from typing import Dict, Any
from langchain_groq import ChatGroq

logger = logging.getLogger(__name__)

class LLMError(Exception):
    """Custom exception raised when LLM generation or parsing fails."""
    pass

def _parse_json(text: str) -> dict:
    """Helper function to parse JSON by balancing open and close braces to isolate the JSON object."""
    text = text.strip()
    
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
        
    start_idx = text.find("{")
    if start_idx == -1:
        raise ValueError("Could not find a valid JSON object block in the LLM response.")
        
    balance = 0
    end_idx = -1
    for i in range(start_idx, len(text)):
        char = text[i]
        if char == "{":
            balance += 1
        elif char == "}":
            balance -= 1
            if balance == 0:
                end_idx = i
                break
                
    if end_idx != -1:
        try:
            return json.loads(text[start_idx:end_idx+1])
        except json.JSONDecodeError as e:
            raise ValueError(f"Extracted balanced block was not valid JSON: {e}") from e
            
    raise ValueError("Could not find a balanced JSON object block in the LLM response.")

async def generate_structured(prompt: str, target_language: str) -> Dict[str, Any]:
    """
    Generates a structured JSON response from Groq, guaranteeing formatting in the target language.
    Retries once with a stricter instruction if JSON parsing fails.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise LLMError("GROQ_API_KEY environment variable is not set")
    
    try:
        llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            groq_api_key=api_key,
            timeout=15.0,
            temperature=0.0,
            max_retries=0
        )
    except Exception as e:
        raise LLMError(f"Failed to initialize ChatGroq with llama-3.3-70b-versatile: {e}") from e

    # First attempt prompt
    full_prompt = f"{prompt}\n\nRespond entirely in {target_language} using native script, output ONLY valid JSON, no other text"
    
    try:
        response = await llm.ainvoke(full_prompt)
        content = str(response.content)
        return _parse_json(content)
    except Exception as first_error:
        logger.warning(f"First structured LLM attempt failed: {first_error}. Retrying with stricter constraints...")
        
        # Second attempt prompt (stricter instruction)
        stricter_prompt = (
            f"{prompt}\n\nRespond entirely in {target_language} using native script.\n"
            "CRITICAL: You must return ONLY a raw JSON object. Do not include markdown code fences (like ```json ... ```), "
            "preamble, markdown formatting, or explanation. The response must start with '{' and end with '}' and be valid parseable JSON."
        )
        try:
            response = await llm.ainvoke(stricter_prompt)
            content = str(response.content)
            return _parse_json(content)
        except Exception as second_error:
            raise LLMError(
                f"LLM generation failed after retry. "
                f"First error: {first_error}. Second error: {second_error}"
            ) from second_error
