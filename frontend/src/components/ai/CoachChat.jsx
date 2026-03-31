import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Sparkles, User, Bot, Send, RotateCcw, MessageSquare } from "lucide-react";

const renderContent = (text = "") => {
  const segments = text.split(/(\*\*[^*]+\*\*)/g);
  return segments.map((segment, index) => {
    if (segment.startsWith("**") && segment.endsWith("**")) {
      return <strong key={`strong-${index}`}>{segment.slice(2, -2)}</strong>;
    }
    return <span key={`text-${index}`}>{segment}</span>;
  });
};

export default function CoachChat({ messages, onSend, isSending, suggestions = [], onClear, isClearing = false }) {
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  const virtualMessages = useMemo(() => messages.slice(Math.max(0, messages.length - 120)), [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [virtualMessages, isSending]);

  const submit = (e) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="glass-card flex h-[78vh] flex-col overflow-hidden rounded-3xl border border-white/5 ring-1 ring-white/10">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/20">
            <Bot size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Aria AI</h3>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Active Coach</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onClear} 
          disabled={isClearing}
          className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-xs font-bold text-white/60 transition-all hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw size={14} />
          <span>{isClearing ? "Resetting..." : "Reset"}</span>
        </button>
      </div>

      {/* Messages Container */}
      <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto px-6 py-6 scroll-smooth custom-scrollbar">
        {virtualMessages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center space-y-4 opacity-30">
            <MessageSquare size={48} />
            <p className="text-sm font-medium">Start a conversation with Aria...</p>
          </div>
        )}
        
        {virtualMessages.map((msg, index) => (
          <div key={`${msg.role}-${index}`} className={`flex w-full animate-floatIn gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white ring-1 ${
              msg.role === "user" ? "bg-bg-muted ring-white/10" : "bg-brand-500 ring-brand-400/20"
            }`}>
              {msg.role === "user" ? <User size={16} /> : <Sparkles size={16} />}
            </div>
            
            <div className={`flex flex-col gap-1.5 ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-lg ${
                  msg.role === "user" 
                    ? "bg-brand-500 text-white rounded-tr-none" 
                    : "bg-white/5 text-white/90 ring-1 ring-white/10 rounded-tl-none border-l-2 border-brand-500"
                }`}
              >
                <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
                  {renderContent(msg.content)}
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">
                {msg.role === "user" ? "You" : "Aria AI"}
              </span>
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex animate-floatIn gap-4">
             <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white ring-1 ring-brand-400/20">
                <Sparkles size={16} className="animate-pulse" />
             </div>
             <div className="inline-flex items-center gap-2 rounded-2xl rounded-tl-none bg-white/5 px-5 py-3 ring-1 ring-white/10 border-l-2 border-brand-500">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-400" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-400 [animation-delay:200ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-400 [animation-delay:400ms]" />
                </span>
             </div>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="border-t border-white/5 bg-white/[0.01] p-6">
        {suggestions.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onSend(suggestion)}
                className="rounded-full border border-brand-500/20 bg-brand-500/5 px-4 py-1.5 text-xs font-bold text-brand-300 transition-all hover:bg-brand-500/10 hover:border-brand-500/40"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={submit} className="relative group">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isSending}
            placeholder="Type your message to Aria..."
            className="w-full rounded-2xl bg-white/5 pl-6 pr-14 py-4 text-sm outline-none ring-1 ring-white/10 transition-all focus:ring-2 focus:ring-brand-500/50 disabled:opacity-50"
          />
          <button 
            type="submit" 
            disabled={isSending || !input.trim()} 
            className="absolute right-2 top-2 h-10 w-10 flex items-center justify-center rounded-xl bg-brand-500 text-white shadow-lg shadow-brand-500/20 transition-all hover:bg-brand-600 active:scale-95 disabled:opacity-30 disabled:grayscale"
          >
            {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}

