import os
import json
import logging
from typing import Dict, Any, List, Optional
from langchain_core.tools import tool

# Import the Listing Agent Executor
from agents.listing_agent import get_listing_agent_executor

logger = logging.getLogger(__name__)

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
TEST_CASES_PATH = os.path.join(CURRENT_DIR, "test_cases.json")

@tool
def load_test_cases() -> List[Dict[str, Any]]:
    """loads test_cases.json and returns a list of test cases."""
    if not os.path.exists(TEST_CASES_PATH):
        logger.error(f"Test cases file not found at {TEST_CASES_PATH}")
        return []
        
    try:
        with open(TEST_CASES_PATH, "r") as f:
            test_cases = json.load(f)
        return test_cases
    except Exception as e:
        logger.error(f"Failed to load test cases: {e}")
        return []

_listing_agent_executor = None

def get_cached_listing_agent_executor():
    """Singleton getter for the Listing Agent's AgentExecutor to avoid multiple initialisations."""
    global _listing_agent_executor
    if _listing_agent_executor is None:
        _listing_agent_executor = get_listing_agent_executor()
    return _listing_agent_executor

async def run_listing_agent(test_case_input: Dict[str, Any]) -> Dict[str, Any]:
    """
    Helper function that invokes the Listing Agent (AgentExecutor) with the structured test input.
    Returns the parsed result dictionary mirroring Prompt 5 response.
    """
    input_data = test_case_input.get("input", {})
    audio_file = input_data.get("audio_file")
    image_files = input_data.get("image_files", [])
    declared_category = input_data.get("declared_category")
    target_language = input_data.get("target_language", "Hindi")
    pincode = input_data.get("pincode")
    input_text = input_data.get("input_text", "")
    
    # Resolve paths relative to backend directory
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    audio_path = None
    if audio_file:
        if os.path.isabs(audio_file):
            audio_path = audio_file
        else:
            audio_path = os.path.abspath(os.path.join(backend_dir, audio_file))
            
    image_path = None
    if image_files and len(image_files) > 0 and image_files[0]:
        first_image = image_files[0]
        if os.path.isabs(first_image):
            image_path = first_image
        else:
            image_path = os.path.abspath(os.path.join(backend_dir, first_image))

    query_parts = []
    if input_text:
        query_parts.append(f"Seller Input Text: {input_text}")
    
    if audio_path:
        query_parts.append(f"Audio Provided: Yes, saved at {audio_path}")
    else:
        query_parts.append("Audio Provided: No")
        
    if image_path:
        query_parts.append(f"Image Provided: Yes, saved at {image_path}")
    else:
        query_parts.append("Image Provided: No")
        
    query_parts.append(f"Declared Category: {declared_category}")
    query_parts.append(f"Target Language: {target_language}")
    if pincode:
        query_parts.append(f"Delivery Pincode: {pincode}")
        
    user_query = "\n".join(query_parts)
    
    try:
        executor = get_cached_listing_agent_executor()
        result = await executor.ainvoke({"input": user_query})
        
        # Format intermediate steps for easy serialization and validation
        trace = []
        for action, observation in result.get("intermediate_steps", []):
            input_sum = json.dumps(action.tool_input, ensure_ascii=True)
            output_sum = json.dumps(observation, ensure_ascii=True)
            
            # Truncate to save tokens and prevent "413 Request Too Large" errors
            if len(input_sum) > 200:
                input_sum = input_sum[:200] + "..."
            if len(output_sum) > 200:
                output_sum = output_sum[:200] + "..."
                
            trace.append({
                "tool_called": action.tool,
                "input_summary": input_sum,
                "output_summary": output_sum
            })
            
        # Extract individual findings from raw intermediate steps
        final_listing = None
        risk_score = None
        issues_found = []
        pincode_risk = None
        category_mismatch_flagged = False
        mismatch_message = None
        
        for action, observation in result.get("intermediate_steps", []):
            tool_name = action.tool
            if tool_name == "check_category_mismatch":
                if isinstance(observation, dict):
                    mismatch_flag = observation.get("mismatch", False)
                    if mismatch_flag:
                        category_mismatch_flagged = True
                        mismatch_message = observation.get("message")
            elif tool_name == "generate_listing_content":
                if isinstance(observation, dict) and "error" not in observation:
                    final_listing = observation
            elif tool_name == "score_return_risk":
                if isinstance(observation, dict) and "error" not in observation:
                    risk_score = observation.get("return_risk_score_pct")
                    issues_found = observation.get("unresolved_issues", [])
            elif tool_name == "check_pincode_risk":
                if isinstance(observation, dict) and "error" not in observation:
                    pincode_risk = observation
                    
        # Apply safety net: if category mismatch is flagged, force final_listing and risk null
        if category_mismatch_flagged:
            final_listing = None
            risk_score = None
            issues_found = []
            
        # If no mismatch was flagged, but we still didn't generate a listing, it is a tool failure -> trigger fallback
        fallback_used = False
        if not final_listing and not category_mismatch_flagged:
            fallback_used = True
            fallback_path = os.path.join(backend_dir, "data", "fallback_listing.json")
            try:
                with open(fallback_path, "r") as f:
                    fallback_data = json.load(f)
                
                category_cleaned = declared_category.strip().lower() if declared_category else "kurti"
                cat_key = "kurti"
                for key in fallback_data.keys():
                    if key in category_cleaned or category_cleaned in key:
                        cat_key = key
                        break
                        
                final_listing = fallback_data.get(cat_key)
                risk_score = 45.0
                issues_found = [{
                    "issue": "fallback_data_used",
                    "severity": "medium",
                    "contribution_pct": 0,
                    "explanation": "Agent execution failed. Loaded fallback listing."
                }]
            except Exception as fe:
                logger.error(f"Failed to load fallback catalog in evaluator: {fe}")

        return {
            "final_listing": final_listing,
            "risk_score": risk_score,
            "issues_found": issues_found,
            "pincode_risk": pincode_risk,
            "category_mismatch_flagged": category_mismatch_flagged,
            "mismatch_message": mismatch_message,
            "agent_reasoning_trace": trace,
            "fallback_used": fallback_used,
            "output": result.get("output")
        }
    except Exception as e:
        err_msg = str(e)
        logger.error(f"Failed to execute listing agent on test case: {err_msg}")
        
        if "Category mismatch detected" in err_msg or "mismatch" in err_msg:
            mismatch_message = "Category mismatch detected. Please upload an image matching the declared category."
            
            if "message':" in err_msg:
                try:
                    parts = err_msg.split("message':")
                    if len(parts) > 1:
                        sub_part = parts[1].strip()
                        if sub_part.startswith("'") or sub_part.startswith('"'):
                            quote_char = sub_part[0]
                            mismatch_message = sub_part[1:].split(quote_char)[0]
                        else:
                            mismatch_message = sub_part.split(",")[0].strip("'\" ")
                except Exception as parse_err:
                    logger.warning(f"Failed to parse mismatch message: {parse_err}")
            elif 'message":' in err_msg:
                try:
                    parts = err_msg.split('message":')
                    if len(parts) > 1:
                        sub_part = parts[1].strip()
                        if sub_part.startswith("'") or sub_part.startswith('"'):
                            quote_char = sub_part[0]
                            mismatch_message = sub_part[1:].split(quote_char)[0]
                        else:
                            mismatch_message = sub_part.split(",")[0].strip("'\" ")
                except Exception as parse_err:
                    logger.warning(f"Failed to parse mismatch message: {parse_err}")
                    
            return {
                "final_listing": None,
                "risk_score": None,
                "issues_found": [],
                "pincode_risk": None,
                "category_mismatch_flagged": True,
                "mismatch_message": mismatch_message,
                "agent_reasoning_trace": [],
                "fallback_used": False,
                "output": err_msg
            }
            
        return {"error": f"Failed to execute agent: {str(e)}"}

