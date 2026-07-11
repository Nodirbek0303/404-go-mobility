import React, { useEffect, useRef, useState } from "react";
import { Phone, MessageSquare, Send, MapPin, Navigation, Loader2, Car, User } from "lucide-react";
import SmartMap from "./maps/SmartMap";
import { Booking, DriverChatMessage, Language, UserProfile } from "../types";
import {
  googleMapsDirections,
  openExternalMap,
  twoGisPoint,
  yandexNavigatorRoute,
} from "../utils/mapProviders";
import { calculateCancelFee, cancelFeeLabel } from "../utils/cancelFee";
import {
  driverTraveledKm,
  etaMinutesFromKm,
  haversineKm,
  interpolateCoords,
  kmStepForInterval,
} from "../utils/geoCalc";
import {
  dispatchPlatformOrder,
  getPlatformOrder,
  mapDriverToBooking,
  orderStatusToRidePhase,
} from "../services/platformApi";

const DRIVER_TICK_MS = 2000;

type Translations = typeof import("../translations").translations.uz;

interface TaxiRidePanelProps {
  order: Booking;
  userProfile: UserProfile;
  lang: Language;
  t: Translations;
  onUpdateOrder: (orderId: string, updates: Partial<Booking>) => void;
  onCancel?: (order: Booking) => void;
}

