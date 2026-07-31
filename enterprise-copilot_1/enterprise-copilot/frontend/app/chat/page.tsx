"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, FileText } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { api, Source } from "@/lib/api";

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};

const SUGGESTIONS = [
  "Which buildings have inspections overdue?",
  "Summarize every HVAC repair over $20,000",
  "When does the lease renew and what's the rent?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (question: string) => {
    if (!question.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", content: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.askQuestion(question);
      setMessages((m) => [...m, { role: "assistant", content: res.answer, sources: res.sources }]);
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `Something went wrong: ${e.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <PageHeader title="AI Chat" subtitle="Ask across every uploaded document." />

      <div className="flex-1 overflow-y-auto card p-6 mb-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <FileText size={28} className="text-muted mb-3" />
            <p className="text-sm text-muted mb-4 max-w-sm">
              Ask a question and I'll search every processed document for the answer, citing
              exactly where each fact came from.
            </p>
            <div className="flex flex-col gap-2 w-full max-w-md">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-sm text-left border border-border rounded-lg px-4 py-2.5 hover:border-accent hover:bg-accent/5 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                <div
                  className={
                    m.role === "user"
                      ? "bg-accent text-white rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[75%] text-sm"
                      : "max-w-[85%]"
                  }
                >
                  <p className={`text-sm whitespace-pre-wrap ${m.role === "assistant" ? "text-ink" : ""}`}>
                    {m.content}
                  </p>
                  {m.sources && m.sources.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {m.sources.map((s, j) => (
                        <span key={j} className="citation-pin" title={s.snippet}>
                          <FileText size={11} /> {s.filename} · p.{s.page}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <Loader2 size={14} className="animate-spin" /> Searching documents…
              </div>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your leases, inspections, invoices…"
          className="flex-1 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-accent text-white px-4 rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
