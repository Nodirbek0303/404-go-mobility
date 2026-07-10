import React, { useState, useEffect, useRef } from "react";
import { 
  Car, 
  Package, 
  Utensils, 
  ShoppingCart, 
  Truck, 
  Bus, 
  Key, 
  Bike, 
  Footprints, 
  SquarePlay, 
  Zap, 
  Wind, 
  ShieldAlert, 
  Ticket, 
  Droplets, 
  Grid, 
  ChevronRight, 
  Search, 
  MapPin, 
  Plus, 
  Phone, 
  ArrowRightLeft, 
  History, 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Star, 
  User, 
  Wallet, 
  Bell, 
  Heart, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Map, 
  Cpu, 
  Languages, 
  ChevronLeft,
  Download,
  FileText,
  Printer,
  Volume2,
  VolumeX,
  MessageSquare,
  Eye,
  Sliders,
  Camera,
  Navigation
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { translations } from "./translations";
import { serviceCategories, initialOrders, transitRoutes } from "./servicesData";
import { Language, Booking, ChatMessage, TransitRoute, UserProfile, AppNotification, SavedAddress, PaymentProvider, AuthSession } from "./types";
import MapComponent, { TASHKENT_LOCATIONS } from "./components/MapComponent";
import UIUXShowcase from "./components/UIUXShowcase";
import TaxiRidePanel from "./components/TaxiRidePanel";
import AuthModal from "./components/customer/AuthModal";
import NotificationPanel, { createNotification } from "./components/customer/NotificationPanel";
import SavedAddressesBar from "./components/customer/SavedAddressesBar";
import PaymentProviderModal from "./components/customer/PaymentProviderModal";
import SosShareBar, { callDriver } from "./components/customer/SosShareBar";
import DriverProfileCard from "./components/customer/DriverProfileCard";
import { useVoiceOrder } from "./hooks/useVoiceOrder";
import {
  loadAuth,
  loadNotifications,
  loadSavedAddresses,
  saveNotifications,
  saveSavedAddresses,
  clearAuth,
} from "./utils/customerStorage";
import {
  CARGO_TRUCKS,
  DELIVERY_VEHICLES,
  PARCEL_TYPES,
  PARKING_LOTS,
  EV_STATIONS,
  SERVICE_ROLE_HINTS,
  localizedName,
} from "./servicePoints";
import {
  googleMapsDirections,
  openExternalMap,
  twoGisPoint,
  yandexNavigatorRoute,
} from "./utils/mapProviders";

type BookingType = Booking["type"];
const SINGLE_LOCATION_SERVICES = ["parking", "ev_charge"];

function toBookingType(serviceId: string): BookingType {
  if (serviceId === "delivery") return "delivery";
  if (serviceId === "cargo") return "cargo";
  if (serviceId === "parking") return "parking";
  if (serviceId === "ev_charge") return "ev_charge";
  return "taxi";
}

function getOrderTitle(type: BookingType): { uz: string; en: string; ru: string } {
  const titles: Record<BookingType, { uz: string; en: string; ru: string }> = {
    taxi: { uz: "Taksi", en: "Taxi", ru: "Такси" },
    delivery: { uz: "Yetkazib berish", en: "Delivery", ru: "Доставка" },
    cargo: { uz: "Yuk tashish", en: "Cargo", ru: "Грузоперевозки" },
    parking: { uz: "Smart Parking", en: "Smart Parking", ru: "Парковка" },
    ev_charge: { uz: "EV zaryadlash", en: "EV Charging", ru: "Зарядка EV" },
  };
  return titles[type];
}

function getDirectBookingLabel(serviceId: string, language: Language): string {
  const labels: Record<string, { uz: string; en: string; ru: string }> = {
    taxi: { uz: "Taksi buyurtmasi", en: "Taxi Order", ru: "Заказ такси" },
    delivery: { uz: "Yetkazib berish", en: "Delivery", ru: "Доставка" },
    cargo: { uz: "Yuk tashish", en: "Cargo Delivery", ru: "Грузоперевозки" },
    parking: { uz: "Smart Parking", en: "Smart Parking", ru: "Парковка" },
    ev_charge: { uz: "EV zaryadlash", en: "EV Charging", ru: "Зарядка EV" },
  };
  return labels[serviceId]?.[language] ?? labels.taxi[language];
}

const PROFILE_STORAGE_KEY = "NEXGO_USER_PROFILE";

const emptyUserProfile: UserProfile = {
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  birthDate: "",
  photoUrl: null,
};

function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      return { ...emptyUserProfile, ...JSON.parse(raw) };
    }
  } catch {
    // ignore corrupt storage
  }
  return { ...emptyUserProfile };
}

