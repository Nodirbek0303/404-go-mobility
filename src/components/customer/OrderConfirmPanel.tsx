import React from "react";
import { X, MapPin, Car, CreditCard, Ticket, CheckCircle2 } from "lucide-react";
import type { Language, PaymentProvider } from "../../types";
import { taxiClassLabel, type TaxiClassId } from "../../taxiClasses";

interface OrderConfirmPanelProps {
  lang: Language;
  from: string;
  to: string;
  taxiClass: TaxiClassId;
  price: number;
  paymentProvider: PaymentProvider;
  walletBalance?: number;
  couponCode?: string | null;
  distanceKm?: number;
  durationMin?: number;
  onConfirm: () => void;
  onClose: () => void;
  submitting?: boolean;
}

export default function OrderConfirmPanel({
  lang,
  from,
  to,
  taxiClass,
  price,
  paymentProvider,
  walletBalance,
  couponCode,
  distanceKm,
  durationMin,
  onConfirm,
  onClose,
  submitting = false,
}: OrderConfirmPanelProps) {
  const t = {
    title: lang === "uz" ? "Buyurtmani tasdiqlash" : lang === "ru" ? "Подтверждение заказа" : "Confirm order",
    from: lang === "uz" ? "Qayerdan" : lang === "ru" ? "Откуда" : "From",
    to: lang === "uz" ? "Qayerga" : lang === "ru" ? "Куда" : "To",
    class: lang === "uz" ? "Tarif" : lang === "ru" ? "Тариф" : "Class",
    pay: lang === "uz" ? "To'lov" : lang === "ru" ? "Оплата" : "Payment",
    total: lang === "uz" ? "Jami" : lang === "ru" ? "Итого" : "Total",
    confirm: lang === "uz" ? "Zakaz qilish" : lang === "ru" ? "Заказать" : "Order now",
    coupon: lang === "uz" ? "Kupon" : lang === "ru" ? "Купон" : "Coupon",
  };

  const payLabel =
    paymentProvider === "wallet"
      ? lang === "uz"
        ? "404-GO Hamyon"
        : lang === "ru"
          ? "404-GO Кошелёк"
          : "404-GO Wallet"
      : paymentProvider;

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
      <div className="w-full max-w-md bg-slate-950 border border-blue-500/30 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-blue-600/10">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            {t.title}
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-slate-900">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="space-y-2 bg-slate-900/80 rounded-xl p-3 border border-slate-800">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                A
              </span>
              <div className="min-w-0">
                <p className="text-[9px] text-gray-500 uppercase">{t.from}</p>
                <p className="text-xs text-white truncate">{from}</p>
              </div>
            </div>
            <div className="ml-2.5 border-l border-dashed border-slate-700 h-2" />
            <div className="flex items-start gap-2">
              <span className="mt-0.5 w-5 h-5 rounded bg-blue-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                B
              </span>
              <div className="min-w-0">
                <p className="text-[9px] text-gray-500 uppercase">{t.to}</p>
                <p className="text-xs text-white truncate">{to}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-slate-900 rounded-xl p-2.5 border border-slate-800 flex items-center gap-2">
              <Car className="w-3.5 h-3.5 text-blue-400" />
              <div>
                <p className="text-gray-500">{t.class}</p>
                <p className="text-white font-semibold">{taxiClassLabel(taxiClass, lang)}</p>
              </div>
            </div>
            <div className="bg-slate-900 rounded-xl p-2.5 border border-slate-800 flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5 text-blue-400" />
              <div>
                <p className="text-gray-500">{t.pay}</p>
                <p className="text-white font-semibold capitalize">{payLabel}</p>
                {paymentProvider === "wallet" && walletBalance != null && (
                  <p className="text-[8px] text-teal-400 font-mono mt-0.5">
                    {walletBalance.toLocaleString()} so'm
                  </p>
                )}
              </div>
            </div>
          </div>

          {(distanceKm != null || durationMin != null || couponCode) && (
            <div className="flex flex-wrap gap-2 text-[9px] text-gray-400">
              {distanceKm != null && (
                <span className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {distanceKm.toFixed(1)} km
                </span>
              )}
              {durationMin != null && (
                <span className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800">~{Math.round(durationMin)} min</span>
              )}
              {couponCode && (
                <span className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-1">
                  <Ticket className="w-3 h-3" />
                  {t.coupon}: {couponCode}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-gray-400 font-medium">{t.total}</span>
            <span className="text-lg font-mono font-bold text-blue-300">{price.toLocaleString()} so'm</span>
          </div>

          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:pointer-events-none text-white font-bold text-sm shadow-lg shadow-blue-600/30 active:scale-[0.98] transition"
          >
            {submitting
              ? lang === "uz"
                ? "Kutilmoqda..."
                : lang === "ru"
                  ? "Подождите..."
                  : "Please wait..."
              : t.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
