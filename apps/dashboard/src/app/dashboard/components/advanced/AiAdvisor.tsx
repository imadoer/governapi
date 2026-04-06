"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, PaperAirplaneIcon, SparklesIcon } from "@heroicons/react/24/outline";

const QUICK_PROMPTS = [
  "What should I fix first?",
  "Explain my worst vulnerability",
  "How do I improve my score?",
  "Generate a security summary for my boss",
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AiAdvisor({ companyId, plan }: { companyId: string; plan: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(20);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const isPro = ["professional", "enterprise"].includes(plan);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    setError("");
    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const r = await fetch("/api/customer/ai-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": companyId },
        body: JSON.stringify({ message: text.trim() }),
      });
      const d = await r.json();
      if (d.success) {
        setMessages((prev) => [...prev, { role: "assistant", content: d.reply }]);
        if (d.remaining != null) setRemaining(d.remaining);
      } else {
        setError(d.error || "Failed to get response");
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-[100] w-12 h-12 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-shadow flex items-center justify-center"
      >
        {open ? <XMarkIcon className="w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-6 z-[100] w-[400px] max-w-[calc(100vw-48px)] h-[520px] bg-[#111318] border border-white/[0.06] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-violet-400" />
                <span className="text-[13px] font-semibold text-white">AI Security Advisor</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-600">{remaining} msgs left today</span>
                <span className="text-[9px] text-gray-700">Powered by AI</span>
              </div>
            </div>

            {!isPro ? (
              /* Upgrade prompt for non-pro users */
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <div>
                  <SparklesIcon className="w-10 h-10 text-violet-400/40 mx-auto mb-3" />
                  <h3 className="text-[15px] font-semibold text-white mb-2">AI Security Advisor</h3>
                  <p className="text-[12px] text-gray-500 mb-4">Get personalized security advice based on your scan data. Available on Professional plan.</p>
                  <div className="inline-block px-4 py-2 rounded-xl text-[12px] font-medium bg-gradient-to-r from-violet-500 to-cyan-500 text-white">
                    Upgrade to Professional
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && !loading && (
                    <div className="space-y-3">
                      <p className="text-[12px] text-gray-500 text-center mb-4">Ask me anything about your API security. I have access to your scan data.</p>
                      {QUICK_PROMPTS.map((q) => (
                        <button key={q} onClick={() => sendMessage(q)}
                          className="w-full text-left px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] text-[12px] text-gray-400 hover:text-white transition-colors">
                          {q}
                        </button>
                      ))}
                    </div>
                  )}

                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] px-3 py-2 rounded-xl text-[12px] leading-relaxed ${
                        m.role === "user"
                          ? "bg-cyan-500/15 text-cyan-100 border border-cyan-500/20"
                          : "bg-white/[0.03] text-gray-300 border border-white/[0.04]"
                      }`}>
                        {m.role === "assistant" ? (
                          <div className="prose prose-invert prose-sm max-w-none" style={{ fontSize: 12 }}
                            dangerouslySetInnerHTML={{ __html: simpleMarkdown(m.content) }} />
                        ) : m.content}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[11px] text-red-400">
                      {error}
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-3 border-t border-white/[0.06] shrink-0">
                  <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
                    <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your security..."
                      className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[12px] text-white placeholder-gray-600 focus:outline-none focus:border-white/[0.12]" />
                    <button type="submit" disabled={!input.trim() || loading}
                      className="p-2 rounded-lg bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 disabled:opacity-30 transition-colors">
                      <PaperAirplaneIcon className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function simpleMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code style='background:rgba(255,255,255,0.06);padding:1px 4px;border-radius:3px;font-size:11px'>$1</code>")
    .replace(/^- (.+)/gm, "<li style='margin-left:12px'>$1</li>")
    .replace(/^(\d+)\. (.+)/gm, "<li style='margin-left:12px'>$1. $2</li>")
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}
