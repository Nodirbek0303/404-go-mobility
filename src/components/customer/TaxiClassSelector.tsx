import React from "react";
import { Car, Crown, Clock } from "lucide-react";
import type { Language } from "../types";
import { TAXI_CLASSES, type TaxiClassId } from "../../taxiClasses";

interface TaxiClassSelectorProps {
  lang: Language;
  selected: TaxiClassId;
  basePrice: number;
  onSelect: (id: TaxiClassId) => void;
}

export default function TaxiClassSelector({ lang, selected, basePrice, onSelect }: TaxiClassSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">
        {lang === "uz" ? "Tarif tanlash" : lang === "ru" ? "Выбор тарифа" : "Select tariff"}
      </p>
      <div className="space-y-1.5">
        {TAXI_CLASSES.map((cls) => {
          const price = Math.round(basePrice * cls.multiplier);
          const active = selected === cls.id;
          return (
            <button
              key={cls.id}
              type="button"
              onClick={() => onSelect(cls.id)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition text-left ${
                active
                  ? "bg-blue-600/20 border-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.25)]"
                  : "bg-slate-950/80 border-slate-800 hover:border-blue-500/40"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  active ? "bg-blue-600 text-white" : "bg-slate-900 text-blue-400"
                }`}
              >
                {cls.icon === "crown" ? <Crown className="w-4 h-4" /> : <Car className="w-4 h-4" />}
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${active ? "text-white" : "text-gray-200"}`}>
                    {cls.name[lang]}
                  </span>
                  <span className="text-[9px] text-gray-500 flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />~{cls.etaMin} {lang === "uz" ? "daq" : "min"}
                  </span>
                </div>
                <p className="text-[9px] text-gray-500 truncate">{cls.desc[lang]}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-xs font-mono font-bold ${active ? "text-blue-300" : "text-gray-300"}`}>
                  {price.toLocaleString()}
                </p>
                <p className="text-[8px] text-gray-500">so'm</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
