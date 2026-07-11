import React, { useMemo, useState } from "react";
import {
  X,
  LayoutDashboard,
  Map,
  ClipboardList,
  BarChart3,
  Settings,
  Users,
  Car,
  DollarSign,
} from "lucide-react";
import type { Booking, Language } from "../../types";
import SmartMap from "../maps/SmartMap";

interface AdminPortalProps {
  lang: Language;
  bookings: Booking[];
  onClose: () => void;
}

type AdminTab = "dashboard" | "map" | "orders" | "analytics" | "settings";

export default function AdminPortal({ lang, bookings, onClose }: AdminPortalProps) {
  const [tab, setTab] = useState<AdminTab>("dashboard");

  const stats = useMemo(() => {
    const active = bookings.filter((b) => b.status === "active").length;
    const completed = bookings.filter((b) => b.status === "completed").length;
    const revenue = bookings.reduce((s, b) => s + (b.price || 0), 0);
    return { active, completed, revenue, total: bookings.length };
  }, [bookings]);

  const tabs: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "dashboard", label: lang === "uz" ? "Dashboard" : "Dashboard", icon: LayoutDashboard },
    { id: "map", label: lang === "uz" ? "Xarita" : lang === "ru" ? "Карта" : "Map", icon: Map },
    { id: "orders", label: lang === "uz" ? "Buyurtmalar" : lang === "ru" ? "Заказы" : "Orders", icon: ClipboardList },
    { id: "analytics", label: lang === "uz" ? "Analitika" : lang === "ru" ? "Аналитика" : "Analytics", icon: BarChart3 },
    { id: "settings", label: lang === "uz" ? "Sozlamalar" : lang === "ru" ? "Настройки" : "Settings", icon: Settings },
  ];

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950 flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-blue-950/40">
        <div>
          <h1 className="text-sm font-bold text-white">404 TAXI · Admin</h1>
          <p className="text-[9px] text-blue-300/80">
            {lang === "uz" ? "Boshqaruv paneli" : lang === "ru" ? "Панель управления" : "Control panel"}
          </p>
        </div>
        <button type="button" onClick={onClose} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </header>

      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {tab === "dashboard" && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { icon: ClipboardList, label: lang === "uz" ? "Jami" : "Total", value: stats.total, color: "text-blue-400" },
                { icon: Car, label: lang === "uz" ? "Faol" : "Active", value: stats.active, color: "text-emerald-400" },
                { icon: Users, label: lang === "uz" ? "Yakunlangan" : "Done", value: stats.completed, color: "text-amber-400" },
                { icon: DollarSign, label: lang === "uz" ? "Daromad" : "Revenue", value: `${(stats.revenue / 1000).toFixed(0)}k`, color: "text-teal-400" },
              ].map((s) => (
                <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <s.icon className={`w-4 h-4 ${s.color} mb-2`} />
                  <p className="text-lg font-mono font-bold text-white">{s.value}</p>
                  <p className="text-[9px] text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase">
                {lang === "uz" ? "So'nggi buyurtmalar" : "Recent orders"}
              </p>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {bookings.slice(0, 8).map((b) => (
                  <div key={b.id} className="flex items-center justify-between text-[10px] py-1.5 border-b border-slate-800/60 last:border-0">
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{b.title[lang] || b.title.uz}</p>
                      <p className="text-gray-500 truncate">{b.from} → {b.to}</p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="font-mono text-blue-300">{b.price.toLocaleString()}</p>
                      <p className={b.status === "active" ? "text-emerald-400" : "text-gray-500"}>{b.status}</p>
                    </div>
                  </div>
                ))}
                {bookings.length === 0 && <p className="text-gray-500 text-xs py-4 text-center">—</p>}
              </div>
            </div>
          </>
        )}

        {tab === "map" && (
          <div className="h-[420px] rounded-xl overflow-hidden border border-slate-800">
            <SmartMap
              compact={false}
              showRoute={false}
              lang={lang}
              activeFrom={lang === "uz" ? "Markaz" : "Center"}
              activeTo=""
              driverName={lang === "uz" ? "Avtopark" : "Fleet"}
            />
          </div>
        )}

        {tab === "orders" && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-[10px]">
              <thead className="bg-slate-950 text-gray-400">
                <tr>
                  <th className="text-left p-2 font-medium">ID</th>
                  <th className="text-left p-2 font-medium">{lang === "uz" ? "Yo'nalish" : "Route"}</th>
                  <th className="text-right p-2 font-medium">{lang === "uz" ? "Narx" : "Price"}</th>
                  <th className="text-right p-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-t border-slate-800/80">
                    <td className="p-2 font-mono text-gray-500">{b.id.slice(-6)}</td>
                    <td className="p-2 text-white truncate max-w-[140px]">
                      {b.from} → {b.to}
                    </td>
                    <td className="p-2 text-right font-mono text-blue-300">{b.price.toLocaleString()}</td>
                    <td className="p-2 text-right">
                      <span
                        className={`px-1.5 py-0.5 rounded ${
                          b.status === "active" ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-800 text-gray-400"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "analytics" && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-white">
              {lang === "uz" ? "Haftalik ko'rsatkichlar" : "Weekly metrics"}
            </p>
            <div className="flex items-end gap-2 h-28">
              {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t bg-blue-600/80" style={{ height: `${h}%` }} />
                  <span className="text-[8px] text-gray-500">{["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"][i]}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400">
              {lang === "uz"
                ? `Jami daromad: ${stats.revenue.toLocaleString()} so'm`
                : `Total revenue: ${stats.revenue.toLocaleString()} UZS`}
            </p>
          </div>
        )}

        {tab === "settings" && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 text-[11px] text-gray-300">
            <p className="font-bold text-white text-xs mb-2">{lang === "uz" ? "Platforma" : "Platform"}</p>
            <p>• support@404.taxi</p>
            <p>• +998 90 123 45 67</p>
            <p>• Toshkent, O'zbekiston</p>
            <p className="text-gray-500 pt-2">404 TAXI Admin · demo rejim</p>
          </div>
        )}
      </div>

      <nav className="flex border-t border-slate-800 bg-slate-950/95 px-1 py-1.5 gap-0.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[8px] ${
              tab === t.id ? "bg-blue-600/20 text-blue-300" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
