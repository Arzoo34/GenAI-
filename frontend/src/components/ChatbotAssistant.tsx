import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Sparkles, Navigation } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "@/lib/language-context";
import { sendAssistantMessage } from "@/api/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatbotAssistant() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Set up localized initial message
  useEffect(() => {
    let initialGreeting = "Hello! I am your Shuruaat AI Assistant. How can I help you onboard or optimize your store today?";
    if (language === "hi") {
      initialGreeting = "नमस्ते! मैं आपका शुरुआत AI सहायक हूँ। आज मैं आपकी दुकान को ऑनलाइन लाने या आपके ऑर्डर बढ़ाने में क्या मदद कर सकता हूँ?";
    } else if (language === "ta") {
      initialGreeting = "வணக்கம்! நான் உங்கள் ஷுருவாத் AI உதவியாளர். உங்கள் கடையை ஆன்லைனில் கொண்டு வர அல்லது விற்பனையை மேம்படுத்த இன்று நான் எவ்வாறு உதவ முடியும்?";
    } else if (language === "bn") {
      initialGreeting = "নমস্কার! আমি আপনার শুরুয়াত AI সহকারী। আপনার দোকান অনলাইনে আনতে বা বিক্রি বাড়াতে আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?";
    }
    
    setMessages([
      { role: "assistant", content: initialGreeting }
    ]);
  }, [language]);

  // Scroll to bottom when messages change or open
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;
    
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setLoading(true);

    try {
      // Map to server ChatMessage format
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      
      const response = await sendAssistantMessage(text, historyPayload, language);
      setMessages((prev) => [...prev, { role: "assistant", content: response.reply }]);
    } catch (err) {
      console.error("Chatbot request failed:", err);
      setMessages((prev) => [
        ...prev,
        { 
          role: "assistant", 
          content: "Sorry, I am having trouble connecting to the server. But you can check **[Listing Agent](/listing)** to list products, or **[Health Dashboard](/health)** to view return audits!" 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to parse markdown links like [Text](/route) and render them as interactive links
  const renderMessageContent = (content: string) => {
    // Regex for matching [Label](/route)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const matchIndex = match.index;
      // Add text before link
      if (matchIndex > lastIndex) {
        parts.push(content.substring(lastIndex, matchIndex));
      }
      
      const label = match[1];
      const route = match[2];

      parts.push(
        <button
          key={matchIndex}
          onClick={() => {
            setIsOpen(false); // Close chatbot
            navigate({ to: route }); // Navigate to internal page
          }}
          className="inline-flex items-center gap-1 font-bold text-primary underline hover:text-accent transition-colors cursor-pointer text-left"
        >
          {label} <Navigation className="h-3 w-3 inline" />
        </button>
      );

      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  const suggestionChips = {
    en: [
      { label: "📦 How to list products?", query: "How do I list a product and write titles?" },
      { label: "📉 How to reduce returns?", query: "How can I reduce COD returns and RTO?" },
      { label: "❓ Where are buyer questions?", query: "Where do I see buyer questions and edit replies?" }
    ],
    hi: [
      { label: "📦 प्रोडक्ट लिस्ट कैसे करें?", query: "मैं एक उत्पाद कैसे सूचीबद्ध करूं और शीर्षक लिखूं?" },
      { label: "📉 रिटर्न कैसे कम करें?", query: "मैं सीओडी रिटर्न और आरटीओ को कैसे कम कर सकता हूं?" },
      { label: "❓ क्रेता के सवाल कहां देखें?", query: "मैं क्रेता के सवाल कहां देख सकता हूं और उत्तर संपादित कर सकता हूं?" }
    ],
    ta: [
      { label: "📦 தயாரிப்பை பட்டியலிடுவது எப்படி?", query: "ஒரு தயாரிப்பை எவ்வாறு பட்டியலிடுவது மற்றும் தலைப்புகளை எழுதுவது?" },
      { label: "📉 ரிட்டர்ன்களைக் குறைப்பது எப்படி?", query: "COD ரிட்டர்ன்கள் மற்றும் RTO ஐ எவ்வாறு குறைப்பது?" }
    ],
    bn: [
      { label: "📦 প্রোডাক্ট লিস্ট কীভাবে করব?", query: "আমি কীভাবে একটি পণ্য তালিকাভুক্ত করব এবং শিরোনাম লিখব?" },
      { label: "📉 রিটার্ন কীভাবে কমাব?", query: "আমি কীভাবে সিওডি রিটার্ন এবং আরটিও কমাতে পারি?" }
    ]
  }[language as "hi" | "ta" | "bn" | "en"] || [
    { label: "📦 How to list products?", query: "How do I list a product?" },
    { label: "📉 How to reduce returns?", query: "How can I reduce COD returns?" }
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 mx-auto max-w-[480px] w-full h-0 pointer-events-none z-40">
      {/* Floating Action Button (FAB) */}
      <div className="absolute right-5 bottom-[7.5rem] pointer-events-auto">
        <motion.button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-accent shadow-lg shadow-primary/20 text-primary-foreground focus:outline-none btn-lift"
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        </motion.button>
      </div>

      {/* Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
            className="absolute right-5 bottom-[11.5rem] pointer-events-auto flex h-[480px] w-[calc(100%-2.5rem)] max-w-[360px] flex-col rounded-3xl border border-border/80 bg-[#FFF8F2] shadow-2xl backdrop-blur-md"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 bg-gradient-to-r from-primary/10 to-accent/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-display text-sm font-bold text-foreground">Shuruaat AI Sahayak</h4>
                  <span className="text-[10px] text-[oklch(0.5_0.14_145)] font-semibold uppercase tracking-wider">Online Assistant</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-black/5 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-card text-foreground border border-border/60 rounded-tl-sm"
                    }`}
                  >
                    {m.role === "user" ? (
                      m.content
                    ) : (
                      <span className="whitespace-pre-wrap">
                        {renderMessageContent(m.content)}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-card border border-border/60 p-3 text-sm flex items-center gap-1 shadow-sm">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:0.2s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Suggestions Chips */}
            {messages.length === 1 && !loading && (
              <div className="px-4 pb-2 flex flex-col gap-1.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-1">Suggested questions:</p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {suggestionChips.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(chip.query)}
                      className="rounded-full bg-card hover:bg-primary/10 border border-border/70 hover:border-primary/40 px-3 py-1 text-xs text-foreground/80 hover:text-primary transition-all text-left font-medium"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Box */}
            <div className="border-t border-border/60 bg-card p-3 rounded-b-3xl">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(inputVal);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 rounded-full border border-border/80 bg-background px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none placeholder:text-muted-foreground/60"
                />
                <button
                  type="submit"
                  disabled={!inputVal.trim() || loading}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm disabled:opacity-50 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
