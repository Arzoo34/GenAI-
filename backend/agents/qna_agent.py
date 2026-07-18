import os
import logging
from typing import Optional
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_classic.agents import create_tool_calling_agent, AgentExecutor

# Import tools
from agents.qna_tools import (
    fetch_questions,
    detect_question_pattern,
    draft_reply,
    suggest_listing_fix
)

logger = logging.getLogger(__name__)

def get_qna_agent_executor() -> AgentExecutor:
    """
    Initializes and returns the LangChain AgentExecutor for the Shuruaat AI Q&A Agent.
    Configured with a tool-calling system prompt and the ChatGroq model (llama-3.3-70b-versatile).
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
        fetch_questions,
        detect_question_pattern,
        draft_reply,
        suggest_listing_fix
    ]
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", (
            "You are the Q&A Agent for Shuruaat AI. Your job is to process all buyer questions for a listing_id and listing_context.\n\n"
            "You MUST perform the following steps in strict order:\n"
            "1. Call fetch_questions tool with the listing_id to get the questions list.\n"
            "2. Call detect_question_pattern tool. You MUST pass the exact list of questions returned from fetch_questions. Do NOT invent, hallucinate, or alter any questions.\n"
            "3. If a pattern is detected (pattern_found = True), call suggest_listing_fix tool. Pass the topic, a list of plain text strings of the matched questions (do NOT pass dictionaries, just a list of the question text strings), and the listing_context.\n"
            "4. For any question not in the matched_question_ids list, call draft_reply tool with the question, the listing_context, and the target_language.\n\n"
            "Separate your final report into:\n"
            "- Suggested listing fixes for detected patterns.\n"
            "- Individual replies for non-pattern questions."
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
