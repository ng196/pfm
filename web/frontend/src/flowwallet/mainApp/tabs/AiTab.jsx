import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, RotateCcw } from "lucide-react";
import { checkAIHealth, sendAIMessage, resetSession } from "../../../services/aiService";

const SUGGESTIONS = [
  { icon: "🍔", text: "Add ₹500 food expense for lunch today" },
  { icon: "✈️", text: "Create a vacation goal for ₹50,000" },
  { icon: "📊", text: "Summarize my financial health" },
  { icon: "💡", text: "What are some ways to save more money?" },
  { icon: "🏦", text: "Which account has the most balance?" },
  { icon: "📈", text: "How much am I spending vs earning?" },
];

export default function AiTab({ data }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [online, setOnline] = useState(false);
  const [checking, setChecking] = useState(true);
  const messagesRef = useRef(null);
  const inputRef = useRef(null);

  // Check AI health on mount and periodically
  useEffect(() => {
    let active = true;
    const check = async () => {
      const isOnline = await checkAIHealth();
      if (active) {
        setOnline(isOnline);
        setChecking(false);
      }
    };
    check();
    const id = setInterval(check, 30000);
    return () => { active = false; clearInterval(id); };
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || sending) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setSending(true);

    try {
      const result = await sendAIMessage(msg, { data });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.message || "No response received.",
          actions: result.actions || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Could not reach AI. Make sure backend is running on port 5000 and ZAI_API_KEY is set in backend .env.\n\nError: ${err.message}`,
          actions: [],
        },
      ]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [input, sending, data]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    resetSession();
    setMessages([]);
  };

  return (
    <div className="flex h-[calc(100vh-160px)] flex-col">
      {/* Header */}
      <header className="mb-3 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white">
          <Bot size={22} />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-black text-slate-900">FinWise AI</h2>
          <p className="text-xs text-slate-500">Chat, ask questions, or tell me to do things</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            title="New chat"
          >
            <RotateCcw size={12} />
            New
          </button>
          <span
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${online
              ? "border-emerald-300 bg-emerald-100 text-emerald-700"
              : "border-amber-300 bg-amber-100 text-amber-700"
              }`}
          >
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}
            />
            {checking ? "Checking..." : online ? "Online" : "Offline"}
          </span>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={messagesRef}
        className="flex-1 overflow-y-auto rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <div className="mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-teal-100 to-cyan-100">
              <Sparkles size={28} className="text-teal-600" />
            </div>
            <h3 className="text-lg font-black text-slate-900">FinWise AI Assistant</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              I can answer questions, add transactions, create goals, and analyze your finances. Try one of these:
            </p>
            <div className="mt-5 grid w-full max-w-md grid-cols-2 gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  onClick={() => handleSend(s.text)}
                  className="rounded-xl border border-teal-200 bg-teal-50/50 px-3 py-2.5 text-left text-xs font-semibold text-teal-800 transition-all hover:border-teal-300 hover:bg-teal-50 hover:shadow-sm"
                >
                  <span className="mr-1">{s.icon}</span> {s.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div
                  className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-xs font-bold ${msg.role === "user"
                    ? "bg-teal-600 text-white"
                    : "bg-slate-800 text-white"
                    }`}
                >
                  {msg.role === "user" ? "YOU" : "AI"}
                </div>
                <div className="max-w-[75%] space-y-2">
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user"
                      ? "rounded-tr-sm bg-teal-600 text-white"
                      : "rounded-tl-sm bg-slate-100 text-slate-800"
                      }`}
                  >
                    {msg.content.split("\n").map((line, i) => (
                      <p key={i} className={i > 0 ? "mt-1" : ""}>{line}</p>
                    ))}
                  </div>
                  {msg.actions?.length > 0 && (
                    <div className="space-y-1">
                      {msg.actions.map((action, ai) => (
                        <div
                          key={ai}
                          className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700"
                        >
                          ✅ Action: {action.action} — {JSON.stringify(action.data).slice(0, 80)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex gap-2.5">
                <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-slate-800 text-xs font-bold text-white">
                  AI
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0ms" }} />
                    <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "200ms" }} />
                    <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "400ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="mt-3 flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask FinWise anything..."
          disabled={sending}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-100 disabled:opacity-50"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || sending}
          className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-600/20 transition-all hover:shadow-lg hover:shadow-teal-600/30 disabled:opacity-50 disabled:shadow-none"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
