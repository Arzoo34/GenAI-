from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional

class ListingContent(BaseModel):
    title: str = Field(..., description="E-commerce optimized product title")
    bullets: List[str] = Field(..., description="5 description bullet points")
    size_chart: Dict[str, str] = Field(..., description="Sizing chart dictionary mapping size to details")
    price: int = Field(..., description="Recommended price in INR")
    keywords: List[str] = Field(..., description="Search keywords")
    material: Optional[str] = Field(None, description="Primary material of the product")
    fabric: Optional[str] = Field(None, description="Fabric details if applicable")
    colour: Optional[str] = Field(None, description="Main color(s) of the product")
    pattern: Optional[str] = Field(None, description="Pattern style or print type")
    sleeve: Optional[str] = Field(None, description="Sleeve type (null for non-apparel)")
    occasion: Optional[str] = Field(None, description="Occasion suitability")
    available_sizes: Optional[List[str]] = Field(None, description="List of standard sizes available")

class AgentTraceStep(BaseModel):
    tool_called: str = Field(..., description="Name of the tool that was called")
    input_summary: str = Field(..., description="Summary of arguments passed to the tool")
    output_summary: str = Field(..., description="Summary of results returned by the tool")

class PincodeRiskResponse(BaseModel):
    pincode: str
    location: Optional[str] = None
    risk_level: str
    estimated_return_rate_pct: float
    status: str

class PincodeRiskBatchItem(BaseModel):
    input: str
    matched_city: str
    latitude: float
    longitude: float
    risk_level: str
    estimated_return_rate: float
    recommendation: str

class ListingAgentResponse(BaseModel):
    final_listing: Optional[ListingContent] = None
    risk_score: Optional[float] = None
    issues_found: List[Dict[str, Any]] = Field(default_factory=list)
    pincode_risk: Optional[PincodeRiskResponse] = None
    category_mismatch_flagged: bool
    mismatch_message: Optional[str] = None
    agent_reasoning_trace: List[AgentTraceStep] = Field(default_factory=list)
    fallback_used: bool

class RunSuiteRequest(BaseModel):
    test_ids: Optional[List[str]] = Field(default=None, description="Optional list of test IDs to run")

class TestCaseResult(BaseModel):
    test_id: str
    description: str
    status: str  # "PASSED" | "FAILED"
    report: Optional[str] = None
    error: Optional[str] = None

class RunSuiteResponse(BaseModel):
    total_tests: int
    passed: int
    failed: int
    results: List[TestCaseResult]

class QnaAgentRequest(BaseModel):
    listing_id: str
    current_listing: Dict[str, Any]
    target_language: str

class QnaIndividualReply(BaseModel):
    question_id: str
    question: str
    drafted_reply: str

class QnaPatternFlag(BaseModel):
    topic: str
    question_count: int
    suggested_addition: str
    field_to_update: str

class QnaAgentResponse(BaseModel):
    individual_replies: List[QnaIndividualReply] = Field(default_factory=list)
    pattern_flags: List[QnaPatternFlag] = Field(default_factory=list)
    agent_reasoning_trace: List[AgentTraceStep] = Field(default_factory=list)
    fallback_used: bool

class HealthBriefStats(BaseModel):
    return_rate: float
    return_rate_trend: str
    cod_returns: int
    prepaid_returns: int
    top_complaint_theme: str
    total_orders: int

class HealthBriefRecommendation(BaseModel):
    text: str
    money_saved_estimate: float
    action: str
    action_value: float

class HealthBriefResponse(BaseModel):
    seller_name: str
    week_range: str
    stats: HealthBriefStats
    recommendation: HealthBriefRecommendation
    narrative_summary: str
    narrative_source: str
    note: str = Field(
        default="This is a simulated weekly brief based on representative demo data. In production, this would be generated from the seller's actual order and return history."
    )

class ApplySuggestionRequest(BaseModel):
    seller_id: str
    action: str

class ApplySuggestionResponse(BaseModel):
    success: bool
    message: str

