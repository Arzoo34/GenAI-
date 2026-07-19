import os
import json
import logging
import base64
from typing import Dict, Any, List
from langchain_core.tools import tool

# Services imports
from services.sarvam_client import transcribe
from services.vision_client import analyze_image, blur_score
from services.llm_client import generate_structured

logger = logging.getLogger(__name__)

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(CURRENT_DIR, "..", "data")

def normalize_path(path_str: str) -> str:
    """Normalizes the file path to prevent LLM autocorrect failures (e.g. sciptedbyher -> scriptedbyher)."""
    if not path_str:
        return path_str
    # Swap out LLM's autocorrected scriptedbyher with the actual sciptedbyher folder name
    if "scriptedbyher" in path_str:
        path_str = path_str.replace("scriptedbyher", "sciptedbyher")
    return path_str

@tool
async def transcribe_audio(audio_ref: str) -> dict:
    """use ONLY if seller provided a voice recording, not if they typed text. Wraps sarvam_client.transcribe()."""
    audio_ref = normalize_path(audio_ref)
    if not os.path.exists(audio_ref):
        return {"error": f"Audio file not found at {audio_ref}"}
        
    try:
        with open(audio_ref, "rb") as f:
            audio_bytes = f.read()
        return await transcribe(audio_bytes)
    except Exception as e:
        return {"error": f"Failed to transcribe audio: {e}"}

@tool
async def analyze_product_image(image_ref: str, declared_category: str) -> dict:
    """checks blur, angle, background/lighting quality, and detects actual product category shown, to compare against declared_category. Wraps vision_client.analyze_image() + blur_score(), merged into one dict."""
    image_ref = normalize_path(image_ref)
    if not os.path.exists(image_ref):
        return {"error": f"Image file not found at {image_ref}"}
        
    try:
        with open(image_ref, "rb") as f:
            image_bytes = f.read()
            
        # Run local blur score check
        blur_res = blur_score(image_bytes)
        
        # Run multimodal quality / category classification
        vision_res = await analyze_image(image_bytes)
        
        # Merge results
        return {**blur_res, **vision_res}
    except Exception as e:
        return {"error": f"Failed to analyze image: {e}"}

@tool
def check_category_mismatch(declared_category: str, detected_category: str) -> dict:
    """MUST be called immediately after analyze_product_image whenever an image was provided, before generating listing content. Pure logic, no LLM call. Returns {mismatch: bool, message: str}. If true, hard stop — do not proceed to listing generation."""
    dec = declared_category.strip().lower()
    det = detected_category.strip().lower()
    
    # Synonym groups to avoid false positives (e.g. sari vs saree, footwear vs sandals)
    synonyms = {
        "saree": ["saree", "sari"],
        "sari": ["saree", "sari"],
        "kurti": ["kurti", "kurtas", "kurta", "dress"],
        "tshirt": ["tshirt", "t-shirt", "tee", "shirt", "top"],
        "pants": ["pants", "trouser", "trousers", "jeans", "leggings", "pajamas"],
        "dress": ["dress", "gown", "frock", "maxi"],
        "footwear": ["footwear", "sandals", "sandal", "shoes", "shoe", "flats", "heels", "slippers"],
        "jewelry": ["jewelry", "jewellery", "necklace", "earrings", "ring", "bangle", "bracelet"],
        "home_decor": ["home_decor", "decor", "vase", "planter", "pot", "table", "carpet", "curtain", "lamp"]
    }
    
    matched = False
    if dec == det:
        matched = True
    else:
        dec_group = synonyms.get(dec, [dec])
        det_group = synonyms.get(det, [det])
        if set(dec_group).intersection(set(det_group)):
            matched = True
            
    mismatch = not matched
    if mismatch:
        message = (
            f"Category mismatch detected: Declared category '{declared_category}' does not match the product detected in image '{detected_category}'. "
            "You MUST stop immediately. Do not call generate_listing_content or any other tools."
        )
    else:
        message = "Category match verified successfully."
        
    return {
        "mismatch": mismatch,
        "message": message
    }

