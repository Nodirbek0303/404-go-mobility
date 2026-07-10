import React, { useState } from "react";
import { CheckCircle2, CreditCard, Loader2, X } from "lucide-react";
import { Language, PaymentProvider } from "../../types";

interface PaymentProviderModalProps {
  lang: Language;
  amount: number;
  open: boolean;
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
  onClose,
  onSuccess,
}: PaymentProviderModalProps) {
  const [selected, setSelected] = useState<PaymentProvider>("payme");
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) return null;

  const title =
    lang === "uz" ? "To'lov usulini tanlang" : lang === "ru" ? "Выберите способ оплаты" : "Choose payment method";

  const handlePay = () => {
    setProcessing(true);
    window.setTimeout(() => {
      setProcessing(false);
      setDone(true);
      window.setTimeout(() => {
        onSuccess(selected);
        setDone(false);
        onClose();
      }, 1200);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[95]">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-sm">{title}</h3>
            <p className="text-teal-400 font-mono text-lg font-bold mt-1">{amount.toLocaleString()} so'm</p>
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
