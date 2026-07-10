import React from "react";
import { Bell, Check, Trash2, X } from "lucide-react";
import { AppNotification, Language } from "../../types";

interface NotificationPanelProps {
  lang: Language;
  notifications: AppNotification[];
  open: boolean;
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClear: () => void;
}

export default function NotificationPanel({
  lang,
  notifications,
  open,
  onClose,
  onMarkRead,
  onMarkAllRead,
  onClear,
}: NotificationPanelProps) {
  if (!open) return null;

  const unread = notifications.filter((n) => !n.read).length;
  const title =
    lang === "uz" ? "Bildirishnomalar" : lang === "ru" ? "Уведомления" : "Notifications";

  return (
    <div className="fixed inset-0 z-[90]">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close" />
      <div className="absolute top-14 right-2 left-2 sm:left-auto sm:w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-bold text-white">{title}</span>
            {unread > 0 && (
              <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">{unread}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unread > 0 && (
              <button type="button" onClick={onMarkAllRead} className="text-[9px] text-teal-400 px-2 py-1">
                {lang === "uz" ? "O'qildi" : lang === "ru" ? "Прочитано" : "Read all"}
              </button>
            )}
            <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <p className="text-[10px] text-gray-500 text-center py-8">
              {lang === "uz" ? "Bildirishnomalar yo'q" : lang === "ru" ? "Нет уведомлений" : "No notifications"}
            </p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => onMarkRead(n.id)}
                className={`w-full text-left p-3 border-b border-slate-850 hover:bg-slate-850/50 transition ${
                  !n.read ? "bg-teal-500/5" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold text-white">{n.title[lang]}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5 leading-snug">{n.body[lang]}</p>
                    <p className="text-[8px] text-gray-600 mt-1">{n.createdAt}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 bg-teal-400 rounded-full shrink-0 mt-1" />}
                </div>
              </button>
            ))
          )}
        </div>
        {notifications.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center justify-center gap-1 p-2 text-[9px] text-red-400 border-t border-slate-800 hover:bg-red-950/20"
          >
            <Trash2 className="w-3 h-3" />
            {lang === "uz" ? "Tozalash" : lang === "ru" ? "Очистить" : "Clear all"}
          </button>
        )}
      </div>
    </div>
  );
}

export function createNotification(
  partial: Omit<AppNotification, "id" | "read" | "createdAt">
): AppNotification {
  return {
    ...partial,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    read: false,
    createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}