@tool
async def generate_listing_content(input_text: str, category: str, target_language: str, image_findings: str = "") -> dict:
    """generates title, 5 description bullets, size_chart, price, keywords. Only call once mismatch check has passed or no image was provided. Wraps llm_client.generate_structured() with a JSON schema in the prompt."""
    findings_str = "No image provided"
    if image_findings:
        findings_str = str(image_findings)
            
    prompt = (
        f"Create an optimized e-commerce product listing for the category '{category}'.\n\n"
        f"Seller description / input details: {input_text}\n"
        f"Multimodal image analysis findings: {findings_str}\n\n"
        "Generate a complete listing. The response MUST be a JSON object with the following fields:\n"
        "1. 'title': A catchy, search-optimized title including key product details (e.g. material, style).\n"
        "2. 'bullets': A JSON array of exactly 5 detailed feature description bullets highlighting material, comfort, occasion, styling tips, and care instructions.\n"
        "3. 'size_chart': A JSON dictionary mapping standard sizes (S, M, L, XL, XXL, or 'Free Size') to measurement details (e.g. 'Bust: 38 in').\n"
        "4. 'price': A recommended price in INR (integer, e.g. 799).\n"
        "5. 'keywords': A JSON list of 5-8 search keywords.\n"
        "6. 'material': The primary material of the product (e.g. 'Cotton', 'Silk', 'Brass', 'Leather').\n"
        "7. 'fabric': Specific fabric texture details (e.g. 'Banarasi Silk', 'Khadder Cotton', 'TPR Sole') if relevant.\n"
        "8. 'colour': Main color(s) of the product.\n"
        "9. 'pattern': Design pattern or prints (e.g. 'Floral Print', 'Solid', 'Embroidered').\n"
        "10. 'sleeve': Sleeve style for apparel items like kurtis/sarees (e.g. '3/4 Sleeve', 'Sleeveless'). This field must be null/None for non-apparel categories like footwear, jewelry, or home decor.\n"
        "11. 'occasion': Ideal occasion for the product (e.g. 'Festive Wear', 'Wedding Wear', 'Daily Casual').\n"
        "12. 'available_sizes': A JSON list of standard sizes available (e.g. ['Free'], or ['S', 'M', 'L', 'XL', 'XXL']).\n"
    )
    
    try:
        return await generate_structured(prompt, target_language)
    except Exception as e:
        return {"error": f"Failed to generate listing content: {e}"}

