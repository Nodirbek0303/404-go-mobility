import React from "react";
import { BadgeCheck, Car, Star } from "lucide-react";
import { Booking, Language } from "../../types";

interface DriverProfileCardProps {
  lang: Language;
  order: Booking;
}

export default function DriverProfileCard({ lang, order }: DriverProfileCardProps) {
  const trips = order.driverTrips ?? 0;
  const verified = order.driverVerified ?? true;
  const rating = order.rating ?? 4.85;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500/30 to-cyan-600/20 border border-teal-400/30 flex items-center justify-center shrink-0">
        <span className="text-sm font-bold text-teal-300">
          {(order.driverFirstName?.[0] || order.driverName?.[0] || "H").toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] font-bold text-white truncate">
            {order.driverName || (lang === "uz" ? "Haydovchi" : "Driver")}
          </p>
          {verified && (
            <BadgeCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" title={lang === "uz" ? "Tasdiqlangan" : "Verified"} />
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="flex items-center gap-0.5 text-[9px] text-amber-400">
            <Star className="w-3 h-3 fill-amber-400" />
            {rating.toFixed(2)}
          </span>
          <span className="text-[8px] text-gray-500">
            {trips.toLocaleString()} {lang === "uz" ? "safar" : lang === "ru" ? "поездок" : "trips"}
          </span>
        </div>
        {order.carName && (
          <p className="text-[9px] text-gray-400 mt-1 flex items-center gap-1 truncate">
            <Car className="w-3 h-3 shrink-0" />
            {order.carName} · {order.carNumber}
          </p>
        )}
      </div>
    </div>
  );
}
