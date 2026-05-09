"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { postTrashTalk } from "./actions";
import { getAvatar } from "@/lib/avatars";
import type { TrashTalk } from "@/types/database";

interface Props {
  initialMessages: TrashTalk[];
  currentUserId: string;
}

const PLACEHOLDERS = [
  "Min gissning är genialisk och alla andras är fel...",
  "Vem tar guld? Försvara din gissning! 🏆",
  "Vilken grupp är dödsgruppen? Argumentera!",
  "Skriv något kontroversiellt om Mbappe...",
  "Argentina eller Brasilien? Fight me 🥊",
  "Skyttekungen? Jag har redan vunnit i huvudet...",
  "Hur fel har du tänkt att ta? Berätta!",
  "Din gissning är sämst och det vet du! 😂",
];

function MessageBubble({ msg, isOwn }: { msg: TrashTalk; isOwn: boolean }) {
  const avatar = getAvatar(msg.avatar_key);
  const time = new Date(msg.created_at).toLocaleTimeString("sv-SE", {
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className={`flex gap-2.5 ${isOwn ? "flex-row-reverse" : ""}`}>
      <div
        className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-lg bg-gradient-to-br ${avatar?.gradient ?? "from-pitch to-pitch-light"}`}
      >
        {avatar?.emoji ?? "⚽"}
      </div>
      <div className={`max-w-[78%] space-y-0.5 flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
        <div className={`flex items-center gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
          <span className="text-[11px] font-bold text-green-500">{msg.username}</span>
          <span className="text-[10px] text-green-800">{time}</span>
        </div>
        <div
          className={`px-3 py-2 rounded-2xl text-sm text-white leading-snug shadow-sm ${
            isOwn
              ? "bg-gradient-to-br from-gold/25 to-yellow-600/15 border border-gold/25 rounded-tr-sm"
              : "bg-pitch-light/50 border border-pitch-light/30 rounded-tl-sm"
          }`}
        >
          {msg.message}
        </div>
      </div>
    </div>
  );
}

export default function TrashTalkWall({ initialMessages, currentUserId }: Props) {
  const [messages, setMessages]   = useState<TrashTalk[]>(initialMessages);
  const [text, setText]           = useState("");
  const [phIdx, setPhIdx]         = useState(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError]         = useState<string | null>(null);
  const bottomRef                 = useRef<HTMLDivElement>(null);
  const supabase                  = createClient();

  // Rotate placeholder text every 4 seconds
  useEffect(() => {
    const id = setInterval(() => setPhIdx((i) => (i + 1) % PLACEHOLDERS.length), 4_000);
    return () => clearInterval(id);
  }, []);

  // Supabase Realtime — live messages
  useEffect(() => {
    const channel = supabase
      .channel("spelarbänken_live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "trash_talk" }, (payload) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === (payload.new as TrashTalk).id)) return prev;
          return [...prev, payload.new as TrashTalk];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setError(null);
    const msg = text;
    setText("");
    startTransition(async () => {
      const result = await postTrashTalk(msg);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="rounded-2xl border border-pitch-light/20 bg-pitch/40 overflow-hidden shadow-inner">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-pitch-dark/80 to-pitch/60 border-b border-pitch-light/20 flex items-center gap-2">
        <span className="text-xl">🏟️</span>
        <div className="flex-1 min-w-0">
          <h2 className="font-bebas text-xl text-gold tracking-widest leading-none">SPELARBÄNKEN</h2>
          <p className="text-green-700 text-[10px] font-semibold">Provokationer, skryt och gissningar välkomnas</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-green-500 text-[10px] font-semibold">{messages.length} inlägg</span>
        </div>
      </div>

      {/* Message list */}
      <div className="h-72 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2 py-4">
            <span className="text-4xl">🦗</span>
            <p className="text-green-600 text-sm font-semibold">Tystare än ett tomt Råsunda...</p>
            <p className="text-green-700 text-xs">Var den första att starta buset!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} isOwn={msg.user_id === currentUserId} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-3 py-3 border-t border-pitch-light/20 flex gap-2">
        <input
          value={text}
          onChange={(e) => { setText(e.target.value); setError(null); }}
          maxLength={280}
          placeholder={PLACEHOLDERS[phIdx]}
          className="flex-1 bg-pitch-dark border border-pitch-light/30 rounded-xl px-3 py-2.5 text-sm text-white placeholder-green-800 focus:outline-none focus:ring-2 focus:ring-gold/25 focus:border-gold/35 transition-all"
        />
        <button
          type="submit"
          disabled={isPending || !text.trim()}
          className="shrink-0 bg-gold hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-pitch-dark font-bebas text-base tracking-widest px-4 rounded-xl transition-all active:scale-95"
        >
          AVFYRA 🚀
        </button>
      </form>
      {error && <p className="px-4 pb-3 text-red-400 text-xs">{error}</p>}
    </div>
  );
}