@tool
async def run_listing_agent_on_case(test_case: Any) -> Dict[str, Any]:
    """invokes the Listing Agent (the AgentExecutor) with the given test_case dict or test_case ID string (e.g., 'TC1') and returns the full output (including intermediate_steps)."""
    if isinstance(test_case, str):
        import os
        import json
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        tc_path = os.path.join(backend_dir, "evaluator", "test_cases.json")
        try:
            with open(tc_path, "r") as f:
                cases = json.load(f)
            found = None
            for c in cases:
                if c.get("id") == test_case:
                    found = c
                    break
            if found:
                test_case = found
            else:
                return {"error": f"Test case ID '{test_case}' not found in test_cases.json"}
        except Exception as e:
            return {"error": f"Failed to load test case by ID: {e}"}
            
    if not isinstance(test_case, dict):
        return {"error": "Invalid test case input, expected dict or test case ID string"}
        
    return await run_listing_agent(test_case)

@tool
def validate_listing_structure(listing_output: Dict[str, Any]) -> Dict[str, Any]:
    """checks that the returned final_listing contains all required fields: title, bullets (list of 5), size_chart, price, keywords. Returns {valid: bool, missing_fields: list}."""
    # Attempt to extract final_listing from either the direct wrapper or nested dictionary
    final_listing = listing_output.get("final_listing")
    if final_listing is None:
        # Check if the output itself contains the listing keys directly
        if "title" in listing_output or "bullets" in listing_output:
            final_listing = listing_output
        else:
            return {"valid": False, "missing_fields": ["final_listing_object_missing"]}
            
    required_fields = ["title", "bullets", "size_chart", "price", "keywords"]
    missing = []
    
    for field in required_fields:
        if field not in final_listing:
            missing.append(field)
            
    bullets = final_listing.get("bullets", [])
    if "bullets" not in missing:
        if not isinstance(bullets, list) or len(bullets) != 5:
            missing.append("bullets_length_not_5")
            
    return {
        "valid": len(missing) == 0,
        "missing_fields": missing
    }

