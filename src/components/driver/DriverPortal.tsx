import React, { useEffect, useRef, useState } from "react";
import { Car, MapPin, Navigation, Phone, Power, User } from "lucide-react";
import type { DriverRecord, GeoPoint, OrderRecord } from "../../../lib/store/types";
import {
  driverAcceptPlatformOrder,
  getPlatformDriver,
  listPlatformDrivers,
  setDriverStatus,
  updateDriverPlatformLocation,
} from "../../services/platformApi";
import SmartMap from "../maps/SmartMap";
import RideChatPanel from "../RideChatPanel";
import { appendRideChat, loadRideChat, nowChatTime } from "../../utils/rideChatStorage";

interface DriverPortalProps {
  lang: "uz" | "en" | "ru";
  onClose?: () => void;
}

const DRIVER_STORAGE_KEY = "404GO_DRIVER_ID";

export default function DriverPortal({ lang, onClose }: DriverPortalProps) {
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>(() => localStorage.getItem(DRIVER_STORAGE_KEY) || "");
  const [driver, setDriver] = useState<DriverRecord | null>(null);
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const geoRef = useRef<number | null>(null);

  const t = {
    title: lang === "uz" ? "Haydovchi portali" : lang === "ru" ? "Портал водителя" : "Driver portal",
    select: lang === "uz" ? "Haydovchini tanlang" : lang === "ru" ? "Выберите водителя" : "Select driver",
    online: lang === "uz" ? "Onlayn" : lang === "ru" ? "Онлайн" : "Online",
    offline: lang === "uz" ? "Oflayn" : lang === "ru" ? "Оффлайн" : "Offline",
    accept: lang === "uz" ? "Qabul qilish" : lang === "ru" ? "Принять" : "Accept",
    noOrder: lang === "uz" ? "Faol buyurtma yo'q" : lang === "ru" ? "Нет активного заказа" : "No active order",
    network: lang === "uz" ? "404-GO haydovchi tarmog'i" : lang === "ru" ? "Сеть водителей 404-GO" : "404-GO driver network",
  };

  useEffect(() => {
    listPlatformDrivers()
      .then(setDrivers)
      .catch(() => setDrivers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    localStorage.setItem(DRIVER_STORAGE_KEY, selectedId);
    refreshDriver();
    const interval = window.setInterval(refreshDriver, 4000);
    return () => clearInterval(interval);
  }, [selectedId]);

  const refreshDriver = async () => {
    if (!selectedId) return;
    try {
      const data = await getPlatformDriver(selectedId);
      setDriver(data.driver);
      setOrder(data.order);
    } catch {
      /* ignore */
    }
  };

  const toggleOnline = async () => {
    if (!driver) return;
    const next = driver.status === "online" ? "offline" : "online";
    await setDriverStatus(driver.id, next);
    refreshDriver();
  };

  const acceptOrder = async () => {
    if (!driver?.currentOrderId) return;
    await driverAcceptPlatformOrder(driver.id, driver.currentOrderId);
    await refreshDriver();

    const orderId = driver.currentOrderId;
    const existing = loadRideChat(orderId);
    if (existing.length === 0) {
      appendRideChat(orderId, {
        id: `drv-welcome-${Date.now()}`,
        sender: "driver",
        content:
          lang === "uz"
            ? `Salom! Men ${driver.firstName}. Buyurtmangizni qabul qildim, yo'lga chiqyapman.`
            : lang === "ru"
              ? `Здравствуйте! Я ${driver.firstName}. Принял заказ, выезжаю.`
              : `Hi! I'm ${driver.firstName}. Order accepted, on my way.`,
        timestamp: nowChatTime(),
      });
    }
  };

  const pushLocation = async (location: GeoPoint) => {
    if (!driver) return;
    await updateDriverPlatformLocation(driver.id, location, driver.currentOrderId || undefined);
    refreshDriver();
  };

  useEffect(() => {
    if (!driver || driver.status !== "online") return;

    if (navigator.geolocation) {
      geoRef.current = window.setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            pushLocation({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 5000 }
        );
      }, 8000);
    }

    return () => {
      if (geoRef.current) clearInterval(geoRef.current);
    };
  }, [driver?.id, driver?.status]);

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-400 text-sm animate-pulse">{t.network}...</div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-slate-800">
        <div>
          <p className="text-xs text-teal-400 font-mono uppercase tracking-widest">{t.network}</p>
          <h1 className="text-lg font-bold text-white">{t.title}</h1>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white text-sm px-3 py-1 rounded-lg border border-slate-800">
            ✕
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg mx-auto w-full">
        {!selectedId ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-400">{t.select}</p>
            {drivers.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedId(d.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900 hover:border-teal-500/40 text-left"
              >
                <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{d.firstName} {d.lastName}</p>
                  <p className="text-xs text-gray-400">{d.carName} · {d.carNumber}</p>
                  <p className="text-[10px] text-teal-400">{d.serviceTypes.join(", ")} · ★ {d.rating}</p>
                </div>
              </button>
            ))}
          </div>
        ) : driver ? (
          <>
            <div className="nexgo-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">{driver.firstName} {driver.lastName}</p>
                  <p className="text-xs text-gray-400">{driver.carName} · {driver.carNumber}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${driver.status === "online" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-gray-400"}`}>
                  {driver.status}
                </span>
              </div>
              <button
                type="button"
                onClick={toggleOnline}
                className="w-full py-2 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-400 text-sm font-bold flex items-center justify-center gap-2"
              >
                <Power className="w-4 h-4" />
                {driver.status === "online" ? t.offline : t.online}
              </button>
              <a href={`tel:${driver.phone}`} className="flex items-center gap-2 text-xs text-teal-400">
                <Phone className="w-3 h-3" /> {driver.phone}
              </a>
            </div>

            <div className="h-40 rounded-xl overflow-hidden border border-slate-800 isolate z-0">
              <SmartMap
                compact={false}
                activeFrom={order?.from || "Toshkent"}
                activeTo={order?.to || ""}
                driverName={`${driver.firstName}`}
                customFromCoords={order?.fromCoords || driver.location}
                customToCoords={order?.toCoords || null}
                driverCoords={order?.driverCoords || driver.location}
                showRoute={!!order}
              />
            </div>

            {order ? (
              <div className="nexgo-card p-4 space-y-2 border-teal-500/20">
                <p className="text-xs text-teal-400 font-mono uppercase">{order.type} · {order.status}</p>
                <p className="text-sm text-white">{order.from} {order.to ? `→ ${order.to}` : ""}</p>
                {order.customerName && (
                  <p className="text-[10px] text-gray-400">
                    {lang === "uz" ? "Mijoz:" : lang === "ru" ? "Клиент:" : "Passenger:"}{" "}
                    <span className="text-white font-medium">{order.customerName}</span>
                  </p>
                )}
                <p className="text-lg font-bold text-teal-400">{order.price.toLocaleString()} so'm</p>
                {order.status === "dispatched" && (
                  <button type="button" onClick={acceptOrder} className="w-full py-2 bg-teal-400 text-slate-950 rounded-xl text-sm font-bold">
                    {t.accept}
                  </button>
                )}
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <Navigation className="w-3 h-3" />
                  GPS: {driver.location.latitude.toFixed(4)}, {driver.location.longitude.toFixed(4)}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 flex flex-col items-center gap-2">
                <Car className="w-8 h-8 opacity-40" />
                <p className="text-sm">{t.noOrder}</p>
              </div>
            )}

            {order && order.status !== "dispatched" && order.status !== "pending" && (
              <RideChatPanel
                orderId={order.id}
                chatKey={order.id}
                lang={lang}
                role="driver"
                customerName={order.customerName || (lang === "uz" ? "Mijoz" : lang === "ru" ? "Клиент" : "Passenger")}
                driverName={`${driver.firstName} ${driver.lastName}`}
                initialMessages={loadRideChat(order.id)}
              />
            )}

            <div className="nexgo-card p-4 space-y-2 border-blue-500/20">
              <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">
                {lang === "uz" ? "Haftalik daromad" : lang === "ru" ? "Недельный доход" : "Weekly earnings"}
              </p>
              <div className="flex items-end gap-1.5 h-16">
                {[35, 55, 42, 70, 48, 85, 62].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full rounded-t bg-blue-500/70" style={{ height: `${h}%` }} />
                    <span className="text-[7px] text-gray-500">{["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"][i]}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm font-mono font-bold text-white">
                {(order?.price ? order.price * 3.2 : 285000).toLocaleString()} so'm
              </p>
            </div>

            <button
              type="button"
              onClick={() => { setSelectedId(""); localStorage.removeItem(DRIVER_STORAGE_KEY); }}
              className="text-xs text-gray-500 underline"
            >
              {t.select}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
