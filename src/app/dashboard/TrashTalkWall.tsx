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

function MessageBubble({ msg, isOwn }: { msg: TrashTalk; isOwn: boolean }) {
  const avatar = getAvatar(msg.avatar_key);
  const time = new Date(msg.created_at).toLocaleTimeString("sv-SE", {
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
      <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br ${avatar?.gradient ?? "from-pitch to-pitch-light"}`}>
        {avatar?.emoji ?? "⚽"}
      </div>
      <div className={`max-w-[75%] space-y-0.5 ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
        <div className={`flex items-center gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
          <span className="text-xs text-green-500 font-semibold">{msg.username}</span>
          <span className="text-xs text-green-800">{time}</span>
        </div>
        <div className={`px-3 py-2 rounded-2xl text-sm text-white leading-snug ${
          isOwn
            ? "bg-gold/20 border border-gold/30 rounded-tr-sm"
            : "bg-pitch-light/60 border border-pitch-light/40 rounded-tl-sm"
        }`}>
          {msg.message}
        </div>
      </div>
    </div>
  );
}

export default function TrashTalkWall({ initialMessages, currentUserId }: Props) {
  const [messages, setMessages] = useState<TrashTalk[]>(initialMessages);
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Supabase Realtime — live incoming messages
  useEffect(() => {
    const channel = supabase
      .channel("trash_talk_live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "trash_talk" },
        (payload) => {
          setMessages((prev) => {
            // Avoid duplicates (own messages arrive via server action too)
            if (prev.some((m) => m.id === (payload.new as TrashTalk).id)) return prev;
            return [...prev, payload.new as TrashTalk];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  // Scroll to bottom when new messages arrive
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
    <div className="rounded-2xl border border-pitch-light/30 bg-pitch/40 overflow-hidden">
      <div className="px-4 py-3 border-b border-pitch-light/20 flex items-center gap-2">
        <span className="text-lg">💬</span>
        <h2 className="font-bebas text-xl text-gold tracking-widest">TRASH TALK</h2>
        <span className="text-green-600 text-xs ml-auto">{messages.length} meddelanden</span>
      </div>

      {/* Message list */}
      <div className="h-72 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
        {messages.length === 0 && (
          <p className="text-center text-green-700 text-sm py-8">
            Inga meddelanden ännu — var först med lite banter! 🔥
          </p>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} isOwn={msg.user_id === currentUserId} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-pitch-light/20 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={280}
          placeholder="Säg något provokativt..."
          className="flex-1 bg-pitch-dark border border-pitch-light/40 rounded-xl px-3 py-2 text-sm text-white placeholder-green-700 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40"
        />
        <button
          type="submit"
          disabled={isPending || !text.trim()}
          className="bg-gold hover:bg-yellow-400 disabled:opacity-40 text-pitch-dark font-bebas text-lg tracking-widest px-4 rounded-xl transition-all active:scale-95"
        >
          SKICKA
        </button>
      </form>
      {error && <p className="px-4 pb-3 text-red-400 text-xs">{error}</p>}
    </div>
  );
}
