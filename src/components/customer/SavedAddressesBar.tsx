import React, { useState } from "react";
import { Briefcase, Heart, Home, MapPin, Plus } from "lucide-react";
import { Language, SavedAddress } from "../../types";

interface SavedAddressesBarProps {
  lang: Language;
  addresses: SavedAddress[];
  onSelect: (addr: SavedAddress, field: "from" | "to") => void;
  onSaveCustom?: (address: string) => void;
}

const iconMap = {
  home: Home,
  work: Briefcase,
  custom: Heart,
};

export default function SavedAddressesBar({
  lang,
  addresses,
  onSelect,
  onSaveCustom,
}: SavedAddressesBarProps) {
  const [pickField, setPickField] = useState<"from" | "to" | null>(null);
  const [customInput, setCustomInput] = useState("");

  const label =
    lang === "uz" ? "Saqlangan manzillar" : lang === "ru" ? "Сохранённые адреса" : "Saved addresses";

  return (
    <div className="space-y-1.5">
      <p className="text-[9px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
        <MapPin className="w-3 h-3 text-teal-400" />
        {label}
      </p>
      <div className="flex flex-wrap gap-1">
        {addresses.map((addr) => {
          const Icon = iconMap[addr.icon];
          return (
            <div key={addr.id} className="flex gap-0.5">
              <button
                type="button"
                onClick={() => onSelect(addr, "from")}
                className="text-[8px] px-2 py-1 rounded-l-full border border-slate-800 bg-slate-900 text-gray-300 hover:border-teal-400/40 hover:text-teal-300 transition flex items-center gap-1"
                title={lang === "uz" ? "Qayerdan" : "From"}
              >
                <Icon className="w-2.5 h-2.5" />
                {addr.label[lang]} ↗
              </button>
              <button
                type="button"
                onClick={() => onSelect(addr, "to")}
                className="text-[8px] px-2 py-1 rounded-r-full border border-l-0 border-slate-800 bg-slate-950 text-gray-400 hover:border-teal-400/40 hover:text-teal-300 transition"
                title={lang === "uz" ? "Qayerga" : "To"}
              >
                →
              </button>
            </div>
          );
        })}
      </div>
      {onSaveCustom && (
        <div className="flex gap-1">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder={lang === "uz" ? "Yangi manzil..." : "New address..."}
            className="flex-1 text-[9px] bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white outline-none focus:border-teal-400"
          />
          <button
            type="button"
            onClick={() => {
              if (customInput.trim()) {
                onSaveCustom(customInput.trim());
                setCustomInput("");
              }
            }}
            className="p-1 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-400"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