@tool
def score_return_risk(listing: str, category: str) -> dict:
    """scores the listing against category_benchmarks.json — checks whether each known issue is actually addressed in the listing, sums contribution_pct of unresolved issues (cap 5-95%), returns score + unresolved issues list."""
    benchmarks_path = os.path.join(DATA_DIR, "category_benchmarks.json")
    if not os.path.exists(benchmarks_path):
        return {"error": "Category benchmarks file not found."}
        
    try:
        with open(benchmarks_path, "r") as f:
            benchmarks = json.load(f)
    except Exception as e:
        return {"error": f"Failed to load category benchmarks: {e}"}
        
    listing_dict = {}
    if isinstance(listing, dict):
        listing_dict = listing
    elif isinstance(listing, str):
        try:
            listing_dict = json.loads(listing)
        except Exception:
            try:
                import ast
                listing_dict = ast.literal_eval(listing)
            except Exception:
                return {"error": "Failed to parse listing JSON from string."}
    else:
        return {"error": "Invalid listing format passed to tool."}
        
    # Standardize category key
    cat_key = category.strip().lower().replace(" ", "_")
    if cat_key not in benchmarks:
        # Check for matching substrings
        found = False
        for key in benchmarks.keys():
            if key in cat_key or cat_key in key:
                cat_key = key
                found = True
                break
        if not found:
            return {"error": f"Category '{category}' not found in benchmarks database."}
            
    category_issues = benchmarks[cat_key]
    unresolved_issues = []
    total_unresolved_pct = 0
    
    title = listing_dict.get("title", "").lower()
    bullets_text = " ".join(listing_dict.get("bullets", [])).lower()
    keywords_text = " ".join(listing_dict.get("keywords", [])).lower()
    combined = f"{title} {bullets_text} {keywords_text}"
    
    for item in category_issues:
        issue_id = item["issue"].lower()
        addressed = False
        
        if "size_chart" in issue_id:
            chart = listing.get("size_chart")
            addressed = bool(chart and len(chart) > 0)
        elif "color" in issue_id:
            addressed = any(w in combined for w in ["color", "shade", "screen", "variation", "image", "actual", "picture"])
        elif "fabric" in issue_id or "material" in issue_id or "silk" in issue_id or "cotton" in issue_id:
            material_val = listing.get("material", "") or listing.get("fabric", "")
            addressed = bool(material_val and len(str(material_val).strip()) > 0) or any(w in combined for w in ["fabric", "material", "pure", "quality", "cotton", "silk", "soft", "blend", "breathable", "drape"])
        elif "stitch" in issue_id or "seam" in issue_id or "hem" in issue_id or "finish" in issue_id:
            addressed = any(w in combined for w in ["stitch", "seam", "hem", "finish", "craft", "tailor", "durable"])
        elif "blouse" in issue_id:
            addressed = any(w in combined for w in ["blouse", "piece", "unstitched"])
        elif "fit" in issue_id or "toe" in issue_id:
            addressed = any(w in combined for w in ["fit", "toe", "size", "width", "wide", "narrow"])
        elif "cushion" in issue_id or "sole" in issue_id:
            addressed = any(w in combined for w in ["cushion", "sole", "comfort", "heel", "walk", "soft", "tpr"])
        elif "adhesive" in issue_id or "glue" in issue_id:
            addressed = any(w in combined for w in ["adhesive", "glue", "bond", "durable", "quality", "sole"])
        elif "tarnish" in issue_id or "discolor" in issue_id or "oxidation" in issue_id:
            addressed = any(w in combined for w in ["tarnish", "discolor", "plating", "shine", "care", "perfume", "water", "keep"])
        elif "clasp" in issue_id or "hook" in issue_id or "chain" in issue_id or "drawstring" in issue_id:
            addressed = any(w in combined for w in ["clasp", "hook", "chain", "drawstring", "closure", "lock", "secure"])
        elif "weight" in issue_id:
            addressed = any(w in combined for w in ["weight", "light", "heavy", "comfortable", "easy"])
        elif "gemstone" in issue_id or "pearl" in issue_id or "stone" in issue_id:
            addressed = any(w in combined for w in ["gemstone", "pearl", "stone", "kundan", "bead", "stud", "attach"])
        elif "transit" in issue_id or "damage" in issue_id or "pack" in issue_id or "break" in issue_id:
            addressed = any(w in combined for w in ["package", "pack", "wrap", "bubble", "box", "transit", "safe", "secure", "damage"])
        elif "dimension" in issue_id:
            addressed = any(w in combined for w in ["dimension", "height", "width", "size", "measure", "cm", "inch"])
        elif "base" in issue_id or "tip" in issue_id or "wobble" in issue_id:
            addressed = any(w in combined for w in ["base", "stable", "flat", "tip", "wobble", "bottom", "stand"])
            
        if not addressed:
            unresolved_issues.append({
                "issue": item["issue"],
                "severity": item["severity"],
                "contribution_pct": item["contribution_pct"],
                "explanation": item["explanation"]
            })
            total_unresolved_pct += item["contribution_pct"]
            
    risk_score = max(5, min(95, total_unresolved_pct))
    
    return {
        "return_risk_score_pct": risk_score,
        "unresolved_issues": unresolved_issues
    }

@tool
def check_pincode_risk(pincode: str) -> dict:
    """optional, call only if seller provided a pincode. Looks up pincode_risk.json, defaults to medium/unknown if not found."""
    pincode_clean = pincode.strip()
    pincode_path = os.path.join(DATA_DIR, "pincode_risk.json")
    
    if not os.path.exists(pincode_path):
        return {
            "pincode": pincode_clean,
            "risk_level": "medium",
            "estimated_return_rate_pct": 15.0,
            "status": "missing_data_file"
        }
        
    try:
        with open(pincode_path, "r") as f:
            data = json.load(f)
            
        pincodes_list = data.get("pincode_risks", [])
        for entry in pincodes_list:
            if entry.get("pincode") == pincode_clean:
                return {
                    "pincode": pincode_clean,
                    "location": entry.get("location"),
                    "risk_level": entry.get("risk_level"),
                    "estimated_return_rate_pct": entry.get("estimated_return_rate_pct"),
                    "status": "verified"
                }
                
        # Default back to medium risk
        return {
            "pincode": pincode_clean,
            "risk_level": "medium",
            "estimated_return_rate_pct": 15.0,
            "status": "not_found"
        }
    except Exception as e:
        return {
            "pincode": pincode_clean,
            "risk_level": "medium",
            "estimated_return_rate_pct": 15.0,
            "status": f"error: {str(e)}"
        }
