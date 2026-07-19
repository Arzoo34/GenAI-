import os
import json
import logging
import asyncio
import uuid
from typing import Optional, List
from fastapi import APIRouter, Form, File, UploadFile, HTTPException
from models.schemas import ListingAgentResponse, ListingContent, PincodeRiskResponse, AgentTraceStep, PincodeRiskBatchItem
from agents.listing_agent import get_listing_agent_executor

router = APIRouter(prefix="/api/listing", tags=["listing"])
logger = logging.getLogger(__name__)

@router.post("/run-agent", response_model=ListingAgentResponse)
async def run_listing_agent(
    declared_category: str = Form(...),
    target_language: str = Form(...),
    pincode: Optional[str] = Form(None),
    audio: Optional[UploadFile] = File(None),
    images: Optional[List[UploadFile]] = File(None),
    product_name: Optional[str] = Form(None),
    material: Optional[str] = Form(None),
    colour: Optional[str] = Form(None),
    sleeve: Optional[str] = Form(None),
    occasion: Optional[str] = Form(None),
    sizes: Optional[str] = Form(None),
    description: Optional[str] = Form(None)
):
    """
    Exposes the Listing Agent workflow.
    Accepts form fields and optional media uploads (audio/images).
    """
    # Create temp workspace directory for processing uploads
    temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "temp")
    os.makedirs(temp_dir, exist_ok=True)
    
    audio_path = None
    image_path = None
    
    try:
        # Save temporary files if provided
        if audio and audio.filename:
            audio_ext = os.path.splitext(audio.filename)[1] or ".wav"
            audio_path = os.path.join(temp_dir, f"audio_{uuid.uuid4().hex}{audio_ext}")
            with open(audio_path, "wb") as f:
                f.write(await audio.read())
                
        if images and len(images) > 0 and images[0].filename:
            # We process the primary uploaded image
            image_ext = os.path.splitext(images[0].filename)[1] or ".jpg"
            image_path = os.path.join(temp_dir, f"image_{uuid.uuid4().hex}{image_ext}")
            with open(image_path, "wb") as f:
                f.write(await images[0].read())
                
        # Construct the execution prompt for the AgentExecutor
        query_parts = []
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
        if product_name:
            query_parts.append(f"Seller Entered Product Name: {product_name}")
        if material:
            query_parts.append(f"Seller Entered Material: {material}")
        if colour:
            query_parts.append(f"Seller Entered Colour: {colour}")
        if sleeve:
            query_parts.append(f"Seller Entered Sleeve: {sleeve}")
        if occasion:
            query_parts.append(f"Seller Entered Occasion: {occasion}")
        if sizes:
            query_parts.append(f"Seller Entered Available Sizes: {sizes}")
        if description:
            query_parts.append(f"Seller Entered Description: {description}")
            
        user_query = "\n".join(query_parts)
        
        # Initialize default values
        final_listing = None
        risk_score = None
        issues_found = []
        pincode_risk = None
        category_mismatch_flagged = False
        mismatch_message = None
        agent_reasoning_trace = []
        fallback_used = False
        
        agent_failed = False
        
        try:
            executor = get_listing_agent_executor()
            # Enforce 30s timeout on agent run
            result = await asyncio.wait_for(executor.ainvoke({"input": user_query}), timeout=30.0)
            
            # Inspect intermediate_steps to gather tool outputs
            for action, observation in result.get("intermediate_steps", []):
                tool_name = action.tool
                
                # Format arguments and outputs for trace representation
                agent_reasoning_trace.append(AgentTraceStep(
                    tool_called=tool_name,
                    input_summary=json.dumps(action.tool_input, ensure_ascii=True),
                    output_summary=json.dumps(observation, ensure_ascii=True)
                ))
                
                # Check for category mismatch hard flags
                if tool_name == "check_category_mismatch":
                    if isinstance(observation, dict):
                        mismatch_flag = observation.get("mismatch", False)
                        if mismatch_flag:
                            category_mismatch_flagged = True
                            mismatch_message = observation.get("message", "Category mismatch detected.")
                            
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
                
            # If no mismatch was flagged, but we still didn't generate a listing, it is a tool failure
            if not final_listing and not category_mismatch_flagged:
                agent_failed = True
                
        except (asyncio.TimeoutError, Exception) as e:
            err_msg = str(e)
            logger.error(f"Agent execution failed or timed out: {err_msg}")
            
            if "Category mismatch detected" in err_msg or "mismatch" in err_msg:
                category_mismatch_flagged = True
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
                
                agent_failed = False
            else:
                agent_failed = True
            
        # Trigger fallback catalog recovery if the agent failed to yield listing details
        if agent_failed:
            fallback_used = True
            data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
            fallback_path = os.path.join(data_dir, "fallback_listing.json")
            
            try:
                with open(fallback_path, "r") as f:
                    fallback_data = json.load(f)
                
                category_cleaned = declared_category.strip().lower()
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
                    "explanation": "Listing Agent execution failed. Loaded fallback listing."
                }]
            except Exception as fe:
                logger.error(f"Failed to load fallback catalog: {fe}")
                raise HTTPException(status_code=500, detail="Internal server error: Fallback catalog missing.")
                
        return {
            "final_listing": final_listing,
            "risk_score": risk_score,
            "issues_found": issues_found,
            "pincode_risk": pincode_risk,
            "category_mismatch_flagged": category_mismatch_flagged,
            "mismatch_message": mismatch_message,
            "agent_reasoning_trace": agent_reasoning_trace,
            "fallback_used": fallback_used
        }
        
    finally:
        # Cleanup file attachments immediately to conserve storage
        if audio_path and os.path.exists(audio_path):
            try:
                os.remove(audio_path)
            except Exception as ce:
                logger.error(f"Failed to delete temp audio file: {ce}")
        if image_path and os.path.exists(image_path):
            try:
                os.remove(image_path)
            except Exception as ce:
                logger.error(f"Failed to delete temp image file: {ce}")

