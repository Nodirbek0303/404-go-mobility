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
