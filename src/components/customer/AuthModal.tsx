import React, { useState } from "react";
import { Phone, ShieldCheck, User, X, Loader2, MonitorSmartphone } from "lucide-react";
import { Language } from "../../types";
import {
  formatUzPhone,
  generateVerificationCode,
  registerVerifiedUser,
  saveAuth,
} from "../../utils/customerStorage";

interface AuthModalProps {
  lang: Language;
  onVerified: (phone: string, displayName?: string) => void;
  onClose?: () => void;
  required?: boolean;
}

const copy = {
  uz: {
    title: "404-GO ga kirish",
    subtitle: "Telefon raqamingizni tasdiqlang (SMS yuborilmaydi — kod ekranda)",
    phone: "Telefon raqam",
    name: "Ismingiz",
    namePlaceholder: "Masalan: Nodirbek",
    showCode: "Tasdiqlash kodini olish",
    otp: "Ekrandagi kodni kiriting",
    verify: "Tasdiqlash va kirish",
    back: "Orqaga",
    codeTitle: "Sizning tasdiqlash kodingiz",
    codeHint: "Bu kod SMS emas — faqat shu ekranda ko'rsatiladi. Quyidagi maydonga kiriting.",
    invalid: "Noto'g'ri kod. Ekrandagi kodni qayta tekshiring.",
    freeNote: "Bepul tasdiqlash — SMS xizmati talab qilinmaydi",
  },
  en: {
    title: "Sign in to 404-GO",
    subtitle: "Verify your phone (no SMS — code shown on screen)",
    phone: "Phone number",
    name: "Your name",
    namePlaceholder: "e.g. John",
    showCode: "Get verification code",
    otp: "Enter the code from screen",
    verify: "Verify and sign in",
    back: "Back",
    codeTitle: "Your verification code",
    codeHint: "This is not SMS — shown only here. Type it below.",
    invalid: "Wrong code. Check the code on screen.",
    freeNote: "Free verification — no SMS service required",
  },
  ru: {
    title: "Вход в 404-GO",
    subtitle: "Подтвердите телефон (без SMS — код на экране)",
    phone: "Номер телефона",
    name: "Ваше имя",
    namePlaceholder: "Например: Али",
    showCode: "Получить код подтверждения",
    otp: "Введите код с экрана",
    verify: "Подтвердить и войти",
    back: "Назад",
    codeTitle: "Ваш код подтверждения",
    codeHint: "Это не SMS — код только на этом экране. Введите его ниже.",
    invalid: "Неверный код. Проверьте код на экране.",
    freeNote: "Бесплатная проверка — SMS-сервис не нужен",
  },
};

export default function AuthModal({ lang, onVerified, onClose, required }: AuthModalProps) {
  const t = copy[lang];
  const [phone, setPhone] = useState("+99890");
  const [displayName, setDisplayName] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState("");
  const [expectedOtp, setExpectedOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShowCode = () => {
    const formatted = formatUzPhone(phone);
    if (formatted.replace(/\D/g, "").length < 12) {
      setError(lang === "uz" ? "To'liq raqam kiriting" : lang === "ru" ? "Введите полный номер" : "Enter full number");
      return;
    }
    if (!displayName.trim()) {
      setError(lang === "uz" ? "Ismingizni kiriting" : lang === "ru" ? "Введите имя" : "Enter your name");
      return;
    }
    setLoading(true);
    setError(null);
    window.setTimeout(() => {
      setExpectedOtp(generateVerificationCode());
      setPhone(formatted);
      setStep("otp");
      setLoading(false);
    }, 600);
  };

  const handleVerify = () => {
    if (otp !== expectedOtp) {
      setError(t.invalid);
      return;
    }
    const formatted = formatUzPhone(phone);
    const name = displayName.trim();
    registerVerifiedUser(formatted, name);
    saveAuth({
      phone: formatted,
      verifiedAt: new Date().toISOString(),
      token: `verified-${Date.now()}`,
      verifyMethod: "screen",
      displayName: name,
    });
    onVerified(formatted, name);
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
              <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">{t.subtitle}</p>
            </div>
          </div>
          {!required && onClose && (
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="text-[9px] text-teal-400/90 bg-teal-500/10 border border-teal-500/20 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
          <MonitorSmartphone className="w-3.5 h-3.5 shrink-0" />
          {t.freeNote}
        </p>

        {step === "phone" ? (
          <>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 uppercase tracking-wider">{t.name}</label>
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                <User className="w-4 h-4 text-teal-400 shrink-0" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="flex-1 bg-transparent text-white text-sm outline-none"
                  placeholder={t.namePlaceholder}
                />
              </div>
            </div>
            <div className="space-y-1">
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
            </div>
            {error && <p className="text-[10px] text-red-400">{error}</p>}
            <button
              type="button"
              onClick={handleShowCode}
              disabled={loading}
              className="w-full py-2.5 bg-teal-400 hover:bg-teal-300 disabled:opacity-60 text-slate-950 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {t.showCode}
            </button>
          </>
        ) : (
          <>
            <p className="text-[10px] text-gray-400 font-mono">{phone} · {displayName}</p>

            <div className="bg-gradient-to-br from-teal-500/20 to-cyan-600/10 border-2 border-teal-400/40 rounded-xl p-4 text-center">
              <p className="text-[9px] text-teal-300 uppercase tracking-widest font-bold">{t.codeTitle}</p>
              <p className="text-4xl font-black font-mono text-white tracking-[0.3em] mt-2">{expectedOtp}</p>
              <p className="text-[9px] text-gray-400 mt-2 leading-snug">{t.codeHint}</p>
            </div>

            <label className="text-[10px] text-gray-500 uppercase tracking-wider">{t.otp}</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="w-full bg-slate-950 text-white text-center text-2xl font-mono tracking-[0.5em] p-3 rounded-xl border border-slate-800 focus:border-teal-400 outline-none"
              placeholder="••••"
              autoFocus
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
              onClick={() => {
                setStep("phone");
                setOtp("");
                setExpectedOtp("");
                setError(null);
              }}
              className="w-full text-[10px] text-gray-400 hover:text-teal-400"
            >
              {t.back}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
