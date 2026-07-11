import React from "react";
import { Shield, Clock, BadgeCheck, Headphones, CreditCard, Zap, Gift } from "lucide-react";
import type { Language } from "../../types";

interface Why404PanelProps {
  lang: Language;
}

export default function Why404Panel({ lang }: Why404PanelProps) {
  const reasons = [
    {
      icon: Zap,
      title: lang === "uz" ? "Tez yetib kelish" : lang === "ru" ? "Быстрая подача" : "Fast arrival",
      desc: lang === "uz" ? "3 daqiqadan" : lang === "ru" ? "от 3 минут" : "from 3 min",
    },
    {
      icon: BadgeCheck,
      title: lang === "uz" ? "Halol narx" : lang === "ru" ? "Честные цены" : "Fair prices",
      desc: lang === "uz" ? "GPS bo'yicha" : lang === "ru" ? "по GPS" : "GPS-based",
    },
    {
      icon: Shield,
      title: lang === "uz" ? "Xavfsiz safar" : lang === "ru" ? "Безопасные поездки" : "Safe trips",
      desc: lang === "uz" ? "Tekshirilgan haydovchi" : lang === "ru" ? "Проверенные водители" : "Verified drivers",
    },
    {
      icon: Headphones,
      title: lang === "uz" ? "24/7 yordam" : lang === "ru" ? "Поддержка 24/7" : "24/7 support",
      desc: "support@404.taxi",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-br from-blue-950 to-slate-950 border border-blue-500/30 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">
            {lang === "uz" ? "Nega 404 TAXI?" : lang === "ru" ? "Почему 404 TAXI?" : "Why 404 TAXI?"}
          </h3>
          <span className="text-[9px] font-mono text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/30">
            24/7
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {reasons.map((r) => (
            <div key={r.title} className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80">
              <r.icon className="w-3.5 h-3.5 text-blue-400 mb-1.5" />
              <p className="text-[10px] font-bold text-white leading-tight">{r.title}</p>
              <p className="text-[9px] text-gray-500 mt-0.5">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <p className="text-[10px] font-bold text-white">
              {lang === "uz" ? "Xavfsizlik" : lang === "ru" ? "Безопасность" : "Safety first"}
            </p>
          </div>
          <ul className="text-[9px] text-gray-400 space-y-1">
            <li>• {lang === "uz" ? "Haydovchi tekshiruvi" : "Driver verification"}</li>
            <li>• {lang === "uz" ? "Jonli kuzatuv" : "Live tracking"}</li>
            <li>• {lang === "uz" ? "SOS tugmasi" : "SOS button"}</li>
          </ul>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-blue-400" />
            <p className="text-[10px] font-bold text-white">
              {lang === "uz" ? "To'lov" : lang === "ru" ? "Оплата" : "Payments"}
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            {["Payme", "Click", "Uzum", "Naqd"].map((p) => (
              <span key={p} className="text-[8px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-gray-300">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
          <Gift className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-amber-300">
            {lang === "uz" ? "1% cashback har safar" : lang === "ru" ? "1% кэшбэк за поездку" : "1% cashback every ride"}
          </p>
          <p className="text-[9px] text-gray-400">
            {lang === "uz" ? "Hamyon → Kupondan foydalaning" : "Use coupons in Wallet"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[9px] text-gray-500 px-1">
        <Clock className="w-3 h-3" />
        <span>+998 90 123 45 67 · Toshkent · support@404.taxi</span>
      </div>
    </div>
  );
}
