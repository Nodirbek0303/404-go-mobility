import React from "react";
import { Headphones, Phone, Send } from "lucide-react";
import type { Language } from "../../types";
import { SUPPORT_CONTACT } from "../../supportContact";

interface SupportContactPanelProps {
  lang: Language;
}

export default function SupportContactPanel({ lang }: SupportContactPanelProps) {
  const title =
    lang === "uz" ? "Yordam va aloqa" : lang === "ru" ? "Помощь и связь" : "Help & contact";
  const intro =
    lang === "uz"
      ? "Savol, taklif yoki muammo bo'lsa — biz bilan bog'laning. 404 TAXI yordam xizmati 24/7 ishlaydi."
      : lang === "ru"
        ? "Если есть вопрос, предложение или проблема — свяжитесь с нами. Служба поддержки 404 TAXI работает 24/7."
        : "Questions, feedback, or issues? Contact us anytime. 404 TAXI support is available 24/7.";
  const callLabel = lang === "uz" ? "Telefon orqali qo'ng'iroq" : lang === "ru" ? "Позвонить" : "Call us";
  const telegramLabel =
    lang === "uz" ? "Telegram orqali yozish" : lang === "ru" ? "Написать в Telegram" : "Message on Telegram";
  const writeHint =
    lang === "uz"
      ? "Telegramda @evanshar03 ga yozing yoki +998 95 599 77 03 raqamiga qo'ng'iroq qiling."
      : lang === "ru"
        ? "Напишите @evanshar03 в Telegram или позвоните +998 95 599 77 03."
        : "Write to @evanshar03 on Telegram or call +998 95 599 77 03.";

  return (
    <div className="bg-gradient-to-br from-teal-950/40 to-slate-950 p-3.5 rounded-xl border border-teal-500/25 space-y-3">
      <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
        <Headphones className="w-3.5 h-3.5 text-teal-400" />
        {title}
      </h4>
      <p className="text-[11px] text-gray-300 leading-relaxed">{intro}</p>
      <p className="text-[10px] text-teal-300/90 font-medium">{writeHint}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <a
          href={`tel:${SUPPORT_CONTACT.phoneTel}`}
          className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-400/50 transition"
        >
          <Phone className="w-4 h-4 text-teal-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] text-gray-500">{callLabel}</p>
            <p className="text-xs font-bold text-white">{SUPPORT_CONTACT.phoneDisplay}</p>
          </div>
        </a>
        <a
          href={SUPPORT_CONTACT.telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-400/50 transition"
        >
          <Send className="w-4 h-4 text-blue-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] text-gray-500">{telegramLabel}</p>
            <p className="text-xs font-bold text-white">{SUPPORT_CONTACT.telegramHandle}</p>
          </div>
        </a>
      </div>
    </div>
  );
}
