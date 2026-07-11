export type WalletTxType = "topup" | "taxi" | "transfer_out" | "transfer_in" | "refund";

export interface WalletTransaction {
  id: string;
  type: WalletTxType;
  amount: number;
  balanceAfter: number;
  label: { uz: string; en: string; ru: string };
  createdAt: string;
}

const BALANCE_KEY = "404GO_WALLET_BALANCE_V1";
const TX_KEY = "404GO_WALLET_TX_V1";
const COUPON_BALANCE_KEY = "404GO_COUPON_BALANCE_V1";

/**
 * Kupon yig'ish shkalasi (misollar):
 * - 10 000 so'm safar → 1 so'm kupon
 * - 100 000 so'm safar → 500 so'm kupon
 */
const COUPON_BASE_PRICE = 10_000;
const COUPON_AT_BASE = 1;
const COUPON_AT_100K = 500;
const COUPON_EXPONENT = Math.log(COUPON_AT_100K / COUPON_AT_BASE) / Math.log(100_000 / COUPON_BASE_PRICE);

export function loadWalletBalance(): number {
  try {
    const raw = localStorage.getItem(BALANCE_KEY);
    if (raw != null) {
      const n = Number(raw);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    }
  } catch {
    /* ignore */
  }
  return 0;
}

export function saveWalletBalance(amount: number) {
  localStorage.setItem(BALANCE_KEY, String(Math.max(0, Math.floor(amount))));
}

export function loadWalletTransactions(): WalletTransaction[] {
  try {
    const raw = localStorage.getItem(TX_KEY);
    if (raw) return JSON.parse(raw) as WalletTransaction[];
  } catch {
    /* ignore */
  }
  return [];
}

export function appendWalletTransaction(tx: WalletTransaction) {
  const prev = loadWalletTransactions();
  localStorage.setItem(TX_KEY, JSON.stringify([tx, ...prev].slice(0, 100)));
}

export function loadCouponBalance(): number {
  try {
    const raw = localStorage.getItem(COUPON_BALANCE_KEY);
    if (raw != null) {
      const n = Number(raw);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    }
  } catch {
    /* ignore */
  }
  return 0;
}

export function saveCouponBalance(amount: number) {
  localStorage.setItem(COUPON_BALANCE_KEY, String(Math.max(0, Math.floor(amount))));
}

export function calcRideCouponEarn(ridePrice: number): number {
  if (!Number.isFinite(ridePrice) || ridePrice < COUPON_BASE_PRICE) return 0;
  const ratio = ridePrice / COUPON_BASE_PRICE;
  return Math.max(0, Math.round(COUPON_AT_BASE * Math.pow(ratio, COUPON_EXPONENT)));
}

export function couponEarnHint(lang: "uz" | "en" | "ru"): string {
  if (lang === "uz") return "10 000 so'm → 1 so'm kupon · 100 000 so'm → 500 so'm";
  if (lang === "ru") return "10 000 сум → 1 сум купона · 100 000 сум → 500 сум";
  return "10,000 UZS → 1 UZS coupon · 100,000 UZS → 500 UZS";
}

export function calcCouponPaymentSplit(
  price: number,
  couponBalance: number,
  useCoupon: boolean
): { couponDeduct: number; walletDue: number } {
  const couponDeduct = useCoupon ? Math.min(couponBalance, price) : 0;
  return { couponDeduct, walletDue: Math.max(0, price - couponDeduct) };
}