@router.post("/pincode-risk-batch", response_model=List[PincodeRiskBatchItem])
async def check_pincode_risk_batch(inputs: List[str]):
    """
    Evaluates risk for a batch of pincodes or city names.
    Performs fuzzy matching for city names and exact matching for pincodes.
    """
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
    pincode_path = os.path.join(data_dir, "pincode_risk.json")
    
    try:
        with open(pincode_path, "r") as f:
            data = json.load(f)
        pincode_risks = data.get("pincode_risks", [])
    except Exception as e:
        logger.error(f"Failed to load pincode risks data: {e}")
        raise HTTPException(status_code=500, detail="Pincode risk configuration error.")

    results = []
    for input_item in inputs:
        cleaned_input = input_item.strip().lower()
        matched_entry = None

        # Try matching by pincode first
        for entry in pincode_risks:
            if entry.get("pincode") == input_item.strip():
                matched_entry = entry
                break
        
        # Try matching by fuzzy city_name second
        if not matched_entry and cleaned_input:
            for entry in pincode_risks:
                city = entry.get("city_name", "").lower()
                if cleaned_input in city or city in cleaned_input:
                    matched_entry = entry
                    break

        # State names are also supported by the expanded illustrative dataset.
        # This lets sellers add a whole delivery state (e.g. "Uttarakhand")
        # without silently dropping a marker in the centre of India.
        if not matched_entry and cleaned_input:
            for entry in pincode_risks:
                state = entry.get("state_name", "").lower()
                if state and (cleaned_input == state or cleaned_input in state or state in cleaned_input):
                    matched_entry = entry
                    break

        if matched_entry:
            risk = matched_entry.get("risk_level", "medium")
            est_rate = matched_entry.get("estimated_return_rate_pct", 15.0)
            
            # Formulate recommendation
            if risk == "low":
                recommendation = "Safe zone. Low return rates expected."
            elif risk == "medium":
                recommendation = "Moderate return risk. Standard logistics guidelines apply."
            else:
                recommendation = "High return risk! Consider disabling COD or verifying the order via call."

            results.append(PincodeRiskBatchItem(
                input=input_item,
                matched_city=matched_entry.get("city_name", "Unknown"),
                latitude=matched_entry.get("latitude", 22.9734),
                longitude=matched_entry.get("longitude", 78.6569),
                risk_level=risk,
                estimated_return_rate=est_rate,
                recommendation=recommendation
            ))
        else:
            # Fallback
            results.append(PincodeRiskBatchItem(
                input=input_item,
                matched_city=f"Unmapped: {input_item}",
                latitude=0,
                longitude=0,
                risk_level="medium",
                estimated_return_rate=15.0,
                recommendation="General caution advised. Monitor order closely."
            ))

    return results