export default function App() {
  const [lang, setLang] = useState<Language>("uz");
  const t = translations[lang];

  // Simulator tabs: 'home' | 'orders' | 'wallet' | 'messages' | 'profile'
  const [activeTab, setActiveTab] = useState<"home" | "orders" | "wallet" | "messages" | "profile">("home");
  
  // App Orders list (with simulation additions)
  const [orders, setOrders] = useState<Booking[]>(initialOrders);
  const [orderFilter, setOrderFilter] = useState<"active" | "completed" | "scheduled">("active");
  const [selectedOrder, setSelectedOrder] = useState<Booking | null>(initialOrders[0]);
  const [viewingHistoricalTrip, setViewingHistoricalTrip] = useState<Booking | null>(null);

  // Order Completed rating and feedback modal states
  const [completedOrderForRating, setCompletedOrderForRating] = useState<Booking | null>(null);
  const [selectedStars, setSelectedStars] = useState<number>(5);
  const [hoveredStars, setHoveredStars] = useState<number | null>(null);
  const [selectedFeedbackTags, setSelectedFeedbackTags] = useState<string[]>([]);
  const [userCommentText, setUserCommentText] = useState<string>("");

  // Wallet stats & forms
  const [balance, setBalance] = useState<number>(1250000);
  const [cashback, setCashback] = useState<number>(125000);
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(380);
  const [activeCoupons, setActiveCoupons] = useState<Array<{ id: string; code: string; type: string; discount: number; isFlat: boolean }>>([
    { id: "coupon-initial-1", code: "NEXWELCOME10", type: "10% Chegirma", discount: 10, isFlat: false },
  ]);
  const [appliedCouponId, setAppliedCouponId] = useState<string | null>(null);
  const [redeemedBanner, setRedeemedBanner] = useState<string | null>(null);
  const [promoCodeInput, setPromoCodeInput] = useState<string>("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<string>("50000");
  const [transferPhone, setTransferPhone] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferSuccess, setTransferSuccess] = useState(false);

  // Payment Cards
  const [paymentCards, setPaymentCards] = useState([
    { id: "card-uzcard", name: "Uzcard", logo: "UZCARD", number: "8600 4321 •••• 9876", expiry: "12/28", balance: 1250000, active: true },
    { id: "card-humo", name: "Humo", logo: "HUMO", number: "9860 8765 •••• 1234", expiry: "10/29", balance: 450000, active: false },
    { id: "card-visa", name: "Visa Gold", logo: "VISA", number: "4000 1024 •••• 5678", expiry: "05/30", balance: 2500000, active: false },
  ]);
  const [newCardNumber, setNewCardNumber] = useState("");
  const [newCardExpiry, setNewCardExpiry] = useState("");
  const [newCardCvv, setNewCardCvv] = useState("");
  const [newCardType, setNewCardType] = useState<"Uzcard" | "Humo" | "Visa" | "Mastercard">("Uzcard");
  const [newCardStartBalance, setNewCardStartBalance] = useState("500000");
  const [showAddCard, setShowAddCard] = useState(false);
  const [showShowcaseModal, setShowShowcaseModal] = useState(false);
  const [showShowcaseInsideApp, setShowShowcaseInsideApp] = useState(false);

  // User profile
  const [userProfile, setUserProfile] = useState<UserProfile>(loadUserProfile);
  const [profileErrors, setProfileErrors] = useState<Partial<Record<keyof UserProfile, string>>>({});
  const [profileSaveMessage, setProfileSaveMessage] = useState<string | null>(null);
  const [homePhotoMessage, setHomePhotoMessage] = useState<string | null>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);

  // Customer features: auth, notifications, saved addresses, payments, scheduling
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => loadAuth());
  const [showAuthModal, setShowAuthModal] = useState(() => !loadAuth());
  const [notifications, setNotifications] = useState<AppNotification[]>(() => loadNotifications());
  const [showNotifications, setShowNotifications] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(() => loadSavedAddresses());
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentPurpose, setPaymentPurpose] = useState<"booking" | "topup">("booking");
  const [selectedPaymentProvider, setSelectedPaymentProvider] = useState<PaymentProvider>("payme");
  const [scheduledDateTime, setScheduledDateTime] = useState("");
  const paymentCallbackRef = useRef<((provider: PaymentProvider) => void) | null>(null);

  const pushNotification = (partial: Omit<AppNotification, "id" | "read" | "createdAt">) => {
    const n = createNotification(partial);
    setNotifications((prev) => {
      const next = [n, ...prev].slice(0, 50);
      saveNotifications(next);
      return next;
    });
  };

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  const handleAuthVerified = (phone: string) => {
    setAuthSession(loadAuth());
    setShowAuthModal(false);
    setUserProfile((prev) => ({ ...prev, phone }));
    pushNotification({
      type: "system",
      title: { uz: "Xush kelibsiz!", en: "Welcome!", ru: "Добро пожаловать!" },
      body: {
        uz: `${phone} raqami tasdiqlandi. 404-GO xizmatlaridan foydalanishingiz mumkin.`,
        en: `${phone} verified. You can use 404-GO services.`,
        ru: `${phone} подтверждён. Можете пользоваться 404-GO.`,
      },
    });
  };

  const openPayment = (amount: number, purpose: "booking" | "topup", onSuccess: (provider: PaymentProvider) => void) => {
    setPaymentAmount(amount);
    setPaymentPurpose(purpose);
    paymentCallbackRef.current = onSuccess;
    setShowPaymentModal(true);
  };

  const handleSelectSavedAddress = (addr: SavedAddress, field: "from" | "to") => {
    if (field === "from") {
      setDirectFromText(addr.address);
      if (addr.coords) setCustomFromCoords(addr.coords);
    } else {
      setDirectToText(addr.address);
      if (addr.coords) setCustomToCoords(addr.coords);
    }
  };

  const handleSaveCustomAddress = (address: string) => {
    const newAddr: SavedAddress = {
      id: `custom-${Date.now()}`,
      label: { uz: "Sevimli", en: "Favorite", ru: "Избранное" },
      address,
      icon: "custom",
    };
    setSavedAddresses((prev) => {
      const next = [...prev, newAddr];
      saveSavedAddresses(next);
      return next;
    });
  };

  const [couponSortOrder, setCouponSortOrder] = useState<"desc" | "asc" | "code">("desc");
  const [useCashbackAsPayment, setUseCashbackAsPayment] = useState(false);

  // Driver notes input state
  const [driverNotesInput, setDriverNotesInput] = useState<string>("");

  useEffect(() => {
    if (selectedOrder) {
      setDriverNotesInput(selectedOrder.driverNotes || "");
    } else {
      setDriverNotesInput("");
    }
  }, [selectedOrder?.id]);

  const handleSaveDriverNotes = (orderId: string, notes: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, driverNotes: notes } : o));
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, driverNotes: notes } : null);
    }
    const msg = lang === "uz"
      ? "Haydovchi uchun eslatma muvaffaqiyatli saqlandi!"
      : lang === "ru"
        ? "Заметка для водителя успешно сохранена!"
        : "Notes for driver saved successfully!";
    speakText(msg);
  };

  // Voice announcement state & refs
  const [voiceAnnouncementsEnabled, setVoiceAnnouncementsEnabled] = useState<boolean>(true);
  
  const voiceAnnouncementsEnabledRef = useRef(voiceAnnouncementsEnabled);
  useEffect(() => {
    voiceAnnouncementsEnabledRef.current = voiceAnnouncementsEnabled;
  }, [voiceAnnouncementsEnabled]);

  const langRef = useRef(lang);
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  const speakText = (text: string) => {
    if (!voiceAnnouncementsEnabledRef.current || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/🔔|✅|⚠️|📢|⭐|🚀|🔥/g, '').trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const currentLang = langRef.current;
      if (currentLang === "uz") {
        utterance.lang = "uz-UZ";
      } else if (currentLang === "ru") {
        utterance.lang = "ru-RU";
      } else {
        utterance.lang = "en-US";
      }
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Speech synthesis error:", e);
    }
  };

  // 'Notify when near' simulation states
  const [notifyWhenNear, setNotifyWhenNear] = useState<boolean>(false);
  const [nearAlertBanner, setNearAlertBanner] = useState<string | null>(null);
  const [simulatedDistance, setSimulatedDistance] = useState<number | null>(null);

  // 'Notify when near' simulation logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (notifyWhenNear && selectedOrder && selectedOrder.status === "active") {
      setSimulatedDistance(1200); // Start at 1.2 km
      setNearAlertBanner(null);

      interval = setInterval(() => {
        setSimulatedDistance(prev => {
          if (prev === null) return null;
          if (prev <= 500) {
            if (interval) clearInterval(interval);
            // Trigger near alert
            const driverName = selectedOrder.driverName || "Azizbek";
            const msg = lang === "uz"
              ? `${driverName} yaqinlashmoqda! Haydovchi sizdan 450 metr uzoqlikda. Iltimos, tayyor turing!`
              : lang === "ru"
                ? `${driverName} приближается! Водитель в 450 метрах от вас. Пожалуйста, будьте готовы!`
                : `${driverName} is near! The driver is 450 meters away. Please be ready!`;
            
            setNearAlertBanner(`🔔 ${msg}`);
            speakText(msg);
            return 450;
          }
          return prev - 250;
        });
      }, 2000);
    } else {
      setSimulatedDistance(null);
      setNearAlertBanner(null);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [notifyWhenNear, selectedOrder?.id, selectedOrder?.status, lang]);


  // Transit route tool
  const [transitFrom, setTransitFrom] = useState("Amir Temur xiyoboni");
  const [transitTo, setTransitTo] = useState("Mustaqillik maydoni");
  const [transitOptions, setTransitOptions] = useState<TransitRoute[]>(transitRoutes);

  // Chat with NEXGO AI
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: translations[lang].ai_helper_desc,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [userInput, setUserInput] = useState("");
  const [userApiKeyState, setUserApiKeyState] = useState<string>(() => {
    return localStorage.getItem("NEXGO_GEMINI_API_KEY") || "";
  });
  const [apiKeyInput, setApiKeyInput] = useState(() => {
    return localStorage.getItem("NEXGO_GEMINI_API_KEY") || "";
  });
  const [isVerifyingKey, setIsVerifyingKey] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Voice Command (Web Speech API + fallback)
  const [voiceTimer, setVoiceTimer] = useState<number | null>(null);

  // Active Live Booking popup (parsed from Gemini or custom trigger)
  const [pendingBooking, setPendingBooking] = useState<{
    type: BookingType;
    from?: string;
    to?: string;
    price: number;
    title: string;
    subtitle: string;
    item?: string;
    couponCalculated?: boolean;
    originalPrice?: number;
    fromCoords?: { latitude: number; longitude: number };
    toCoords?: { latitude: number; longitude: number };
  } | null>(null);

  // Manual direct booking states without AI Chat transition
  const [directBookingService, setDirectBookingService] = useState<string | null>(null);
  const [directFromText, setDirectFromText] = useState("Chorsu bozori");
  const [directToText, setDirectToText] = useState("Magic City bog'i");
  const [customFromCoords, setCustomFromCoords] = useState<{ latitude: number; longitude: number } | null>({ latitude: 41.3216, longitude: 69.2285 });
  const [customToCoords, setCustomToCoords] = useState<{ latitude: number; longitude: number } | null>({ latitude: 41.3031, longitude: 69.2486 });
  const [pinMode, setPinMode] = useState<"from" | "to" | null>(null);
  const [selectedCargoTruck, setSelectedCargoTruck] = useState(CARGO_TRUCKS[0].id);
  const [selectedDeliveryVehicle, setSelectedDeliveryVehicle] = useState(DELIVERY_VEHICLES[1].id);
  const [selectedParcelType, setSelectedParcelType] = useState(PARCEL_TYPES[0].id);
  const [cargoWeightTon, setCargoWeightTon] = useState("1.5");
  const [selectedParkingId, setSelectedParkingId] = useState(PARKING_LOTS[0].id);
  const [selectedEvStationId, setSelectedEvStationId] = useState(EV_STATIONS[0].id);

  const applyParkingLot = (id: string) => {
    const lot = PARKING_LOTS.find((p) => p.id === id);
    if (!lot) return;
    setSelectedParkingId(id);
    setDirectFromText(localizedName(lot, lang));
    setCustomFromCoords({ latitude: lot.lat, longitude: lot.lng });
    setDirectToText("");
    setCustomToCoords(null);
  };

  const applyEvStation = (id: string) => {
    const st = EV_STATIONS.find((s) => s.id === id);
    if (!st) return;
    setSelectedEvStationId(id);
    setDirectFromText(localizedName(st, lang));
    setCustomFromCoords({ latitude: st.lat, longitude: st.lng });
    setDirectToText("");
    setCustomToCoords(null);
  };

  useEffect(() => {
    if (directBookingService === "parking") applyParkingLot(selectedParkingId);
    if (directBookingService === "ev_charge") applyEvStation(selectedEvStationId);
  }, [directBookingService, lang]);

  // Clear historical route viewing if a new direct booking flow starts
  useEffect(() => {
    if (directBookingService) {
      setViewingHistoricalTrip(null);
    }
  }, [directBookingService]);

  const handleMapClick = (lat: number, lng: number, name: string) => {
    if (pinMode === "from") {
      setDirectFromText(name);
      setCustomFromCoords({ latitude: lat, longitude: lng });
      setPinMode(null);
    } else if (pinMode === "to") {
      setDirectToText(name);
      setCustomToCoords({ latitude: lat, longitude: lng });
      setPinMode(null);
    }
  };

  // Quick prompt suggestions
  const suggestions = {
    uz: [
      "Chorsudan Magic Citygacha taksi chaqir",
      "Hujjatlarni yetkazib berish",
      "1 tonna yuk tashish kerak",
      "Eng yaqin smart parking topish",
      "EV zaryadlash stansiyasi qayerda?"
    ],
    en: [
      "Call a taxi from Chorsu to Magic City",
      "Deliver documents to my office",
      "I need cargo transport for 1 ton",
      "Find nearest smart parking",
      "Where is the nearest EV charging station?"
    ],
    ru: [
      "Вызови такси от Чорсу до Magic City",
      "Доставь документы в офис",
      "Нужна перевозка груза 1 тонна",
      "Найди ближайшую smart parking",
      "Где ближайшая станция зарядки EV?"
    ]
  };

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, activeTab]);

  // Sync initial welcome message on language change
  useEffect(() => {
    setChatMessages(prev => {
      if (prev.length === 1 && prev[0].id === "welcome") {
        return [{
          id: "welcome",
          role: "assistant",
          content: translations[lang].ai_helper_desc,
          timestamp: prev[0].timestamp
        }];
      }
      return prev;
    });
  }, [lang]);

  // Handle message send to backend
  const handleSendMessage = async (textToSend?: string) => {
    const prompt = textToSend || userInput;
    if (!prompt.trim()) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages(prev => [...prev, userMsg]);
    setUserInput("");
    setIsChatLoading(true);

    try {
      // Send actual full message history
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg].map(m => ({ role: m.role, content: m.content })),
          userLanguage: lang,
          userApiKey: userApiKeyState
        }),
      });

      const data = await response.json();
      const reply = data.text || "Kechirasiz, tizimda xatolik yuz berdi.";

      // Parse booking action tags from reply e.g. [BOOKING_ACTION: type=taxi, from=Chorsu, to=Magic City, price=28000]
      const bookingMatch = reply.match(/\[BOOKING_ACTION:\s*([^\]]+)\]/i);
      if (bookingMatch) {
        const paramsStr = bookingMatch[1];
        const params: Record<string, string> = {};
        paramsStr.split(",").forEach(p => {
          const [k, v] = p.split("=");
          if (k && v) params[k.trim().toLowerCase()] = v.trim();
        });

        // Trigger dynamic interactive booking request
        setPendingBooking({
          type: toBookingType(params.type || "taxi"),
          from: params.from || "Chorsu",
          to: params.to || "Magic City",
          price: parseInt(params.price) || 28000,
          title: params.type === "cargo" ? "404-GO Cargo" : params.type === "parking" ? "Smart Parking" : params.type === "ev_charge" ? "EV Charging" : params.type === "delivery" ? "Courier" : "404-GO Taxi",
          subtitle: params.type === "parking" || params.type === "ev_charge" ? (params.from || params.to || "Tashkent City") : `${params.from} → ${params.to}`,
        });
      }

      // Clean the action code from display message
      const cleanReply = reply.replace(/\[BOOKING_ACTION:[^\]]+\]/gi, "").trim();

      setChatMessages(prev => [
        ...prev,
        {
          id: `msg-reply-${Date.now()}`,
          role: "assistant",
          content: cleanReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);

    } catch (e) {
      console.error(e);
      // Fallback
      setChatMessages(prev => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          role: "assistant",
          content: lang === "uz" ? "Tarmoq ulanishida xatolik yuz berdi." : "Network connection error.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Simulate voice assistant (fallback when Web Speech unavailable)
  const startVoiceListeningLegacy = () => {
    const prompts = suggestions[lang];
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    let charIdx = 0;
    let acc = "";
    const interval = setInterval(() => {
      acc += randomPrompt.charAt(charIdx);
      charIdx++;
      if (charIdx >= randomPrompt.length) {
        clearInterval(interval);
        setTimeout(() => {
          handleSendMessage(randomPrompt);
          setActiveTab("messages");
        }, 800);
      }
    }, 45);
  };

  // Confirm booking & create active order
  const finalizeBooking = (paymentProvider: PaymentProvider = "card") => {
    if (!pendingBooking) return;

    // Find the active linked card
    const activeCard = paymentCards.find(c => c.active);

    let maxDeduct = 0;
    let cardPayment = pendingBooking.price;

    if (useCashbackAsPayment) {
      maxDeduct = Math.min(cashback, pendingBooking.price);
      cardPayment = pendingBooking.price - maxDeduct;
    }

    if (cardPayment > 0) {
      if (!activeCard) {
        const err = lang === "uz"
          ? "Platformaga biriktirilgan faol karta topilmadi! Iltimos, hamyon bo'limida yangi karta biriktiring."
          : lang === "ru"
            ? "Не найдена активная привязанная карта! Пожалуйста, привяжите карту в разделе кошелька."
            : "No active linked card found! Please link a card in the wallet section.";
        alert(err);
        speakText(err);
        return;
      }

      // Check balance of the linked card
      if (balance < cardPayment) {
        const err = lang === "uz"
          ? `Biriktirilgan "${activeCard.name}" kartangizda yetarli mablag' mavjud emas (Karta qoldig'i: ${balance.toLocaleString()} so'm, To'lanishi kerak: ${cardPayment.toLocaleString()} so'm). Iltimos, boshqa karta tanlang.`
          : lang === "ru"
            ? `На привязанной карте "${activeCard.name}" недостаточно средств (Баланс карты: ${balance.toLocaleString()} сумов, К оплате: ${cardPayment.toLocaleString()} сумов). Пожалуйста, выберите другую карту.`
            : `Insufficient funds on your linked "${activeCard.name}" card (Card balance: ${balance.toLocaleString()} UZS, Required: ${cardPayment.toLocaleString()} UZS). Please select another card.`;
        alert(err);
        speakText(err);
        return;
      }
    }

    // Deduct money from card (auto-debit) and cashback, then add earned cashback
    const earnedCashback = Math.floor(pendingBooking.price * 0.1);
    
    if (useCashbackAsPayment) {
      setCashback(prev => prev - maxDeduct + earnedCashback);
      setBalance(prev => prev - cardPayment);
    } else {
      setBalance(prev => prev - pendingBooking.price);
      setCashback(prev => prev + earnedCashback);
    }

    // Announce transaction details
    let debitMsg = "";
    if (useCashbackAsPayment) {
      if (cardPayment === 0) {
        debitMsg = lang === "uz"
          ? `To'lov to'liq kupon balansi (${maxDeduct.toLocaleString()} so'm) hisobidan amalga oshirildi!`
          : lang === "ru"
            ? `Оплата полностью списана с баланса купонов (${maxDeduct.toLocaleString()} сумов)!`
            : `Payment fully debited from your coupon balance (${maxDeduct.toLocaleString()} UZS)!`;
      } else {
        const activeCardNumber = activeCard ? (activeCard.number || "•••• 1234") : "•••• 1234";
        debitMsg = lang === "uz"
          ? `To'lov muvaffaqiyatli! ${maxDeduct.toLocaleString()} so'm kupon hisobidan va ${cardPayment.toLocaleString()} so'm ${activeCard.name} (${activeCardNumber}) kartangizdan avtomatik tarzda yechib olindi.`
          : lang === "ru"
            ? `Оплата успешна! ${maxDeduct.toLocaleString()} сумов списано с баланса купонов и ${cardPayment.toLocaleString()} сумов с карты ${activeCard.name} (${activeCardNumber}).`
            : `Payment successful! ${maxDeduct.toLocaleString()} UZS debited from coupons and ${cardPayment.toLocaleString()} UZS from your ${activeCard.name} (${activeCardNumber}) card.`;
      }
    } else {
      const activeCardNumber = activeCard ? (activeCard.number || "•••• 1234") : "•••• 1234";
      debitMsg = lang === "uz"
        ? `To'lov biriktirilgan ${activeCard.name} (${activeCardNumber}) kartangizdan avtomatik tarzda yechib olindi!`
        : lang === "ru"
          ? `Оплата автоматически списана с вашей привязанной карты ${activeCard.name} (${activeCardNumber})!`
          : `Payment automatically debited from your linked ${activeCard.name} (${activeCardNumber}) card!`;
    }

    speakText(debitMsg);

    // Consume discount coupon if applied
    if (appliedCouponId) {
      setActiveCoupons(prev => prev.filter(c => c.id !== appliedCouponId));
      setAppliedCouponId(null);
    }

    // Reset payment option
    setUseCashbackAsPayment(false);

    const isTaxi = pendingBooking.type === "taxi";
    const cargoTruck = CARGO_TRUCKS.find((t) => t.id === selectedCargoTruck);
    const deliveryVehicle = DELIVERY_VEHICLES.find((v) => v.id === selectedDeliveryVehicle);
    const parcel = PARCEL_TYPES.find((p) => p.id === selectedParcelType);
    const parkingLot = PARKING_LOTS.find((p) => p.id === selectedParkingId);
    const evStation = EV_STATIONS.find((s) => s.id === selectedEvStationId);

    const serviceDriverInfo = (() => {
      if (pendingBooking.type === "cargo" && cargoTruck) {
        return {
          driverName: "Yuk haydovchisi",
          carName: localizedName(cargoTruck, lang),
          carNumber: cargoTruck.plate,
        };
      }
      if (pendingBooking.type === "delivery" && deliveryVehicle) {
        return {
          driverName: "Kuryer",
          carName: `${localizedName(deliveryVehicle, lang)} · ${parcel ? localizedName(parcel, lang) : "Pochta"}`,
          carNumber: deliveryVehicle.plate,
        };
      }
      if (pendingBooking.type === "parking" && parkingLot) {
        return {
          driverName: "Smart Parking",
          carName: localizedName(parkingLot, lang),
          carNumber: `${parkingLot.freeSpots}/${parkingLot.spots} joy`,
        };
      }
      if (pendingBooking.type === "ev_charge" && evStation) {
        return {
          driverName: "EV Station",
          carName: localizedName(evStation, lang),
          carNumber: `${evStation.connectors} · ${evStation.powerKw}kW`,
        };
      }
      return {
        driverName: ["Sardor Alimov", "Rustam Pozilov", "Dina Ahmedova", "Aleksey Smirnov"][
          Math.floor(Math.random() * 4)
        ],
        carName: ["BYD Song Plus", "Chevrolet Onix", "Kia K5", "Tesla Model 3"][
          Math.floor(Math.random() * 4)
        ],
        carNumber: ["01 A 777 AA", "01 D 345 AB", "01 B 123 AB", "01 M 888 MA"][
          Math.floor(Math.random() * 4)
        ],
      };
    })();

    const statusForType = () => {
      if (isTaxi) return { uz: "Haydovchi qidirilmoqda", en: "Finding driver", ru: "Поиск водителя" };
      if (pendingBooking.type === "cargo") return { uz: "Yuk mashinasi tayinlandi", en: "Cargo truck assigned", ru: "Грузовик назначен" };
      if (pendingBooking.type === "delivery") return { uz: "Kuryer pochta olib ketmoqda", en: "Courier picking up mail", ru: "Курьер забирает посылку" };
      if (pendingBooking.type === "parking") return { uz: "Parkovka band qilindi", en: "Parking spot reserved", ru: "Место забронировано" };
      if (pendingBooking.type === "ev_charge") return { uz: "Zaryad stansiyasi tayyor", en: "Charging station ready", ru: "Станция готова" };
      return { uz: "Bajarilmoqda", en: "In progress", ru: "Выполняется" };
    };

    const isScheduled = !!scheduledDateTime && new Date(scheduledDateTime) > new Date();
    const scheduledStatus = {
      uz: "Rejalashtirilgan",
      en: "Scheduled",
      ru: "Запланировано",
    };

    const newOrder: Booking = {
      id: `order-${Date.now()}`,
      type: pendingBooking.type,
      title: getOrderTitle(pendingBooking.type),
      subtitle: {
        uz: pendingBooking.subtitle,
        en: pendingBooking.subtitle,
        ru: pendingBooking.subtitle,
      },
      price: pendingBooking.price,
      date: isScheduled
        ? new Date(scheduledDateTime).toLocaleString(lang === "ru" ? "ru-RU" : lang === "en" ? "en-US" : "uz-UZ")
        : "Hozirgina",
      status: isScheduled ? "scheduled" : "active",
      statusText: isScheduled ? scheduledStatus : statusForType(),
      from: pendingBooking.from,
      to: pendingBooking.to,
      fromCoords: pendingBooking.fromCoords ?? customFromCoords ?? undefined,
      toCoords: pendingBooking.toCoords ?? customToCoords ?? undefined,
      scheduledAt: isScheduled ? scheduledDateTime : undefined,
      paymentProvider,
      driverPhone: "+998901234567",
      driverTrips: Math.floor(800 + Math.random() * 3200),
      driverVerified: true,
      ...(isTaxi && !isScheduled
        ? {
            ridePhase: "searching" as const,
            driverChat: [],
          }
        : !isScheduled
          ? {
              driverName: serviceDriverInfo.driverName,
              carName: serviceDriverInfo.carName,
              carNumber: serviceDriverInfo.carNumber,
              rating: parseFloat((4.7 + Math.random() * 0.3).toFixed(2)),
              duration: pendingBooking.type === "parking" || pendingBooking.type === "ev_charge" ? "1 soat" : "18 daqiqa",
              distance: pendingBooking.type === "parking" || pendingBooking.type === "ev_charge" ? "—" : "12.4 km",
            }
          : {}),
    };

    setOrders(prev => [newOrder, ...prev]);
    setSelectedOrder(newOrder);
    setPendingBooking(null);
    setDirectBookingService(null);
    setPinMode(null);
    setScheduledDateTime("");
    setSelectedPaymentProvider(paymentProvider);
    setActiveTab("orders");
    setOrderFilter(isScheduled ? "scheduled" : "active");
    setShowShowcaseInsideApp(!isTaxi && !isScheduled);

    pushNotification({
      type: "order",
      orderId: newOrder.id,
      title: {
        uz: isScheduled ? "Buyurtma rejalashtirildi" : "Buyurtma qabul qilindi",
        en: isScheduled ? "Order scheduled" : "Order accepted",
        ru: isScheduled ? "Заказ запланирован" : "Заказ принят",
      },
      body: {
        uz: `${pendingBooking.from || ""} ${pendingBooking.to ? "→ " + pendingBooking.to : ""} · ${pendingBooking.price.toLocaleString()} so'm`,
        en: `${pendingBooking.from || ""} ${pendingBooking.to ? "→ " + pendingBooking.to : ""} · ${pendingBooking.price.toLocaleString()} UZS`,
        ru: `${pendingBooking.from || ""} ${pendingBooking.to ? "→ " + pendingBooking.to : ""} · ${pendingBooking.price.toLocaleString()} сум`,
      },
    });

    pushNotification({
      type: "payment",
      title: { uz: "To'lov o'tdi", en: "Payment successful", ru: "Оплата прошла" },
      body: {
        uz: `${paymentProvider.toUpperCase()} orqali ${pendingBooking.price.toLocaleString()} so'm yechildi`,
        en: `${pendingBooking.price.toLocaleString()} UZS paid via ${paymentProvider}`,
        ru: `Списано ${pendingBooking.price.toLocaleString()} сум через ${paymentProvider}`,
      },
    });

    const welcomeMsg = isScheduled
      ? lang === "uz"
        ? `Buyurtma ${newOrder.date} ga rejalashtirildi!`
        : lang === "ru"
          ? `Заказ запланирован на ${newOrder.date}!`
          : `Order scheduled for ${newOrder.date}!`
      : isTaxi
        ? lang === "uz"
          ? "Taksi buyurtmangiz yuborildi! Eng yaqin haydovchi qidirilmoqda."
          : lang === "ru"
            ? "Заказ такси отправлен! Ищем ближайшего водителя."
            : "Taxi request sent! Searching for the nearest driver."
        : lang === "uz"
          ? "Buyurtmangiz qabul qilindi! Haydovchi tayinlandi va yo'lga chiqdi."
          : lang === "ru"
            ? "Ваш заказ успешно принят! Водитель назначен и уже в пути."
            : "Your order is accepted! The driver is assigned and on their way.";
    speakText(welcomeMsg);
  };

  const handleConfirmBooking = () => {
    if (!pendingBooking) return;
    if (!authSession) {
      setShowAuthModal(true);
      return;
    }
    openPayment(pendingBooking.price, "booking", (provider) => finalizeBooking(provider));
  };

  const { isListening, interimText: voiceTextPrompt, startListening, stopListening, supported: voiceSupported } = useVoiceOrder({
    lang,
    onResult: (text) => {
      handleSendMessage(text);
      setActiveTab("messages");
    },
    onError: (msg) => speakText(msg),
  });

  const startVoiceListening = () => {
    if (voiceSupported) {
      if (isListening) stopListening();
      else startListening();
    } else {
      startVoiceListeningLegacy();
    }
  };

  // Activate scheduled orders when time arrives
  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = Date.now();
      setOrders((prev) => {
        const dueIds: string[] = [];
        const next = prev.map((o) => {
          if (o.status === "scheduled" && o.scheduledAt && new Date(o.scheduledAt).getTime() <= now) {
            dueIds.push(o.id);
            return {
              ...o,
              status: "active" as const,
              date: "Hozirgina",
              statusText: { uz: "Bajarilmoqda", en: "In progress", ru: "Выполняется" },
              ...(o.type === "taxi" ? { ridePhase: "searching" as const, driverChat: [] } : {}),
            };
          }
          return o;
        });
        if (dueIds.length > 0) {
          dueIds.forEach((id) => {
            const o = next.find((x) => x.id === id);
            if (o) {
              pushNotification({
                type: "order",
                orderId: id,
                title: { uz: "Rejalashtirilgan buyurtma boshlandi", en: "Scheduled order started", ru: "Запланированный заказ начался" },
                body: { uz: o.from || "404-GO", en: o.from || "404-GO", ru: o.from || "404-GO" },
              });
            }
          });
          return next;
        }
        return prev;
      });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateOrder = (orderId: string, updates: Partial<Booking>) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...updates } : o)));
    setSelectedOrder((prev) => (prev?.id === orderId ? { ...prev, ...updates } : prev));
  };

  // Submit rating and feedback tags for completed trip
  const handleSubmitFeedback = () => {
    if (!completedOrderForRating) return;

    // Earn loyalty points based on ride price (1 point per 1000 so'm)
    const pointsEarned = Math.floor(completedOrderForRating.price / 1000);
    setLoyaltyPoints(prev => prev + pointsEarned);

    const updatedOrders = orders.map(o => {
      if (o.id === completedOrderForRating.id) {
        return {
          ...o,
          status: "completed" as const,
          statusText: {
            uz: "Yakunlandi",
            en: "Completed",
            ru: "Завершено",
          },
          userRating: selectedStars,
          userFeedbackTags: selectedFeedbackTags,
          userComment: userCommentText.trim() || undefined
        };
      }
      return o;
    });

    setOrders(updatedOrders);
    
    const newlyCompleted = updatedOrders.find(o => o.id === completedOrderForRating.id);
    if (newlyCompleted) {
      setSelectedOrder(newlyCompleted);
    }

    setCompletedOrderForRating(null);
    setSelectedStars(5);
    setSelectedFeedbackTags([]);
    setUserCommentText("");
    setOrderFilter("completed");
  };

  // Wallet top-up
  const handleTopUp = () => {
    const amount = parseInt(topUpAmount);
    if (!isNaN(amount) && amount > 0) {
      setShowTopUpModal(false);
      openPayment(amount, "topup", () => {
        setBalance((prev) => prev + amount);
        setShowTopUpModal(false);
        pushNotification({
          type: "payment",
          title: { uz: "Balans to'ldirildi", en: "Balance topped up", ru: "Баланс пополнен" },
          body: {
            uz: `+${amount.toLocaleString()} so'm qo'shildi`,
            en: `+${amount.toLocaleString()} UZS added`,
            ru: `+${amount.toLocaleString()} сум добавлено`,
          },
        });
        const topUpMsg = lang === "uz"
          ? `Hisobingiz muvaffaqiyatli to'ldirildi. Hozirgi balans: ${balance + amount} so'm.`
          : lang === "ru"
            ? `Баланс успешно пополнен. Текущий баланс: ${balance + amount} сумов.`
            : `Account successfully topped up. Current balance: ${balance + amount} UZS.`;
        speakText(topUpMsg);
      });
    }
  };

  // Redeemable loyalty coupons
  const redeemableCoupons = [
    { id: "c-1", name: { uz: "10% Chegirma", en: "10% Discount", ru: "10% Скидка" }, cost: 100, discount: 10, isFlat: false, code: "NEX10SILVER" },
    { id: "c-2", name: { uz: "20% Chegirma", en: "20% Discount", ru: "20% Скидка" }, cost: 180, discount: 20, isFlat: false, code: "NEX20GOLD" },
    { id: "c-3", name: { uz: "30% Chegirma", en: "30% Discount", ru: "30% Скидка" }, cost: 250, discount: 30, isFlat: false, code: "NEX30PLATINUM" },
    { id: "c-4", name: { uz: "15,000 so'm Chegirma", en: "15,000 UZS Discount", ru: "15,000 сумов Скидка" }, cost: 120, discount: 15000, isFlat: true, code: "NEX15SAVER" }
  ];

  // Redeem coupon using loyalty points
  const handleRedeemCoupon = (coupon: typeof redeemableCoupons[0]) => {
    if (loyaltyPoints < coupon.cost) {
      const err = lang === "uz" ? "Sizda yetarli ball mavjud emas!" : lang === "ru" ? "У вас недостаточно баллов!" : "You don't have enough points!";
      alert(err);
      speakText(err);
      return;
    }
    setLoyaltyPoints(prev => prev - coupon.cost);
    const newCoupon = {
      id: `coupon-${Date.now()}`,
      code: coupon.code,
      type: coupon.name[lang],
      discount: coupon.discount,
      isFlat: coupon.isFlat
    };
    setActiveCoupons(prev => [...prev, newCoupon]);
    
    const bannerMsg = lang === "uz"
      ? `Muvaffaqiyatli xarid! ${coupon.name.uz} kuponi qo'shildi.`
      : lang === "ru"
        ? `Успешно выкуплено! Купон на ${coupon.name.ru} добавлен.`
        : `Success! Coupon for ${coupon.name.en} added.`;
    
    setRedeemedBanner(
      lang === "uz"
        ? `Muvaffaqiyatli xarid! ${coupon.name.uz} kuponi qo'shildi. Kod: ${coupon.code}`
        : lang === "ru"
          ? `Успешно выкуплено! Купон на ${coupon.name.ru} добавлен. Код: ${coupon.code}`
          : `Success! Coupon for ${coupon.name.en} added. Code: ${coupon.code}`
    );
    speakText(bannerMsg);

    setTimeout(() => {
      setRedeemedBanner(null);
    }, 5000);
  };

  // Get sorted active coupons
  const getSortedCoupons = (couponsList: typeof activeCoupons) => {
    return [...couponsList].sort((a, b) => {
      if (couponSortOrder === "code") {
        return a.code.localeCompare(b.code);
      }
      const valA = a.isFlat ? a.discount : 20000 * (a.discount / 100);
      const valB = b.isFlat ? b.discount : 20000 * (b.discount / 100);
      if (couponSortOrder === "desc") {
        return valB - valA;
      } else {
        return valA - valB;
      }
    });
  };

  // Find the optimal coupon for a given base price
  const getBestCouponForPrice = (basePrice: number) => {
    if (activeCoupons.length === 0) return null;
    let bestCoupon: typeof activeCoupons[0] | null = null;
    let maxDiscountVal = 0;

    activeCoupons.forEach(coupon => {
      let discountVal = 0;
      if (coupon.isFlat) {
        discountVal = Math.min(basePrice, coupon.discount);
      } else {
        discountVal = Math.floor(basePrice * (coupon.discount / 100));
      }

      if (discountVal > maxDiscountVal) {
        maxDiscountVal = discountVal;
        bestCoupon = coupon;
      }
    });

    return bestCoupon;
  };

  // Automatically calculate the best discount and select the optimal coupon when pendingBooking is opened
  useEffect(() => {
    if (pendingBooking && !pendingBooking.couponCalculated) {
      const basePrice = pendingBooking.price;
      const best = getBestCouponForPrice(basePrice);
      
      if (best) {
        setAppliedCouponId(best.id);
        
        let newPrice = basePrice;
        if (best.isFlat) {
          newPrice = Math.max(0, basePrice - best.discount);
        } else {
          newPrice = Math.max(0, Math.floor((basePrice * (100 - best.discount)) / 100));
        }

        const msg = lang === "uz"
          ? `Siz uchun eng yaxshi chegirma ("${best.code}") avtomatik ravishda qo'llanildi. Narx: ${newPrice.toLocaleString()} so'm.`
          : lang === "ru"
            ? `Для вас автоматически применен лучший купон ("${best.code}"). Цена: ${newPrice.toLocaleString()} сумов.`
            : `The best coupon ("${best.code}") has been automatically applied for you. Price: ${newPrice.toLocaleString()} UZS.`;
        
        speakText(msg);

        setPendingBooking(prev => {
          if (!prev) return null;
          return {
            ...prev,
            price: newPrice,
            originalPrice: basePrice,
            couponCalculated: true,
          };
        });
      } else {
        // No coupon available, just mark as calculated
        setPendingBooking(prev => {
          if (!prev) return null;
          return {
            ...prev,
            couponCalculated: true,
          };
        });
      }
    }
  }, [pendingBooking, activeCoupons, lang]);

  // Redeem text-based discount promo code
  const handleRedeemPromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;

    // Check if a coupon with this code is already active
    const alreadyActive = activeCoupons.some(c => c.code === code);
    if (alreadyActive) {
      const errText = lang === "uz"
        ? "Bu promo-kod allaqachon faollashtirilgan!"
        : lang === "ru"
          ? "Этот промокод уже активирован!"
          : "This promo code is already active!";
      setPromoError(errText);
      speakText(errText);
      return;
    }

    let couponData: { type: string; discount: number; isFlat: boolean } | null = null;

    if (code === "NEXGO20" || code === "404GO20") {
      couponData = {
        type: lang === "uz" ? "20% Chegirma" : lang === "ru" ? "20% Скидка" : "20% Discount",
        discount: 20,
        isFlat: false
      };
    } else if (code === "FREE50") {
      couponData = {
        type: lang === "uz" ? "50% Chegirma" : lang === "ru" ? "50% Скидка" : "50% Discount",
        discount: 50,
        isFlat: false
      };
    } else if (code === "UZB2026") {
      couponData = {
        type: lang === "uz" ? "15,000 so'm Chegirma" : lang === "ru" ? "15,000 сумов Скидка" : "15,000 UZS Discount",
        discount: 15000,
        isFlat: true
      };
    } else if (code === "TAXI99") {
      couponData = {
        type: lang === "uz" ? "9,900 so'm Chegirma" : lang === "ru" ? "9,900 сумов Скидка" : "9,900 UZS Discount",
        discount: 9900,
        isFlat: true
      };
    } else {
      // General fallback coupon for any typed promo code
      couponData = {
        type: lang === "uz" ? "15% Chegirma" : lang === "ru" ? "15% Скидка" : "15% Discount",
        discount: 15,
        isFlat: false
      };
    }

    const newCoupon = {
      id: `coupon-${Date.now()}`,
      code,
      type: couponData.type,
      discount: couponData.discount,
      isFlat: couponData.isFlat
    };

    setActiveCoupons(prev => [...prev, newCoupon]);
    
    const successText = lang === "uz"
      ? `Muvaffaqiyatli! ${couponData.type} kuponi qo'shildi`
      : lang === "ru"
        ? `Успешно! Купон ${couponData.type} добавлен`
        : `Success! ${couponData.type} coupon has been added`;

    setPromoSuccess(successText);
    speakText(successText);
    setPromoError(null);
    setPromoCodeInput("");

    // Clear success message after 4 seconds
    setTimeout(() => {
      setPromoSuccess(null);
    }, 4000);
  };

  // Get dynamic calculated price with coupon applied
  const getCalculatedPrice = () => {
    let base = 12000;
    if (directBookingService === "delivery") {
      const vehicle = DELIVERY_VEHICLES.find((v) => v.id === selectedDeliveryVehicle);
      const parcel = PARCEL_TYPES.find((p) => p.id === selectedParcelType);
      base = Math.round(9000 * (vehicle?.priceMultiplier ?? 1) + (parcel?.priceAdd ?? 0));
    }
    if (directBookingService === "cargo") {
      const truck = CARGO_TRUCKS.find((t) => t.id === selectedCargoTruck);
      const weight = parseFloat(cargoWeightTon) || 1.5;
      base = Math.round(180000 * (truck?.priceMultiplier ?? 1) * Math.max(1, weight / (truck?.capacityTon ?? 1.5)));
    }
    if (directBookingService === "parking") {
      const lot = PARKING_LOTS.find((p) => p.id === selectedParkingId);
      base = lot?.pricePerHour ?? 8000;
    }
    if (directBookingService === "ev_charge") {
      const st = EV_STATIONS.find((s) => s.id === selectedEvStationId);
      base = st?.pricePer30Min ?? 15000;
    }
    
    let price = base;
    if (customFromCoords && customToCoords && !SINGLE_LOCATION_SERVICES.includes(directBookingService || "")) {
      const dist = Math.sqrt(
        Math.pow(customFromCoords.latitude - customToCoords.latitude, 2) + 
        Math.pow(customFromCoords.longitude - customToCoords.longitude, 2)
      ) * 150000;
      price = Math.max(8000, Math.floor((base + dist) / 1000) * 1000);
    }
    
    if (appliedCouponId) {
      const coupon = activeCoupons.find(c => c.id === appliedCouponId);
      if (coupon) {
        if (coupon.isFlat) {
          price = Math.max(0, price - coupon.discount);
        } else {
          price = Math.max(0, Math.floor((price * (100 - coupon.discount)) / 100));
        }
      }
    }
    
    return price;
  };

  // Send transfer from active card
  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(transferAmount);
    if (isNaN(amount) || amount <= 0 || !transferPhone) return;

    const activeCard = paymentCards.find(c => c.active);
    if (!activeCard) return;

    if (balance < amount) {
      alert(lang === "uz" ? "Kartangizda yetarli mablag' mavjud emas!" : "Insufficient balance on card!");
      return;
    }

    setBalance(prev => prev - amount);
    setTransferSuccess(true);
    setTransferAmount("");
    setTransferPhone("");

    const activeCardNumber = activeCard.number || "•••• 1234";
    const transferMsg = lang === "uz"
      ? `O'tkazma muvaffaqiyatli bajarildi! ${amount.toLocaleString()} so'm ${activeCard.name} (${activeCardNumber}) kartangizdan yuborildi.`
      : lang === "ru"
        ? `Перевод успешно выполнен! ${amount.toLocaleString()} сумов отправлено с вашей карты ${activeCard.name} (${activeCardNumber}).`
        : `Transfer successfully completed! ${amount.toLocaleString()} UZS sent from your ${activeCard.name} (${activeCardNumber}) card.`;
    speakText(transferMsg);

    setTimeout(() => setTransferSuccess(false), 3000);
  };

  // Add customized bank card
  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardNumber.trim() || !newCardExpiry.trim() || !newCardCvv.trim()) {
      const err = lang === "uz" 
        ? "Iltimos, barcha maydonlarni to'ldiring!" 
        : "Please fill in all fields!";
      alert(err);
      return;
    }

    if (newCardCvv.length !== 3) {
      const err = lang === "uz" 
        ? "CVV/CVC kodi 3 ta raqamdan iborat bo'lishi kerak!" 
        : "CVV/CVC code must be exactly 3 digits!";
      alert(err);
      return;
    }

    const rawNum = newCardNumber.replace(/\s+/g, '');
    if (rawNum.length < 16) {
      const err = lang === "uz" 
        ? "Karta raqami kamida 16 ta raqam bo'lishi kerak!" 
        : "Card number must be at least 16 digits!";
      alert(err);
      return;
    }

    const last4 = rawNum.slice(-4) || "0000";
    const masked = `${rawNum.slice(0, 4)} •••• •••• ${last4}`;
    const startBal = parseInt(newCardStartBalance) || 500000;

    const newCard = {
      id: `card-${Date.now()}`,
      name: `${newCardType}`,
      logo: newCardType.toUpperCase(),
      number: masked,
      expiry: newCardExpiry || "12/29",
      cvv: newCardCvv,
      balance: startBal,
      active: false
    };

    setPaymentCards(prev => [...prev, newCard]);
    
    setNewCardNumber("");
    setNewCardExpiry("");
    setNewCardCvv("");
    setNewCardStartBalance("500000");
    setShowAddCard(false);

    const msg = lang === "uz"
      ? `${newCardType} (${masked}) kartangiz muvaffaqiyatli biriktirildi!`
      : lang === "ru"
        ? `Ваша карта ${newCardType} (${masked}) успешно привязана!`
        : `${newCardType} (${masked}) card successfully linked!`;
    
    alert(msg);
    speakText(msg);
  };

  // Select active linked card
  const handleSelectCard = (id: string) => {
    let selectedCardName = "";
    let selectedCardNumber = "";

    setPaymentCards(prev => {
      // 1. Save current "balance" back to the currently active card
      const withUpdatedBalance = prev.map(c => {
        if (c.active) {
          return { ...c, balance: balance };
        }
        return c;
      });

      // 2. Activate the selected card and set its balance
      return withUpdatedBalance.map(c => {
        if (c.id === id) {
          setBalance(c.balance || 0);
          selectedCardName = c.name;
          selectedCardNumber = c.number;
          return { ...c, active: true };
        } else {
          return { ...c, active: false };
        }
      });
    });

    if (selectedCardName) {
      const selectMsg = lang === "uz"
        ? `Tizim ${selectedCardName} (${selectedCardNumber}) kartasiga biriktirildi. To'lovlar shu kartadan avtomatik yechiladi!`
        : lang === "ru"
          ? `Система привязана к карте ${selectedCardName} (${selectedCardNumber}). Оплата будет списываться автоматически!`
          : `System linked to ${selectedCardName} (${selectedCardNumber}) card. Payments will be auto-debited!`;
      speakText(selectMsg);
    }
  };

  // Route calculation simulator
  const handleSearchTransit = (e: React.FormEvent) => {
    e.preventDefault();
    // randomize times slightly for realism
    setTransitOptions([
      {
        id: "tr-1",
        from: transitFrom,
        to: transitTo,
        lines: ["11", "24", "93"],
        type: "bus",
        timeMin: Math.floor(Math.random() * 8) + 2,
      },
      {
        id: "tr-2",
        from: transitFrom,
        to: transitTo,
        lines: ["Metro Chilonzor", "Yunisobod"],
        type: "metro",
        timeMin: Math.floor(Math.random() * 5) + 3,
      }
    ]);
  };

  // Lucide helper
  const renderIcon = (name: string, className = "w-5 h-5") => {
    switch (name) {
      case "Car": return <Car className={className} />;
      case "Package": return <Package className={className} />;
      case "Utensils": return <Utensils className={className} />;
      case "ShoppingCart": return <ShoppingCart className={className} />;
      case "Truck": return <Truck className={className} />;
      case "Bus": return <Bus className={className} />;
      case "Key": return <Key className={className} />;
      case "Bike": return <Bike className={className} />;
      case "Footprints": return <Footprints className={className} />;
      case "SquarePlay": return <SquarePlay className={className} />;
      case "Zap": return <Zap className={className} />;
      case "Wind": return <Wind className={className} />;
      case "ShieldAlert": return <ShieldAlert className={className} />;
      case "Ticket": return <Ticket className={className} />;
      case "Droplets": return <Droplets className={className} />;
      default: return <Grid className={className} />;
    }
  };

  const apiTranslations = {
    uz: {
      title: "404-GO AI Faollashtirish",
      desc: "Ushbu ilovani to'liq aqlli qilish uchun o'z Gemini API kalitingizni kiriting. Bu real-time rejimni yoqadi.",
      placeholder: "Gemini API kalitini kiriting...",
      status_sim: "Simulyatsiya Rejimi (Cheklangan)",
      status_active: "Tizim To'liq Faol (Live Gemini API)",
      activate_btn: "Kalitni Saqlash",
      deactivate_btn: "O'chirish",
      testing: "Ulanish tekshirilmoqda...",
      test_success: "Muvaffaqiyatli bog'landi! Gemini API to'liq faollashtirildi.",
      test_error: "Xatolik yuz berdi. API kalitini qayta tekshiring.",
      get_key_hint: "Gemini API kalitini qayerdan olsam bo'ladi?"
    },
    en: {
      title: "404-GO AI Activation",
      desc: "Enter your Gemini API key to unlock full-scale AI capabilities and activate live real-time queries.",
      placeholder: "Enter Gemini API key...",
      status_sim: "Simulation Mode (Offline Replay)",
      status_active: "Fully Activated (Live Gemini API)",
      activate_btn: "Save Key",
      deactivate_btn: "Deactivate",
      testing: "Verifying connection...",
      test_success: "Connection successful! Gemini API is now fully active.",
      test_error: "Verification failed. Please check your API key.",
      get_key_hint: "How do I get a Gemini API key?"
    },
    ru: {
      title: "Активация 404-GO AI",
      desc: "Введите свой API-ключ Gemini, чтобы разблокировать полноценный ИИ и активировать живые запросы в реальном времени.",
      placeholder: "Введите API-ключ Gemini...",
      status_sim: "Режим Симуляции (Ограниченный)",
      status_active: "Система Полностью Активна (Live Gemini API)",
      activate_btn: "Активировать",
      deactivate_btn: "Деактивировать",
      testing: "Проверка соединения...",
      test_success: "Соединение успешно установлено! Gemini API полностью активирован.",
      test_error: "Ошибка проверки. Пожалуйста, проверьте ваш API-ключ.",
      get_key_hint: "Где получить API-ключ Gemini?"
    }
  };

  const handleVerifyAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;

    setIsVerifyingKey(true);
    setVerificationFeedback(null);

    try {
      const response = await fetch("/api/check-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userApiKey: apiKeyInput.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("NEXGO_GEMINI_API_KEY", apiKeyInput.trim());
        setUserApiKeyState(apiKeyInput.trim());
        setVerificationFeedback({
          success: true,
          message: apiTranslations[lang].test_success
        });
      } else {
        setVerificationFeedback({
          success: false,
          message: data.error || apiTranslations[lang].test_error
        });
      }
    } catch (err: any) {
      setVerificationFeedback({
        success: false,
        message: err.message || apiTranslations[lang].test_error
      });
    } finally {
      setIsVerifyingKey(false);
    }
  };

  const handleDeactivate = () => {
    localStorage.removeItem("NEXGO_GEMINI_API_KEY");
    setUserApiKeyState("");
    setApiKeyInput("");
    setVerificationFeedback(null);
  };

  const getUserDisplayName = () => {
    const first = userProfile.firstName.trim();
    const last = userProfile.lastName.trim();
    if (first && last) return `${first} ${last}`;
    if (first) return first;
    return lang === "uz" ? "Foydalanuvchi" : lang === "ru" ? "Пользователь" : "User";
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      setProfileSaveMessage(t.profile_photo_too_large);
      setHomePhotoMessage(t.profile_photo_too_large);
      setTimeout(() => setHomePhotoMessage(null), 3000);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setUserProfile((prev) => {
        const updated = { ...prev, photoUrl: reader.result as string };
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
      setProfileSaveMessage(null);
      const savedMsg = lang === "uz" ? "Rasm saqlandi!" : lang === "ru" ? "Фото сохранено!" : "Photo saved!";
      setHomePhotoMessage(savedMsg);
      setTimeout(() => setHomePhotoMessage(null), 2500);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const validateProfile = (): boolean => {
    const errors: Partial<Record<keyof UserProfile, string>> = {};
    if (!userProfile.firstName.trim()) errors.firstName = t.profile_required;
    if (!userProfile.lastName.trim()) errors.lastName = t.profile_required;
    if (userProfile.phone.replace(/\D/g, "").length < 9) errors.phone = t.profile_phone_invalid;
    if (!userProfile.address.trim()) errors.address = t.profile_required;
    if (!userProfile.birthDate) {
      errors.birthDate = t.profile_required;
    } else {
      const birth = new Date(userProfile.birthDate);
      if (isNaN(birth.getTime()) || birth > new Date()) {
        errors.birthDate = t.profile_birth_invalid;
      }
    }
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfile()) {
      setProfileSaveMessage(t.profile_incomplete);
      return;
    }
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(userProfile));
    setProfileSaveMessage(t.profile_saved);
    speakText(t.profile_saved);
    setTimeout(() => setProfileSaveMessage(null), 3000);
  };

  const updateProfileField = <K extends keyof UserProfile>(field: K, value: UserProfile[K]) => {
    setUserProfile((prev) => ({ ...prev, [field]: value }));
    setProfileErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const reportTranslations = {
    uz: {
      export_options: "Eksport imkoniyatlari",
      export_desc: "Tarixni yuklab oling yoki chop eting.",
      export_json: "JSON yuklab olish",
      pdf_report: "PDF Hisobot",
      trip_history: "Sayohatlar Tarixi",
      history_report: "SAYOHATLAR HISOBOTI",
      total_trips: "Jami sayohatlar",
      total_spend: "Umumiy xarajat",
      avg_price: "O'rtacha narxi",
      total_distance: "Jami masofa",
      date: "Sana",
      service: "Xizmat turi",
      route: "Yo'nalish",
      driver: "Haydovchi",
      price: "Narxi",
      rating: "Baho",
      sec_footer: "Xavfsiz shaklda 404-GO AI Core tizimida yaratildi. 404-GO xizmatlaridan foydalanganingiz uchun tashakkur!",
      save_pdf: "Chop etish / PDF saqlash",
      close: "Yopish",
      client_email: "Mijoz pochtasi",
      gen_date: "Yaratilgan sana",
    },
    en: {
      export_options: "Export Options",
      export_desc: "Download or print your completed trip history.",
      export_json: "Download JSON",
      pdf_report: "PDF Report",
      trip_history: "Trip History",
      history_report: "TRIP HISTORY SUMMARY REPORT",
      total_trips: "Total Trips",
      total_spend: "Total Spent",
      avg_price: "Average Spend",
      total_distance: "Total Distance",
      date: "Date",
      service: "Service",
      route: "Route",
      driver: "Driver/Carrier",
      price: "Price",
      rating: "Rating",
      sec_footer: "Generated securely via 404-GO AI Core. Thank you for riding with us!",
      save_pdf: "Print / Save PDF",
      close: "Close",
      client_email: "Client Email",
      gen_date: "Generation Date",
    },
    ru: {
      export_options: "Варианты экспорта",
      export_desc: "Скачайте или распечатайте историю поездок.",
      export_json: "Скачать JSON",
      pdf_report: "PDF Отчет",
      trip_history: "История поездок",
      history_report: "ОТЧЕТ ОБ ИСТОРИИ ПОЕЗДОК",
      total_trips: "Всего поездок",
      total_spend: "Общие расходы",
      avg_price: "Средний чек",
      total_distance: "Общее расстояние",
      date: "Дата",
      service: "Услуга",
      route: "Маршрут",
      driver: "Водитель",
      price: "Стоимость",
      rating: "Оценка",
      sec_footer: "Сгенерировано безопасно с помощью 404-GO AI Core. Спасибо, что вы с нами!",
      save_pdf: "Печать / Сохранить в PDF",
      close: "Закрыть",
      client_email: "Email клиента",
      gen_date: "Дата создания",
    }
  };

  const exportToJSON = () => {
    const completed = orders.filter(o => o.status === "completed");
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(completed, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `404GO_Trip_History_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="four04-mobile-app text-gray-100 font-sans selection:bg-teal-500/30 selection:text-teal-200">
      <div className={`four04-app-root ${showReportModal ? "print:hidden" : ""}`}>
        
      {/* HEADER BAR */}
      <header className="hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-400 to-emerald-500 flex items-center justify-center glow-teal">
              <span className="font-display font-black text-xl text-slate-950 tracking-tighter">NX</span>
            </div>
            <div>
              <h1 className="font-display font-black text-2xl tracking-tight text-white leading-none">
                404<span className="text-[#009EE3]">-GO</span>
              </h1>
              <p className="text-[10px] text-teal-400 font-mono tracking-widest uppercase">{t.subtitle}</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <span className="hover:text-white cursor-pointer transition">{t.slogan}</span>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-2 text-teal-400 text-xs font-mono bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
              <span>AI Engine Connected</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* UI/UX Showcase Trigger */}
            <button
              onClick={() => setShowShowcaseModal(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-teal-500/20 to-emerald-500/20 hover:from-teal-500/30 hover:to-emerald-500/30 text-teal-400 hover:text-teal-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-teal-500/30 transition shadow-lg hover:scale-105 active:scale-95 duration-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
              <span>UI/UX Showcase</span>
            </button>

            {/* Voice Announcement Toggle */}
            <button
              onClick={() => {
                const newValue = !voiceAnnouncementsEnabled;
                setVoiceAnnouncementsEnabled(newValue);
                if (newValue) {
                  const confirmMsg = lang === "uz" ? "Ovozli xabarlar yoqildi" : lang === "ru" ? "Голосовые оповещения включены" : "Voice notifications enabled";
                  if ('speechSynthesis' in window) {
                    try {
                      window.speechSynthesis.cancel();
                      const utterance = new SpeechSynthesisUtterance(confirmMsg);
                      if (lang === "uz") utterance.lang = "uz-UZ";
                      else if (lang === "ru") utterance.lang = "ru-RU";
                      else utterance.lang = "en-US";
                      window.speechSynthesis.speak(utterance);
                    } catch (e) {}
                  }
                }
              }}
              title={lang === "uz" ? "Ovozli bildirishnomalar" : lang === "ru" ? "Голосовые уведомления" : "Voice Notifications"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition duration-200 active:scale-95 ${
                voiceAnnouncementsEnabled 
                  ? "bg-teal-500/10 border-teal-500/30 text-teal-400 hover:bg-teal-500/20" 
                  : "bg-slate-900 border-slate-800 text-gray-500 hover:bg-slate-850"
              }`}
            >
              {voiceAnnouncementsEnabled ? (
                <Volume2 className="w-3.5 h-3.5 animate-pulse" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
              <span className="text-xs font-bold hidden sm:inline">
                {lang === "uz" ? "Ovoz" : lang === "ru" ? "Голос" : "Voice"}
              </span>
            </button>

            {/* Languages Selector */}
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <Languages className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Language)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-medium"
              >
                <option value="uz" className="bg-slate-950 text-white">O'zbekcha</option>
                <option value="en" className="bg-slate-950 text-white">English</option>
                <option value="ru" className="bg-slate-950 text-white">Русский</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Mobil ilova — to'liq ekran */}
      <main className="four04-app-shell">
        
        {/* LEFT COLUMN: hidden on mobile-first layout */}
        <section className="hidden">
          
          {/* Welcome Intro Box */}
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 glow-teal/5">
            <span className="text-xs font-mono text-teal-400 bg-teal-400/10 px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">
              Super App
            </span>
            <h2 className="font-display font-extrabold text-3xl text-white mt-3 leading-tight">
              {t.slogan}
            </h2>
            <p className="text-gray-400 text-sm mt-3 leading-relaxed">
              {t.intro}
            </p>
            
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-center">
                <p className="text-teal-400 font-display font-extrabold text-lg">50+</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{t.xizmatlar}</p>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-center">
                <p className="text-teal-400 font-display font-extrabold text-lg">AI</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Intellektual</p>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-center">
                <p className="text-teal-400 font-display font-extrabold text-lg">100+</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Davlatlarda</p>
              </div>
            </div>
          </div>

          {/* Interactive NEXGO Wallet Widget */}
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-teal-400" />
                <h3 className="font-display font-bold text-base text-white">{t.nexgo_wallet}</h3>
              </div>
              <span className="text-[10px] font-mono text-gray-500">Secure Vault</span>
            </div>

            <div className="mt-4 bg-slate-950/60 p-4 rounded-xl border border-slate-850 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{t.balansingiz}</p>
                <p className="text-2xl font-mono font-bold text-white mt-1">
                  {balance.toLocaleString()} <span className="text-xs text-teal-400">so'm</span>
                </p>
              </div>
              <button 
                onClick={() => setShowTopUpModal(true)}
                className="bg-teal-400 hover:bg-teal-300 text-slate-950 font-semibold text-xs px-3 py-2 rounded-lg transition"
              >
                + {t.toldirish}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-900 text-xs">
                <p className="text-gray-400 text-[10px]">{t.keshbek_va_bonuslar}</p>
                <p className="text-sm font-semibold font-mono text-emerald-400 mt-1">
                  +{cashback.toLocaleString()} so'm
                </p>
              </div>
              <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-900 text-xs">
                <p className="text-gray-400 text-[10px]">{t.oyning_maqsadi}</p>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-teal-400 h-full rounded-full" style={{ width: "80%" }} />
                </div>
                <p className="text-[9px] text-gray-400 text-right mt-1">80% Completed</p>
              </div>
            </div>

            {/* Quick simulated transfer */}
            <form onSubmit={handleTransfer} className="mt-4 border-t border-slate-800 pt-4">
              <p className="text-[10px] font-mono text-teal-400 uppercase tracking-wider">{t.otkazish} (Transfer)</p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input
                  type="text"
                  placeholder="+998"
                  value={transferPhone}
                  onChange={(e) => setTransferPhone(e.target.value)}
                  className="bg-slate-950 text-white text-xs px-2 py-1.5 rounded border border-slate-800 focus:outline-none focus:border-teal-400"
                  required
                />
                <input
                  type="number"
                  placeholder="Summa"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="bg-slate-950 text-white text-xs px-2 py-1.5 rounded border border-slate-800 focus:outline-none focus:border-teal-400"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full mt-2 bg-slate-800 hover:bg-slate-700 text-white text-xs py-1.5 rounded transition font-medium flex items-center justify-center gap-1.5"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                {t.otkazish}
              </button>
              {transferSuccess && (
                <p className="text-emerald-400 text-[10px] text-center mt-1 animate-pulse">✓ Muvaffaqiyatli o'tkazildi!</p>
              )}
            </form>
          </div>

          {/* Advantages Section */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5">
            <h3 className="font-display font-bold text-sm text-teal-400 tracking-wider uppercase mb-3">{t.nima_uchun_nexgo}</h3>
            <ul className="space-y-2">
              {t.advantages.map((adv, idx) => (
                <li key={idx} className="text-xs text-gray-400 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                  <span>{adv}</span>
                </li>
              ))}
            </ul>
          </div>

        </section>

        {/* Asosiy mobil ekran */}
        <section className="four04-app-screen flex flex-col flex-1 min-h-0 relative">
              
              {/* Gallery picker — always mounted for home & profile */}
              <input
                ref={profilePhotoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePhotoChange}
              />

              <AnimatePresence>
                {showShowcaseInsideApp && (
                  <UIUXShowcase
                    lang={lang}
                    onClose={() => setShowShowcaseInsideApp(false)}
                    embedded={true}
                  />
                )}
                {isListening && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center z-[60] p-4 text-center"
                  >
                    {/* Glowing radar ring */}
                    <div className="relative w-16 h-16 bg-teal-400/10 rounded-full flex items-center justify-center border border-teal-400/20">
                      <div className="absolute inset-0 rounded-full bg-teal-400/20 radar-pulse-ring" />
                      <Mic className="w-8 h-8 text-teal-400 animate-pulse" />
                    </div>
                    <h4 className="text-sm font-bold text-white mt-4 uppercase tracking-wider">
                      {lang === "uz" ? "Ovozli buyruq..." : lang === "ru" ? "Голосовая команда..." : "Voice Command..."}
                    </h4>
                    <p className="text-xs text-teal-400 font-mono mt-1 animate-pulse uppercase tracking-widest">
                      {lang === "uz" ? "ESHITILMOQDA..." : lang === "ru" ? "ПРОСЛУШИВАНИЕ..." : "LISTENING..."}
                    </p>
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 mt-4 max-w-[240px]">
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest font-mono mb-1 text-center">
                        {lang === "uz" ? "Siz aytgan matn" : lang === "ru" ? "Распознанный текст" : "Detected Speech"}
                      </p>
                      <p className="text-[11px] text-white font-medium italic">"{voiceTextPrompt || (lang === "uz" ? "Gapiring..." : lang === "ru" ? "Говорите..." : "Speak now...")}"</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        if (voiceTimer) clearTimeout(voiceTimer);
                        stopListening();
                      }}
                      className="mt-6 bg-slate-900 hover:bg-slate-850 text-gray-400 hover:text-white px-4 py-1.5 rounded-xl text-[11px] font-semibold border border-slate-800 transition"
                    >
                      {lang === "uz" ? "Bekor qilish" : lang === "ru" ? "Отмена" : "Cancel"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              


              {/* Eng tepa: brend + foydalanuvchi profili (barcha tablar) */}
              <div className="shrink-0 px-4 pt-3 pb-2 border-b border-white/5 four04-app-header">
                <div className="nexgo-inapp-brand">
                  <img src="/logo-404-go.png" alt="404-GO" className="four04-logo-img four04-logo-img--in-app shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="four04-logo-text four04-logo-text--in-app">404<span>-GO</span></p>
                    <p className="text-[8px] text-gray-500 font-mono uppercase tracking-wider truncate">{t.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => profilePhotoInputRef.current?.click()}
                      className="relative w-10 h-10 rounded-full bg-slate-800/80 border-2 border-teal-400/30 hover:border-teal-400 overflow-hidden flex items-center justify-center shrink-0 transition"
                      title={t.home_photo_upload_hint}
                    >
                      {userProfile.photoUrl ? (
                        <img src={userProfile.photoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-teal-400" />
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 text-slate-950 flex items-center justify-center border border-slate-950">
                        <Camera className="w-2 h-2" />
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("profile")}
                      className={`min-w-0 flex-1 text-left rounded-lg px-1 py-0.5 transition ${
                        activeTab === "profile" ? "bg-teal-500/10" : "hover:bg-slate-800/40"
                      }`}
                    >
                      <p className="text-[11px] font-bold text-white truncate leading-tight">
                        {userProfile.firstName.trim() ? getUserDisplayName() : t.salom_user}
                      </p>
                      <p className="text-[9px] text-gray-400 truncate mt-0.5">
                        {userProfile.phone.trim()
                          ? userProfile.phone
                          : userProfile.address.trim()
                            ? userProfile.address
                            : t.salom_user_sub}
                      </p>
                      {homePhotoMessage && (
                        <p className="text-[8px] text-emerald-400 mt-0.5 animate-pulse truncate">{homePhotoMessage}</p>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <select
                      value={lang}
                      onChange={(e) => setLang(e.target.value as Language)}
                      className="nexgo-lang-select nexgo-lang-select--compact"
                      aria-label={t.language_label}
                    >
                      <option value="uz" className="bg-slate-950">O&apos;Z</option>
                      <option value="en" className="bg-slate-950">EN</option>
                      <option value="ru" className="bg-slate-950">RU</option>
                    </select>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowNotifications(true)}
                        className="p-2 nexgo-glass rounded-full text-gray-300 hover:border-teal-400/30 transition"
                        aria-label={lang === "uz" ? "Bildirishnomalar" : lang === "ru" ? "Уведомления" : "Notifications"}
                      >
                        <Bell className="w-3.5 h-3.5 text-teal-400" />
                      </button>
                      {unreadNotificationCount > 0 && (
                        <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab content */}
              <div className="flex-grow overflow-y-auto min-h-0 px-4 four04-app-content">
                <AnimatePresence mode="wait">
                  
                  {/* TAB 1: HOME */}
                  {activeTab === "home" && (
                    <motion.div
                      key="home"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      {directBookingService ? (
                        /* DIRECT BOOKING FORM (Map-based location selection) */
                        <div className="space-y-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 animate-fade-in text-left">
                          {/* Header */}
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
                                {directBookingService === "taxi" && renderIcon("Car", "w-3.5 h-3.5")}
                                {directBookingService === "delivery" && renderIcon("Package", "w-3.5 h-3.5")}
                                {directBookingService === "cargo" && renderIcon("Truck", "w-3.5 h-3.5")}
                                {directBookingService === "parking" && renderIcon("SquarePlay", "w-3.5 h-3.5")}
                                {directBookingService === "ev_charge" && renderIcon("Zap", "w-3.5 h-3.5")}
                              </div>
                              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                                {getDirectBookingLabel(directBookingService, lang)}
                              </h3>
                            </div>
                            <button onClick={() => { setDirectBookingService(null); setPinMode(null); }} className="text-gray-400 hover:text-white transition">
                              {renderIcon("X", "w-4 h-4")}
                            </button>
                          </div>

                          {SERVICE_ROLE_HINTS[directBookingService] && (
                            <p className="text-[9px] text-teal-400/90 leading-snug bg-teal-500/5 border border-teal-500/15 rounded-lg px-2 py-1.5">
                              {SERVICE_ROLE_HINTS[directBookingService][lang]}
                            </p>
                          )}

                          {!SINGLE_LOCATION_SERVICES.includes(directBookingService) && (
                            <SavedAddressesBar
                              lang={lang}
                              addresses={savedAddresses}
                              onSelect={handleSelectSavedAddress}
                              onSaveCustom={handleSaveCustomAddress}
                            />
                          )}

                          {!SINGLE_LOCATION_SERVICES.includes(directBookingService) && (
                            <div>
                              <label className="text-[9px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {lang === "uz" ? "Rejalashtirish (ixtiyoriy)" : lang === "ru" ? "Запланировать (опц.)" : "Schedule (optional)"}
                              </label>
                              <input
                                type="datetime-local"
                                value={scheduledDateTime}
                                onChange={(e) => setScheduledDateTime(e.target.value)}
                                className="mt-1 w-full bg-slate-900 text-white text-[10px] p-2 rounded-lg border border-slate-800 focus:border-teal-400 outline-none"
                              />
                            </div>
                          )}

                          {directBookingService === "delivery" && (
                            <div className="space-y-2">
                              <div>
                                <label className="text-[9px] text-gray-500 uppercase tracking-wider">
                                  {lang === "uz" ? "Yengil mashina (pochta/zakaz)" : lang === "ru" ? "Легковой авто (почта)" : "Light vehicle (mail)"}
                                </label>
                                <div className="grid grid-cols-2 gap-1 mt-1">
                                  {DELIVERY_VEHICLES.map((v) => (
                                    <button
                                      key={v.id}
                                      type="button"
                                      onClick={() => setSelectedDeliveryVehicle(v.id)}
                                      className={`text-left p-1.5 rounded-lg border text-[8px] transition ${
                                        selectedDeliveryVehicle === v.id
                                          ? "border-orange-400/60 bg-orange-500/10 text-orange-300"
                                          : "border-slate-800 bg-slate-900 text-gray-400"
                                      }`}
                                    >
                                      <span className="font-bold block">{localizedName(v, lang)}</span>
                                      <span className="opacity-70">{localizedName({ name: v.role }, lang)}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className="text-[9px] text-gray-500 uppercase tracking-wider">
                                  {lang === "uz" ? "Pochta / posilka turi" : lang === "ru" ? "Тип посылки" : "Parcel type"}
                                </label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {PARCEL_TYPES.map((p) => (
                                    <button
                                      key={p.id}
                                      type="button"
                                      onClick={() => setSelectedParcelType(p.id)}
                                      className={`text-[8px] px-2 py-1 rounded-full border transition ${
                                        selectedParcelType === p.id
                                          ? "border-orange-400 bg-orange-500/15 text-orange-300 font-bold"
                                          : "border-slate-800 text-gray-400"
                                      }`}
                                    >
                                      {localizedName(p, lang)}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {directBookingService === "cargo" && (
                            <div className="space-y-2">
                              <div>
                                <label className="text-[9px] text-gray-500 uppercase tracking-wider">
                                  {lang === "uz" ? "Yuk mashinasi" : lang === "ru" ? "Грузовик" : "Cargo truck"}
                                </label>
                                <div className="grid grid-cols-2 gap-1 mt-1">
                                  {CARGO_TRUCKS.map((t) => (
                                    <button
                                      key={t.id}
                                      type="button"
                                      onClick={() => setSelectedCargoTruck(t.id)}
                                      className={`text-left p-1.5 rounded-lg border text-[8px] transition ${
                                        selectedCargoTruck === t.id
                                          ? "border-blue-400/60 bg-blue-500/10 text-blue-300"
                                          : "border-slate-800 bg-slate-900 text-gray-400"
                                      }`}
                                    >
                                      <span className="font-bold block">{localizedName(t, lang)}</span>
                                      <span className="opacity-70">{t.plate}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className="text-[9px] text-gray-500 uppercase tracking-wider">
                                  {lang === "uz" ? "Yuk og'irligi (tonna)" : lang === "ru" ? "Вес груза (т)" : "Cargo weight (t)"}
                                </label>
                                <input
                                  type="number"
                                  min="0.1"
                                  step="0.1"
                                  value={cargoWeightTon}
                                  onChange={(e) => setCargoWeightTon(e.target.value)}
                                  className="mt-1 w-full bg-slate-900 text-white text-[11px] p-2 rounded-lg border border-slate-800 focus:border-blue-400 outline-none"
                                />
                              </div>
                            </div>
                          )}

                          {directBookingService === "parking" && (
                            <div>
                              <label className="text-[9px] text-gray-500 uppercase tracking-wider">
                                {lang === "uz" ? "Parkovka tanlang" : lang === "ru" ? "Выберите парковку" : "Select parking lot"}
                              </label>
                              <div className="grid grid-cols-1 gap-1 mt-1">
                                {PARKING_LOTS.map((lot) => (
                                  <button
                                    key={lot.id}
                                    type="button"
                                    onClick={() => applyParkingLot(lot.id)}
                                    className={`text-left p-2 rounded-lg border text-[9px] transition ${
                                      selectedParkingId === lot.id
                                        ? "border-cyan-400/60 bg-cyan-500/10 text-cyan-200"
                                        : "border-slate-800 bg-slate-900 text-gray-400"
                                    }`}
                                  >
                                    <span className="font-bold block">{localizedName(lot, lang)}</span>
                                    <span className="opacity-70">
                                      {lot.freeSpots} {lang === "uz" ? "bo'sh joy" : lang === "ru" ? "свободно" : "free"} · {lot.pricePerHour.toLocaleString()} so'm/soat
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {directBookingService === "ev_charge" && (
                            <div>
                              <label className="text-[9px] text-gray-500 uppercase tracking-wider">
                                {lang === "uz" ? "Zaryad stansiyasi" : lang === "ru" ? "Зарядная станция" : "Charging station"}
                              </label>
                              <div className="grid grid-cols-1 gap-1 mt-1">
                                {EV_STATIONS.map((st) => (
                                  <button
                                    key={st.id}
                                    type="button"
                                    onClick={() => applyEvStation(st.id)}
                                    className={`text-left p-2 rounded-lg border text-[9px] transition ${
                                      selectedEvStationId === st.id
                                        ? "border-violet-400/60 bg-violet-500/10 text-violet-200"
                                        : "border-slate-800 bg-slate-900 text-gray-400"
                                    }`}
                                  >
                                    <span className="font-bold block">{localizedName(st, lang)}</span>
                                    <span className="opacity-70">
                                      {st.connectors} · {st.powerKw}kW · {st.freePorts} {lang === "uz" ? "port" : "port"}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {directBookingService === "taxi" && customFromCoords && customToCoords && (
                            <div className="grid grid-cols-3 gap-1 mt-1">
                              <button
                                type="button"
                                onClick={() =>
                                  openExternalMap(
                                    googleMapsDirections(
                                      customFromCoords.latitude,
                                      customFromCoords.longitude,
                                      customToCoords.latitude,
                                      customToCoords.longitude
                                    )
                                  )
                                }
                                className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[7px] font-bold text-white py-1 rounded-lg"
                              >
                                {t.taxi_google_maps}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  openExternalMap(
                                    yandexNavigatorRoute(
                                      customFromCoords.latitude,
                                      customFromCoords.longitude,
                                      customToCoords.latitude,
                                      customToCoords.longitude
                                    )
                                  )
                                }
                                className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[7px] font-bold text-white py-1 rounded-lg"
                              >
                                {t.taxi_yandex}
                              </button>
                              <button
                                type="button"
                                onClick={() => openExternalMap(twoGisPoint(customFromCoords.latitude, customFromCoords.longitude))}
                                className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[7px] font-bold text-white py-1 rounded-lg"
                              >
                                {t.taxi_2gis}
                              </button>
                            </div>
                          )}

                          {/* Tashkent Interactive Map embedded in Mobile view! */}
                          <div className="h-28 rounded-xl overflow-hidden border border-slate-800 relative shadow-inner mt-1">
                            <MapComponent
                              pinMode={pinMode}
                              serviceMode={directBookingService as "taxi" | "delivery" | "cargo" | "parking" | "ev_charge"}
                              selectedServicePointId={
                                directBookingService === "parking"
                                  ? selectedParkingId
                                  : directBookingService === "ev_charge"
                                    ? selectedEvStationId
                                    : null
                              }
                              showRoute={!SINGLE_LOCATION_SERVICES.includes(directBookingService)}
                              lang={lang}
                              customFromCoords={
                                pinMode === "from" 
                                  ? customFromCoords 
                                  : (directBookingService ? customFromCoords : null)
                              }
                              customToCoords={
                                pinMode === "to" 
                                  ? customToCoords 
                                  : (directBookingService && !SINGLE_LOCATION_SERVICES.includes(directBookingService) ? customToCoords : null)
                              }
                              onMapClick={handleMapClick}
                            />
                          </div>

                          {/* Helper indicator if user is in map pin mode */}
                          {pinMode && (
                            <div className="bg-teal-500/10 border border-teal-500/30 p-2 rounded-lg text-[9px] text-teal-400 flex items-center gap-1.5 animate-pulse font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
                              <span>
                                {lang === "uz" 
                                  ? "Xarita ustiga bosib joylashuvni belgilang!" 
                                  : lang === "ru"
                                    ? "Нажмите на карту, чтобы выбрать местоположение!"
                                    : "Click on the map to select location!"}
                              </span>
                            </div>
                          )}

                          {/* Field A: Starting point */}
                          <div className="space-y-1">
                            <label className="text-[10px] text-gray-400 font-medium">
                              {directBookingService === "parking"
                                ? (lang === "uz" ? "Parkovka joyi:" : lang === "ru" ? "Парковка:" : "Parking lot:")
                                : directBookingService === "ev_charge"
                                  ? (lang === "uz" ? "Zaryad stansiyasi:" : lang === "ru" ? "Станция:" : "Charging station:")
                                  : (lang === "uz" ? "Qayerdan (A nuqta):" : lang === "ru" ? "Откуда (Точка A):" : "Pickup (Point A):")}
                            </label>
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={directFromText}
                                onChange={(e) => {
                                  setDirectFromText(e.target.value);
                                  setCustomFromCoords(null);
                                }}
                                className="bg-slate-900 text-white text-[11px] p-2 rounded-lg border border-slate-800 focus:outline-none focus:border-teal-400 flex-grow"
                                placeholder={lang === "uz" ? "Masalan: Chorsu bozori" : lang === "ru" ? "Например: Базар Чорсу" : "e.g., Chorsu Bazaar"}
                              />
                              <button
                                onClick={() => setPinMode(pinMode === "from" ? null : "from")}
                                className={`p-2 rounded-lg border transition ${
                                  pinMode === "from" 
                                    ? "bg-teal-400 text-slate-950 border-teal-400" 
                                    : "bg-slate-900 text-gray-400 border-slate-800 hover:border-teal-400/40"
                                }`}
                                title={lang === "uz" ? "Xaritadan tanlash" : lang === "ru" ? "Выбрать на карте" : "Select on map"}
                              >
                                {renderIcon("MapPin", "w-3.5 h-3.5")}
                              </button>
                              {directBookingService === "taxi" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!navigator.geolocation) return;
                                    navigator.geolocation.getCurrentPosition(
                                      (pos) => {
                                        const { latitude, longitude } = pos.coords;
                                        setCustomFromCoords({ latitude, longitude });
                                        setDirectFromText(
                                          lang === "uz"
                                            ? `Mening joylashuvim (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
                                            : lang === "ru"
                                              ? `Моё местоположение (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
                                              : `My location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
                                        );
                                      },
                                      () => {},
                                      { enableHighAccuracy: true, timeout: 8000 }
                                    );
                                  }}
                                  className="p-2 rounded-lg border bg-slate-900 text-teal-400 border-slate-800 hover:border-teal-400/40 transition"
                                  title={lang === "uz" ? "GPS — hozirgi joy" : lang === "ru" ? "GPS — текущее место" : "GPS — current location"}
                                >
                                  <Navigation className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Field B: Destination */}
                          {!SINGLE_LOCATION_SERVICES.includes(directBookingService) && (
                            <div className="space-y-1">
                              <label className="text-[10px] text-gray-400 font-medium">
                                {lang === "uz" ? "Qayerga (B nuqta):" : lang === "ru" ? "Куда (Точка B):" : "Destination (Point B):"}
                              </label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={directToText}
                                  onChange={(e) => {
                                    setDirectToText(e.target.value);
                                    setCustomToCoords(null);
                                  }}
                                  className="bg-slate-900 text-white text-[11px] p-2 rounded-lg border border-slate-800 focus:outline-none focus:border-teal-400 flex-grow"
                                  placeholder={lang === "uz" ? "Masalan: Magic City bog'i" : lang === "ru" ? "Например: Парк Magic City" : "e.g., Magic City Park"}
                                />
                                <button
                                  onClick={() => setPinMode(pinMode === "to" ? null : "to")}
                                  className={`p-2 rounded-lg border transition ${
                                    pinMode === "to" 
                                      ? "bg-teal-400 text-slate-950 border-teal-400" 
                                      : "bg-slate-900 text-gray-400 border-slate-800 hover:border-teal-400/40"
                                  }`}
                                  title={lang === "uz" ? "Xaritadan tanlash" : lang === "ru" ? "Выбрать на карте" : "Select on map"}
                                >
                                  {renderIcon("MapPin", "w-3.5 h-3.5")}
                                </button>
                              </div>
                            </div>
                          )}

                          {!SINGLE_LOCATION_SERVICES.includes(directBookingService) && (
                            <div className="space-y-1 pt-1">
                            <span className="text-[9px] text-gray-500 font-mono tracking-wider block uppercase">
                              {lang === "uz" ? "Tezkor tanlash" : lang === "ru" ? "Быстрый выбор" : "Quick select"}
                            </span>
                            <div className="flex gap-1 overflow-x-auto pb-1 max-w-full scrollbar-none">
                              {TASHKENT_LOCATIONS.map((loc) => {
                                const locName = loc.name[lang as "uz" | "en" | "ru"] || loc.name.uz;
                                return (
                                  <button
                                    key={loc.id}
                                    type="button"
                                    onClick={() => {
                                      if (pinMode === "to" || (!pinMode && directFromText && !directToText)) {
                                        setDirectToText(locName);
                                        setCustomToCoords({ latitude: loc.lat, longitude: loc.lng });
                                      } else {
                                        setDirectFromText(locName);
                                        setCustomFromCoords({ latitude: loc.lat, longitude: loc.lng });
                                      }
                                    }}
                                    className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-teal-500/30 text-[9px] text-gray-300 px-2 py-1 rounded-full whitespace-nowrap transition shrink-0"
                                  >
                                    {locName}
                                  </button>
                                );
                              })}
                            </div>
                            </div>
                          )}

                          {/* Payment Card Selector */}
                          <div className="space-y-1 pt-1">
                            <label className="text-[10px] text-gray-400 font-medium">
                              {lang === "uz" ? "To'lov kartasi:" : lang === "ru" ? "Карта оплаты:" : "Payment Card:"}
                            </label>
                            <div className="grid grid-cols-4 gap-1.5">
                              {paymentCards.map((c) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => handleSelectCard(c.id)}
                                  className={`py-1 px-1 rounded-lg text-[9px] font-bold border transition truncate ${
                                    c.active 
                                      ? "bg-teal-400/10 text-teal-400 border-teal-400/50" 
                                      : "bg-slate-900 text-gray-400 border-slate-850 hover:border-slate-800"
                                  }`}
                                >
                                  {c.logo}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Coupon Selector */}
                          {activeCoupons.length > 0 && (
                            <div className="space-y-1 pt-1 animate-fade-in">
                              <label className="text-[10px] text-gray-400 font-medium flex justify-between">
                                <span>{lang === "uz" ? "Chegirma kuponi:" : lang === "ru" ? "Купон на скидку:" : "Discount Coupon:"}</span>
                                {appliedCouponId && (
                                  <button 
                                    type="button" 
                                    onClick={() => setAppliedCouponId(null)}
                                    className="text-red-400 text-[8px] hover:underline"
                                  >
                                    {lang === "uz" ? "O'chirish" : lang === "ru" ? "Удалить" : "Clear"}
                                  </button>
                                )}
                              </label>
                              <div className="flex gap-1 overflow-x-auto pb-1 max-w-full scrollbar-none">
                                {getSortedCoupons(activeCoupons).map((coupon) => (
                                  <button
                                    key={coupon.id}
                                    type="button"
                                    onClick={() => setAppliedCouponId(appliedCouponId === coupon.id ? null : coupon.id)}
                                    className={`py-1 px-2 rounded-lg text-[9px] font-mono border transition shrink-0 flex items-center gap-1 ${
                                      appliedCouponId === coupon.id
                                        ? "bg-amber-400/20 text-amber-400 border-amber-400 font-bold"
                                        : "bg-slate-900 text-gray-400 border-slate-850 hover:border-slate-800"
                                    }`}
                                  >
                                    <Ticket className="w-2.5 h-2.5 shrink-0" />
                                    <span>{coupon.code} ({coupon.type})</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Calculated price */}
                          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs mt-1">
                            <span className="text-gray-400 font-medium">
                              {lang === "uz" ? "Hisoblangan narx:" : lang === "ru" ? "Расчетная стоимость:" : "Estimated Price:"}
                            </span>
                            <span className="font-mono font-bold text-teal-400">
                              {getCalculatedPrice().toLocaleString()} so'm
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => {
                                setPendingBooking({
                                  type: toBookingType(directBookingService),
                                  from: directFromText,
                                  to: SINGLE_LOCATION_SERVICES.includes(directBookingService) ? undefined : directToText,
                                  price: getCalculatedPrice(),
                                  title: getDirectBookingLabel(directBookingService, "en"),
                                  subtitle: SINGLE_LOCATION_SERVICES.includes(directBookingService)
                                    ? directFromText
                                    : `${directFromText} → ${directToText}`,
                                  fromCoords: customFromCoords ?? undefined,
                                  toCoords: customToCoords ?? undefined,
                                });
                              }}
                              className="flex-grow nexgo-btn-primary text-xs py-2.5 active:scale-[0.98]"
                            >
                              {lang === "uz" ? "Buyurtma berish" : lang === "ru" ? "Заказать сейчас" : "Order Now"}
                            </button>
                            <button
                              onClick={() => {
                                setDirectBookingService(null);
                                setPinMode(null);
                              }}
                              className="bg-slate-900 hover:bg-slate-850 text-gray-400 hover:text-white font-semibold text-xs py-2.5 px-3 rounded-xl border border-slate-800 transition"
                            >
                              {lang === "uz" ? "Orqaga" : lang === "ru" ? "Назад" : "Back"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ORIGINAL SERVICE EXPLORER GRID */
                        <>
                          <div className="nexgo-hero-chip">
                            <strong>404-GO AI</strong>
                            <span>{t.slogan}</span>
                          </div>

                          <div className="nexgo-search flex items-center gap-2">
                            <Search className="w-4 h-4 text-teal-400 shrink-0" />
                            <input
                              type="text"
                              placeholder={t.search_placeholder}
                              className="bg-transparent text-xs text-white focus:outline-none w-full cursor-pointer placeholder:text-gray-500"
                              readOnly
                              onClick={() => {
                                setDirectBookingService("taxi");
                                setDirectFromText(lang === "uz" ? "Chorsu bozori" : lang === "ru" ? "Базар Чорсу" : "Chorsu Bazaar");
                                setDirectToText(lang === "uz" ? "Magic City bog'i" : lang === "ru" ? "Парк Magic City" : "Magic City Park");
                                setCustomFromCoords({ latitude: 41.3216, longitude: 69.2285 });
                                setCustomToCoords({ latitude: 41.3031, longitude: 69.2486 });
                              }}
                            />
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startVoiceListening();
                              }}
                              className={`p-1.5 rounded-lg transition duration-200 ${isListening ? "bg-red-500/20 text-red-400 animate-pulse" : "text-gray-500 hover:text-teal-400 hover:bg-slate-900/50"}`}
                            >
                              <Mic className="w-3.5 h-3.5" />
                            </button>

                            {renderIcon("MapPin", "w-4 h-4 text-gray-500 hover:text-teal-400 cursor-pointer shrink-0")}
                          </div>

                          <div 
                            onClick={() => setActiveTab("messages")}
                            className="nexgo-ai-banner flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2.5 relative z-10">
                              <div className="nexgo-ai-icon">
                                {renderIcon("Sparkles", "w-4 h-4 text-teal-400 animate-pulse")}
                              </div>
                              <div>
                                <p className="text-[11px] font-bold text-white leading-none">{t.ai_assistant}</p>
                                <p className="text-[9px] text-gray-400 mt-0.5">{t.ai_helper_desc}</p>
                              </div>
                            </div>
                            <span className="relative z-10">{renderIcon("ChevronRight", "w-4 h-4 text-teal-400")}</span>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2.5">
                              <h4 className="nexgo-section-title">{t.xizmatlar}</h4>
                              <span className="text-[10px] text-teal-400 cursor-pointer hover:text-teal-300 transition">{t.hammasini_korish}</span>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              {serviceCategories.map((cat) => (
                                <div
                                  key={cat.id}
                                  onClick={() => {
                                    setDirectBookingService(cat.id);
                                    if (SINGLE_LOCATION_SERVICES.includes(cat.id)) {
                                      if (cat.id === "parking") {
                                        applyParkingLot(PARKING_LOTS[0].id);
                                      } else {
                                        applyEvStation(EV_STATIONS[0].id);
                                      }
                                    } else {
                                      setDirectFromText(lang === "uz" ? "Chorsu bozori" : lang === "ru" ? "Базар Чорсу" : "Chorsu Bazaar");
                                      setDirectToText(lang === "uz" ? "Magic City bog'i" : lang === "ru" ? "Парк Magic City" : "Magic City Park");
                                      setCustomFromCoords({ latitude: 41.3216, longitude: 69.2285 });
                                      setCustomToCoords({ latitude: 41.3031, longitude: 69.2486 });
                                      if (cat.id === "cargo") setSelectedCargoTruck(CARGO_TRUCKS[0].id);
                                      if (cat.id === "delivery") setSelectedDeliveryVehicle(DELIVERY_VEHICLES[1].id);
                                    }
                                  }}
                                  className="nexgo-service-tile flex flex-col items-center justify-center text-center group"
                                >
                                  {cat.badge && (
                                    <span className="nexgo-service-badge">{cat.badge}</span>
                                  )}
                                  <div className={`nexgo-service-icon bg-gradient-to-br ${cat.color} text-white group-hover:scale-105 transition-transform`}>
                                    {renderIcon(cat.icon, "w-4 h-4")}
                                  </div>
                                  <span className="nexgo-service-label truncate w-full">
                                    {cat.name[lang]}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}

                  {/* TAB 2: ORDERS & TRACKING */}
                  {activeTab === "orders" && (
                    <motion.div
                      key="orders"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <>
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white">{t.buyurtmalar}</h3>
                            <span className="text-[10px] text-teal-400">{t.hammasini_korish_orders}</span>
                          </div>

                      {/* Filters: Active / Completed / Scheduled */}
                      <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-850">
                        <button
                          onClick={() => setOrderFilter("active")}
                          className={`flex-1 text-center py-1 rounded text-[10px] font-medium transition ${
                            orderFilter === "active" ? "bg-teal-400 text-slate-950" : "text-gray-400 hover:text-white"
                          }`}
                        >
                          {t.joriy}
                        </button>
                        <button
                          onClick={() => setOrderFilter("scheduled")}
                          className={`flex-1 text-center py-1 rounded text-[10px] font-medium transition ${
                            orderFilter === "scheduled" ? "bg-teal-400 text-slate-950" : "text-gray-400 hover:text-white"
                          }`}
                        >
                          {t.rejalashtirilgan}
                        </button>
                        <button
                          onClick={() => setOrderFilter("completed")}
                          className={`flex-1 text-center py-1 rounded text-[10px] font-medium transition ${
                            orderFilter === "completed" ? "bg-teal-400 text-slate-950" : "text-gray-400 hover:text-white"
                          }`}
                        >
                          {t.otgan}
                        </button>
                      </div>

                      {/* Export Options for Completed Orders */}
                      {orderFilter === "completed" && orders.filter((o) => o.status === "completed").length > 0 && (
                        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-850 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono text-teal-400 uppercase tracking-widest leading-none">
                              {reportTranslations[lang].export_options}
                            </span>
                            <span className="text-[8px] text-gray-500 font-mono">
                              {orders.filter((o) => o.status === "completed").length} {lang === "uz" ? "sayohat" : lang === "ru" ? "поездок" : "trips"}
                            </span>
                          </div>
                          <p className="text-[9px] text-gray-400 leading-tight">
                            {reportTranslations[lang].export_desc}
                          </p>
                          <div className="grid grid-cols-2 gap-1.5 pt-1">
                            <button
                              onClick={exportToJSON}
                              className="bg-slate-900 hover:bg-slate-850 text-gray-300 text-[10px] font-semibold py-1.5 px-2 rounded-lg border border-slate-800 transition flex items-center justify-center gap-1 cursor-pointer animate-fade-in"
                            >
                              <Download className="w-3 h-3 text-teal-400" />
                              {reportTranslations[lang].export_json}
                            </button>
                            <button
                              onClick={() => setShowReportModal(true)}
                              className="bg-teal-400/10 hover:bg-teal-400/20 text-teal-400 text-[10px] font-bold py-1.5 px-2 rounded-lg border border-teal-500/20 transition flex items-center justify-center gap-1 cursor-pointer animate-fade-in"
                            >
                              <FileText className="w-3 h-3 text-teal-400" />
                              {reportTranslations[lang].pdf_report}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Orders list */}
                      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                        {orders
                          .filter((o) =>
                            orderFilter === "active"
                              ? o.status === "active"
                              : orderFilter === "scheduled"
                                ? o.status === "scheduled"
                                : o.status === "completed"
                          )
                          .map((o) => (
                            <div
                              key={o.id}
                              onClick={() => setSelectedOrder(o)}
                              className={`p-2.5 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                                selectedOrder?.id === o.id
                                  ? "bg-slate-850 border-teal-400/50"
                                  : "bg-slate-950/60 border-slate-900 hover:border-slate-800"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded bg-slate-900 flex items-center justify-center text-teal-400 shrink-0">
                                  {o.type === "taxi" && <Car className="w-4 h-4" />}
                                  {o.type === "delivery" && <Package className="w-4 h-4" />}
                                  {o.type === "cargo" && <Truck className="w-4 h-4" />}
                                  {o.type === "parking" && <SquarePlay className="w-4 h-4" />}
                                  {o.type === "ev_charge" && <Zap className="w-4 h-4" />}
                                </div>
                                <div className="leading-tight">
                                  <p className="text-[10px] text-white font-semibold">{o.title[lang]}</p>
                                  <p className="text-[8px] text-gray-400 truncate max-w-[140px] mt-0.5">{o.subtitle[lang]}</p>
                                </div>
                              </div>
                              <div className="text-right leading-none flex flex-col items-end gap-1.5 shrink-0">
                                <p className="text-[10px] font-mono font-bold text-white">{o.price.toLocaleString()} so'm</p>
                                <div className="flex items-center gap-1.5">
                                  {o.status === "completed" && (
                                    viewingHistoricalTrip?.id === o.id ? (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setViewingHistoricalTrip(null);
                                        }}
                                        className="text-[8px] px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition flex items-center gap-0.5"
                                      >
                                        {lang === "uz" ? "Yopish" : lang === "ru" ? "Скрыть" : "Hide"}
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setViewingHistoricalTrip(o);
                                          setSelectedOrder(o);
                                        }}
                                        className="text-[8px] px-2 py-1 rounded bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold transition flex items-center gap-0.5"
                                      >
                                        {renderIcon("Map", "w-2.5 h-2.5")}
                                        {lang === "uz" ? "Xarita" : lang === "ru" ? "Карта" : "View Route"}
                                      </button>
                                    )
                                  )}
                                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full inline-block ${
                                    o.status === "active"
                                      ? "bg-amber-400/10 text-amber-400"
                                      : o.status === "scheduled"
                                        ? "bg-violet-400/10 text-violet-400"
                                        : "bg-emerald-400/10 text-emerald-400"
                                  }`}>
                                    {o.statusText[lang]}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        {orders.filter((o) =>
                          orderFilter === "active"
                            ? o.status === "active"
                            : orderFilter === "scheduled"
                              ? o.status === "scheduled"
                              : o.status === "completed"
                        ).length === 0 && (
                          <p className="text-[10px] text-gray-500 text-center py-4">{t.no_active_order}</p>
                        )}
                      </div>

                      {/* Selected active order tracking details */}
                      {selectedOrder && (
                        <div className="bg-slate-950/90 border border-slate-850 rounded-xl p-3 space-y-2.5">
                          <p className="text-[9px] font-mono text-teal-400 uppercase tracking-widest leading-none">
                            {t.buyurtma_tafsiloti}
                          </p>

                          <div className="grid grid-cols-3 gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800 text-center">
                            <div>
                              <p className="text-[8px] text-gray-400">{t.masofa}</p>
                              <p className="text-[10px] font-semibold text-white mt-0.5">{selectedOrder.distance || "12.4 km"}</p>
                            </div>
                            <div>
                              <p className="text-[8px] text-gray-400">{t.vaqt}</p>
                              <p className="text-[10px] font-semibold text-white mt-0.5">{selectedOrder.duration || "18 min"}</p>
                            </div>
                            <div>
                              <p className="text-[8px] text-gray-400">{t.narx}</p>
                              <p className="text-[10px] font-semibold text-teal-400 mt-0.5">{selectedOrder.price.toLocaleString()} s.</p>
                            </div>
                          </div>

                          {selectedOrder.type === "taxi" && selectedOrder.status === "active" ? (
                            <>
                              <TaxiRidePanel
                                order={selectedOrder}
                                userProfile={userProfile}
                                lang={lang}
                                t={t}
                                onUpdateOrder={handleUpdateOrder}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setOrders((prev) =>
                                    prev.map((o) =>
                                      o.id === selectedOrder.id
                                        ? {
                                            ...o,
                                            status: "completed",
                                            statusText: { uz: "Bekor qilindi", en: "Cancelled", ru: "Отменено" },
                                          }
                                        : o
                                    )
                                  );
                                  setSelectedOrder(null);
                                }}
                                className="w-full bg-red-950/40 hover:bg-red-950/60 text-red-400 text-[10px] font-medium py-1.5 rounded-lg border border-red-900/30 transition"
                              >
                                {t.bekor_qilish}
                              </button>
                            </>
                          ) : (
                            <>
                          {selectedOrder.status === "active" && (
                            <>
                              <DriverProfileCard lang={lang} order={selectedOrder} />
                              <SosShareBar lang={lang} order={selectedOrder} userPhone={userProfile.phone} />
                            </>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center">
                                <User className="w-4 h-4 text-teal-400" />
                              </div>
                              <div className="leading-none">
                                <p className="text-[10px] font-bold text-white">
                                  {selectedOrder.driverName || "Azizbek"}
                                </p>
                                <div className="flex items-center gap-1 mt-1">
                                  <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                                  <span className="text-[9px] text-gray-400">{selectedOrder.rating || 4.9}</span>
                                </div>
                              </div>
                            </div>
                            {selectedOrder.carName && (
                              <div className="text-right leading-none">
                                <p className="text-[10px] text-white font-semibold">{selectedOrder.carName}</p>
                                <p className="text-[9px] text-teal-400 font-mono mt-1">{selectedOrder.carNumber}</p>
                              </div>
                            )}
                          </div>

                          {selectedOrder.status === "active" && (
                            <div className="space-y-2">
                              {/* UI/UX Showcase Embedded Trigger Promo inside active order */}
                              <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-slate-950 border border-teal-500/20 p-2.5 rounded-xl space-y-1.5 text-left animate-pulse">
                                <div className="flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                                  <span className="text-[9px] font-black text-white tracking-wider">
                                    {lang === "uz" ? "404-GO UI/UX PRESENTATION" : lang === "ru" ? "404-GO UI/UX ПРЕЗЕНТАЦИЯ" : "404-GO UI/UX PRESENTATION"}
                                  </span>
                                </div>
                                <p className="text-[8px] text-gray-400 leading-normal">
                                  {lang === "uz" 
                                    ? "Buyurtmangiz faollashdi! Platformaning eng yangi dizayn va UI/UX xususiyatlari taqdimoti panelini bevosita ilova ichida tomosha qiling." 
                                    : lang === "ru" 
                                      ? "Ваш заказ активен! Смотрите презентацию новейшего дизайна и возможностей UI/UX прямо в приложении." 
                                      : "Your order is active! View the high-fidelity design showcase and interactive prototype directly inside the mobile app."}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setShowShowcaseInsideApp(true)}
                                  className="w-full bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold py-1 px-2 rounded-lg text-[9px] transition flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3 text-slate-950" />
                                  {lang === "uz" ? "Showcase panelini ko'rish" : lang === "ru" ? "Смотреть Showcase" : "View Showcase Panel"}
                                </button>
                              </div>

                              {/* Notify when near Toggle */}
                              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 space-y-2 mt-1 text-left">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <Bell className={`w-3.5 h-3.5 shrink-0 ${notifyWhenNear ? "text-amber-400 animate-bounce" : "text-gray-400"}`} />
                                    <div className="leading-tight">
                                      <p className="text-[9px] font-bold text-white uppercase tracking-wide">
                                        {lang === "uz" ? "Yaqinlashganda bildirish" : lang === "ru" ? "Уведомить при приближении" : "Notify when near"}
                                      </p>
                                      <p className="text-[8px] text-gray-500">
                                        {lang === "uz" ? "500m qolganda ogohlantirish" : lang === "ru" ? "Сигнал при 500м" : "Alert when within 500m"}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Toggle Switch */}
                                  <button
                                    type="button"
                                    onClick={() => setNotifyWhenNear(!notifyWhenNear)}
                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                      notifyWhenNear ? "bg-teal-400" : "bg-slate-800"
                                    }`}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
                                        notifyWhenNear ? "translate-x-4" : "translate-x-0"
                                      }`}
                                    />
                                  </button>
                                </div>

                                {/* Live simulated tracking */}
                                {notifyWhenNear && simulatedDistance !== null && (
                                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-850/50 space-y-1.5 animate-fade-in">
                                    <div className="flex justify-between items-center text-[8px] font-mono">
                                      <span className="text-gray-400">
                                        {lang === "uz" ? "Simulyatsiya masofasi:" : lang === "ru" ? "Симуляция расстояния:" : "Simulated distance:"}
                                      </span>
                                      <span className={`${simulatedDistance <= 500 ? "text-amber-400 font-bold" : "text-teal-400"}`}>
                                        {simulatedDistance} m
                                      </span>
                                    </div>
                                    
                                    {/* Progress line */}
                                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full transition-all duration-1000 ${simulatedDistance <= 500 ? "bg-amber-400 animate-pulse" : "bg-teal-400"}`}
                                        style={{ width: `${Math.max(10, Math.min(100, (1 - simulatedDistance / 1200) * 100))}%` }}
                                      />
                                    </div>

                                    {nearAlertBanner && (
                                      <div className="bg-amber-400/10 border border-amber-400/25 p-1.5 rounded text-[8px] text-amber-300 leading-normal flex items-start gap-1">
                                        <span className="shrink-0">📢</span>
                                        <span>{nearAlertBanner}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Driver Notes Section */}
                              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 space-y-1.5 mt-1 text-left">
                                <label className="text-[9px] font-bold text-white uppercase tracking-wide flex items-center gap-1">
                                  <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
                                  {lang === "uz" ? "Haydovchiga eslatma" : lang === "ru" ? "Заметка для водителя" : "Driver Notes"}
                                </label>
                                <p className="text-[8px] text-gray-400 leading-tight">
                                  {lang === "uz" 
                                    ? "Haydovchiga yetkazib berish yoki kutish joyi haqida eslatma yozing (masalan: 'Kirish B' yoki 'Yetib kelganda tel qiling')."
                                    : lang === "ru"
                                      ? "Напишите заметку для водителя (например: 'Подъезд Б' или 'Позвоните по прибытии')."
                                      : "Add a custom note (e.g. 'Entrance B' or 'Please call upon arrival')."}
                                </p>
                                <div className="flex gap-1.5 mt-1.5">
                                  <input
                                    type="text"
                                    value={driverNotesInput}
                                    onChange={(e) => setDriverNotesInput(e.target.value)}
                                    placeholder={
                                      lang === "uz" 
                                        ? "Masalan: Kirish B, 3-qavat..." 
                                        : lang === "ru" 
                                          ? "Например: Подъезд Б, 3 этаж..." 
                                          : "e.g., Entrance B, 3rd floor..."
                                    }
                                    className="flex-1 bg-slate-950/80 text-[10px] text-white px-2 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-teal-500 font-medium placeholder-gray-600 transition"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveDriverNotes(selectedOrder.id, driverNotesInput)}
                                    className="bg-teal-400 hover:bg-teal-300 text-slate-950 text-[10px] font-bold px-3 py-1.5 rounded-lg transition shrink-0 flex items-center justify-center gap-1 active:scale-95"
                                  >
                                    {lang === "uz" ? "Saqlash" : lang === "ru" ? "Сохранить" : "Save"}
                                  </button>
                                </div>
                                {selectedOrder.driverNotes && (
                                  <div className="bg-teal-400/5 border border-teal-500/10 p-1.5 rounded-lg mt-1 text-[8px] text-teal-300 font-medium leading-normal flex items-start gap-1 animate-fade-in">
                                    <span className="shrink-0 text-teal-400 font-bold">✓ {lang === "uz" ? "Saqlandi" : lang === "ru" ? "Сохранено" : "Saved"}:</span>
                                    <span className="italic">"{selectedOrder.driverNotes}"</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => callDriver(selectedOrder.driverPhone || "+998901112233")}
                                  className="flex-1 bg-slate-900 hover:bg-slate-850 text-white text-[10px] font-medium py-1.5 rounded-lg border border-slate-800 transition flex items-center justify-center gap-1"
                                >
                                  <Phone className="w-3 h-3 text-teal-400" />
                                  {t.haydovchiga_qongiroq}
                                </button>
                                <button
                                  onClick={() => {
                                    // cancel
                                    setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: "completed", statusText: { uz: "Bekor qilindi", en: "Cancelled", ru: "Отменено" } } : o));
                                    setSelectedOrder(null);
                                  }}
                                  className="flex-1 bg-red-950/40 hover:bg-red-950/60 text-red-400 text-[10px] font-medium py-1.5 rounded-lg border border-red-900/30 transition"
                                >
                                  {t.bekor_qilish}
                                </button>
                              </div>
                              
                              <button
                                onClick={() => {
                                  setCompletedOrderForRating(selectedOrder);
                                  setSelectedStars(5);
                                  setSelectedFeedbackTags([]);
                                  setUserCommentText("");
                                }}
                                className="w-full bg-teal-400 hover:bg-teal-300 text-slate-950 text-[10px] font-bold py-1.5 rounded-lg transition flex items-center justify-center gap-1 shadow-sm"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {lang === "uz" ? "Sayohatni yakunlash" : lang === "en" ? "Complete Trip" : "Завершить поездку"}
                              </button>
                            </div>
                          )}

                            </>
                          )}

                           {selectedOrder.status === "completed" && (
                            <div className="border-t border-slate-900 pt-2.5 space-y-2">
                              {viewingHistoricalTrip?.id === selectedOrder.id ? (
                                <button
                                  onClick={() => setViewingHistoricalTrip(null)}
                                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold py-1.5 rounded-lg transition flex items-center justify-center gap-1 shadow-sm"
                                >
                                  {renderIcon("Map", "w-3.5 h-3.5")}
                                  {lang === "uz" ? "Tarixiy marshrutni tozalash" : lang === "ru" ? "Сбросить исторический маршрут" : "Clear Historical Route"}
                                </button>
                              ) : (
                                <button
                                  onClick={() => setViewingHistoricalTrip(selectedOrder)}
                                  className="w-full bg-teal-400 hover:bg-teal-300 text-slate-950 text-[10px] font-bold py-1.5 rounded-lg transition flex items-center justify-center gap-1 shadow-sm"
                                >
                                  {renderIcon("Map", "w-3.5 h-3.5")}
                                  {lang === "uz" ? "Sayohat marshrutini ko'rish" : lang === "ru" ? "Показать маршрут поездки" : "View Trip Route"}
                                </button>
                              )}

                              {selectedOrder.driverNotes && (
                                <div className="space-y-1.5 pt-1 border-t border-slate-900/60 text-left">
                                  <p className="text-[8px] font-mono text-teal-400 uppercase tracking-wider leading-none">
                                    {lang === "uz" ? "Haydovchiga eslatma" : lang === "ru" ? "Ваша заметка" : "Driver Notes"}
                                  </p>
                                  <p className="text-[9px] text-gray-300 italic bg-slate-900/60 p-1.5 rounded border border-slate-850/60 leading-normal">
                                    "{selectedOrder.driverNotes}"
                                  </p>
                                </div>
                              )}

                              {selectedOrder.userRating && (
                                <div className="space-y-1.5 pt-1 border-t border-slate-900/60">
                                  <p className="text-[8px] font-mono text-teal-400 uppercase tracking-wider leading-none text-left">
                                    {lang === "uz" ? "Sizning bahoingiz" : lang === "en" ? "Your Feedback" : "Ваш отзыв"}
                                  </p>
                                  <div className="flex items-center gap-1.5">
                                    <div className="flex items-center gap-0.5">
                                      {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                          key={s}
                                          className={`w-3.5 h-3.5 ${
                                            s <= (selectedOrder.userRating || 0)
                                              ? "text-amber-400 fill-amber-400"
                                              : "text-slate-800"
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-[10px] font-bold text-white">{selectedOrder.userRating}/5</span>
                                  </div>
                                  {selectedOrder.userFeedbackTags && selectedOrder.userFeedbackTags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {selectedOrder.userFeedbackTags.map((tag) => (
                                        <span
                                          key={tag}
                                          className="text-[8px] bg-teal-400/10 text-teal-400 border border-teal-500/15 px-1.5 py-0.5 rounded-full"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {selectedOrder.userComment && (
                                    <p className="text-[9px] text-gray-400 italic mt-1 bg-slate-900/40 p-1.5 rounded border border-slate-850/60 text-left">
                                      "{selectedOrder.userComment}"
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                    </motion.div>
                  )}

                  {/* TAB 3: WALLET */}
                  {activeTab === "wallet" && (
                    <motion.div
                      key="wallet"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <>
                        <h3 className="text-sm font-bold text-white mb-2">{t.nexgo_wallet}</h3>

                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/80 flex items-center justify-between text-left">
                          <div>
                            <p className="text-[8px] text-teal-400 uppercase tracking-widest font-mono font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                              {lang === "uz" ? "AVTOMATIK TO'LOV TIZIMI FAOL" : lang === "ru" ? "АВТОПЛАТЕЖ АКТИВЕН" : "AUTO-PAYMENT SYSTEM ACTIVE"}
                            </p>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="text-xl font-mono font-black text-white">
                                {balance.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-teal-400 font-medium font-mono">so'm</span>
                            </div>
                            <p className="text-[9px] text-gray-500 mt-1 flex items-center gap-1 leading-none">
                              <span>💳</span>
                              <span>
                                {lang === "uz" 
                                  ? "To'lovlar tanlangan kartadan avtomatik tarzda yechib olinadi" 
                                  : "Payments are auto-debited from the selected card"}
                              </span>
                            </p>
                          </div>
                          <button
                            onClick={() => setShowTopUpModal(true)}
                            className="bg-teal-400 hover:bg-teal-300 text-slate-950 font-black text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-lg transition shrink-0 active:scale-95"
                          >
                            + {lang === "uz" ? "Karta balansi" : lang === "ru" ? "Пополнить карту" : "Add Card Funds"}
                          </button>
                        </div>

                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-2">
                          <p className="text-[9px] font-mono text-teal-400 uppercase tracking-widest leading-none mb-1 text-left">
                            {lang === "uz" ? "Biriktirilgan bank kartalari" : lang === "ru" ? "Привязанные банковские карты" : "Linked Bank Cards"}
                          </p>
                          <div className="space-y-1.5">
                            {paymentCards.map((card) => (
                              <div
                                key={card.id}
                                onClick={() => handleSelectCard(card.id)}
                                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                                  card.active ? "bg-teal-400/5 border-teal-400/50" : "bg-slate-950 border-slate-900 hover:border-slate-800"
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="w-9 h-6 rounded bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-[7px] font-bold text-teal-400 font-mono">
                                    {card.logo}
                                  </div>
                                  <div className="text-left leading-tight">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] font-bold text-gray-200">{card.name}</span>
                                      {card.active && (
                                        <span className="bg-teal-400/10 text-teal-400 border border-teal-500/20 text-[6.5px] px-1 py-0.2 rounded-full uppercase tracking-wider font-mono scale-90">
                                          {lang === "uz" ? "Avto-to'lov" : lang === "ru" ? "Автооплата" : "Auto-pay"}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[9px] text-gray-400 font-mono mt-0.5">
                                      {card.number} <span className="text-gray-600 ml-1">exp: {card.expiry}</span>
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right flex items-center gap-2">
                                  <div className="text-right leading-none">
                                    <span className="text-[8px] text-gray-500 font-mono block uppercase">{lang === "uz" ? "Karta qoldig'i" : lang === "ru" ? "Баланс" : "Card Balance"}</span>
                                    <span className="text-[10px] font-mono font-bold text-gray-300">{(card.balance || 0).toLocaleString()} UZS</span>
                                  </div>
                                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                    card.active ? "border-teal-400 bg-teal-400/20" : "border-slate-800"
                                  }`}>
                                    {card.active && <span className="w-2 h-2 rounded-full bg-teal-400" />}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Add new card simulator form */}
                        {showAddCard ? (
                          <form onSubmit={handleAddCard} className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-3 text-left">
                            <p className="text-[9px] font-mono text-teal-400 uppercase tracking-widest leading-none">
                              {lang === "uz" ? "Yangi Karta Biriktirish" : lang === "ru" ? "Привязать новую карту" : "Link New Card"}
                            </p>
                            
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="text-[8px] text-gray-400 uppercase font-mono block mb-1">{lang === "uz" ? "Karta turi" : "Card Type"}</label>
                                <select
                                  value={newCardType}
                                  onChange={(e) => setNewCardType(e.target.value as any)}
                                  className="bg-slate-900 text-white text-[10px] p-2 rounded-lg w-full border border-slate-800 focus:outline-none focus:border-teal-400"
                                >
                                  <option value="Uzcard">Uzcard</option>
                                  <option value="Humo">Humo</option>
                                  <option value="Visa">Visa</option>
                                  <option value="Mastercard">Mastercard</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[8px] text-gray-400 uppercase font-mono block mb-1">{lang === "uz" ? "Muddati (MM/YY)" : "Expiry (MM/YY)"}</label>
                                <input
                                  type="text"
                                  placeholder="12/29"
                                  value={newCardExpiry}
                                  onChange={(e) => {
                                    let val = e.target.value.replace(/\D/g, '');
                                    if (val.length > 2) {
                                      val = val.slice(0, 2) + '/' + val.slice(2, 4);
                                    }
                                    setNewCardExpiry(val.slice(0, 5));
                                  }}
                                  className="bg-slate-900 text-white text-[10px] p-2 rounded-lg w-full border border-slate-800 focus:outline-none focus:border-teal-400 font-mono"
                                  required
                                />
                              </div>
                              <div>
                                <label className="text-[8px] text-gray-400 uppercase font-mono block mb-1">{lang === "uz" ? "CVV/CVC kodi" : "CVV/CVC"}</label>
                                <input
                                  type="password"
                                  maxLength={3}
                                  placeholder="•••"
                                  value={newCardCvv}
                                  onChange={(e) => setNewCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                  className="bg-slate-900 text-white text-[10px] p-2 rounded-lg w-full border border-slate-800 focus:outline-none focus:border-teal-400 font-mono text-center font-bold tracking-widest"
                                  required
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[8px] text-gray-400 uppercase font-mono block mb-1">{lang === "uz" ? "Karta raqami" : "Card Number"}</label>
                              <input
                                type="text"
                                placeholder="8600 0000 0000 0000"
                                value={newCardNumber}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\s+/g, '').replace(/(\d{4})/g, '$1 ').trim();
                                  setNewCardNumber(val.slice(0, 19));
                                }}
                                className="bg-slate-900 text-white text-[10px] p-2 rounded-lg w-full border border-slate-800 focus:outline-none focus:border-teal-400 font-mono"
                                required
                              />
                            </div>

                            <div>
                              <label className="text-[8px] text-gray-400 uppercase font-mono block mb-1">
                                {lang === "uz" ? "Karta balansi (Simulyatsiya uchun)" : "Simulated Card Balance"}
                              </label>
                              <input
                                type="number"
                                placeholder="500000"
                                value={newCardStartBalance}
                                onChange={(e) => setNewCardStartBalance(e.target.value)}
                                className="bg-slate-900 text-white text-[10px] p-2 rounded-lg w-full border border-slate-800 focus:outline-none focus:border-teal-400 font-mono"
                                required
                              />
                              <span className="text-[7.5px] text-gray-500 block mt-1 leading-normal">
                                {lang === "uz" 
                                  ? "Mijozlar platformaga pul o'tkazmaydilar, to'lovlar shu kartadan avtomatik tarzda yechiladi." 
                                  : "Customers do not deposit money to platform, payments are auto-debited directly from this card."}
                              </span>
                            </div>

                            <div className="flex gap-2 pt-1">
                              <button
                                type="submit"
                                className="bg-teal-400 hover:bg-teal-300 text-slate-950 text-[9px] font-black uppercase tracking-wider py-1.5 px-4 rounded-lg transition"
                              >
                                {lang === "uz" ? "Biriktirish" : lang === "ru" ? "Привязать" : "Link"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowAddCard(false)}
                                className="text-gray-400 hover:text-white text-[9px] py-1.5 px-3 rounded-lg border border-slate-850 hover:border-slate-800 transition"
                              >
                                {lang === "uz" ? "Bekor qilish" : "Cancel"}
                              </button>
                            </div>
                          </form>
                        ) : (
                          <button
                            onClick={() => setShowAddCard(true)}
                            className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-teal-400 hover:text-teal-300 text-[10px] border border-dashed border-teal-500/20 hover:border-teal-500/40 rounded-xl transition font-black uppercase tracking-wider"
                          >
                            + {lang === "uz" ? "Yangi karta biriktirish" : lang === "ru" ? "Привязать новую карту" : "Link New Card"}
                          </button>
                        )}

                      {/* Loyalty Points Tracker */}
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3.5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-xl pointer-events-none" />
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-teal-400/10 flex items-center justify-center">
                              <Star className="w-4 h-4 text-teal-400 animate-pulse fill-teal-400" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                                {lang === "uz" ? "404-GO Loyalty Club" : lang === "ru" ? "Клуб Лояльности 404-GO" : "404-GO Loyalty Club"}
                              </h4>
                              <p className="text-[9px] text-gray-500">
                                {lang === "uz" ? "Sayohat qiling va ballar to'plang" : lang === "ru" ? "Поезжайте и копите баллы" : "Ride and earn rewards"}
                              </p>
                            </div>
                          </div>
                          <div className="bg-teal-400/10 border border-teal-500/20 px-2.5 py-1 rounded-lg text-right">
                            <span className="text-[8px] font-mono text-gray-400 block leading-none uppercase">{lang === "uz" ? "Ballaringiz" : lang === "ru" ? "Ваши Баллы" : "Your Points"}</span>
                            <span className="text-sm font-mono font-black text-teal-400 leading-none block mt-0.5">
                              {loyaltyPoints} <span className="text-[9px]">pts</span>
                            </span>
                          </div>
                        </div>

                        {/* Redeemed Success Toast inside Card */}
                        {redeemedBanner && (
                          <div className="bg-teal-400 text-slate-950 font-bold text-[9px] p-2 rounded-lg border border-teal-300 shadow-md flex items-center gap-1.5 animate-bounce">
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                            <span>{redeemedBanner}</span>
                          </div>
                        )}

                        {/* Earned Per Ride history tracker */}
                        <div className="space-y-1.5">
                          <p className="text-[9px] font-mono text-teal-400 uppercase tracking-widest leading-none">
                            {lang === "uz" ? "Sayohatlardan to'plangan ballar" : lang === "ru" ? "Баллы за поездки" : "Earned Points Per Ride"}
                          </p>
                          <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-850/60 max-h-[100px] overflow-y-auto space-y-1 scrollbar-none">
                            {orders.filter(o => o.status === "completed").map((o) => {
                              const points = Math.floor(o.price / 1000);
                              return (
                                <div key={o.id} className="flex items-center justify-between text-[9px] py-1 border-b border-slate-850 last:border-0">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <div className="text-gray-400 scale-90">
                                      {o.type === "taxi" && <Car className="w-3 h-3 text-teal-400" />}
                                      {o.type === "delivery" && <Package className="w-3 h-3 text-teal-400" />}
                                      {o.type === "cargo" && <Truck className="w-3 h-3 text-teal-400" />}
                                      {o.type === "parking" && <SquarePlay className="w-3 h-3 text-teal-400" />}
                                      {o.type === "ev_charge" && <Zap className="w-3 h-3 text-teal-400" />}
                                    </div>
                                    <div className="truncate leading-none">
                                      <p className="text-white font-bold truncate max-w-[150px]">{o.title[lang]}</p>
                                      <span className="text-[7px] text-gray-500 font-mono">{o.date}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0 text-right leading-none">
                                    <span className="text-gray-400 font-mono">{o.price.toLocaleString()} so'm</span>
                                    <span className="text-emerald-400 font-bold font-mono">+{points} pts</span>
                                  </div>
                                </div>
                              );
                            })}
                            {orders.filter(o => o.status === "completed").length === 0 && (
                              <p className="text-[9px] text-gray-500 text-center py-2">{lang === "uz" ? "Hozircha tugallangan sayohatlar yo'q" : lang === "ru" ? "Нет завершенных поездок" : "No completed rides yet"}</p>
                            )}
                          </div>
                        </div>

                        {/* Redeem Coupons Options */}
                        <div className="space-y-1.5">
                          <p className="text-[9px] font-mono text-teal-400 uppercase tracking-widest leading-none">
                            {lang === "uz" ? "Kuponlarga almashtirish" : lang === "ru" ? "Обменять на купоны" : "Redeem Points for Coupons"}
                          </p>
                          <div className="grid grid-cols-2 gap-1.5">
                            {redeemableCoupons.map((coupon) => {
                              const canRedeem = loyaltyPoints >= coupon.cost;
                              return (
                                <div key={coupon.id} className="bg-slate-900 border border-slate-850 p-2 rounded-lg flex flex-col justify-between space-y-1.5">
                                  <div className="leading-tight">
                                    <div className="flex items-center gap-1">
                                      <Ticket className="w-3 h-3 text-amber-400 shrink-0" />
                                      <span className="text-[9px] text-white font-bold">{coupon.name[lang]}</span>
                                    </div>
                                    <span className="text-[8px] text-gray-500 font-mono block mt-0.5">{coupon.code}</span>
                                  </div>
                                  <div className="flex items-center justify-between pt-1 border-t border-slate-850/60 mt-1">
                                    <span className="text-[9px] font-mono font-bold text-teal-400">{coupon.cost} pts</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRedeemCoupon(coupon)}
                                      disabled={!canRedeem}
                                      className={`text-[8px] font-bold px-2 py-1 rounded transition shrink-0 ${
                                        canRedeem
                                          ? "bg-amber-400 hover:bg-amber-300 text-slate-950 active:scale-95 cursor-pointer"
                                          : "bg-slate-950 text-gray-600 border border-slate-850 cursor-not-allowed"
                                      }`}
                                    >
                                      {lang === "uz" ? "Olish" : lang === "ru" ? "Купить" : "Redeem"}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Active Coupons List */}
                        {activeCoupons.length > 0 && (
                          <div className="space-y-1.5 pt-1 border-t border-slate-850/60 text-left">
                            <div className="flex items-center justify-between">
                              <p className="text-[9px] font-mono text-teal-400 uppercase tracking-widest leading-none">
                                {lang === "uz" ? "Sizning faol kuponlaringiz" : lang === "ru" ? "Ваши активные купоны" : "Your Active Coupons"}
                              </p>
                              
                              {/* Sort controls */}
                              <div className="flex gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setCouponSortOrder("desc")}
                                  className={`text-[7px] px-1.5 py-0.5 rounded font-mono transition ${couponSortOrder === "desc" ? "bg-teal-400 text-slate-950 font-bold" : "bg-slate-900 text-gray-400"}`}
                                  title={lang === "uz" ? "Katta chegirma" : "Highest Discount"}
                                >
                                  {lang === "uz" ? "Katta ↓" : "High ↓"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCouponSortOrder("asc")}
                                  className={`text-[7px] px-1.5 py-0.5 rounded font-mono transition ${couponSortOrder === "asc" ? "bg-teal-400 text-slate-950 font-bold" : "bg-slate-900 text-gray-400"}`}
                                  title={lang === "uz" ? "Kichik chegirma" : "Lowest Discount"}
                                >
                                  {lang === "uz" ? "Kichik ↑" : "Low ↑"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCouponSortOrder("code")}
                                  className={`text-[7px] px-1.5 py-0.5 rounded font-mono transition ${couponSortOrder === "code" ? "bg-teal-400 text-slate-950 font-bold" : "bg-slate-900 text-gray-400"}`}
                                  title={lang === "uz" ? "Alifbo bo'yicha" : "Alphabetical"}
                                >
                                  {lang === "uz" ? "A-Z" : "A-Z"}
                                </button>
                              </div>
                            </div>
                            <div className="space-y-1">
                              {getSortedCoupons(activeCoupons).map((coupon) => (
                                <div key={coupon.id} className="bg-slate-900 border border-slate-850 p-1.5 rounded-lg flex items-center justify-between text-[9px]">
                                  <div className="flex items-center gap-1.5">
                                    <Ticket className="w-3 h-3 text-teal-400" />
                                    <div>
                                      <span className="text-white font-bold font-mono">{coupon.code}</span>
                                      <span className="text-gray-400 ml-1.5">({coupon.type})</span>
                                    </div>
                                  </div>
                                  <span className="text-[8px] text-emerald-400 font-bold bg-emerald-400/10 px-1.5 py-0.5 rounded-full uppercase scale-90">
                                    {lang === "uz" ? "Tayyor" : lang === "ru" ? "Готов" : "Ready"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Promo Code Redemption Section */}
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                        
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center border border-amber-500/15">
                            <Ticket className="w-4 h-4 text-amber-400" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-white uppercase tracking-wider">
                              {lang === "uz" ? "Promo-kod Kiritish" : lang === "ru" ? "Ввод Промокода" : "Promo Code Redemption"}
                            </h4>
                            <p className="text-[9px] text-gray-500">
                              {lang === "uz" ? "Sayohat uchun chegirmali kuponlarni faollashtiring" : lang === "ru" ? "Активируйте купоны на скидку" : "Activate discount coupons for your rides"}
                            </p>
                          </div>
                        </div>

                        <form onSubmit={handleRedeemPromoCode} className="flex gap-2">
                          <input
                            type="text"
                            value={promoCodeInput}
                            onChange={(e) => {
                              setPromoCodeInput(e.target.value.toUpperCase());
                              setPromoError(null);
                              setPromoSuccess(null);
                            }}
                            placeholder={lang === "uz" ? "Masalan: 404GO20" : lang === "ru" ? "Например: 404GO20" : "e.g., 404GO20"}
                            className="bg-slate-900 text-white text-[11px] font-mono p-2 rounded-lg border border-slate-850 focus:outline-none focus:border-teal-400 flex-grow"
                            required
                          />
                          <button
                            type="submit"
                            className="bg-teal-400 hover:bg-teal-300 text-slate-950 font-black text-[10px] px-4 py-2 rounded-lg tracking-wider uppercase transition shrink-0"
                          >
                            {lang === "uz" ? "Kiritish" : lang === "ru" ? "Ввод" : "Redeem"}
                          </button>
                        </form>

                        {promoError && (
                          <div className="text-[9px] text-red-400 bg-red-400/10 border border-red-500/15 p-2 rounded-lg flex items-center gap-1.5 animate-pulse">
                            <span>⚠️</span>
                            <span>{promoError}</span>
                          </div>
                        )}
                        {promoSuccess && (
                          <div className="text-[9px] text-emerald-400 bg-emerald-400/10 border border-emerald-500/15 p-2 rounded-lg flex items-center gap-1.5">
                            <span>✅</span>
                            <span>{promoSuccess}</span>
                          </div>
                        )}
                      </div>
                    </>
                    </motion.div>
                  )}

                  {/* TAB 4: AI MESSAGES / CHAT */}
                  {activeTab === "messages" && (
                    <motion.div
                      key="messages"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex flex-col h-[320px]"
                    >
                      {/* Messages window */}
                      <div className="flex-grow overflow-y-auto space-y-2.5 pb-2 scrollbar-none pr-1">
                        {chatMessages.map((m) => (
                          <div
                            key={m.id}
                            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-normal relative ${
                                m.role === "user"
                                  ? "bg-teal-400 text-slate-950 rounded-tr-none font-medium"
                                  : "bg-slate-950/90 text-gray-200 border border-slate-850 rounded-tl-none"
                              }`}
                            >
                              {m.content}
                              <p className={`text-[7px] text-right mt-1 font-mono ${
                                m.role === "user" ? "text-slate-800" : "text-gray-500"
                              }`}>
                                {m.timestamp}
                              </p>
                            </div>
                          </div>
                        ))}
                        {isChatLoading && (
                          <div className="flex justify-start">
                            <div className="bg-slate-950/90 border border-slate-850 rounded-2xl rounded-tl-none px-3 py-2.5 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" />
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce [animation-delay:0.2s]" />
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce [animation-delay:0.4s]" />
                            </div>
                          </div>
                        )}
                        <div ref={chatBottomRef} />
                      </div>

                      {/* Prompt Suggestions Carousel */}
                      <div className="flex gap-1 overflow-x-auto py-1 mb-2 max-w-full scrollbar-none">
                        {suggestions[lang].map((sug, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(sug)}
                            className="bg-slate-950 hover:bg-slate-900 border border-slate-850 text-[9px] text-teal-400 px-2 py-1 rounded-full whitespace-nowrap transition shrink-0"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>

                      {/* Chat Input form */}
                      <div className="flex items-center gap-1.5 border-t border-slate-850 pt-2">
                        <input
                          type="text"
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                          placeholder={t.type_message_placeholder}
                          className="bg-slate-950/80 text-xs text-white p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-teal-400 w-full"
                        />
                        <button
                          onClick={() => handleSendMessage()}
                          disabled={!userInput.trim()}
                          className="bg-teal-400 hover:bg-teal-300 disabled:opacity-45 disabled:hover:bg-teal-400 text-slate-950 p-2.5 rounded-xl transition shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 5: PROFILE & STATS */}
                  {activeTab === "profile" && (
                    <motion.div
                      key="profile"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4 pb-4 overflow-y-auto max-h-[350px] pr-1 scrollbar-thin"
                    >
                      {/* Profile Form */}
                      <form onSubmit={handleProfileSave} className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-3">
                        <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-teal-400" />
                          {t.profile_title}
                        </h4>

                        {authSession ? (
                          <div className="flex items-center justify-between bg-teal-500/10 border border-teal-500/20 rounded-lg px-2.5 py-2">
                            <div>
                              <p className="text-[9px] text-teal-400 font-bold">
                                {lang === "uz" ? "SMS orqali kirilgan" : lang === "ru" ? "Вход по SMS" : "SMS verified"}
                              </p>
                              <p className="text-[10px] text-white font-mono">{authSession.phone}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => { clearAuth(); setAuthSession(null); setShowAuthModal(true); }}
                              className="text-[9px] text-red-400 hover:text-red-300 px-2 py-1 border border-red-900/40 rounded-lg"
                            >
                              {lang === "uz" ? "Chiqish" : lang === "ru" ? "Выйти" : "Logout"}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowAuthModal(true)}
                            className="w-full py-2 bg-teal-400/15 border border-teal-400/30 text-teal-300 text-[10px] font-bold rounded-lg"
                          >
                            {lang === "uz" ? "SMS orqali kirish" : lang === "ru" ? "Войти по SMS" : "Sign in with SMS"}
                          </button>
                        )}

                        <SavedAddressesBar
                          lang={lang}
                          addresses={savedAddresses}
                          onSelect={(addr) => updateProfileField("address", addr.address)}
                        />

                        {/* Photo upload */}
                        <div className="flex flex-col items-center gap-2 py-1">
                          <div className="relative">
                            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-teal-400 overflow-hidden flex items-center justify-center">
                              {userProfile.photoUrl ? (
                                <img src={userProfile.photoUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-8 h-8 text-teal-400" />
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => profilePhotoInputRef.current?.click()}
                              className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-teal-400 hover:bg-teal-300 text-slate-950 flex items-center justify-center border-2 border-slate-950 transition"
                              title={userProfile.photoUrl ? t.profile_photo_change : t.profile_photo_upload}
                            >
                              <Camera className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="text-[9px] text-gray-500">{t.profile_photo}</span>
                          {(userProfile.firstName.trim() || userProfile.lastName.trim()) && (
                            <p className="text-xs font-bold text-white">{getUserDisplayName()}</p>
                          )}
                        </div>

                        {/* First name */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 font-medium">
                            {t.profile_first_name} <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={userProfile.firstName}
                            onChange={(e) => updateProfileField("firstName", e.target.value)}
                            className={`bg-slate-900 text-white text-xs px-2.5 py-2 rounded-lg w-full border focus:outline-none focus:border-teal-400/60 transition ${
                              profileErrors.firstName ? "border-red-500/60" : "border-slate-800"
                            }`}
                            required
                          />
                          {profileErrors.firstName && (
                            <p className="text-[9px] text-red-400">{profileErrors.firstName}</p>
                          )}
                        </div>

                        {/* Last name */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 font-medium">
                            {t.profile_last_name} <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={userProfile.lastName}
                            onChange={(e) => updateProfileField("lastName", e.target.value)}
                            className={`bg-slate-900 text-white text-xs px-2.5 py-2 rounded-lg w-full border focus:outline-none focus:border-teal-400/60 transition ${
                              profileErrors.lastName ? "border-red-500/60" : "border-slate-800"
                            }`}
                            required
                          />
                          {profileErrors.lastName && (
                            <p className="text-[9px] text-red-400">{profileErrors.lastName}</p>
                          )}
                        </div>

                        {/* Phone */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 font-medium">
                            {t.profile_phone} <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="tel"
                            value={userProfile.phone}
                            onChange={(e) => updateProfileField("phone", e.target.value)}
                            placeholder="+998 90 123 45 67"
                            className={`bg-slate-900 text-white text-xs px-2.5 py-2 rounded-lg w-full border focus:outline-none focus:border-teal-400/60 transition ${
                              profileErrors.phone ? "border-red-500/60" : "border-slate-800"
                            }`}
                            required
                          />
                          {profileErrors.phone && (
                            <p className="text-[9px] text-red-400">{profileErrors.phone}</p>
                          )}
                        </div>

                        {/* Address */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 font-medium">
                            {t.profile_address} <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={userProfile.address}
                            onChange={(e) => updateProfileField("address", e.target.value)}
                            placeholder={lang === "uz" ? "Toshkent, Yunusobod..." : lang === "ru" ? "Ташкент, Юнусабад..." : "Tashkent, Yunusobod..."}
                            className={`bg-slate-900 text-white text-xs px-2.5 py-2 rounded-lg w-full border focus:outline-none focus:border-teal-400/60 transition ${
                              profileErrors.address ? "border-red-500/60" : "border-slate-800"
                            }`}
                            required
                          />
                          {profileErrors.address && (
                            <p className="text-[9px] text-red-400">{profileErrors.address}</p>
                          )}
                        </div>

                        {/* Birth date */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 font-medium">
                            {t.profile_birth_date} <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="date"
                            value={userProfile.birthDate}
                            onChange={(e) => updateProfileField("birthDate", e.target.value)}
                            max={new Date().toISOString().split("T")[0]}
                            className={`bg-slate-900 text-white text-xs px-2.5 py-2 rounded-lg w-full border focus:outline-none focus:border-teal-400/60 transition [color-scheme:dark] ${
                              profileErrors.birthDate ? "border-red-500/60" : "border-slate-800"
                            }`}
                            required
                          />
                          {profileErrors.birthDate && (
                            <p className="text-[9px] text-red-400">{profileErrors.birthDate}</p>
                          )}
                        </div>

                        {profileSaveMessage && (
                          <p className={`text-[10px] text-center font-medium ${
                            profileSaveMessage === t.profile_saved ? "text-emerald-400" : "text-red-400"
                          }`}>
                            {profileSaveMessage}
                          </p>
                        )}

                        <button
                          type="submit"
                          className="w-full nexgo-btn-primary text-xs py-2.5 active:scale-[0.98]"
                        >
                          {t.profile_save}
                        </button>
                      </form>

                      {/* Stats Card */}
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-2">
                        <div className="flex items-center justify-between text-xs border-b border-slate-900 pb-1.5">
                          <span className="text-gray-400">Platform Rating</span>
                          <span className="font-semibold text-white">4.98 (Elite VIP)</span>
                        </div>
                        <div className="flex items-center justify-between text-xs border-b border-slate-900 pb-1.5">
                          <span className="text-gray-400">Total Rides</span>
                          <span className="font-semibold text-white">524</span>
                        </div>
                        <div className="flex items-center justify-between text-xs pb-0.5">
                          <span className="text-gray-400">{t.profile_phone}</span>
                          <span className="font-semibold text-white truncate max-w-[140px]">
                            {userProfile.phone.trim() || "—"}
                          </span>
                        </div>
                      </div>

                      {/* App Preferences & Settings */}
                      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-3.5">
                        <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                          <Sliders className="w-3.5 h-3.5 text-teal-400" />
                          {lang === "uz" ? "Ilova sozlamalari" : lang === "ru" ? "Настройки приложения" : "App Settings"}
                        </h4>

                        <div className="space-y-2.5">
                          {/* Language Switcher inside App */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">{lang === "uz" ? "Tizim tili:" : lang === "ru" ? "Язык интерфейса:" : "Interface Language:"}</span>
                            <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                              <Languages className="w-3.5 h-3.5 text-teal-400" />
                              <select
                                value={lang}
                                onChange={(e) => setLang(e.target.value as Language)}
                                className="bg-transparent text-[11px] text-white focus:outline-none cursor-pointer font-bold uppercase"
                              >
                                <option value="uz" className="bg-slate-950 text-white">UZ</option>
                                <option value="en" className="bg-slate-950 text-white">EN</option>
                                <option value="ru" className="bg-slate-950 text-white">RU</option>
                              </select>
                            </div>
                          </div>

                          {/* Voice Toggle inside App */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">{lang === "uz" ? "Ovozli bildirishnomalar:" : lang === "ru" ? "Голосовое вещание:" : "Voice Announcements:"}</span>
                            <button
                              onClick={() => {
                                const newValue = !voiceAnnouncementsEnabled;
                                setVoiceAnnouncementsEnabled(newValue);
                                if (newValue) {
                                  const confirmMsg = lang === "uz" ? "Ovozli xabarlar yoqildi" : lang === "ru" ? "Голосовые оповещения включены" : "Voice notifications enabled";
                                  if ('speechSynthesis' in window) {
                                    try {
                                      window.speechSynthesis.cancel();
                                      const utterance = new SpeechSynthesisUtterance(confirmMsg);
                                      if (lang === "uz") utterance.lang = "uz-UZ";
                                      else if (lang === "ru") utterance.lang = "ru-RU";
                                      else utterance.lang = "en-US";
                                      window.speechSynthesis.speak(utterance);
                                    } catch (e) {}
                                  }
                                }
                              }}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition ${
                                voiceAnnouncementsEnabled 
                                  ? "bg-teal-500/10 border-teal-500/30 text-teal-400" 
                                  : "bg-slate-900 border-slate-800 text-gray-500"
                              }`}
                            >
                              {voiceAnnouncementsEnabled ? <Volume2 className="w-3.5 h-3.5 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
                              <span className="text-[10px] font-bold">
                                {voiceAnnouncementsEnabled ? (lang === "uz" ? "YOQIQ" : lang === "ru" ? "ВКЛ" : "ON") : (lang === "uz" ? "O'CHIQ" : lang === "ru" ? "ВЫКЛ" : "OFF")}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Gemini AI Key Setup Panel (Migrated inside Profile) */}
                      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-3 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-teal-400/5 rounded-full blur-xl pointer-events-none" />
                        
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-teal-400" />
                            {apiTranslations[lang].title}
                          </h4>
                          
                          {userApiKeyState ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                              Live API
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                              Simulated
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-gray-400 leading-normal">
                          {apiTranslations[lang].desc}
                        </p>

                        {userApiKeyState ? (
                          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-850 space-y-2">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-gray-400">Status:</span>
                              <span className="font-mono text-emerald-400 font-bold">{apiTranslations[lang].status_active}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-gray-400">API Key:</span>
                              <span className="font-mono text-gray-400">
                                {showKey ? userApiKeyState : `••••${userApiKeyState.slice(-4)}`}
                              </span>
                            </div>
                            <div className="flex gap-1.5 pt-1">
                              <button
                                onClick={() => setShowKey(!showKey)}
                                className="flex-grow bg-slate-950 hover:bg-slate-900 text-gray-300 text-[9px] font-semibold py-1 rounded-md border border-slate-800 transition"
                              >
                                {showKey ? "Hide" : "Show"}
                              </button>
                              <button
                                onClick={handleDeactivate}
                                className="flex-grow bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[9px] font-semibold py-1 rounded-md border border-rose-500/25 transition"
                              >
                                {apiTranslations[lang].deactivate_btn}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <form onSubmit={handleVerifyAndSave} className="space-y-2">
                            <div className="relative flex items-center">
                              <input
                                type={showKey ? "text" : "password"}
                                placeholder={apiTranslations[lang].placeholder}
                                value={apiKeyInput}
                                onChange={(e) => setApiKeyInput(e.target.value)}
                                disabled={isVerifyingKey}
                                className="bg-slate-900 text-white text-[10px] pl-2.5 pr-8 py-2 rounded-lg w-full border border-slate-800 focus:outline-none focus:border-teal-400/60 transition disabled:opacity-50"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-2 text-gray-500 hover:text-gray-300 transition text-[9px] font-mono select-none"
                              >
                                {showKey ? "HIDE" : "SHOW"}
                              </button>
                            </div>

                            <div className="flex items-center justify-between pt-0.5">
                              <a
                                href="https://aistudio.google.com/"
                                target="_blank"
                                rel="noreferrer"
                                className="text-[9px] text-teal-400/80 hover:text-teal-400 underline"
                              >
                                {apiTranslations[lang].get_key_hint}
                              </a>

                              <button
                                type="submit"
                                disabled={isVerifyingKey || !apiKeyInput.trim()}
                                className="bg-teal-400 hover:bg-teal-300 disabled:bg-slate-800 disabled:text-gray-500 text-slate-950 font-bold text-[9px] px-2.5 py-1 rounded transition"
                              >
                                {isVerifyingKey ? "..." : apiTranslations[lang].activate_btn}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>

                      {/* Collapsible Advantages Accordion */}
                      <details className="bg-slate-950 rounded-xl border border-slate-850 overflow-hidden group">
                        <summary className="list-none flex items-center justify-between p-3.5 cursor-pointer text-xs font-black text-white uppercase tracking-wider select-none hover:bg-slate-900/40 transition">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                            {lang === "uz" ? "Nima uchun 404-GO?" : lang === "ru" ? "Почему 404-GO?" : "Why Choose 404-GO?"}
                          </span>
                          <span className="text-teal-400 transition-transform duration-300 group-open:rotate-180">
                            ▼
                          </span>
                        </summary>
                        <div className="p-3.5 border-t border-slate-900 bg-slate-950 space-y-2">
                          <p className="text-[10px] text-gray-400 leading-normal mb-2">
                            {lang === "uz" ? "404-GO - bu Toshkent shahridagi eng ilg'or xavfsiz va aqlli transport hamda to'lov tizimidir." : "404-GO is the most advanced safe transport and payment ecosystem."}
                          </p>
                          <ul className="space-y-1.5">
                            {t.advantages.map((adv, idx) => (
                              <li key={idx} className="text-[10px] text-gray-300 flex items-start gap-1.5">
                                <CheckCircle2 className="w-3 h-3 text-teal-400 shrink-0 mt-0.5" />
                                <span>{adv}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </details>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* MOBILE BOTTOM NAVIGATION BAR */}
              <nav className="nexgo-nav four04-app-nav flex justify-between items-center select-none shrink-0 px-2">
                <button
                  onClick={() => setActiveTab("home")}
                  className={`nexgo-nav-btn ${activeTab === "home" ? "active" : ""}`}
                >
                  <Map className="w-4 h-4" />
                  <span>{t.home_tab}</span>
                </button>
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`nexgo-nav-btn ${activeTab === "orders" ? "active" : ""}`}
                >
                  <Clock className="w-4 h-4" />
                  <span>{t.orders_tab}</span>
                </button>
                <button
                  onClick={() => setActiveTab("wallet")}
                  className={`nexgo-nav-btn ${activeTab === "wallet" ? "active" : ""}`}
                >
                  <Wallet className="w-4 h-4" />
                  <span>{t.wallet_tab}</span>
                </button>
                <button
                  onClick={() => setActiveTab("messages")}
                  className={`nexgo-nav-btn relative ${activeTab === "messages" ? "active" : ""}`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{t.messages_tab}</span>
                  {chatMessages.length > 1 && activeTab !== "messages" && (
                    <span className="absolute top-1 right-3 w-1.5 h-1.5 rounded-full bg-red-500" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`nexgo-nav-btn ${activeTab === "profile" ? "active" : ""}`}
                >
                  <User className="w-4 h-4" />
                  <span>{t.profile_tab}</span>
                </button>
              </nav>

            {/* Simulated Live Booking Dialog */}
            <AnimatePresence>
              {pendingBooking && (
                <motion.div
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 100 }}
                  className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-4 right-4 bg-slate-950 p-4 rounded-2xl border-2 border-teal-400 shadow-2xl z-50 space-y-3 max-w-lg mx-auto"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      New Booking
                    </span>
                    <button onClick={() => setPendingBooking(null)} className="text-gray-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0">
                      {pendingBooking.type === "taxi" && <Car className="w-5 h-5" />}
                      {pendingBooking.type === "delivery" && <Package className="w-5 h-5" />}
                      {pendingBooking.type === "cargo" && <Truck className="w-5 h-5" />}
                      {pendingBooking.type === "parking" && <SquarePlay className="w-5 h-5" />}
                      {pendingBooking.type === "ev_charge" && <Zap className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{pendingBooking.title}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">{pendingBooking.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-slate-900 px-3 py-2 rounded-lg text-xs">
                    <span className="text-gray-400">{t.narx}:</span>
                    <span className="font-mono font-bold text-white">{pendingBooking.price.toLocaleString()} so'm</span>
                  </div>

                  {/* Coupon Fund Payment Option */}
                  {cashback > 0 && (
                    <div className="bg-slate-900 px-3 py-2 rounded-lg space-y-1.5 text-xs border border-teal-500/10 text-left">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer select-none text-white font-medium">
                          <input
                            type="checkbox"
                            checked={useCashbackAsPayment}
                            onChange={(e) => setUseCashbackAsPayment(e.target.checked)}
                            className="w-3.5 h-3.5 accent-teal-400 rounded cursor-pointer border border-slate-700 bg-slate-950"
                          />
                          <span>{lang === "uz" ? "Kupon hisobidan to'lash" : lang === "ru" ? "Оплатить с купонов" : "Pay with Coupon"}</span>
                        </label>
                        <span className="font-mono text-[10px] text-teal-400 font-bold bg-teal-400/10 px-1.5 py-0.5 rounded-full">
                          {cashback.toLocaleString()} so'm
                        </span>
                      </div>
                      {useCashbackAsPayment && (
                        <div className="pt-1.5 border-t border-slate-800 space-y-0.5 text-[10px]">
                          <div className="flex justify-between text-gray-400">
                            <span>{lang === "uz" ? "Kupondan chegiriladi:" : lang === "ru" ? "Спишется с купонов:" : "Deducted from Coupons:"}</span>
                            <span className="font-mono text-amber-400 font-bold">-{Math.min(cashback, pendingBooking.price).toLocaleString()} so'm</span>
                          </div>
                          <div className="flex justify-between text-gray-400">
                            <span>{lang === "uz" ? "Kartadan yechiladi:" : lang === "ru" ? "Спишется с карты:" : "Remaining from Card:"}</span>
                            <span className="font-mono text-teal-400 font-bold">{(pendingBooking.price - Math.min(cashback, pendingBooking.price)).toLocaleString()} so'm</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handleConfirmBooking}
                      className="flex-grow nexgo-btn-primary text-xs py-2"
                    >
                      {t.buyurtmani_tasdiqlash}
                    </button>
                    <button
                      onClick={() => setPendingBooking(null)}
                      className="bg-slate-900 hover:bg-slate-850 text-gray-400 text-xs py-2 px-3 rounded-lg border border-slate-800 transition"
                    >
                      {t.bekor_qilish}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

        </section>

        {/* RIGHT COLUMN: INTELLIGENT AI WIDGETS & REAL-TIME UTILITIES (4 COLS) */}
        <section className="hidden">
          
          {/* NEXGO AI Activation & Verification Panel */}
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-5 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <h3 className="font-display font-extrabold text-sm text-white tracking-wider uppercase flex items-center gap-2">
                <Key className="w-4 h-4 text-teal-400" />
                {apiTranslations[lang].title}
              </h3>
              
              {userApiKeyState ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live API
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Simulated
                </span>
              )}
            </div>

            <p className="text-[11px] text-gray-400 leading-normal">
              {apiTranslations[lang].desc}
            </p>

            {userApiKeyState ? (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850/60 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Status:</span>
                  <span className="font-mono text-emerald-400 font-bold">{apiTranslations[lang].status_active}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">API Key:</span>
                  <span className="font-mono text-gray-400">
                    {showKey ? userApiKeyState : `••••••••••••••••${userApiKeyState.slice(-4)}`}
                  </span>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="flex-grow bg-slate-900 hover:bg-slate-850 text-gray-300 text-[10px] font-semibold py-1.5 px-3 rounded-lg border border-slate-800 transition"
                  >
                    {showKey ? "Hide" : "Show"}
                  </button>
                  <button
                    onClick={handleDeactivate}
                    className="flex-grow bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-semibold py-1.5 px-3 rounded-lg border border-rose-500/25 transition"
                  >
                    {apiTranslations[lang].deactivate_btn}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleVerifyAndSave} className="space-y-3">
                <div className="relative flex items-center">
                  <input
                    type={showKey ? "text" : "password"}
                    placeholder={apiTranslations[lang].placeholder}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    disabled={isVerifyingKey}
                    className="bg-slate-950 text-white text-[11px] pl-3 pr-10 py-2.5 rounded-xl w-full border border-slate-800 focus:outline-none focus:border-teal-400/60 transition disabled:opacity-50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 text-gray-500 hover:text-gray-300 transition text-[10px] font-mono select-none"
                  >
                    {showKey ? "HIDE" : "SHOW"}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <a
                    href="https://aistudio.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[9px] text-teal-400/80 hover:text-teal-400 underline"
                  >
                    {apiTranslations[lang].get_key_hint}
                  </a>

                  <button
                    type="submit"
                    disabled={isVerifyingKey || !apiKeyInput.trim()}
                    className="bg-teal-400 hover:bg-teal-300 disabled:opacity-50 text-slate-950 text-[10px] font-bold py-2 px-4 rounded-xl transition flex items-center gap-1.5"
                  >
                    {isVerifyingKey && (
                      <span className="w-2.5 h-2.5 rounded-full border border-slate-950 border-t-transparent animate-spin" />
                    )}
                    {isVerifyingKey ? apiTranslations[lang].testing : apiTranslations[lang].activate_btn}
                  </button>
                </div>
              </form>
            )}

            {verificationFeedback && (
              <div
                className={`p-2.5 rounded-xl text-[10px] leading-relaxed border ${
                  verificationFeedback.success
                    ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/25"
                    : "bg-rose-500/5 text-rose-400 border-rose-500/25"
                }`}
              >
                {verificationFeedback.message}
              </div>
            )}
          </div>

          {/* AI Assistants Status (Replicating Image 1 details) */}
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-5 space-y-4">
            <h3 className="font-display font-extrabold text-sm text-teal-400 tracking-wider uppercase">
              {t.ai_yordamchilaringiz}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850 hover:border-teal-400/30 transition">
                <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-2">
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-bold text-white leading-none">{t.ai_route_title}</h4>
                <p className="text-[9px] text-gray-400 mt-1 leading-tight">{t.ai_route_desc}</p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850 hover:border-teal-400/30 transition">
                <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 mb-2">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-bold text-white leading-none">{t.ai_traffic_title}</h4>
                <p className="text-[9px] text-gray-400 mt-1 leading-tight">{t.ai_traffic_desc}</p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850 hover:border-teal-400/30 transition">
                <div className="w-6 h-6 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 mb-2">
                  <Star className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-bold text-white leading-none">{t.ai_pricing_title}</h4>
                <p className="text-[9px] text-gray-400 mt-1 leading-tight">{t.ai_pricing_desc}</p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850 hover:border-teal-400/30 transition">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2">
                  <ShieldAlert className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-bold text-white leading-none">{t.ai_safety_title}</h4>
                <p className="text-[9px] text-gray-400 mt-1 leading-tight">{t.ai_safety_desc}</p>
              </div>
            </div>
          </div>

          {/* Real-time Map Canvas Companion */}
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-white">{t.real_time_xarita}</h3>
              <span className="text-[10px] text-gray-400 font-mono">Live Tracker</span>
            </div>
            
            {/* Embedded Live Map */}
            <div className="w-full h-[220px]">
              <MapComponent
                activeFrom={
                  viewingHistoricalTrip
                    ? (viewingHistoricalTrip.from || "Chorsu")
                    : (directBookingService ? directFromText : (selectedOrder?.from || "Chorsu"))
                }
                activeTo={
                  viewingHistoricalTrip
                    ? (viewingHistoricalTrip.to || "Magic City")
                    : (directBookingService ? directToText : (selectedOrder?.to || "Magic City"))
                }
                driverName={
                  viewingHistoricalTrip
                    ? (viewingHistoricalTrip.driverName || (lang === "uz" ? "Haydovchi" : lang === "ru" ? "Водитель" : "Driver"))
                    : (selectedOrder?.driverName || "Azizbek")
                }
                driverStatus={
                  viewingHistoricalTrip
                    ? (lang === "uz" ? "Sayohat yakunlangan (Tarix)" : lang === "ru" ? "Поездка завершена (История)" : "Trip Completed (History)")
                    : (selectedOrder?.status === "active" ? t.active_order_banner : "404-GO Active Platform")
                }
                showRoute={
                  !!viewingHistoricalTrip || !!directBookingService || (!!selectedOrder && selectedOrder.status === "active")
                }
                lang={lang}
                pinMode={viewingHistoricalTrip ? null : pinMode}
                customFromCoords={
                  viewingHistoricalTrip
                    ? (viewingHistoricalTrip.fromCoords || null)
                    : (directBookingService ? customFromCoords : null)
                }
                customToCoords={
                  viewingHistoricalTrip
                    ? (viewingHistoricalTrip.toCoords || null)
                    : (directBookingService ? customToCoords : null)
                }
                onMapClick={handleMapClick}
              />
            </div>
          </div>

          {/* Voice Command Simulated Box (Ovoz orqali buyurtma) */}
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-5 space-y-3">
            <h3 className="font-display font-bold text-sm text-teal-400 uppercase tracking-wider">{t.ovoz_orqali_buyurtma}</h3>
            <p className="text-xs text-gray-400">{t.ovoz_desc}</p>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 flex flex-col items-center justify-center relative overflow-hidden">
              <AnimatePresence>
                {isListening && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/90 backdrop-blur-xs flex flex-col items-center justify-center z-10"
                  >
                    {/* Glowing radar ring */}
                    <div className="relative w-14 h-14 bg-teal-400/10 rounded-full flex items-center justify-center border border-teal-400/20">
                      <div className="absolute inset-0 rounded-full bg-teal-400/20 radar-pulse-ring" />
                      <Mic className="w-6 h-6 text-teal-400 animate-pulse" />
                    </div>
                    <p className="text-[10px] text-teal-400 font-mono mt-3 animate-pulse uppercase tracking-widest">LISTENING...</p>
                    <p className="text-xs text-white text-center font-medium mt-1.5 px-3 italic">"{voiceTextPrompt}"</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Inactive Microphone State */}
              <button
                onClick={startVoiceListening}
                className="w-14 h-14 rounded-full bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-teal-400/30 transition flex items-center justify-center text-teal-400 glow-teal/5 relative group"
              >
                <Mic className="w-6 h-6 group-hover:scale-110 transition duration-300" />
              </button>

              <span className="text-[10px] text-gray-500 mt-2 text-center select-none font-mono">
                {voiceSupported
                  ? (lang === "uz" ? "Mikrofon — ovoz bilan buyurtma" : lang === "ru" ? "Микрофон — голосовой заказ" : "Mic — voice order")
                  : (lang === "uz" ? "Demo ovoz simulyatsiyasi" : "Demo voice simulation")}
              </span>
            </div>
          </div>

          {/* Public Transit Routes Tool */}
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-5 space-y-4">
            <h3 className="font-display font-bold text-sm text-white">{t.jamoat_transporti}</h3>
            
            <form onSubmit={handleSearchTransit} className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Qayerdan"
                  value={transitFrom}
                  onChange={(e) => setTransitFrom(e.target.value)}
                  className="bg-slate-950 p-2 rounded border border-slate-800 text-white focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Qayerga"
                  value={transitTo}
                  onChange={(e) => setTransitTo(e.target.value)}
                  className="bg-slate-950 p-2 rounded border border-slate-800 text-white focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-750 text-white text-xs font-semibold rounded transition"
              >
                {t.marshrut_qirish}
              </button>
            </form>

            <div className="space-y-1.5">
              <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">{t.yaqin_atrofdagi_bekatlar}</p>
              {transitOptions.map((opt) => (
                <div key={opt.id} className="bg-slate-950 p-2 rounded border border-slate-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center text-teal-400">
                      {opt.type === "bus" ? <Bus className="w-3.5 h-3.5" /> : <TrainIcon className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="flex gap-1">
                        {opt.lines.map((line) => (
                          <span key={line} className="bg-teal-500/10 text-teal-400 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border border-teal-500/20">
                            {line}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400">{opt.timeMin} {t.daqiqa}</span>
                </div>
              ))}
            </div>
          </div>

        </section>

      </main>

      {/* FUTURISTIC CAROUSEL & GLOBAL METRICS FOOTER */}
      <footer className="hidden">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Futuristic Tech Carousel (Kelajak Texnologiyalari) */}
          <div className="border-b border-slate-900 pb-6">
            <h3 className="font-display font-extrabold text-xs text-teal-400 tracking-wider uppercase mb-4 text-center">
              {t.kelajak_texnologiyalari}
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-900 hover:border-teal-400/25 transition text-center group">
                <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center mx-auto text-teal-400 mb-2 group-hover:scale-110 transition duration-300">
                  <Car className="w-5 h-5 animate-pulse" />
                </div>
                <h4 className="text-xs font-bold text-white">{t.robotaksi}</h4>
                <p className="text-[10px] text-gray-400 mt-1">{t.robotaksi_desc}</p>
              </div>

              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-900 hover:border-teal-400/25 transition text-center group">
                <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center mx-auto text-teal-400 mb-2 group-hover:scale-110 transition duration-300">
                  <Wind className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-white">{t.dron_yetkazish}</h4>
                <p className="text-[10px] text-gray-400 mt-1">{t.dron_desc}</p>
              </div>

              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-900 hover:border-teal-400/25 transition text-center group">
                <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center mx-auto text-teal-400 mb-2 group-hover:scale-110 transition duration-300">
                  <Cpu className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-white">{t.avtonom_avto}</h4>
                <p className="text-[10px] text-gray-400 mt-1">{t.avtonom_desc}</p>
              </div>

              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-900 hover:border-teal-400/25 transition text-center group">
                <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center mx-auto text-teal-400 mb-2 group-hover:scale-110 transition duration-300">
                  <Map className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-white">{t.shahar_boshqaruvi}</h4>
                <p className="text-[10px] text-gray-400 mt-1">{t.shahar_desc}</p>
              </div>
            </div>
          </div>

          {/* Global platform statistics (NEXGO Insonlar Uchun) */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
            <div>
              <p className="font-display font-black text-2xl text-teal-400">10M+</p>
              <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{t.yuklab_olishlar}</p>
            </div>
            <div>
              <p className="font-display font-black text-2xl text-teal-400">500K+</p>
              <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{t.faol_foydalanuvchilar}</p>
            </div>
            <div>
              <p className="font-display font-black text-2xl text-teal-400">100K+</p>
              <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{t.hamkor_haydovchilar}</p>
            </div>
            <div>
              <p className="font-display font-black text-2xl text-teal-400">50+</p>
              <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{t.xizmat_turlari}</p>
            </div>
            <div>
              <p className="font-display font-black text-2xl text-teal-400">4.9/5</p>
              <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{t.foydalanuvchi_bahosi}</p>
            </div>
            <div>
              <p className="font-display font-black text-2xl text-teal-400">24/7</p>
              <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{t.qollab_quvvatlash}</p>
            </div>
          </div>

          {/* Copyright & QR code row */}
          <div className="flex flex-col md:flex-row items-center justify-between border-t border-slate-900 pt-6 gap-4 text-xs text-gray-500">
            <p className="font-medium text-gray-400">
              404-GO &copy; 2026. {t.harakatda_aqllilik}
            </p>
            <div className="flex items-center gap-2 bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-900">
              <div className="w-8 h-8 bg-white p-1 rounded-md shrink-0 flex items-center justify-center">
                {/* Visual mock QR code */}
                <div className="grid grid-cols-4 gap-0.5 w-full h-full">
                  {[...Array(16)].map((_, i) => (
                    <div key={i} className={`rounded-3xs ${i % 3 === 0 || i % 4 === 1 ? "bg-black" : "bg-white"}`} />
                  ))}
                </div>
              </div>
              <div className="text-[10px] leading-tight">
                <p className="font-bold text-white">404-GO App Store</p>
                <p className="text-gray-400">Yuklab olish uchun skanerlang</p>
              </div>
            </div>
          </div>

        </div>
      </footer>
    </div>

      {/* TOP-UP MODAL SIMULATOR */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-white">{t.toldirish} (Top Up)</h3>
              <button onClick={() => setShowTopUpModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-400">{t.top_up_amount}</label>
              <div className="flex gap-2">
                {["50000", "100000", "250000", "500000"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTopUpAmount(preset)}
                    className={`flex-1 text-[10px] py-1.5 rounded font-mono border transition ${
                      topUpAmount === preset
                        ? "bg-teal-400 text-slate-950 border-teal-400 font-bold"
                        : "bg-slate-950 text-gray-300 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {parseInt(preset).toLocaleString()}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                className="bg-slate-950 text-white font-mono text-sm p-2.5 rounded-lg w-full border border-slate-800 focus:outline-none focus:border-teal-400 mt-2"
              />
            </div>

            <button
              onClick={handleTopUp}
              className="w-full py-2.5 bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-bold rounded-xl transition"
            >
              {t.top_up_button}
            </button>
          </div>
        </div>
      )}

      {/* ORDER COMPLETED MODAL (RATING & FEEDBACK) */}
      <AnimatePresence>
        {completedOrderForRating && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-slate-900 border border-slate-850 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-850 flex items-center justify-between bg-slate-900">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-teal-400/10 flex items-center justify-center text-teal-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-base text-white">
                      {lang === "uz" ? "Sayohat yakunlandi!" : lang === "en" ? "Trip Completed!" : "Поездка завершена!"}
                    </h3>
                    <p className="text-[10px] text-gray-400">
                      {lang === "uz" ? "Buyurtmangiz muvaffaqiyatli bajarildi" : lang === "en" ? "Your order was successfully completed" : "Ваш заказ успешно выполнен"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCompletedOrderForRating(null)}
                  className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-slate-850 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-none">
                
                {/* Trip / Driver Info summary */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-teal-400">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        {completedOrderForRating.driverName || "Azizbek"}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {completedOrderForRating.title[lang]} • {completedOrderForRating.carName || "Chevrolet Onix"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-bold text-white">
                      {completedOrderForRating.price.toLocaleString()} so'm
                    </p>
                    <p className="text-[9px] text-teal-400 font-mono mt-0.5">
                      {completedOrderForRating.carNumber || "01 D 345 AB"}
                    </p>
                  </div>
                </div>

                {/* Stars Interactive Rating */}
                <div className="text-center py-2 space-y-2">
                  <p className="text-xs font-semibold text-white">
                    {lang === "uz" ? "Sayohat qanday o'tdi?" : lang === "en" ? "How was your trip?" : "Как прошла поездка?"}
                  </p>
                  
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isGold = hoveredStars !== null ? star <= hoveredStars : star <= selectedStars;
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoveredStars(star)}
                          onMouseLeave={() => setHoveredStars(null)}
                          onClick={() => setSelectedStars(star)}
                          className="p-1 focus:outline-none hover:scale-110 transition duration-150 cursor-pointer"
                        >
                          <Star
                            className={`w-9 h-9 ${
                              isGold
                                ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                                : "text-slate-800 fill-transparent"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  {/* Rating Description */}
                  <p className="text-[11px] font-medium text-amber-400 h-5">
                    {(() => {
                      const starVal = hoveredStars !== null ? hoveredStars : selectedStars;
                      if (starVal === 5) return lang === "uz" ? "A'lo darajada! 🌟" : lang === "en" ? "Excellent! 🌟" : "Отлично! 🌟";
                      if (starVal === 4) return lang === "uz" ? "Yaxshi 👍" : lang === "en" ? "Good 👍" : "Хорошо 👍";
                      if (starVal === 3) return lang === "uz" ? "Qoniqarli 😐" : lang === "en" ? "Average 😐" : "Удовлетворительно 😐";
                      if (starVal === 2) return lang === "uz" ? "Yomon 🙁" : lang === "en" ? "Poor 🙁" : "Плохо 🙁";
                      return lang === "uz" ? "Juda yomon 😠" : lang === "en" ? "Very Poor 😠" : "Ужасно 😠";
                    })()}
                  </p>
                </div>

                {/* Feedback Tags selection */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-white">
                    {lang === "uz" ? "Sizga nima ko'proq yoqdi?" : lang === "en" ? "What did you like most?" : "Что вам больше всего понравилось?"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {getFeedbackTags(completedOrderForRating.type, lang).map((tag) => {
                      const isSelected = selectedFeedbackTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedFeedbackTags(prev => prev.filter(t => t !== tag));
                            } else {
                              setSelectedFeedbackTags(prev => [...prev, tag]);
                            }
                          }}
                          className={`text-[10px] py-1.5 px-3 rounded-full border transition duration-150 cursor-pointer ${
                            isSelected
                              ? "bg-teal-400/20 text-teal-400 border-teal-400 font-bold"
                              : "bg-slate-950 text-gray-400 border-slate-850 hover:bg-slate-900 hover:border-slate-800"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Comment notes textarea */}
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-white">
                    {lang === "uz" ? "Izoh qoldiring (ixtiyoriy)" : lang === "en" ? "Leave a comment (optional)" : "Оставьте комментарий (необязательно)"}
                  </p>
                  <textarea
                    rows={2}
                    placeholder={
                      lang === "uz"
                        ? "Boshqalar bilan ulashish uchun fikringizni yozing..."
                        : lang === "en"
                        ? "Write down your experience here..."
                        : "Напишите ваши впечатления о поездке..."
                    }
                    value={userCommentText}
                    onChange={(e) => setUserCommentText(e.target.value)}
                    className="bg-slate-950 text-white rounded-xl border border-slate-850 focus:outline-none focus:border-teal-400 p-3 text-xs w-full transition placeholder:text-gray-600"
                  />
                </div>

              </div>

              {/* Footer Button */}
              <div className="p-5 border-t border-slate-850 bg-slate-950 flex gap-3">
                <button
                  type="button"
                  onClick={() => setCompletedOrderForRating(null)}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-850 text-gray-400 text-xs font-semibold rounded-xl border border-slate-800 transition cursor-pointer"
                >
                  {lang === "uz" ? "Yopish" : lang === "en" ? "Close" : "Закрыть"}
                </button>
                <button
                  type="button"
                  onClick={handleSubmitFeedback}
                  className="flex-1 py-2.5 bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-bold rounded-xl transition shadow-md shadow-teal-400/10 cursor-pointer"
                >
                  {lang === "uz" ? "Yuborish" : lang === "en" ? "Submit" : "Отправить"}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TRIP HISTORY PRINTABLE SUMMARY REPORT MODAL */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto print:absolute print:inset-0 print:bg-white print:text-black print:p-0 print:m-0 print:z-auto print:block print:shadow-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col print:bg-white print:border-none print:shadow-none print:w-full print:h-auto print:static print:transform-none"
            >
              {/* Header section (printed on top, dark on preview, white on print) */}
              <div className="p-6 bg-slate-950 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 print:bg-white print:border-b-2 print:border-slate-300 print:text-slate-950 print:p-0 print:pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-400 to-emerald-500 flex items-center justify-center print:border print:border-slate-300 shrink-0">
                    <span className="font-display font-black text-xl text-slate-950 tracking-tighter">NX</span>
                  </div>
                  <div>
                    <h2 className="font-display font-black text-xl tracking-tight text-white print:text-slate-950 leading-none">
                      404<span className="text-[#009EE3] print:text-[#009EE3] font-bold">-GO</span>
                    </h2>
                    <p className="text-[10px] text-teal-400 print:text-slate-600 font-mono tracking-widest uppercase mt-0.5">
                      {reportTranslations[lang].trip_history} Report
                    </p>
                  </div>
                </div>

                <div className="text-left md:text-right text-[10px] space-y-1 text-gray-400 print:text-slate-700 leading-tight">
                  <p className="font-bold text-white print:text-slate-950 text-xs uppercase tracking-wider">
                    {reportTranslations[lang].history_report}
                  </p>
                  <p><span className="font-semibold">{reportTranslations[lang].client_email}:</span> xayrullayevnodirbek24@gmail.com</p>
                  <p><span className="font-semibold">{reportTranslations[lang].gen_date}:</span> {new Date().toLocaleDateString(lang === 'uz' ? 'uz-UZ' : lang === 'ru' ? 'ru-RU' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="print:block hidden text-[8px] text-gray-400"><span className="font-semibold">Security Hash:</span> SHA256:{Math.random().toString(16).substring(2, 10).toUpperCase()}</p>
                </div>
              </div>

              {/* Stats Grid inside report */}
              <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 print:p-0 print:py-6 print:border-b print:border-slate-200">
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 print:bg-slate-50 print:border-slate-200 print:rounded-lg print:p-3">
                  <p className="text-[9px] text-gray-400 print:text-slate-500 uppercase font-bold tracking-wider">
                    {reportTranslations[lang].total_trips}
                  </p>
                  <p className="text-xl font-mono font-black text-white print:text-slate-950 mt-1">
                    {orders.filter((o) => o.status === "completed").length}
                  </p>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 print:bg-slate-50 print:border-slate-200 print:rounded-lg print:p-3">
                  <p className="text-[9px] text-gray-400 print:text-slate-500 uppercase font-bold tracking-wider">
                    {reportTranslations[lang].total_spend}
                  </p>
                  <p className="text-xl font-mono font-black text-teal-400 print:text-slate-950 mt-1">
                    {orders.filter((o) => o.status === "completed").reduce((sum, o) => sum + o.price, 0).toLocaleString()} <span className="text-xs">s.</span>
                  </p>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 print:bg-slate-50 print:border-slate-200 print:rounded-lg print:p-3">
                  <p className="text-[9px] text-gray-400 print:text-slate-500 uppercase font-bold tracking-wider">
                    {reportTranslations[lang].avg_price}
                  </p>
                  <p className="text-xl font-mono font-black text-white print:text-slate-950 mt-1">
                    {(orders.filter((o) => o.status === "completed").length > 0 
                      ? Math.round(orders.filter((o) => o.status === "completed").reduce((sum, o) => sum + o.price, 0) / orders.filter((o) => o.status === "completed").length)
                      : 0).toLocaleString()} <span className="text-xs">s.</span>
                  </p>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 print:bg-slate-50 print:border-slate-200 print:rounded-lg print:p-3">
                  <p className="text-[9px] text-gray-400 print:text-slate-500 uppercase font-bold tracking-wider">
                    {reportTranslations[lang].total_distance}
                  </p>
                  <p className="text-xl font-mono font-black text-white print:text-slate-950 mt-1">
                    {orders.filter((o) => o.status === "completed").reduce((sum, o) => {
                      if (!o.distance) return sum;
                      const num = parseFloat(o.distance.replace(/[^\d.]/g, ""));
                      return sum + (isNaN(num) ? 0 : num);
                    }, 0).toFixed(1)} <span className="text-xs">km</span>
                  </p>
                </div>
              </div>

              {/* Table section */}
              <div className="px-6 flex-grow overflow-x-auto max-h-[350px] print:max-h-none print:overflow-visible print:p-0 print:py-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] text-gray-400 print:text-slate-500 uppercase font-bold tracking-wider print:border-b-2 print:border-slate-300">
                      <th className="py-2 px-3">{reportTranslations[lang].date}</th>
                      <th className="py-2 px-3">{reportTranslations[lang].service}</th>
                      <th className="py-2 px-3">{reportTranslations[lang].route}</th>
                      <th className="py-2 px-3">{reportTranslations[lang].driver}</th>
                      <th className="py-2 px-3 text-right">{reportTranslations[lang].price}</th>
                      <th className="py-2 px-3 text-right">{reportTranslations[lang].rating}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.filter((o) => o.status === "completed").map((o, idx) => (
                      <tr key={o.id} className="border-b border-slate-850/60 print:border-b print:border-slate-200 last:border-none text-[11px] hover:bg-slate-900/30 transition print:hover:bg-transparent">
                        <td className="py-2.5 px-3 font-mono text-gray-400 print:text-slate-700 whitespace-nowrap">
                          {o.date}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-white print:text-slate-900 capitalize">
                          {o.type === 'taxi' ? (lang === 'uz' ? 'Taksi' : lang === 'ru' ? 'Такси' : 'Taxi') : o.type}
                        </td>
                        <td className="py-2.5 px-3 text-gray-300 print:text-slate-800 max-w-[200px]">
                          <div className="font-medium text-white print:text-slate-950 truncate">{o.title[lang]}</div>
                          <div className="text-[9px] text-gray-500 print:text-slate-500 truncate mt-0.5">{o.subtitle[lang]}</div>
                        </td>
                        <td className="py-2.5 px-3 text-gray-300 print:text-slate-800">
                          <p className="font-semibold text-white print:text-slate-950 leading-none">{o.driverName || "—"}</p>
                          {o.carName && <p className="text-[9px] text-gray-400 print:text-slate-500 mt-1">{o.carName} • {o.carNumber}</p>}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-teal-400 print:text-slate-950 text-right whitespace-nowrap">
                          {o.price.toLocaleString()} s.
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="text-amber-400 print:text-amber-600 font-bold whitespace-nowrap">
                            {o.userRating ? `${o.userRating}/5 ★` : (o.rating ? `${o.rating}/5` : "—")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Report Footer / Security ledger stamp */}
              <div className="p-6 bg-slate-950/40 border-t border-slate-800 text-center space-y-4 print:bg-transparent print:border-t-2 print:border-slate-300 print:p-0 print:pt-6 print:mt-12">
                <p className="text-[10px] text-gray-400 print:text-slate-500 max-w-2xl mx-auto italic">
                  "{reportTranslations[lang].sec_footer}"
                </p>
                
                {/* Print Control Buttons - hidden when printing */}
                <div className="flex gap-3 justify-end pt-2 print:hidden">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-gray-400 text-xs font-semibold rounded-xl border border-slate-800 transition cursor-pointer"
                  >
                    {reportTranslations[lang].close}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-black rounded-xl transition shadow-lg shadow-teal-400/15 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    {reportTranslations[lang].save_pdf}
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UI/UX SHOWCASE DESIGN PRESENTATION MODAL */}
      <AnimatePresence>
        {showShowcaseModal && (
          <UIUXShowcase
            lang={lang}
            onClose={() => setShowShowcaseModal(false)}
          />
        )}
      </AnimatePresence>

      {showAuthModal && (
        <AuthModal
          lang={lang}
          required={!authSession}
          onVerified={handleAuthVerified}
          onClose={authSession ? () => setShowAuthModal(false) : undefined}
        />
      )}

      <NotificationPanel
        lang={lang}
        notifications={notifications}
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
        onMarkRead={(id) => {
          setNotifications((prev) => {
            const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
            saveNotifications(next);
            return next;
          });
        }}
        onMarkAllRead={() => {
          setNotifications((prev) => {
            const next = prev.map((n) => ({ ...n, read: true }));
            saveNotifications(next);
            return next;
          });
        }}
        onClear={() => {
          setNotifications([]);
          saveNotifications([]);
        }}
      />

      <PaymentProviderModal
        lang={lang}
        amount={paymentAmount}
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={(provider) => {
          paymentCallbackRef.current?.(provider);
          paymentCallbackRef.current = null;
        }}
      />

    </div>
  );
}

// Simple TrainIcon
function TrainIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="16" height="16" x="4" y="3" rx="2" />
      <path d="M4 11h16" />
      <path d="M12 3v8" />
      <path d="m8 19-2 3" />
      <path d="m16 19 2 3" />
    </svg>
  );
}

// Localized feedback tags getter based on trip type
const getFeedbackTags = (type: BookingType, language: Language): string[] => {
  const tags: Record<BookingType, { uz: string[]; en: string[]; ru: string[] }> = {
    taxi: {
      uz: ["Xushmuomala haydovchi", "Toza salon", "Xavfsiz haydash", "Yaxshi musiqa", "Tez yetib keldi", "Optimal yo'nalish"],
      en: ["Polite driver", "Clean car", "Safe driving", "Great music", "Fast arrival", "Optimal route"],
      ru: ["Вежливый водитель", "Чистый салон", "Безопасное вождение", "Хорошая музыка", "Быстро приехал", "Оптимальный маршрут"]
    },
    delivery: {
      uz: ["Tezkor yetkazish", "Ehtiyotkor kuryer", "Yaxshi qadoqlangan", "Xushmuomala kuryer", "Aloqada bo'ldi"],
      en: ["Fast delivery", "Careful handling", "Well packaged", "Polite courier", "Good communication"],
      ru: ["Быстрая доставка", "Бережное обращение", "Отличная упаковка", "Вежливый курьер", "Был на связи"]
    },
    cargo: {
      uz: ["Ehtiyotkor yuklash", "O'z vaqtida yetkazish", "Yaxshi qadoqlash", "Professional haydovchi", "Zarar yetkazilmadi"],
      en: ["Careful loading", "On-time delivery", "Good packaging", "Professional driver", "No damage"],
      ru: ["Аккуратная погрузка", "Своевременная доставка", "Хорошая упаковка", "Профессиональный водитель", "Без повреждений"]
    },
    parking: {
      uz: ["Bo'sh joy topildi", "Qulay kirish", "Xavfsiz parking", "Aniq joylashuv", "Tez band qilish"],
      en: ["Spot found quickly", "Easy access", "Secure parking", "Accurate location", "Fast booking"],
      ru: ["Быстро нашли место", "Удобный въезд", "Безопасная парковка", "Точное местоположение", "Быстрое бронирование"]
    },
    ev_charge: {
      uz: ["Tez zaryadlash", "Ishlaydigan stansiya", "Qulay joylashuv", "Toza stansiya", "Aniq narx"],
      en: ["Fast charging", "Working station", "Convenient location", "Clean station", "Fair price"],
      ru: ["Быстрая зарядка", "Рабочая станция", "Удобное расположение", "Чистая станция", "Честная цена"]
    }
  };
  return tags[type][language];
};
