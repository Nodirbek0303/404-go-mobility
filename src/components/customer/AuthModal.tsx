import React, { useState } from "react";
import { Phone, ShieldCheck, X, Loader2 } from "lucide-react";
import { Language } from "../../types";
import { formatUzPhone, generateDemoOtp, saveAuth } from "../../utils/customerStorage";

interface AuthModalProps {
  lang: Language;
  onVerified: (phone: string) => void;
  onClose?: () => void;
  required?: boolean;
}

const copy = {
  uz: {
    title: "404-GO ga kirish",
    subtitle: "Telefon raqamingizga SMS kod yuboramiz",
    phone: "Telefon raqam",
    send: "SMS kod yuborish",
    otp: "Tasdiqlash kodi",
    verify: "Kirish",
    resend: "Qayta yuborish",
    demo: "Demo: kod telefonning oxirgi 4 raqami",
    invalid: "Noto'g'ri kod",
  },
  en: {
    title: "Sign in to 404-GO",
    subtitle: "We will send an SMS code to your phone",
    phone: "Phone number",
    send: "Send SMS code",
    otp: "Verification code",
    verify: "Sign in",
    resend: "Resend",
    demo: "Demo: last 4 digits of your phone",
    invalid: "Invalid code",
  },
  ru: {
    title: "Вход в 404-GO",
    subtitle: "Отправим SMS-код на ваш телефон",
    phone: "Номер телефона",
    send: "Отправить SMS-код",
    otp: "Код подтверждения",
    verify: "Войти",
    resend: "Отправить снова",
    demo: "Демо: последние 4 цифры номера",
    invalid: "Неверный код",
  },
};

export default function AuthModal({ lang, onVerified, onClose, required }: AuthModalProps) {
  const t = copy[lang];
  const [phone, setPhone] = useState("+99890");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState("");
  const [expectedOtp, setExpectedOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = () => {
    const formatted = formatUzPhone(phone);
    if (formatted.replace(/\D/g, "").length < 12) {
      setError(lang === "uz" ? "To'liq raqam kiriting" : lang === "ru" ? "Введите полный номер" : "Enter full number");
      return;
    }
    setLoading(true);
    setError(null);
    window.setTimeout(() => {
      const code = generateDemoOtp(formatted);
      setExpectedOtp(code);
      setPhone(formatted);
      setStep("otp");
      setLoading(false);
    }, 900);
  };

  const handleVerify = () => {
    if (otp !== expectedOtp) {
      setError(t.invalid);
      return;
    }
    const formatted = formatUzPhone(phone);
    saveAuth({
      phone: formatted,
      verifiedAt: new Date().toISOString(),
      token: `demo-${Date.now()}`,
    });
    onVerified(formatted);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-[100]">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-fade-in">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">{t.title}</h2>
              <p className="text-[10px] text-gray-400 mt-0.5">{t.subtitle}</p>
            </div>
          </div>
          {!required && onClose && (
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {step === "phone" ? (
          <>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider">{t.phone}</label>
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
              <Phone className="w-4 h-4 text-teal-400 shrink-0" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 bg-transparent text-white text-sm outline-none"
                placeholder="+998 90 123 45 67"
              />
            </div>
            {error && <p className="text-[10px] text-red-400">{error}</p>}
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full py-2.5 bg-teal-400 hover:bg-teal-300 disabled:opacity-60 text-slate-950 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {t.send}
            </button>
          </>
        ) : (
          <>
            <p className="text-[10px] text-gray-400">
              {phone} · <span className="text-teal-400">{t.demo}: {expectedOtp}</span>
            </p>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider">{t.otp}</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="w-full bg-slate-950 text-white text-center text-2xl font-mono tracking-[0.5em] p-3 rounded-xl border border-slate-800 focus:border-teal-400 outline-none"
              placeholder="••••"
            />
            {error && <p className="text-[10px] text-red-400">{error}</p>}
            <button
              type="button"
              onClick={handleVerify}
              className="w-full py-2.5 bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-bold rounded-xl transition"
            >
              {t.verify}
            </button>
            <button
              type="button"
              onClick={() => { setStep("phone"); setOtp(""); setError(null); }}
              className="w-full text-[10px] text-gray-400 hover:text-teal-400"
            >
              {t.resend}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
