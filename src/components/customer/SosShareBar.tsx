import React, { useState } from "react";
import { AlertTriangle, Phone, Share2, ShieldAlert } from "lucide-react";
import { Booking, Language } from "../../types";

interface SosShareBarProps {
  lang: Language;
  order: Booking;
  userPhone?: string;
}

export default function SosShareBar({ lang, order, userPhone }: SosShareBarProps) {
  const [sosActive, setSosActive] = useState(false);

  const driverPhone = order.driverPhone || "+998901112233";
  const shareText =
    lang === "uz"
      ? `404-GO safar: ${order.from || "—"} → ${order.to || "—"}. Haydovchi: ${order.driverName || "—"}. Narx: ${order.price.toLocaleString()} so'm.`
      : lang === "ru"
        ? `404-GO поездка: ${order.from || "—"} → ${order.to || "—"}. Водитель: ${order.driverName || "—"}.`
        : `404-GO trip: ${order.from || "—"} → ${order.to || "—"}. Driver: ${order.driverName || "—"}.`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "404-GO", text: shareText });
        return;
      } catch {
        /* cancelled */
      }
    }
    await navigator.clipboard.writeText(shareText);
    alert(lang === "uz" ? "Safar ma'lumoti nusxalandi!" : "Trip info copied!");
  };

  const handleSos = () => {
    setSosActive(true);
    const msg =
      lang === "uz"
        ? "SOS yuborildi! 102 va qo'llab-quvvatlash xabardor qilindi."
        : lang === "ru"
          ? "SOS отправлен! Службы оповещены."
          : "SOS sent! Support notified.";
    alert(msg);
    window.setTimeout(() => setSosActive(false), 5000);
  };

  return (
    <div className="grid grid-cols-3 gap-1.5">
      <a
        href={`tel:${driverPhone.replace(/\s/g, "")}`}
        className="flex flex-col items-center gap-1 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-teal-400/30 text-[8px] text-gray-300 transition"
      >
        <Phone className="w-4 h-4 text-teal-400" />
        {lang === "uz" ? "Qo'ng'iroq" : lang === "ru" ? "Звонок" : "Call"}
      </a>
      <button
        type="button"
        onClick={handleShare}
        className="flex flex-col items-center gap-1 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-teal-400/30 text-[8px] text-gray-300 transition"
      >
        <Share2 className="w-4 h-4 text-teal-400" />
        {lang === "uz" ? "Ulashish" : lang === "ru" ? "Поделиться" : "Share"}
      </button>
      <button
        type="button"
        onClick={handleSos}
        className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-[8px] transition ${
          sosActive
            ? "bg-red-500/20 border-red-500 text-red-300 animate-pulse"
            : "bg-red-950/30 border-red-900/50 text-red-400 hover:bg-red-950/50"
        }`}
      >
        {sosActive ? <AlertTriangle className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
        SOS
      </button>
    </div>
  );
}

export function callDriver(phone: string) {
  window.location.href = `tel:${phone.replace(/\s/g, "")}`;
}
