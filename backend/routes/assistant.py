import os
import logging
from typing import List, Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

router = APIRouter(prefix="/api/assistant", tags=["assistant"])
logger = logging.getLogger(__name__)

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class AssistantChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    language: str = "en"

class AssistantChatResponse(BaseModel):
    reply: str

def get_fallback_reply(message: str, lang: str) -> str:
    """Provides a helpful multilingual reply based on keywords when LLM fails or is unconfigured."""
    msg = message.lower()
    lang = lang.lower()
    
    # 1. Listing / Upload
    if any(k in msg for k in ["list", "upload", "create", "photo", "image", "उत्पाद", "अपलोड", "பதிவேற்ற", "ছবি", "আপলোড"]):
        if lang in ["hindi", "hi"]:
            return (
                "एक नया उत्पाद सूचीबद्ध (list) करने के लिए, कृपया **[Listing Agent](/listing)** पर जाएं। "
                "वहां आप अपने उत्पाद की फोटो अपलोड कर सकते हैं, उसकी श्रेणी चुन सकते हैं, और हमारी AI "
                "मीशो (Meesho), अमेज़ॅन (Amazon), मिंत्रा (Myntra) आदि के लिए शीर्षक, बुलेट पॉइंट्स और अनुकूलित विवरण तैयार कर देगी।"
            )
        elif lang in ["tamil", "ta"]:
            return (
                "புதிய தயாரிப்பைப் பட்டியலிட, தயவுசெய்து **[Listing Agent](/listing)** பக்கத்திற்குச் செல்லவும். "
                "அங்கு உங்கள் தயாரிப்பின் புகைப்படத்தைப் பதிவேற்றலாம், வகையைத் தேர்ந்தெடுக்கலாம், மேலும் எங்கள் AI "
                "மீஷோ, அமேசான், மைந்த்ரா போன்ற தளங்களுக்கு உகந்த தலைப்பு, புல்லட் புள்ளிகள் மற்றும் விவரங்களை உருவாக்கும்."
            )
        elif lang in ["bengali", "bn"]:
            return (
                "একটি নতুন পণ্য তালিকাভুক্ত (list) করতে, দয়া করে **[Listing Agent](/listing)**-এ যান। "
                "সেখানে আপনি আপনার পণ্যের ছবি আপলোড করতে পারেন, বিভাগটি বেছে নিতে পারেন, এবং আমাদের AI "
                "মিশো (Meesho), অ্যামাজন (Amazon), মিন্ট্রা (Myntra) ইত্যাদির জন্য শিরোনাম, বুলেট পয়েন্ট এবং বিবরণ তৈরি করে দেবে।"
            )
        else:
            return (
                "To list a new product, please go to the **[Listing Agent](/listing)**. "
                "There, you can upload a photo of your product, select its category, and our AI will "
                "generate optimized titles, bullet points, and description details suitable for Meesho, Amazon, Myntra, etc."
            )

    # 2. Returns / Health / Risk / Score
    if any(k in msg for k in ["return", "risk", "rto", "health", "score", "cod", "रिटर्न", "स्वास्थ्य", "ரிட்டர்ன்", "ফেরত", "ঝুঁকি"]):
        if lang in ["hindi", "hi"]:
            return (
                "आप अपने ग्राहक रिटर्न और रिटर्न जोखिमों का विश्लेषण **[Health Dashboard](/health)** में देख सकते हैं। "
                "यह पृष्ठ आपकी कुल वापसी दर, सीओडी (COD) सीमाएं और शिपिंग लागतों को बचाने के लिए सुझाव दिखाता है।"
            )
        elif lang in ["tamil", "ta"]:
            return (
                "உங்கள் வாடிக்கையாளர் ரிட்டர்ன்கள் மற்றும் ரிட்டர்ன் அபாயங்களை **[Health Dashboard](/health)** இல் பார்க்கலாம். "
                "இந்த பக்கம் உங்கள் மொத்த ரிட்டர்ன் விகிதம், COD வரம்புகள் மற்றும் ஷிப்பிங் கட்டணங்களைச் சேமிப்பதற்கான பரிந்துரைகளைக் காட்டுகிறது."
            )
        elif lang in ["bengali", "bn"]:
            return (
                "আপনি গ্রাহক রিটার্ন এবং রিটার্ন ঝুঁকি বিশ্লেষণ **[Health Dashboard](/health)**-এ দেখতে পারেন। "
                "এই পৃষ্ঠাটি আপনার মোট রিটার্ন রেট, সিওডি (COD) সীমা এবং শিপিং খরচ বাঁচাতে সাহায্যকারী পরামর্শগুলি দেখায়।"
            )
        else:
            return (
                "You can analyze customer returns and shipment risk factors in the **[Health Dashboard](/health)**. "
                "It features details on return rates, COD limits, and automated optimization strategies to save shipping costs."
            )

    # 3. Questions / Q&A / Customer Queries
    if any(k in msg for k in ["question", "qna", "buyer", "customer", "reply", "ग्राहक", "सवाल", "கேள்வி", "প্রশ্ন", "উত্তর"]):
        if lang in ["hindi", "hi"]:
            return (
                "क्रेताओं (buyers) के प्रश्नों को देखने या उनका उत्तर देने के लिए, कृपया **[Q&A Agent](/qa)** पर जाएं। "
                "जब आप एक उत्पाद प्रकाशित करते हैं और होमपेज पर गतिविधि सिम्युलेट (simulate) करते हैं, तो नए प्रश्न यहां दिखाई देंगे, "
                "और हमारी एआई उनके लिए ड्राफ्ट उत्तर तैयार करेगी जिन्हें आप एक-क्लिक में भेज सकते हैं।"
            )
        elif lang in ["tamil", "ta"]:
            return (
                "வாங்குபவர்களின் கேள்விகளைக் காண அல்லது பதிலளிக்க, தயவுசெய்து **[Q&A Agent](/qa)** பக்கத்திற்குச் செல்லவும். "
                "நீங்கள் தயாரிப்பை வெளியிட்டு விற்பனையை உருவகப்படுத்தியதும், கேள்விகள் இங்கே தோன்றும், "
                "மேலும் எங்கள் AI அவற்றுக்கான பதில்களை உருவாக்கும்."
            )
        elif lang in ["bengali", "bn"]:
            return (
                "ক্রেতাদের প্রশ্নের উত্তর দিতে বা পরীক্ষা করতে, দয়া করে **[Q&A Agent](/qa)**-এ যান। "
                "আপনি যখন পণ্য প্রকাশ করবেন এবং গতিবিধি সিমুলেট করবেন, তখন ক্রেতাদের প্রশ্ন এখানে প্রদর্শিত হবে, "
                "এবং আমাদের AI উত্তরগুলির ড্রাফট তৈরি করবে যা আপনি সহজেই পাঠাতে পারেন।"
            )
        else:
            return (
                "To check and respond to buyer questions, please go to the **[Q&A Agent](/qa)**. "
                "Once you publish a listing and simulate some activity on the homepage, buyer questions "
                "will start appearing there along with AI-drafted replies you can approve or edit."
            )

    # 4. Profile / Language / Business Name
    if any(k in msg for k in ["profile", "language", "setting", "name", "business", "प्रोफाइल", "भाषा", "பெயர்", "নাম", "ভাষা"]):
        if lang in ["hindi", "hi"]:
            return (
                "आप **[Profile Page](/profile)** पर जाकर अपनी पसंदीदा भाषा (हिंदी, तमिल, बंगाली, अंग्रेजी) "
                "और अपने व्यवसाय (business) का नाम बदल सकते हैं, साथ ही वहां से लॉगआउट भी कर सकते हैं।"
            )
        elif lang in ["tamil", "ta"]:
            return (
                "உங்கள் வணிகப் பெயர், பயன்பாட்டு மொழி (தமிழ், இந்தி, பெங்காலி, ஆங்கிலம்) ஆகியவற்றை மாற்றவும், "
                "அகவுண்டிலிருந்து லாக்அவுட் செய்யவும் **[Profile Page](/profile)** பக்கத்திற்குச் செல்லலாம்."
            )
        elif lang in ["bengali", "bn"]:
            return (
                "আপনি **[Profile Page](/profile)**-এ গিয়ে আপনার ব্যবসার নাম, পছন্দের ভাষা (বাংলা, হিন্দি, তামিল, ইংরেজি) "
                "পরিবর্তন করতে পারেন, এবং অ্যাকাউন্ট থেকে লগআউট করতে পারেন।"
            )
        else:
            return (
                "You can change your preferred language (English, Hindi, Tamil, Bengali), update your "
                "business name, and logout on the **[Profile Page](/profile)**."
            )

    # Default general greeting
    if lang in ["hindi", "hi"]:
        return (
            "नमस्ते! मैं आपका शुरुआत AI सहायक हूं। 😊\n"
            "मैं आपको उत्पाद सूचीबद्ध करने, रिटर्न को कम करने और खरीदार के सवालों के जवाब देने में सहायता कर सकता हूं।\n\n"
            "आप मुझसे पूछ सकते हैं:\n"
            "* 'मैं नया उत्पाद कैसे जोड़ूं?' -> **[Listing Agent](/listing)**\n"
            "* 'मैं अपनी वापसी दर कैसे देखूं?' -> **[Health Dashboard](/health)**\n"
            "* 'क्रेता के सवाल कहां मिलेंगे?' -> **[Q&A Agent](/qa)**"
        )
    elif lang in ["tamil", "ta"]:
        return (
            "வணக்கம்! நான் உங்கள் ஷுருவாத் AI உதவியாளர். 😊\n"
            "தயாரிப்புகளைப் பட்டியலிட, ரிட்டர்ன் அபாயத்தைக் குறைக்க மற்றும் வாங்குபவர்களின் கேள்விகளுக்குப் பதிலளிக்க நான் உங்களுக்கு உதவுவேன்.\n\n"
            "நீங்கள் கேட்கலாம்:\n"
            "* 'புதிய தயாரிப்பை எப்படி சேர்ப்பது?' -> **[Listing Agent](/listing)**\n"
            "* 'ரிட்டர்ன்களை எப்படி குறைப்பது?' -> **[Health Dashboard](/health)**"
        )
    elif lang in ["bengali", "bn"]:
        return (
            "নমস্কার! আমি আপনার শুরুয়াত AI সহকারী। 😊\n"
            "আমি আপনাকে পণ্য তালিকাভুক্ত করতে, রিটার্ন কমাতে এবং ক্রেতাদের প্রশ্নের উত্তর দিতে সাহায্য করতে পারি।\n\n"
            "আপনি জিজ্ঞেস করতে পারেন:\n"
            "* 'নতুন পণ্য কীভাবে যুক্ত করব?' -> **[Listing Agent](/listing)**\n"
            "* 'আমার রিটার্ন রেট কীভাবে দেখব?' -> **[Health Dashboard](/health)**"
        )
    else:
        return (
            "Hello! I am your Shuruaat AI Assistant. 😊\n"
            "I can guide you on how to write catalog descriptions, minimize customer returns, and respond to buyer questions.\n\n"
            "You can try asking:\n"
            "* *'How do I list a product?'* -> **[Listing Agent](/listing)**\n"
            "* *'How do I view return analytics?'* -> **[Health Dashboard](/health)**\n"
            "* *'Where are buyer questions?'* -> **[Q&A Agent](/qa)**"
        )

