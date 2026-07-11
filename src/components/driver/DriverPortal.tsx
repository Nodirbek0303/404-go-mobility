import React, { useEffect, useRef, useState } from "react";
import { Car, Navigation, Phone, Power, User } from "lucide-react";
import type { DriverRecord, GeoPoint, OrderRecord } from "../../../lib/store/types";
import {
  driverAcceptPlatformOrder,
  getPlatformDriver,
  setDriverStatus,
  updateDriverPlatformLocation,
} from "../../services/platformApi";
import SmartMap from "../maps/SmartMap";
import RideChatPanel from "../RideChatPanel";
import { appendRideChat, loadRideChat, nowChatTime } from "../../utils/rideChatStorage";
import {
  clearDriverToken,
  fetchDriverSession,
  loadDriverToken,
  loginDriverByPhone,
} from "../../utils/driverAuthStorage";

interface DriverPortalProps {
  lang: "uz" | "en" | "ru";
  onClose?: () => void;
}

export default function DriverPortal({ lang, onClose }: DriverPortalProps) {
  const [phone, setPhone] = useState("");
  const [driver, setDriver] = useState<DriverRecord | null>(null);
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const geoRef = useRef<number | null>(null);

  const t = {
    title: lang === "uz" ? "Haydovchi portali" : lang === "ru" ? "Портал водителя" : "Driver portal",
    login: lang === "uz" ? "Kirish" : lang === "ru" ? "Войти" : "Sign in",
    phone: lang === "uz" ? "Ro'yxatdagi telefon raqamingiz" : lang === "ru" ? "Ваш номер в системе" : "Your registered phone",
    online: lang === "uz" ? "Onlayn" : lang === "ru" ? "Онлайн" : "Online",
    offline: lang === "uz" ? "Oflayn" : lang === "ru" ? "Оффлайн" : "Offline",
    accept: lang === "uz" ? "Qabul qilish" : lang === "ru" ? "Принять" : "Accept",
    noOrder: lang === "uz" ? "Faol buyurtma yo'q" : lang === "ru" ? "Нет активного заказа" : "No active order",
    network: lang === "uz" ? "404-GO haydovchi tarmog'i" : lang === "ru" ? "Сеть водителей 404-GO" : "404-GO driver network",
    logout: lang === "uz" ? "Chiqish" : lang === "ru" ? "Выйти" : "Sign out",
    loginHint:
      lang === "uz"
        ? "Tizimga kiritilgan telefon raqamingizni kiriting"
        : lang === "ru"
          ? "Введите номер, указанный в системе"
          : "Enter the phone number registered in the system",
  };

  useEffect(() => {
    const boot = async () => {
      if (!loadDriverToken()) {
        setLoading(false);
        return;
      }
      try {
        const session = await fetchDriverSession();
        if (session) {
          setDriver(session.driver);
          setOrder(session.order);
        }
      } catch {
        clearDriverToken();
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, []);

  useEffect(() => {
    if (!driver) return;
    refreshDriver();
    const interval = window.setInterval(refreshDriver, 4000);
    return () => clearInterval(interval);
  }, [driver?.id]);

  const refreshDriver = async () => {
    if (!driver) return;
    try {
      const data = await getPlatformDriver(driver.id);
      setDriver(data.driver);
      setOrder(data.order);
    } catch {
      /* ignore */
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const result = await loginDriverByPhone(phone.trim());
      const data = await getPlatformDriver(result.driver.id);
      setDriver(data.driver);
      setOrder(data.order);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    clearDriverToken();
    setDriver(null);
    setOrder(null);
    setPhone("");
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
        {!driver ? (
          <form onSubmit={handleLogin} className="space-y-4 pt-8">
            <p className="text-sm text-gray-400 text-center">{t.loginHint}</p>
            <label className="block space-y-1">
              <span className="text-xs text-gray-500">{t.phone}</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm"
                required
              />
            </label>
            {loginError && <p className="text-xs text-red-400 text-center">{loginError}</p>}
            <button
              type="submit"
              disabled={loginLoading || !phone.trim()}
              className="w-full py-3 rounded-xl bg-teal-400 text-slate-950 font-bold text-sm disabled:opacity-50"
            >
              {loginLoading ? "..." : t.login}
            </button>
          </form>
        ) : (
          <>
            <div className="nexgo-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white">{driver.firstName} {driver.lastName}</p>
                    <p className="text-xs text-gray-400">{driver.carName} · {driver.carNumber}</p>
                  </div>
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

            <button type="button" onClick={handleLogout} className="text-xs text-gray-500 underline w-full text-center">
              {t.logout}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