function formatPhoneDisplay(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 12) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
  }
  return phone || "—";
}

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function TaxiRidePanel({
  order,
  userProfile,
  lang,
  t,
  onUpdateOrder,
  onCancel,
}: TaxiRidePanelProps) {
  const [pickupMessage, setPickupMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const simulationStartedFor = useRef<string | null>(null);

  const fromLat = order.fromCoords?.latitude ?? 41.3216;
  const fromLng = order.fromCoords?.longitude ?? 69.2285;
  const toLat = order.toCoords?.latitude ?? 41.3031;
  const toLng = order.toCoords?.longitude ?? 69.2486;

  const phase = order.ridePhase ?? "searching";
  const driverChat = order.driverChat ?? [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [driverChat.length]);

  // Backend haydovchi tarmog'i — dispatch va sync
  useEffect(() => {
    if (order.status !== "active" || order.type !== "taxi") return;
    if (phase !== "searching" || simulationStartedFor.current === order.id) return;
    if (!order.serverOrderId) return;

    simulationStartedFor.current = order.id;

    dispatchPlatformOrder(order.serverOrderId)
      .then(({ order: srvOrder, driver }) => {
        const dispatchKm = srvOrder.driverStartCoords
          ? haversineKm(srvOrder.driverStartCoords, { latitude: fromLat, longitude: fromLng })
          : 0;
        const acceptMsg =
          lang === "uz"
            ? `Salom! Men ${driver.firstName} ${driver.lastName}. Buyurtmangizni qabul qildim, yo'lga chiqyapman.`
            : lang === "ru"
              ? `Здравствуйте! Я ${driver.firstName} ${driver.lastName}. Принял ваш заказ, выезжаю.`
              : `Hi! I'm ${driver.firstName} ${driver.lastName}. I accepted your ride and I'm on my way.`;

        onUpdateOrder(order.id, {
          ridePhase: orderStatusToRidePhase(srvOrder.status),
          driverStartCoords: srvOrder.driverStartCoords || driver.location,
          driverCoords: srvOrder.driverCoords || driver.location,
          dispatchTotalKm: dispatchKm,
          driverDistanceKm: srvOrder.driverDistanceKm ?? 0,
          etaMinutes: etaMinutesFromKm(dispatchKm),
          ...mapDriverToBooking(driver),
          driverChat: [
            {
              id: `drv-${Date.now()}`,
              sender: "driver",
              content: acceptMsg,
              timestamp: nowTime(),
            },
          ],
        });
      })
      .catch(() => {
        simulationStartedFor.current = null;
      });
  }, [order.id, order.status, order.type, order.serverOrderId, phase, lang, onUpdateOrder, fromLat, fromLng]);

  // Serverdan haydovchi GPS sync
  useEffect(() => {
    if (!order.serverOrderId || phase === "searching") return;
    const interval = window.setInterval(async () => {
      try {
        const { order: srvOrder, driver } = await getPlatformOrder(order.serverOrderId!);
        const updates: Partial<Booking> = {
          ridePhase: orderStatusToRidePhase(srvOrder.status),
          driverDistanceKm: srvOrder.driverDistanceKm,
        };
        if (srvOrder.driverCoords) updates.driverCoords = srvOrder.driverCoords;
        if (driver) Object.assign(updates, mapDriverToBooking(driver));
        if (srvOrder.status === "accepted" && phase === "accepted") {
          updates.ridePhase = "arriving";
        }
        onUpdateOrder(order.id, updates);
      } catch {
        /* local GPS sim continues */
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [order.id, order.serverOrderId, phase, onUpdateOrder]);

  // ETA countdown while arriving
  useEffect(() => {
    if (phase !== "arriving" || order.etaMinutes == null || order.etaMinutes <= 0) return;
    const interval = window.setInterval(() => {
      const next = Math.max(0, (order.etaMinutes ?? 1) - 1);
      onUpdateOrder(order.id, { etaMinutes: next });
      if (next === 0) {
        onUpdateOrder(order.id, { ridePhase: "in_ride" });
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [phase, order.id, order.etaMinutes, onUpdateOrder]);

  // Haydovchi GPS bo'yicha aniq harakat (Haversine)
  useEffect(() => {
    if (order.status !== "active" || order.type !== "taxi") return;
    if (phase === "searching" || !order.driverStartCoords) return;

    const pickup = { latitude: fromLat, longitude: fromLng };
    const dest = { latitude: toLat, longitude: toLng };
    const kmStep = kmStepForInterval(DRIVER_TICK_MS);

    const interval = window.setInterval(() => {
      const start = order.driverStartCoords!;
      const current = order.driverCoords ?? start;
      const target = phase === "in_ride" ? dest : pickup;
      const legKm = haversineKm(current, target);

      if (legKm < 0.03) return;

      const step = Math.min(kmStep, legKm);
      const next = interpolateCoords(current, target, step / legKm);

      const traveled =
        phase === "in_ride"
          ? (order.dispatchTotalKm ?? 0) + haversineKm(pickup, next)
          : driverTraveledKm(start, next);

      const remainingKm = haversineKm(next, target);

      onUpdateOrder(order.id, {
        driverCoords: next,
        driverDistanceKm: Math.round(traveled * 100) / 100,
        etaMinutes: phase === "in_ride" ? etaMinutesFromKm(remainingKm) : etaMinutesFromKm(remainingKm),
      });
    }, DRIVER_TICK_MS);

    return () => clearInterval(interval);
  }, [
    phase,
    order.id,
    order.status,
    order.type,
    order.driverStartCoords,
    order.driverCoords,
    order.dispatchTotalKm,
    fromLat,
    fromLng,
    toLat,
    toLng,
    onUpdateOrder,
  ]);

  const cancelPreview = calculateCancelFee(order);

  const phaseLabel = () => {
    if (phase === "searching") return t.taxi_searching;
    if (phase === "accepted") return t.taxi_accepted;
    if (phase === "arriving") return `${t.taxi_arriving} · ${order.etaMinutes ?? "—"} ${t.taxi_minutes}`;
    return t.taxi_in_ride;
  };

  const driverStatusForMap =
    phase === "searching"
      ? t.taxi_searching
      : phase === "in_ride"
        ? t.taxi_in_ride
        : `${t.taxi_arriving} · ${order.etaMinutes ?? "—"} ${t.taxi_minutes}`;

  const userFullName =
    [userProfile.firstName, userProfile.lastName].filter(Boolean).join(" ") ||
    (lang === "uz" ? "Foydalanuvchi" : lang === "ru" ? "Пользователь" : "Passenger");

  const driverFullName =
    order.driverFirstName && order.driverLastName
      ? `${order.driverFirstName} ${order.driverLastName}`
      : order.driverName ?? "—";

  const handleSendPickupMessage = () => {
    const text = pickupMessage.trim();
    if (!text) return;

    const userMsg: DriverChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      content: text,
      timestamp: nowTime(),
    };

    const updatedChat = [...driverChat, userMsg];
    onUpdateOrder(order.id, { driverChat: updatedChat, driverNotes: text });
    setPickupMessage("");

    window.setTimeout(() => {
      const reply =
        lang === "uz"
          ? `Tushundim! ${text} manzilidan kutaman. Tez orada yetib boraman.`
          : lang === "ru"
            ? `Понял! Жду вас по адресу: ${text}. Скоро буду.`
            : `Got it! I'll pick you up at: ${text}. Arriving soon.`;
      onUpdateOrder(order.id, {
        driverChat: [
          ...updatedChat,
          {
            id: `drv-${Date.now() + 1}`,
            sender: "driver",
            content: reply,
            timestamp: nowTime(),
          },
        ],
      });
    }, 1800);
  };

  const openMaps = (provider: "google" | "yandex" | "2gis") => {
    if (provider === "google") {
      openExternalMap(googleMapsDirections(fromLat, fromLng, toLat, toLng));
    } else if (provider === "yandex") {
      openExternalMap(yandexNavigatorRoute(fromLat, fromLng, toLat, toLng));
    } else {
      openExternalMap(twoGisPoint(fromLat, fromLng));
    }
  };

  return (
    <div className="space-y-2.5">
      <div
        className={`nexgo-card p-2.5 flex items-center gap-2 ${
          phase === "searching"
            ? "border-amber-500/30 bg-amber-500/5"
            : "border-teal-500/30"
        }`}
      >
        {phase === "searching" ? (
          <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
        ) : (
          <Car className="w-4 h-4 text-teal-400 shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-white truncate">{phaseLabel()}</p>
          {order.from && order.to && (
            <p className="text-[8px] text-gray-400 truncate mt-0.5">
              {order.from} → {order.to}
            </p>
          )}
        </div>
      </div>

      {/* Map providers */}
      <div className="space-y-1">
        <p className="text-[8px] font-mono text-teal-400 uppercase tracking-widest">{t.taxi_open_maps}</p>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => openMaps("google")}
            className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-teal-500/40 text-[8px] font-bold text-white py-1.5 px-1 rounded-lg transition"
          >
            {t.taxi_google_maps}
          </button>
          <button
            type="button"
            onClick={() => openMaps("yandex")}
            className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 text-[8px] font-bold text-white py-1.5 px-1 rounded-lg transition"
          >
            {t.taxi_yandex}
          </button>
          <button
            type="button"
            onClick={() => openMaps("2gis")}
            className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 text-[8px] font-bold text-white py-1.5 px-1 rounded-lg transition"
          >
            {t.taxi_2gis}
          </button>
        </div>
      </div>

      {/* Live map */}
      <div className="space-y-1">
        <p className="text-[8px] font-mono text-teal-400 uppercase tracking-widest flex items-center gap-1">
          <Navigation className="w-3 h-3" />
          {t.taxi_live_map}
        </p>
        <div className="h-32 rounded-xl overflow-hidden border border-teal-500/20 shadow-inner shadow-teal-500/5">
          <SmartMap
            activeFrom={order.from ?? "Chorsu"}
            activeTo={order.to ?? "Magic City"}
            driverName={driverFullName}
            driverStatus={driverStatusForMap}
            showRoute={phase !== "searching"}
            lang={lang}
            customFromCoords={order.fromCoords ?? null}
            customToCoords={order.toCoords ?? null}
            driverCoords={order.driverCoords ?? null}
          />
        </div>
        {phase === "arriving" && order.etaMinutes != null && order.etaMinutes > 0 && (
          <p className="text-[9px] text-center text-teal-400 font-mono animate-pulse">
            {t.taxi_eta}: {order.etaMinutes} {t.taxi_minutes}
          </p>
        )}
        {phase !== "searching" && (order.driverDistanceKm ?? 0) > 0 && (
          <p className="text-[8px] text-center text-gray-400 font-mono">
            {lang === "uz"
              ? `Haydovchi bosib kelgan: ${(order.driverDistanceKm ?? 0).toFixed(2)} km (GPS)`
              : lang === "ru"
                ? `Проехал: ${(order.driverDistanceKm ?? 0).toFixed(2)} км (GPS)`
                : `Traveled: ${(order.driverDistanceKm ?? 0).toFixed(2)} km (GPS)`}
          </p>
        )}
      </div>

      {/* Contact cards — both sides visible after accept */}
      {phase !== "searching" && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-900 p-2 rounded-xl border border-slate-800/80 space-y-1 nexgo-glass">
            <p className="text-[7px] text-gray-500 uppercase tracking-wider">{t.taxi_your_contact}</p>
            <div className="flex items-center gap-1.5">
              <User className="w-3 h-3 text-teal-400 shrink-0" />
              <span className="text-[9px] font-bold text-white truncate">{userFullName}</span>
            </div>
            {userProfile.phone ? (
              <a
                href={`tel:${userProfile.phone.replace(/\s/g, "")}`}
                className="text-[8px] text-teal-400 font-mono block hover:underline"
              >
                {formatPhoneDisplay(userProfile.phone)}
              </a>
            ) : (
              <p className="text-[7px] text-amber-400 leading-tight">{t.taxi_fill_profile}</p>
            )}
          </div>
          <div className="bg-slate-900 p-2 rounded-xl border border-teal-500/20 space-y-1 nexgo-glass">
            <p className="text-[7px] text-gray-500 uppercase tracking-wider">{t.taxi_driver_contact}</p>
            <div className="flex items-center gap-1.5">
              <Car className="w-3 h-3 text-teal-400 shrink-0" />
              <span className="text-[9px] font-bold text-white truncate">{driverFullName}</span>
            </div>
            {order.driverPhone && (
              <a
                href={`tel:${order.driverPhone}`}
                className="flex items-center gap-1 text-[8px] text-teal-400 font-mono hover:underline"
              >
                <Phone className="w-2.5 h-2.5" />
                {formatPhoneDisplay(order.driverPhone)}
              </a>
            )}
            {order.carNumber && (
              <p className="text-[7px] text-gray-400 font-mono">{order.carName} · {order.carNumber}</p>
            )}
          </div>
        </div>
      )}

      {/* Driver chat */}
      {phase !== "searching" && (
        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-2">
          <p className="text-[9px] font-bold text-white uppercase tracking-wide flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
            {t.taxi_driver_chat}
          </p>

          <div className="max-h-[100px] overflow-y-auto space-y-1.5 pr-0.5 scrollbar-none">
            {driverChat.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[90%] rounded-xl px-2 py-1.5 text-[9px] leading-snug ${
                    msg.sender === "user"
                      ? "bg-teal-400 text-slate-950 rounded-tr-none"
                      : "bg-slate-950 text-gray-200 border border-slate-850 rounded-tl-none"
                  }`}
                >
                  <p className="font-semibold text-[7px] opacity-70 mb-0.5">
                    {msg.sender === "user" ? userFullName : driverFullName}
                  </p>
                  {msg.content}
                  <p className="text-[6px] text-right mt-0.5 opacity-60 font-mono">{msg.timestamp}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="flex gap-1.5">
            <input
              type="text"
              value={pickupMessage}
              onChange={(e) => setPickupMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendPickupMessage()}
              placeholder={t.taxi_pickup_hint}
              className="flex-1 bg-slate-950 text-[10px] text-white px-2 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-teal-400"
            />
            <button
              type="button"
              onClick={handleSendPickupMessage}
              disabled={!pickupMessage.trim()}
              className="bg-teal-400 hover:bg-teal-300 disabled:opacity-40 text-slate-950 p-1.5 rounded-lg transition shrink-0"
              title={t.taxi_send_to_driver}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex gap-2 pt-0.5">
            {order.driverPhone && (
              <a
                href={`tel:${order.driverPhone}`}
                className="flex-1 bg-slate-950 hover:bg-slate-900 text-white text-[9px] font-medium py-1.5 rounded-lg border border-slate-800 transition flex items-center justify-center gap-1"
              >
                <Phone className="w-3 h-3 text-teal-400" />
                {t.taxi_call}
              </a>
            )}
            <button
              type="button"
              onClick={() => openMaps("google")}
              className="flex-1 bg-slate-950 hover:bg-slate-900 text-white text-[9px] font-medium py-1.5 rounded-lg border border-slate-800 transition flex items-center justify-center gap-1"
            >
              <MapPin className="w-3 h-3 text-teal-400" />
              {t.taxi_open_maps}
            </button>
          </div>
        </div>
      )}

      {/* Bekor qilish */}
      {onCancel && (
        <div className="space-y-1.5">
          {phase !== "searching" && (
            <p
              className={`text-[8px] text-center px-2 py-1 rounded-lg border ${
                cancelPreview.fee > 0
                  ? "text-amber-300 bg-amber-500/10 border-amber-500/25"
                  : "text-gray-500 bg-slate-900 border-slate-800"
              }`}
            >
              {cancelFeeLabel(cancelPreview, lang)}
            </p>
          )}
          <button
            type="button"
            onClick={() => onCancel(order)}
            className="w-full bg-red-950/40 hover:bg-red-950/60 text-red-400 text-[10px] font-medium py-1.5 rounded-lg border border-red-900/30 transition"
          >
            {phase === "searching"
              ? `${t.bekor_qilish} (${lang === "uz" ? "bepul" : lang === "ru" ? "бесплатно" : "free"})`
              : t.bekor_qilish}
          </button>
        </div>
      )}
    </div>
  );
}
