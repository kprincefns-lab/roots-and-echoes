"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { ChatMessage, FamilyMember } from "@/types/family";

interface DigitalCloneTabProps {
  member: FamilyMember;
  allMembers: FamilyMember[];
}

export function DigitalCloneTab({ member, allMembers }: DigitalCloneTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: `greet-${member.id}`,
      role: "assistant",
      content: member.persona.greeting,
      timestamp: 0,
      mode: "simulated",
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [activeMode, setActiveMode] = useState<"live" | "simulated">("simulated");
  const bottomRef = useRef<HTMLDivElement>(null);
  const msgCounterRef = useRef(1);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isThinking) return;

    const seq = msgCounterRef.current++;
    const userMsg: ChatMessage = {
      id: `u-${seq}`,
      role: "user",
      content: trimmed,
      timestamp: seq,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");
    setIsThinking(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member,
          allMembers,
          messages: nextHistory,
        }),
      });

      const data = (await res.json()) as {
        reply?: string;
        mode?: "live" | "simulated";
      };

      // Subtle archival pacing so simulated replies feel contemplative and human
      await new Promise((resolve) => setTimeout(resolve, 420));

      const mode = data.mode === "live" ? "live" : "simulated";
      setActiveMode(mode);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content:
            data.reply ||
            `It's wonderful to hear from you. ${member.beliefs.philosophy}`,
          timestamp: Date.now(),
          mode,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: `Forgive the static on the line—let me gather my thoughts. ${member.beliefs.adviceForFuture}`,
          timestamp: Date.now(),
          mode: "simulated",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  return (
    <div className="flex h-[54vh] min-h-[380px] flex-col">
      {/* Persona Header Strip */}
      <div className="mb-3 flex items-center justify-between rounded-xl border border-[#D4A359]/20 bg-[#0B110E]/75 px-3.5 py-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#F5F2EB]">
            <Sparkles className="h-3.5 w-3.5 text-[#D4A359]" />
            <span>Converse with {member.firstName}</span>
          </div>
          <p className="truncate text-[10.5px] text-[#A6A095]">
            {member.persona.era} · {member.persona.traits.slice(0, 3).join(", ")}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
            activeMode === "live"
              ? "border border-emerald-400/35 bg-emerald-500/15 text-emerald-300"
              : "border border-[#D4A359]/30 bg-[#D4A359]/10 text-[#E6C385]"
          }`}
        >
          {activeMode === "live" ? "Live AI Echo" : "Archival Echo"}
        </span>
      </div>

      {/* Chat Messages */}
      <div className="archival-scroll flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[86%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed ${
                  isUser
                    ? "rounded-br-sm bg-[#D4A359] text-[#090D0B] font-medium"
                    : "rounded-bl-sm border border-[#D4A359]/20 bg-[#121B16]/90 text-[#F5F2EB]/92"
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}

        {isThinking && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-[#D4A359]/20 bg-[#121B16]/90 px-4 py-3 text-xs text-[#D4A359]">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D4A359] [animation-delay:-0.2s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D4A359] [animation-delay:-0.1s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D4A359]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested Conversation Starters */}
      {member.persona.suggestedPrompts.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {member.persona.suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={isThinking}
              onClick={() => void sendMessage(prompt)}
              className="rounded-full border border-[#D4A359]/22 bg-[#0B110E]/70 px-3 py-1 text-[11px] text-[#E6C385]/90 transition hover:border-[#D4A359]/55 hover:bg-[#D4A359]/12 disabled:opacity-40 cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask ${member.firstName} a question...`}
          className="flex-1 rounded-full border border-[#D4A359]/25 bg-[#0B110E]/85 px-4 py-2.5 text-xs text-[#F5F2EB] placeholder:text-[#A6A095]/60 focus:border-[#D4A359]/65 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || isThinking}
          aria-label="Send message"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D4A359] text-[#090D0B] transition hover:bg-[#E6C385] disabled:opacity-40 cursor-pointer"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
