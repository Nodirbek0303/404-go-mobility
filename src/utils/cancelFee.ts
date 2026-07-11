import { Booking, Language } from "../types";

const RATE_PER_KM = 2500; // so'm / km — haydovchi bosib kelgan masofa

export interface CancelFeeResult {
  fee: number;
  distanceKm: number;
  freeCancel: boolean;
}

export function calculateCancelFee(order: Booking): CancelFeeResult {
  const phase = order.ridePhase ?? "searching";
  const distanceKm = order.driverDistanceKm ?? 0;
  const price = order.price;

  if (order.status !== "active") {
    return { fee: 0, distanceKm, freeCancel: true };
  }

  // Taksi — haydovchi bosib kelgan masofa bo'yicha
  if (order.type === "taxi") {
    if (phase === "searching") {
      return { fee: 0, distanceKm: 0, freeCancel: true };
    }
    if (phase === "accepted") {
      const fee = Math.max(5000, Math.round(distanceKm * RATE_PER_KM));
      return { fee: Math.min(fee, Math.round(price * 0.25)), distanceKm, freeCancel: false };
    }
    if (phase === "arriving") {
      const fee = Math.round(distanceKm * RATE_PER_KM);
      return {
        fee: Math.min(Math.max(fee, 8000), Math.round(price * 0.5)),
        distanceKm,
        freeCancel: false,
      };
    }
    // in_ride — safar boshlangan
    return {
      fee: Math.min(Math.max(Math.round(distanceKm * RATE_PER_KM), Math.round(price * 0.35)), price),
      distanceKm,
      freeCancel: false,
    };
  }

  // Yetkazib berish / yuk — kuryer tayinlangan bo'lsa
  if ((order.type === "delivery" || order.type === "cargo") && order.driverName) {
    const km = distanceKm || 1.5;
    const fee = Math.min(Math.max(Math.round(km * RATE_PER_KM), 10000), Math.round(price * 0.4));
    return { fee, distanceKm: km, freeCancel: false };
  }

  return { fee: 0, distanceKm, freeCancel: true };
}

export function cancelFeeLabel(result: CancelFeeResult, lang: Language): string {
  if (result.freeCancel || result.fee === 0) {
    return lang === "uz"
      ? "Bepul bekor qilish"
      : lang === "ru"
        ? "Бесплатная отмена"
        : "Free cancellation";
  }
  const km = result.distanceKm.toFixed(1);
  if (lang === "uz") {
    return `Haydovchi ${km} km bosib keldi · ${result.fee.toLocaleString()} so'm yechiladi`;
  }
  if (lang === "ru") {
    return `Водитель проехал ${km} км · спишется ${result.fee.toLocaleString()} сум`;
  }
  return `Driver traveled ${km} km · ${result.fee.toLocaleString()} UZS will be charged`;
}

export function cancelConfirmMessage(result: CancelFeeResult, lang: Language): string {
  if (result.freeCancel || result.fee === 0) {
    return lang === "uz"
      ? "Buyurtmani bekor qilasizmi?"
      : lang === "ru"
        ? "Отменить заказ?"
        : "Cancel this order?";
  }
  const km = result.distanceKm.toFixed(1);
  if (lang === "uz") {
    return `Haydovchi ${km} km yo'l bosib keldi.\n\nBekor qilsangiz ${result.fee.toLocaleString()} so'm avtomatik yechiladi.\n\nDavom etasizmi?`;
  }
  if (lang === "ru") {
    return `Водитель проехал ${km} км.\n\nПри отмене автоматически спишется ${result.fee.toLocaleString()} сум.\n\nПродолжить?`;
  }
  return `Driver traveled ${km} km.\n\nIf you cancel, ${result.fee.toLocaleString()} UZS will be auto-debited.\n\nContinue?`;
}

export function cancelSuccessMessage(result: CancelFeeResult, lang: Language): string {
  if (result.fee === 0) {
    return lang === "uz"
      ? "Buyurtma bekor qilindi. To'lov olinmadi."
      : lang === "ru"
        ? "Заказ отменён. Оплата не взималась."
        : "Order cancelled. No charge applied.";
  }
  if (lang === "uz") {
    return `Buyurtma bekor qilindi. Haydovchi bosib kelgan ${result.distanceKm.toFixed(1)} km uchun ${result.fee.toLocaleString()} so'm avtomatik yechildi.`;
  }
  if (lang === "ru") {
    return `Заказ отменён. За ${result.distanceKm.toFixed(1)} км списано ${result.fee.toLocaleString()} сум.`;
  }
  return `Order cancelled. ${result.fee.toLocaleString()} UZS charged for ${result.distanceKm.toFixed(1)} km traveled.`;
}
