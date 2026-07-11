import React, { useEffect, useRef, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import type { DriverChatMessage, Language } from "../types";
import { appendRideChat, nowChatTime, subscribeRideChat } from "../utils/rideChatStorage";

interface RideChatPanelProps {
  orderId: string;
  chatKey: string;
  lang: Language;
  /** Kim yozmoqda: mijoz yoki haydovchi */
  role: "user" | "driver";
  customerName: string;
  driverName: string;
  initialMessages?: DriverChatMessage[];
  disabled?: boolean;
  onChatChange?: (messages: DriverChatMessage[]) => void;
  className?: string;
}

export default function RideChatPanel({
  orderId,
  chatKey,
  lang,
  role,
  customerName,
  driverName,
  initialMessages = [],
  disabled = false,
  onChatChange,
  className = "",
}: RideChatPanelProps) {
  const [messages, setMessages] = useState<DriverChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const onChatChangeRef = useRef(onChatChange);
  onChatChangeRef.current = onChatChange;

  useEffect(() => {
    setMessages(initialMessages);
  }, [orderId]);

  useEffect(() => {
    if (!chatKey) return;
    return subscribeRideChat(chatKey, (stored) => {
      setMessages(stored);
      onChatChangeRef.current?.(stored);
    });
  }, [chatKey]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const t = {
    title:
      role === "driver"
        ? lang === "uz"
          ? "Mijoz bilan chat"
          : lang === "ru"
            ? "Чат с клиентом"
            : "Chat with passenger"
        : lang === "uz"
          ? "Haydovchi bilan chat"
          : lang === "ru"
            ? "Чат с водителем"
            : "Chat with driver",
    placeholder:
      role === "driver"
        ? lang === "uz"
          ? "Mijozga xabar yozing..."
          : lang === "ru"
            ? "Сообщение клиенту..."
            : "Message to passenger..."
        : lang === "uz"
          ? "Haydovchiga xabar yozing..."
          : lang === "ru"
            ? "Сообщение водителю..."
            : "Message to driver...",
    send: lang === "uz" ? "Yuborish" : lang === "ru" ? "Отправить" : "Send",
    empty: lang === "uz" ? "Xabarlar shu yerda ko'rinadi" : lang === "ru" ? "Сообщения появятся здесь" : "Messages appear here",
  };

  const quickReplies =
    role === "driver"
      ? lang === "uz"
        ? ["5 daqiqada yetaman", "Manzilga keldim", "Qayerdasiz?"]
        : lang === "ru"
          ? ["Буду через 5 мин", "На месте", "Где вы?"]
          : ["Arriving in 5 min", "I'm here", "Where are you?"]
      : lang === "uz"
        ? ["Men shu yerda", "5 daqiqada chiqaman", "Kirish eshigida"]
        : lang === "ru"
          ? ["Я на месте", "Выйду через 5 мин", "У входа"]
          : ["I'm here", "Coming in 5 min", "At the entrance"];

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || disabled || !chatKey) return;

    const msg: DriverChatMessage = {
      id: `${role}-${Date.now()}`,
      sender: role,
      content: trimmed,
      timestamp: nowChatTime(),
    };

    const next = appendRideChat(chatKey, msg);
    setMessages(next);
    onChatChange?.(next);
    setDraft("");
  };

  return (
    <div className={`bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-2 ${className}`}>
      <p className="text-[9px] font-bold text-white uppercase tracking-wide flex items-center gap-1">
        <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
        {t.title}
        {messages.length > 0 && (
          <span className="ml-auto text-[8px] font-mono text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
            {messages.length}
          </span>
        )}
      </p>

      <div className="max-h-[120px] overflow-y-auto space-y-1.5 pr-0.5 scrollbar-none min-h-[48px]">
        {messages.length === 0 ? (
          <p className="text-[9px] text-gray-500 text-center py-3">{t.empty}</p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender === role;
            const label = msg.sender === "user" ? customerName : driverName;
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[88%] rounded-xl px-2.5 py-1.5 text-[9px] leading-snug ${
                    isMine
                      ? "bg-blue-500 text-white rounded-tr-none"
                      : "bg-slate-950 text-gray-200 border border-slate-850 rounded-tl-none"
                  }`}
                >
                  <p className="font-semibold text-[7px] opacity-75 mb-0.5 truncate">{label}</p>
                  {msg.content}
                  <p className="text-[6px] text-right mt-0.5 opacity-60 font-mono">{msg.timestamp}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {!disabled && (
        <>
          <div className="flex gap-1 flex-wrap">
            {quickReplies.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                className="text-[8px] px-2 py-0.5 rounded-full border border-slate-700 text-gray-400 hover:text-white hover:border-blue-500/40 transition"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="flex gap-1.5">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(draft)}
              placeholder={t.placeholder}
              className="flex-1 bg-slate-950 text-[10px] text-white px-2 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-blue-400"
            />
            <button
              type="button"
              onClick={() => send(draft)}
              disabled={!draft.trim()}
              className="bg-blue-500 hover:bg-blue-400 disabled:opacity-40 text-white p-1.5 rounded-lg transition shrink-0"
              title={t.send}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
