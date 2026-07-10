import React, { useState, useEffect } from "react";
import { 
  Car, 
  Package, 
  Truck,
  SquarePlay,
  Zap,
  Search, 
  MapPin, 
  Mic, 
  Star, 
  User, 
  Wallet, 
  Sparkles, 
  CheckCircle2, 
  Map, 
  Cpu, 
  X, 
  Shield, 
  Navigation, 
  ChevronRight,
  TrendingUp,
  Activity,
  CreditCard,
  Volume2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface UIUXShowcaseProps {
  onClose: () => void;
  lang: "uz" | "en" | "ru";
  embedded?: boolean;
}

export default function UIUXShowcase({ onClose, lang, embedded = false }: UIUXShowcaseProps) {
  // Soundwave animation states
  const [waveHeights, setWaveHeights] = useState<number[]>([12, 24, 18, 30, 16, 24, 14, 32, 22, 10, 18, 26, 12]);
  const [activeDriverStatus, setActiveDriverStatus] = useState<boolean>(true);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Animate soundwaves periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setWaveHeights(prev => prev.map(() => Math.floor(Math.random() * 26) + 8));
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // Multi-language translation support inside presentation
  const showT = {
    uz: {
      presentation_title: "404-GO - AI Super Mobility Platformasi",
      presentation_subtitle: "Dizayn taqdimoti va Yuqori darajadagi UI/UX keys",
      close_btn: "Taqdimotni yopish",
      services_count: "50+ Xizmatlar",
      ai_assistant: "AI Yordamchi",
      countries_count: "100+ Davlatlar",
      search_placeholder: "Qayerga boramiz?",
      order_details: "Buyurtma Tafsiloti",
      driver: "Azizbek",
      driver_rating: "4.9 ball",
      car_model: "Chevrolet Onix (Elektro)",
      track_order: "Buyurtmani kuzatish",
      ai_assistants: "AI Yordamchilaringiz",
      ai_route: "AI Route",
      ai_route_desc: "Optimal marshrut topuvchi",
      ai_traffic: "AI Traffic",
      ai_traffic_desc: "Haqiqiy vaqtdagi tirbandlik tahlili",
      ai_pricing: "AI Pricing",
      ai_pricing_desc: "Dinamik va aqlli narxlash tizimi",
      ai_safety: "AI Safety",
      ai_safety_desc: "Aqlli xavfsizlik va favqulodda yordam",
      realtime_map: "REAL-TIME XARITA",
      payment_methods: "TO'LOV USULLARI",
      voice_order: "OVOZ ORQALI BUYURTMA",
      voice_desc: "404-GO AI sizning ovozingiz orqali buyurtmani tezda rasmiylashtiradi.",
      tashkent_skyline: "Toshkent City raqamli osmono'par binolari",
      underglow: "Neon osti yorug'ligi",
      cyber_car: "Kelajak elektromobili",
    },
    en: {
      presentation_title: "404-GO - AI Super Mobility Platform",
      presentation_subtitle: "Design Presentation & High-Fidelity UI/UX Case Study",
      close_btn: "Close Presentation",
      services_count: "50+ Services",
      ai_assistant: "AI Assistant",
      countries_count: "100+ Countries",
      search_placeholder: "Where to?",
      order_details: "Order Details",
      driver: "Azizbek",
      driver_rating: "4.9 rating",
      car_model: "Chevrolet Onix (Electric)",
      track_order: "Track Order",
      ai_assistants: "AI Assistants",
      ai_route: "AI Route",
      ai_route_desc: "Optimal pathfinder algorithm",
      ai_traffic: "AI Traffic",
      ai_traffic_desc: "Real-time congestion analytics",
      ai_pricing: "AI Pricing",
      ai_pricing_desc: "Dynamic and smart fare system",
      ai_safety: "AI Safety",
      ai_safety_desc: "Intelligent safety shield",
      realtime_map: "REAL-TIME MAP",
      payment_methods: "PAYMENT METHODS",
      voice_order: "VOICE ORDERING",
      voice_desc: "404-GO AI processes your booking instantly using voice commands.",
      tashkent_skyline: "Toshkent City Digital Skyline",
      underglow: "Neon Underglow",
      cyber_car: "Futuristic EV",
    },
    ru: {
      presentation_title: "404-GO - AI Super Mobility Платформа",
      presentation_subtitle: "Презентация дизайна и высокотехнологичный UI/UX Кейс",
      close_btn: "Закрыть презентацию",
      services_count: "50+ Услуг",
      ai_assistant: "AI Помощник",
      countries_count: "100+ Стран",
      search_placeholder: "Куда едем?",
      order_details: "Детали Заказа",
      driver: "Азизбек",
      driver_rating: "Рейтинг 4.9",
      car_model: "Chevrolet Onix (Электро)",
      track_order: "Отследить заказ",
      ai_assistants: "Ваши AI Ассистенты",
      ai_route: "AI Route",
      ai_route_desc: "Оптимальный поиск маршрута",
      ai_traffic: "AI Traffic",
      ai_traffic_desc: "Анализ пробок в реальном времени",
      ai_pricing: "AI Pricing",
      ai_pricing_desc: "Динамическое умное ценообразование",
      ai_safety: "AI Safety",
      ai_safety_desc: "Интеллектуальный щит безопасности",
      realtime_map: "КАРТА В РЕАЛЬНОМ ВРЕМЕНИ",
      payment_methods: "СПОСОБЫ ОПЛАТЫ",
      voice_order: "ГОЛОСОВОЙ ЗАКАЗ",
      voice_desc: "404-GO AI мгновенно оформляет заказ по вашему голосовому запросу.",
      tashkent_skyline: "Цифровой Скайлайн Ташкент Сити",
      underglow: "Неоновая подсветка",
      cyber_car: "Электромобиль будущего",
    }
  };

  const st = showT[lang] || showT["uz"];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`${embedded ? "absolute rounded-[32px] z-50" : "fixed z-50"} inset-0 bg-[#060a13] text-gray-100 overflow-y-auto font-sans selection:bg-teal-500/30 selection:text-teal-200`}
    >
      {/* 1. HEADER BAR */}
      <header className={`sticky top-0 z-50 bg-[#080d19]/90 backdrop-blur-md border-b border-slate-900 ${embedded ? "px-3 py-2.5" : "px-6 py-4"} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <div className={`${embedded ? "w-7 h-7 rounded-lg" : "w-9 h-9 rounded-xl"} bg-gradient-to-tr from-cyan-400 to-teal-500 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.35)] shrink-0`}>
            <span className={`font-mono font-black text-slate-950 ${embedded ? "text-xs" : "text-base"}`}>NX</span>
          </div>
          <div>
            <h2 className="text-white font-black text-xs md:text-sm tracking-tight leading-none">
              404-GO <span className="text-cyan-400">{embedded ? "STUDIO" : "DESIGN STUDIO"}</span>
            </h2>
            {!embedded && <p className="text-[10px] text-gray-400 mt-1">{st.presentation_subtitle}</p>}
            {embedded && <p className="text-[8px] text-gray-400 mt-0.5">{lang === "uz" ? "Dizayn taqdimoti" : lang === "ru" ? "Презентация дизайна" : "Design Case"}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!embedded && (
            <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              BEHANCE FEATURED 2026
            </span>
          )}
          <button 
            onClick={onClose}
            className={`flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg border border-slate-800 hover:border-slate-750 transition ${embedded ? "p-1 text-[10px]" : "px-3 py-1.5 text-xs"}`}
          >
            <X className={`${embedded ? "w-3.5 h-3.5" : "w-4 h-4"} text-rose-400`} />
            {!embedded && <span>{st.close_btn}</span>}
          </button>
        </div>
      </header>

      {/* 2. MAIN 3-COLUMN LAYOUT SHOWCASE */}
      <div className={`${embedded ? "px-3 py-4 flex flex-col gap-6" : "max-w-7xl mx-auto px-6 py-10 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8"} items-start relative`}>
        {/* Abstract futuristic grid background shapes */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none" />

        {/* ==================== LEFT COLUMN: HERO & BRAND ASSETS ==================== */}
        <div className="lg:col-span-4 space-y-8">
          <div>
            <motion.div 
              initial={{ y: -15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-block"
            >
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">
                AI SUPER MOBILITY PLATFORM
              </span>
            </motion.div>
            
            <motion.h1 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-6xl lg:text-7xl font-black text-white tracking-tighter mt-4 leading-none"
            >
              NEX<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400">GO</span>
            </motion.h1>
            
            <p className="text-gray-400 text-xs font-medium tracking-wider font-mono mt-2 uppercase">
              {st.presentation_subtitle}
            </p>
          </div>

          {/* FUTURISTIC CAR ILLUSTRATION BLOCK */}
          <div className="bg-[#090f1e] rounded-3xl p-5 border border-slate-900/80 shadow-2xl relative overflow-hidden group">
            {/* Grid grid overlay for tech look */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,30,55,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(18,30,55,0.06)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
            
            {/* Cyberpunk City Skyline overlay */}
            <div className="relative w-full h-[180px] bg-[#050811] rounded-2xl border border-slate-900 overflow-hidden flex flex-col justify-end">
              {/* Neon sky gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-cyan-950/40 via-[#050811] to-black" />
              
              {/* Vector Digital Skyline skyscrapers */}
              <div className="absolute inset-x-0 bottom-0 h-24 flex items-end justify-between px-4 opacity-25">
                <div className="w-10 h-16 bg-[#162a4a] rounded-t-sm" />
                <div className="w-8 h-20 bg-[#1e3a63] rounded-t-md relative">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-0.5 h-10 bg-cyan-400/50" />
                </div>
                <div className="w-14 h-12 bg-[#12223b] rounded-t-sm" />
                <div className="w-12 h-24 bg-[#234270] rounded-t-lg relative">
                  <div className="absolute top-4 left-2 right-2 bottom-0 grid grid-cols-2 gap-1 px-1 py-1">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-cyan-300/30 w-1.5 h-1.5 rounded-2xs" />
                    ))}
                  </div>
                </div>
                <div className="w-10 h-14 bg-[#142642] rounded-t-xs" />
                <div className="w-7 h-18 bg-[#1a3257] rounded-t-md" />
              </div>

              {/* Glowing grid horizon lines */}
              <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-cyan-500/10 to-transparent border-b border-cyan-500/30" />

              {/* Cyberpunk EV Sedan Car - Vector Design built in CSS */}
              <div className="absolute inset-x-0 bottom-3 flex justify-center z-10">
                <div className="relative w-56 h-16">
                  {/* Cyberpunk Wet reflection on floor */}
                  <div className="absolute -bottom-1 left-2 right-2 h-1 bg-cyan-400/60 blur-xs rounded-full animate-pulse" />
                  <div className="absolute -bottom-1 left-12 right-12 h-1.5 bg-emerald-400/40 blur-xs rounded-full animate-pulse" />

                  {/* UNDERGLOW EFFECT */}
                  <div className="absolute bottom-0 left-6 right-6 h-3 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full blur-md opacity-75 animate-pulse" />

                  {/* CAR SHAPE (SLEEK EV SEDAN COUPE) */}
                  <svg viewBox="0 0 250 80" className="w-full h-full text-slate-950 fill-current drop-shadow-[0_4px_10px_rgba(0,240,255,0.15)]">
                    {/* Cabin/Roofline */}
                    <path d="M40 50 Q75 12, 140 10 T210 46 L225 52 Q230 54, 226 58 L15 58 Q12 55, 20 52 Z" className="fill-slate-900 stroke-cyan-500/40" strokeWidth="1" />
                    {/* Main lower chassis body */}
                    <path d="M12 48 Q22 46, 32 46 Q115 48, 175 42 Q230 45, 242 50 Q248 53, 244 58 L238 62 Q235 64, 222 64 L25 64 Q12 64, 10 58 L12 48 Z" className="fill-[#0c1426] stroke-teal-400/50" strokeWidth="1" />
                    {/* Front hood line */}
                    <path d="M210 46 Q222 51, 230 52" className="stroke-cyan-400" strokeWidth="1.5" />
                    {/* Cabin windshield lines */}
                    <path d="M70 48 L105 20 Q125 18, 150 18 L170 38" className="stroke-cyan-300/40 fill-cyan-400/5" strokeWidth="1" />
                    {/* Sleek side mirror */}
                    <path d="M110 38 Q102 38, 104 42" className="stroke-cyan-400" strokeWidth="1.5" />
                    {/* Futuristic Headlight (Neon Cyan line) */}
                    <path d="M232 53 L242 54" className="stroke-cyan-400" strokeWidth="2.5" strokeLinecap="round" />
                    {/* Futuristic Tail-light (Neon Red line) */}
                    <path d="M14 51 L24 50" className="stroke-rose-500" strokeWidth="2.5" strokeLinecap="round" />
                    {/* Ground line shadows */}
                    <line x1="8" y1="65" x2="242" y2="65" className="stroke-black" strokeWidth="2" />
                    {/* Wheels */}
                    <circle cx="58" cy="62" r="13" className="fill-slate-950 stroke-teal-400/60" strokeWidth="2" />
                    <circle cx="58" cy="62" r="6" className="fill-slate-900 stroke-cyan-400" strokeWidth="1" />
                    <circle cx="184" cy="62" r="13" className="fill-slate-950 stroke-teal-400/60" strokeWidth="2" />
                    <circle cx="184" cy="62" r="6" className="fill-slate-900 stroke-cyan-400" strokeWidth="1" />
                  </svg>
                </div>
              </div>

              {/* Skyline floating label */}
              <div className="absolute top-2 left-3 bg-black/55 backdrop-blur-xs px-2 py-0.5 rounded text-[8px] font-mono text-cyan-400">
                {st.tashkent_skyline}
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-1.5">
                <Car className="w-4 h-4 text-cyan-400 animate-bounce" />
                <span className="text-xs font-black text-white uppercase">{st.cyber_car}</span>
              </div>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">
                {st.underglow}
              </span>
            </div>
          </div>

          {/* THREE FLOATING GLASSMORPHISM STAT CARDS */}
          <div className="space-y-4">
            <motion.div 
              whileHover={{ scale: 1.03, x: 5 }}
              className="bg-gradient-to-r from-cyan-950/20 to-slate-900/30 backdrop-blur-md p-4 rounded-2xl border border-cyan-500/20 shadow-lg flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center text-cyan-400 border border-cyan-500/25 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                  <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: "12s" }} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white tracking-wide uppercase">{st.services_count}</h4>
                  <p className="text-[9px] text-gray-500 mt-0.5">Taksi, Yetkazib berish, Yuk tashish, Parking, EV...</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-cyan-400/50 group-hover:text-cyan-400 transition" />
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.03, x: 5 }}
              className="bg-gradient-to-r from-teal-950/20 to-slate-900/30 backdrop-blur-md p-4 rounded-2xl border border-teal-500/20 shadow-lg flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-400/10 flex items-center justify-center text-teal-400 border border-teal-500/25 shadow-[0_0_10px_rgba(45,212,191,0.2)]">
                  <Cpu className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white tracking-wide uppercase">{st.ai_assistant}</h4>
                  <p className="text-[9px] text-gray-500 mt-0.5">Gemini sun'iy intellekti bilan integratsiya</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-teal-400/50 group-hover:text-teal-400 transition" />
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.03, x: 5 }}
              className="bg-gradient-to-r from-emerald-950/20 to-slate-900/30 backdrop-blur-md p-4 rounded-2xl border border-emerald-500/20 shadow-lg flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center text-emerald-400 border border-emerald-500/25 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                  <Map className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white tracking-wide uppercase">{st.countries_count}</h4>
                  <p className="text-[9px] text-gray-500 mt-0.5">Xalqaro darajadagi super-ilova tajribasi</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-400/50 group-hover:text-emerald-400 transition" />
            </motion.div>
          </div>
        </div>

        {/* ==================== CENTER COLUMN: TWO SMARTPHONE MOCKUPS ==================== */}
        <div className="lg:col-span-4 flex flex-col items-center gap-8 md:flex-row md:justify-center lg:flex-col lg:items-center">
          
          {/* TOP PHONE SCREEN mockup */}
          <div className="relative w-full max-w-[280px] aspect-[9/19] bg-[#03060c] rounded-[42px] p-2.5 border-[5px] border-slate-800/95 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Speaker & Dynamic island notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-950 rounded-b-xl z-50 flex items-center justify-center">
              <div className="w-8 h-1 bg-slate-800 rounded-full" />
            </div>

            {/* Screen Inner */}
            <div className="flex-grow rounded-[32px] overflow-hidden bg-[#0a0f1d] p-3 pt-4 flex flex-col justify-between border border-slate-900 relative">
              {/* Map background style layer */}
              <div className="absolute inset-0 bg-[#070b14] pointer-events-none opacity-40">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.1)_1px,transparent_1px)] bg-[size:12px_12px]" />
                {/* Abstract Route Line drawing */}
                <svg className="w-full h-full stroke-cyan-400/30" fill="none">
                  <path d="M 40 40 Q 120 100, 80 180 T 200 240" strokeWidth="2" strokeDasharray="3 3" />
                </svg>
              </div>

              {/* Phone Header */}
              <div className="relative z-10 flex justify-between items-center text-[8px] font-mono text-gray-400 mt-1">
                <span>09:41</span>
                <span className="text-cyan-400">404-GO UX</span>
              </div>

              {/* "Qayerga boramiz?" Search block */}
              <div className="relative z-10 space-y-2 mt-4">
                <div className="bg-slate-950/95 p-2 rounded-xl border border-cyan-400/40 flex items-center gap-2 shadow-[0_0_12px_rgba(34,211,238,0.15)]">
                  <Search className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="text-[10px] text-white font-medium">{st.search_placeholder}</span>
                  <span className="w-1 h-3.5 bg-cyan-400 ml-auto animate-pulse" />
                </div>
              </div>

              {/* Colorful 3D Services Icons Grid */}
              <div className="relative z-10 grid grid-cols-3 gap-2 my-4">
                <div className="bg-gradient-to-br from-amber-400/20 to-amber-500/5 p-2 rounded-xl border border-amber-400/20 flex flex-col items-center justify-center text-center">
                  <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center text-amber-400 mb-1.5 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                    <Car className="w-4 h-4 fill-amber-400/20" />
                  </div>
                  <span className="text-[8px] font-bold text-white uppercase">Taxi</span>
                </div>

                <div className="bg-gradient-to-br from-orange-400/20 to-orange-500/5 p-2 rounded-xl border border-orange-400/20 flex flex-col items-center justify-center text-center">
                  <div className="w-8 h-8 rounded-lg bg-orange-400/10 flex items-center justify-center text-orange-400 mb-1.5 shadow-[0_0_8px_rgba(249,115,22,0.2)]">
                    <Package className="w-4 h-4" />
                  </div>
                  <span className="text-[8px] font-bold text-white uppercase">Delivery</span>
                </div>

                <div className="bg-gradient-to-br from-blue-400/20 to-blue-500/5 p-2 rounded-xl border border-blue-400/20 flex flex-col items-center justify-center text-center">
                  <div className="w-8 h-8 rounded-lg bg-blue-400/10 flex items-center justify-center text-blue-400 mb-1.5 shadow-[0_0_8px_rgba(59,130,246,0.2)]">
                    <Truck className="w-4 h-4" />
                  </div>
                  <span className="text-[8px] font-bold text-white uppercase">Cargo</span>
                </div>

                <div className="bg-gradient-to-br from-cyan-400/20 to-cyan-500/5 p-2 rounded-xl border border-cyan-400/20 flex flex-col items-center justify-center text-center">
                  <div className="w-8 h-8 rounded-lg bg-cyan-400/10 flex items-center justify-center text-cyan-400 mb-1.5 shadow-[0_0_8px_rgba(34,211,238,0.2)]">
                    <SquarePlay className="w-4 h-4" />
                  </div>
                  <span className="text-[8px] font-bold text-white uppercase">Parking</span>
                </div>

                <div className="bg-gradient-to-br from-violet-400/20 to-violet-500/5 p-2 rounded-xl border border-violet-400/20 flex flex-col items-center justify-center text-center col-span-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-400/10 flex items-center justify-center text-violet-400 mb-1.5 shadow-[0_0_8px_rgba(139,92,246,0.2)]">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="text-[8px] font-bold text-white uppercase">EV Charge</span>
                </div>
              </div>

              {/* Bottom active app nav with Home */}
              <div className="relative z-10 border-t border-slate-850 pt-2 flex justify-between items-center text-[7px] text-gray-500">
                <span className="text-cyan-400 font-bold flex flex-col items-center gap-0.5">
                  <Map className="w-3.5 h-3.5" />
                  Home
                </span>
                <span className="flex flex-col items-center gap-0.5">
                  <Wallet className="w-3.5 h-3.5" />
                  Wallet
                </span>
                <span className="flex flex-col items-center gap-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Chat
                </span>
              </div>
            </div>

            {/* iOS Home line */}
            <div className="w-20 h-1 bg-slate-700 mx-auto mt-1 rounded-full shrink-0" />
          </div>

          {/* BOTTOM PHONE SCREEN: Buyurtma tafsilotlari */}
          <div className="relative w-full max-w-[280px] aspect-[9/19] bg-[#03060c] rounded-[42px] p-2.5 border-[5px] border-slate-800/95 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-950 rounded-b-xl z-50 flex items-center justify-center">
              <div className="w-8 h-1 bg-slate-800 rounded-full" />
            </div>

            {/* Inner */}
            <div className="flex-grow rounded-[32px] overflow-hidden bg-[#090e1a] p-3 pt-4 flex flex-col justify-between border border-slate-900 relative">
              <div className="relative z-10 flex justify-between items-center text-[8px] font-mono text-gray-400 mt-1">
                <span>09:42</span>
                <span className="text-emerald-400">{st.order_details}</span>
              </div>

              {/* Mock active path from Point A to Point B on mini map background */}
              <div className="relative z-10 h-24 bg-slate-950 rounded-xl overflow-hidden border border-slate-850 my-2.5">
                <div className="absolute inset-0 opacity-15 bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:8px_8px]" />
                <svg className="w-full h-full relative" fill="none">
                  {/* Glowing Route line */}
                  <path d="M 25 75 Q 60 20, 100 50 T 215 35" className="stroke-emerald-400" strokeWidth="2.5" strokeLinecap="round" />
                  {/* Point A pin */}
                  <circle cx="25" cy="75" r="4.5" className="fill-slate-950 stroke-cyan-400" strokeWidth="2" />
                  <circle cx="25" cy="75" r="1.5" className="fill-cyan-400" />
                  {/* Point B pin */}
                  <circle cx="215" cy="35" r="4.5" className="fill-slate-950 stroke-emerald-400" strokeWidth="2" />
                  <circle cx="215" cy="35" r="1.5" className="fill-emerald-400" />
                  {/* Moving taxi indicator along path */}
                  <circle cx="100" cy="50" r="3.5" className="fill-amber-400 animate-ping" />
                  <circle cx="100" cy="50" r="2.5" className="fill-amber-400" />
                </svg>
                <div className="absolute bottom-1 right-2 bg-black/60 px-1.5 py-0.5 rounded text-[7px] font-mono text-emerald-400">
                  Route Active
                </div>
              </div>

              {/* Driver Azizbek Profile card */}
              <div className="relative z-10 bg-slate-950 p-2 rounded-xl border border-slate-850 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-900 border border-emerald-400 flex items-center justify-center text-teal-400 relative">
                    <User className="w-4 h-4 text-emerald-400" />
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-slate-950" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-[9px] font-bold text-white">{st.driver} G'ulomov</p>
                    <div className="flex items-center gap-0.5">
                      <Star className="w-2 h-2 text-amber-400 fill-amber-400" />
                      <span className="text-[7px] text-gray-400 font-mono">{st.driver_rating}</span>
                    </div>
                  </div>
                  <div className="ml-auto text-right">
                    <span className="text-[8px] font-mono text-gray-500 uppercase">EV Sedan</span>
                    <p className="text-[8px] font-mono text-white mt-0.5">{st.car_model}</p>
                  </div>
                </div>

                <div className="h-px bg-slate-900" />

                {/* Price block */}
                <div className="flex justify-between items-center text-[9px]">
                  <span className="text-gray-400">Yo'l haqi / Fare:</span>
                  <span className="font-mono font-black text-emerald-400">28,000 so'm</span>
                </div>
              </div>

              {/* Action track button */}
              <div className="relative z-10 mt-3">
                <button className="w-full py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-[9px] uppercase tracking-wider rounded-lg transition duration-200 flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                  <Navigation className="w-3.5 h-3.5" />
                  {st.track_order}
                </button>
              </div>
            </div>

            {/* iOS line */}
            <div className="w-20 h-1 bg-slate-700 mx-auto mt-1 rounded-full shrink-0" />
          </div>

        </div>

        {/* ==================== RIGHT COLUMN: AI FEATURES & DETAILED UTILITIES ==================== */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* AI YORDAMCHILARINGIZ (Grid of 4 Feature Cards) */}
          <div className="bg-[#090f1e]/80 border border-slate-900 rounded-3xl p-5 space-y-4 shadow-2xl">
            <h3 className="font-display font-extrabold text-xs text-cyan-400 tracking-wider uppercase flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              {st.ai_assistants}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div 
                onMouseEnter={() => setHoveredCard("route")}
                onMouseLeave={() => setHoveredCard(null)}
                className={`bg-slate-950 p-3 rounded-xl border transition ${
                  hoveredCard === "route" ? "border-cyan-400" : "border-slate-850"
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-cyan-400/10 flex items-center justify-center text-cyan-400 mb-2">
                  <Navigation className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white">{st.ai_route}</h4>
                <p className="text-[9px] text-gray-500 mt-1 leading-tight">{st.ai_route_desc}</p>
              </div>

              <div 
                onMouseEnter={() => setHoveredCard("traffic")}
                onMouseLeave={() => setHoveredCard(null)}
                className={`bg-slate-950 p-3 rounded-xl border transition ${
                  hoveredCard === "traffic" ? "border-teal-400" : "border-slate-850"
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-teal-400/10 flex items-center justify-center text-teal-400 mb-2">
                  <Activity className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white">{st.ai_traffic}</h4>
                <p className="text-[9px] text-gray-500 mt-1 leading-tight">{st.ai_traffic_desc}</p>
              </div>

              <div 
                onMouseEnter={() => setHoveredCard("pricing")}
                onMouseLeave={() => setHoveredCard(null)}
                className={`bg-slate-950 p-3 rounded-xl border transition ${
                  hoveredCard === "pricing" ? "border-emerald-400" : "border-slate-850"
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-400/10 flex items-center justify-center text-emerald-400 mb-2">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white">{st.ai_pricing}</h4>
                <p className="text-[9px] text-gray-500 mt-1 leading-tight">{st.ai_pricing_desc}</p>
              </div>

              <div 
                onMouseEnter={() => setHoveredCard("safety")}
                onMouseLeave={() => setHoveredCard(null)}
                className={`bg-slate-950 p-3 rounded-xl border transition ${
                  hoveredCard === "safety" ? "border-rose-400" : "border-slate-850"
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-rose-400/10 flex items-center justify-center text-rose-400 mb-2">
                  <Shield className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white">{st.ai_safety}</h4>
                <p className="text-[9px] text-gray-500 mt-1 leading-tight">{st.ai_safety_desc}</p>
              </div>
            </div>
          </div>

          {/* REAL-TIME XARITA 3D Isometric flow mock */}
          <div className="bg-[#090f1e]/80 border border-slate-900 rounded-3xl p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-extrabold text-xs text-white tracking-wider uppercase">
                {st.realtime_map}
              </h3>
              <span className="text-[9px] font-mono text-cyan-400">ACTIVE FLOWS</span>
            </div>

            {/* Stylized isometric lines track map */}
            <div className="w-full h-24 bg-slate-950 rounded-2xl relative overflow-hidden border border-slate-850 flex items-center justify-center">
              <div className="absolute inset-0 bg-[#060a12]" />
              <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(244,63,94,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(244,63,94,0.08)_1px,transparent_1px)] bg-[size:16px_16px]" />
              
              {/* Isometric roads with animated pipeline flows */}
              <svg className="w-full h-full relative z-10" viewBox="0 0 300 100" fill="none">
                {/* Red flow line */}
                <path d="M 20 80 L 120 40 L 220 70" className="stroke-rose-500" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
                <path d="M 20 80 L 120 40 L 220 70" className="stroke-rose-300" strokeWidth="1.5" strokeDasharray="5 15" strokeLinecap="round" />

                {/* Yellow flow line */}
                <path d="M 60 10 L 150 50 L 280 15" className="stroke-amber-400" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
                <path d="M 60 10 L 150 50 L 280 15" className="stroke-white" strokeWidth="1.5" strokeDasharray="5 20" strokeLinecap="round" />

                {/* Green active pipeline */}
                <path d="M 120 40 L 250 80 L 290 50" className="stroke-emerald-400" strokeWidth="4.5" strokeLinecap="round" opacity="0.9" />
                <path d="M 120 40 L 250 80 L 290 50" className="stroke-emerald-100" strokeWidth="2" strokeDasharray="8 25" strokeLinecap="round" />
              </svg>

              <div className="absolute top-2 left-3 bg-black/60 px-2 py-0.5 rounded text-[8px] font-mono text-gray-400">
                Live Traffic Pipelines
              </div>
            </div>
          </div>

          {/* TO'LOV USULLARI Logos arranged neatly */}
          <div className="bg-[#090f1e]/80 border border-slate-900 rounded-3xl p-5 space-y-3.5 shadow-2xl">
            <h3 className="font-display font-extrabold text-xs text-white tracking-wider uppercase flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              {st.payment_methods}
            </h3>

            <div className="grid grid-cols-5 gap-2">
              <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl flex flex-col items-center justify-center text-center font-bold font-mono text-[8px] text-cyan-400 hover:border-cyan-400 transition cursor-pointer">
                CLICK
              </div>
              <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl flex flex-col items-center justify-center text-center font-bold font-mono text-[8px] text-emerald-400 hover:border-emerald-400 transition cursor-pointer">
                PAYME
              </div>
              <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl flex flex-col items-center justify-center text-center font-bold font-mono text-[8px] text-violet-400 hover:border-violet-400 transition cursor-pointer">
                UZUM
              </div>
              <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl flex flex-col items-center justify-center text-center font-bold font-mono text-[8px] text-white hover:border-white transition cursor-pointer">
                VISA
              </div>
              <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl flex flex-col items-center justify-center text-center font-bold font-mono text-[8px] text-gray-300 hover:border-teal-400 transition cursor-pointer">
                APPLE
              </div>
            </div>
          </div>

          {/* OVOZ ORQALI BUYURTMA Soundwave animation */}
          <div className="bg-[#090f1e]/80 border border-slate-900 rounded-3xl p-5 space-y-3 shadow-2xl">
            <h3 className="font-display font-extrabold text-xs text-teal-400 tracking-wider uppercase flex items-center gap-1.5">
              <Volume2 className="w-4 h-4" />
              {st.voice_order}
            </h3>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              {st.voice_desc}
            </p>

            {/* Simulated Active Sound Wave */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex items-center justify-center gap-1 relative overflow-hidden h-14">
              <div className="absolute left-4 text-teal-400/40">
                <Mic className="w-4 h-4 animate-pulse" />
              </div>

              {/* Sound bars */}
              <div className="flex items-end justify-center gap-1.5 h-full pt-2">
                {waveHeights.map((h, idx) => (
                  <motion.div
                    key={idx}
                    animate={{ height: h }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-1 rounded-full bg-gradient-to-t from-cyan-400 to-emerald-400"
                    style={{ minHeight: "3px" }}
                  />
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 3. CASE STUDY SPECIFICS FOOTER HERO BLOCK */}
      <footer className="bg-[#04070d] border-t border-slate-900/80 p-8 text-center text-xs text-gray-500">
        <div className="max-w-4xl mx-auto space-y-4">
          <p className="font-mono text-cyan-400 tracking-widest text-[10px] uppercase">
            404-GO MOBILITY RESEARCH &bull; THE COGNITIVE REVOLUTION OF CITIES
          </p>
          <p className="text-gray-400 max-w-xl mx-auto leading-relaxed">
            404-GO is designed with modular microservices powered by state-of-the-art LLMs, adaptive pathfinding networks, and instant payment routers to make modern cities smarter and more sustainable.
          </p>
          <div className="pt-2">
            <span className="text-[9px] text-gray-600 uppercase tracking-widest font-mono">
              Designed with ✦ by the AI Coding Assistant &bull; © 2026 404-GO Super App
            </span>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