@router.post("/chat", response_model=AssistantChatResponse)
async def chat_assistant(request: AssistantChatRequest):
    """
    POST /api/assistant/chat
    Processes messages using ChatGroq LLM with a helpful system prompt,
    falling back to keyword-based local rules if the LLM key is missing or fails.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        logger.warning("GROQ_API_KEY missing, using local rule-based fallback.")
        return AssistantChatResponse(reply=get_fallback_reply(request.message, request.language))

    system_prompt = (
        "You are the Shuruaat AI Assistant, a warm, wise, and helpful helper for micro-merchants and home-run craft stores in India.\n"
        "Your task is to answer user FAQs, help them understand features, and guide them in navigation.\n\n"
        "Here are the pages in Shuruaat AI:\n"
        "- Home page (/home): Shows general sales statistics, customer return rates, trending products, and quick fixes.\n"
        "- Listing page (/listing): Sellers upload product photos and answer questions to write description drafts optimized for Meesho, Myntra, and Amazon.\n"
        "- Q&A Agent page (/qa): Analyzes buyer queries, clusters them into sizing/fabric topics, drafts auto-replies, and suggests catalogue metadata fixes.\n"
        "- Health Agent page (/health): Weekly briefs listing order returns rate, COD limitations, and return savings optimizations.\n"
        "- Profile page (/profile): Change settings like selected language (English, Hindi, Tamil, Bengali) and business name, or sign out.\n\n"
        "Rules:\n"
        "1. If referencing a page or action, include the route link in markdown, for example: [Listing Agent](/listing), [Health Dashboard](/health), [Q&A Agent](/qa), [Profile Page](/profile).\n"
        "2. Keep your answers brief, encouraging, and clear (max 3-4 sentences).\n"
        f"3. Respond entirely in the user's selected language: {request.language} using its native script."
    )

    try:
        llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            groq_api_key=api_key,
            temperature=0.7,
            max_retries=1,
            timeout=10.0
        )
        
        # Build prompt messages
        messages = [SystemMessage(content=system_prompt)]
        for msg in request.history[-6:]:  # Limit history context length
            if msg.role == "user":
                messages.append(HumanMessage(content=msg.content))
            else:
                messages.append(AIMessage(content=msg.content))
        
        messages.append(HumanMessage(content=request.message))
        
        response = await llm.ainvoke(messages)
        return AssistantChatResponse(reply=str(response.content).strip())
        
    except Exception as e:
        logger.error(f"Groq Chat Completion failed: {e}. Falling back to rule-based reply.")
        return AssistantChatResponse(reply=get_fallback_reply(request.message, request.language))
