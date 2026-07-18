import os
import logging
from typing import Optional
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_classic.agents import create_tool_calling_agent, AgentExecutor

# Import tools list
from agents.listing_tools import (
    transcribe_audio,
    analyze_product_image,
    check_category_mismatch,
    generate_listing_content,
    score_return_risk,
    check_pincode_risk
)

logger = logging.getLogger(__name__)

def get_listing_agent_executor() -> AgentExecutor:
    """
    Initializes and returns the LangChain AgentExecutor for the Shuruaat AI Listing Agent.
    Configured with a tool-calling system prompt and the ChatGroq model.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is not set")
        
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        groq_api_key=api_key,
        temperature=0.0,
        max_retries=1
    )
    
    tools = [
        transcribe_audio,
        analyze_product_image,
        check_category_mismatch,
        generate_listing_content,
        score_return_risk,
        check_pincode_risk
    ]
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", (
            "You are the Listing Agent for Shuruaat AI. Given a seller's input "
            "(optionally voice, optionally a photo, a declared product category, and optionally a delivery pincode), "
            "produce a complete, risk-scored product listing. Reason step by step about which tools you actually need for this specific input:\n"
            "- If audio was provided, transcribe it first.\n"
            "- If an image was provided, analyze it and ALWAYS immediately check for category mismatch afterward. "
            "CRITICAL: If the category mismatch check returns mismatch=True, you MUST STOP IMMEDIATELY and return the mismatch message. "
            "Do NOT call generate_listing_content, do NOT call score_return_risk, and do NOT call check_pincode_risk. "
            "Simply terminate and output the mismatch warning as your final answer.\n"
            "- Once you have clean input, generate the listing content (default target language is Hindi, but adapt if specified otherwise).\n"
            "- Always score the return risk of the generated listing.\n"
            "- If a pincode was provided, check its risk level as a final step.\n"
            "- Never skip the category mismatch check when an image is provided."
        )),
        MessagesPlaceholder(variable_name="chat_history", optional=True),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad")
    ])
    
    agent = create_tool_calling_agent(llm, tools, prompt)
    
    return AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=True,
        return_intermediate_steps=True
    )
