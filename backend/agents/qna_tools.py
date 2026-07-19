import os
import json
import logging
import asyncio
from typing import List, Dict, Any, Optional
from langchain.tools import tool
from services.llm_client import generate_structured

logger = logging.getLogger(__name__)

# Resolve path to mock_questions.json
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QUESTIONS_PATH = os.path.join(BACKEND_DIR, "data", "mock_questions.json")

@tool
def fetch_questions(listing_id: str) -> List[Dict[str, Any]]:
    """retrieves all buyer questions for a given listing from mock_questions.json. Always call this first to get the current question set before doing anything else."""
    if not os.path.exists(QUESTIONS_PATH):
        logger.error(f"Mock questions database file not found at {QUESTIONS_PATH}")
        return []
        
    try:
        with open(QUESTIONS_PATH, "r") as f:
            all_questions = json.load(f)
            
        listing_qs = [
            {
                "id": q.get("id"),
                "question": q.get("question"),
                "language": q.get("language")
            }
            for q in all_questions if q.get("listing_id") == listing_id
        ]
        return listing_qs
    except Exception as e:
        logger.error(f"Failed to fetch questions for listing {listing_id}: {e}")
        return []

@tool
def detect_question_pattern(questions: Any) -> Dict[str, Any]:
    """groups questions by topic similarity (keyword/semantic clustering — use simple keyword matching against a small topic taxonomy: sizing, fabric, color, delivery, price, authenticity). If any topic has 3 or more questions, flag it as a pattern. Pure logic, no LLM call needed — implement with keyword matching, not an API call. Returns {pattern_found: bool, topic: str, matched_question_ids: list[str], count: int}."""
    taxonomy = {
        "sizing": ["size", "chart", "fit", "measurement", "bust", "waist", "length", "xl", "xxl", "medium", "small", "large"],
        "fabric": ["fabric", "material", "silk", "cotton", "blend", "cloth", "thread", "zari", "yarn"],
        "color": ["color", "colour", "shade", "dye", "bleed", "picture", "photo", "saturation", "image"],
        "delivery": ["delivery", "deliver", "ship", "pincode", "courier", "receive", "varum", "reach", "send"],
        "price": ["price", "cost", "rupees", "inr", "discount", "offer", "expensive", "rupee"],
        "authenticity": ["pure", "real", "genuine", "authentic", "original", "fake", "duplicate", "silver", "gold", "stone", "diamond"]
    }
    
    topic_matches = {topic: [] for topic in taxonomy.keys()}
    
    for q in questions:
        q_text = str(q.get("question", "")).strip().lower()
        q_id = q.get("id")
        if not q_id:
            continue
            
        for topic, keywords in taxonomy.items():
            for kw in keywords:
                if kw in q_text:
                    topic_matches[topic].append(q_id)
                    break  # Found match for this topic, move to next topic check
                    
    # Find the topic with the maximum matches
    best_topic = ""
    best_matches = []
    max_count = 0
    
    for topic, matches in topic_matches.items():
        if len(matches) >= 3 and len(matches) > max_count:
            max_count = len(matches)
            best_topic = topic
            best_matches = matches
            
    if max_count >= 3:
        return {
            "pattern_found": True,
            "topic": best_topic,
            "matched_question_ids": best_matches,
            "count": max_count
        }
        
    return {
        "pattern_found": False,
        "topic": "",
        "matched_question_ids": [],
        "count": 0
    }

@tool
async def draft_reply(question: str, listing_context: Any, target_language: str) -> str:
    """drafts a natural, helpful reply to a single buyer question in the seller's language, using listing context (title, description, size chart if relevant) to answer accurately. Wraps llm_client.generate_structured() but returns plain text, not JSON — call it only for individual questions, not for pattern-flagged topics (those get suggest_listing_fix instead)."""
    prompt = (
        f"You are a helpful customer support assistant for Shuruaat AI.\n"
        f"Buyer Question: \"{question}\"\n"
        f"Product Details (Listing Context):\n{json.dumps(listing_context, ensure_ascii=False, indent=2)}\n\n"
        f"Please draft a natural, polite, and helpful customer support reply to this question in the language: {target_language}.\n"
        f"Your reply must be based strictly on the listing context details. If the context does not contain the answer, politely state that the detail is currently not available.\n\n"
        f"You must return a JSON object with a single key 'reply' containing the text of your reply."
    )
    
    try:
        await asyncio.sleep(3.0)
        res = await generate_structured(prompt, target_language)
        return res.get("reply", "Failed to generate reply.")
    except Exception as e:
        logger.error(f"Failed to draft reply: {e}")
        return f"Error drafting reply: {str(e)}"

@tool
async def suggest_listing_fix(topic: str, matched_questions: List[str], current_listing: Any) -> Dict[str, Any]:
    """call this ONLY when detect_question_pattern found a pattern (3+ questions on the same topic). Generates a specific suggested addition/edit to the listing to close the gap (e.g., a size chart addition, a fabric detail line). Returns {suggested_addition: str, field_to_update: str}. This should NOT be called for individual one-off questions — only for confirmed patterns."""
    questions_text = "\n".join([f"- {q}" for q in matched_questions])
    
    prompt = (
        f"We have detected a pattern of buyer questions about the topic: \"{topic}\".\n"
        f"Clustered Questions:\n{questions_text}\n\n"
        f"Current Product Listing:\n{json.dumps(current_listing, ensure_ascii=False, indent=2)}\n\n"
        f"Based on the questions, propose a specific text addition or modification to the listing to resolve this information gap (e.g. adding details to 'bullets', updating 'size_chart', or adding keywords).\n"
        f"Return a JSON object containing:\n"
        f"- 'suggested_addition': The specific text content or structure to add/update.\n"
        f"- 'field_to_update': The field name of the listing that should be updated (e.g., 'bullets', 'size_chart', 'title', etc.)."
    )
    
    try:
        await asyncio.sleep(3.0)
        res = await generate_structured(prompt, "English")
        return {
            "suggested_addition": res.get("suggested_addition"),
            "field_to_update": res.get("field_to_update")
        }
    except Exception as e:
        logger.error(f"Failed to generate listing suggestion: {e}")
        return {
            "error": f"Failed to generate suggestion: {str(e)}"
        }