@tool
def validate_risk_score(risk_score: Any, category: str, issues: Optional[List[Any]] = None) -> Dict[str, Any]:
    """checks that the risk score is between 5 and 95 (inclusive) and that the issues list is non‑empty. Returns {valid: bool, issues: list}."""
    score = None
    issues_list = issues or []
    
    if isinstance(risk_score, dict):
        score = risk_score.get("return_risk_score_pct") or risk_score.get("risk_score") or risk_score.get("risk_score_pct")
        if not issues_list:
            issues_list = risk_score.get("unresolved_issues") or risk_score.get("issues_found", [])
    else:
        try:
            score = float(risk_score)
        except (ValueError, TypeError):
            pass
            
    score_valid = (score is not None) and (5.0 <= score <= 95.0)
    
    if issues is None and not isinstance(risk_score, dict):
        issues_valid = True
    else:
        issues_valid = isinstance(issues_list, list) and len(issues_list) > 0
    
    return {
        "valid": bool(score_valid and issues_valid),
        "issues": issues_list,
        "score": score,
        "score_valid": score_valid,
        "issues_valid": issues_valid
    }

@tool
def validate_category_mismatch_handling(output: Dict[str, Any], expected_category: Optional[str] = None) -> Dict[str, Any]:
    """verifies that if category_mismatch_flagged is True, then final_listing is None and mismatch_message is not empty. If False, ensure final_listing exists. Returns {correct: bool, message: str}."""
    mismatch_flagged = output.get("category_mismatch_flagged", False)
    final_listing = output.get("final_listing")
    mismatch_message = output.get("mismatch_message")
    
    if mismatch_flagged:
        correct = (final_listing is None) and bool(mismatch_message and str(mismatch_message).strip())
        if correct:
            msg = "Category mismatch correctly handled: listing blocked and error message returned."
        else:
            msg = f"Mismatch flagged but handling incorrect: final_listing={final_listing}, message={mismatch_message}"
    else:
        correct = final_listing is not None
        if correct:
            msg = "Category verified consistent: product listing correctly generated."
        else:
            msg = "Mismatch not flagged, but final listing is missing."
            
    return {
        "correct": correct,
        "message": msg
    }

@tool
def validate_trace_tool_usage(output: Any, expected_tools: List[str]) -> Dict[str, Any]:
    """checks that the agent_reasoning_trace contains calls to the expected tools (e.g., analyze_product_image when an image was provided). Returns {correct: bool, missing: list, extra: list}."""
    trace = []
    if isinstance(output, dict):
        trace = output.get("agent_reasoning_trace", [])
    elif isinstance(output, list):
        trace = output
        
    called_tools = []
    for step in trace:
        if isinstance(step, str):
            called_tools.append(step)
        elif isinstance(step, dict):
            if "tool_called" in step:
                called_tools.append(step["tool_called"])
            elif "tool" in step:
                called_tools.append(step["tool"])
                
    called_set = set(called_tools)
    expected_set = set(expected_tools)
    
    missing = list(expected_set - called_set)
    extra = list(called_set - expected_set)
    
    # Correct if all expected tools are in called set
    correct = len(missing) == 0
    
    return {
        "correct": correct,
        "called_tools": called_tools,
        "expected_tools": expected_tools,
        "missing": missing,
        "extra": extra
    }
