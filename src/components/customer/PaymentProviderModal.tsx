import React, { useEffect, useState } from "react";
import { CheckCircle2, CreditCard, ExternalLink, Loader2, X } from "lucide-react";
import { Language, PaymentProvider } from "../../types";
import { confirmSandboxPlatformPayment, createPlatformPayment } from "../../services/platformApi";

interface PaymentProviderModalProps {
  lang: Language;
  amount: number;
  open: boolean;
  orderId?: string | null;
  onClose: () => void;
  onSuccess: (provider: PaymentProvider) => void;
}

const providers: { id: PaymentProvider; name: string; color: string; logo: string }[] = [
  { id: "payme", name: "Payme", color: "from-emerald-500/20 to-teal-600/10", logo: "P" },
  { id: "click", name: "Click", color: "from-blue-500/20 to-cyan-600/10", logo: "C" },
  { id: "uzum", name: "Uzum Bank", color: "from-violet-500/20 to-purple-600/10", logo: "U" },
  { id: "card", name: "404-GO Wallet", color: "from-teal-500/20 to-emerald-600/10", logo: "W" },
];

export default function PaymentProviderModal({
  lang,
  amount,
  open,
  orderId,
  onClose,
  onSuccess,
}: PaymentProviderModalProps) {
  const [selected, setSelected] = useState<PaymentProvider>("payme");
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sandboxPaymentId, setSandboxPaymentId] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<"live" | "sandbox" | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      setSandboxPaymentId(null);
      setCheckoutUrl(null);
      setMode(null);
      setDone(false);
    }
  }, [open]);

  if (!open) return null;

  const title =
    lang === "uz" ? "To'lov usulini tanlang" : lang === "ru" ? "Выберите способ оплаты" : "Choose payment method";

  const finishSuccess = (provider: PaymentProvider) => {
    setDone(true);
    window.setTimeout(() => {
      onSuccess(provider);
      setDone(false);
      onClose();
    }, 1200);
  };

  const handlePay = async () => {
    setProcessing(true);
    setError(null);

    try {
      if (orderId) {
        const result = await createPlatformPayment(orderId, selected, amount);
        setMode(result.mode);

        if (result.status === "paid") {
          finishSuccess(selected);
          return;
        }

        if (result.checkoutUrl) {
          setCheckoutUrl(result.checkoutUrl);
          if (result.mode === "sandbox") {
            setSandboxPaymentId(result.paymentId);
          } else {
            window.open(result.checkoutUrl, "_blank", "noopener,noreferrer");
            finishSuccess(selected);
          }
          return;
        }
      }

      // Top-up yoki backend yo'q — lokal tasdiq
      await new Promise((r) => window.setTimeout(r, 1200));
      finishSuccess(selected);
    } catch (e) {
      setError(e instanceof Error ? e.message : "To'lov xatosi");
    } finally {
      setProcessing(false);
    }
  };

  const confirmSandbox = async () => {
    if (!sandboxPaymentId) return;
    setProcessing(true);
    try {
      await confirmSandboxPlatformPayment(sandboxPaymentId);
      finishSuccess(selected);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sandbox tasdiqlash xatosi");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[130]">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-sm">{title}</h3>
            <p className="text-teal-400 font-mono text-lg font-bold mt-1">{amount.toLocaleString()} so'm</p>
            {mode === "sandbox" && (
              <p className="text-[9px] text-amber-400 mt-1">
                {lang === "uz" ? "Sandbox rejim — .env da Payme/Click kalitlarini qo'shing" : "Sandbox mode"}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center py-6 gap-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            <p className="text-sm text-white font-bold">
              {lang === "uz" ? "To'lov muvaffaqiyatli!" : lang === "ru" ? "Оплата успешна!" : "Payment successful!"}
            </p>
          </div>
        ) : sandboxPaymentId ? (
          <div className="space-y-3">
            <p className="text-xs text-gray-300">
              {lang === "uz"
                ? "Demo Payme/Click oynasi. Haqiqiy to'lov uchun merchant kalitlarini sozlang."
                : "Demo payment. Configure merchant keys for live checkout."}
            </p>
            {checkoutUrl && (
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-teal-400 hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Checkout sahifasi
              </a>
            )}
            <button
              type="button"
              onClick={confirmSandbox}
              disabled={processing}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 text-xs font-bold rounded-xl"
            >
              {lang === "uz" ? "Sandbox to'lovni tasdiqlash" : "Confirm sandbox payment"}
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {providers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelected(p.id)}
                  className={`p-3 rounded-xl border text-left transition bg-gradient-to-br ${p.color} ${
                    selected === p.id ? "border-teal-400 ring-1 ring-teal-400/50" : "border-slate-800"
                  }`}
                >
                  <span className="w-8 h-8 rounded-lg bg-slate-950/80 flex items-center justify-center text-sm font-black text-teal-400">
                    {p.logo}
                  </span>
                  <p className="text-[10px] font-bold text-white mt-2">{p.name}</p>
                </button>
              ))}
            </div>
            {error && <p className="text-[10px] text-red-400">{error}</p>}
            <button
              type="button"
              onClick={handlePay}
              disabled={processing}
              className="w-full py-2.5 bg-teal-400 hover:bg-teal-300 disabled:opacity-60 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-2"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              {lang === "uz" ? "To'lash" : lang === "ru" ? "Оплатить" : "Pay now"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
