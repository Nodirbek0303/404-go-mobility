import { Language } from "./types";

type Localized = { uz: string; en: string; ru: string };

export function localizedName(item: { name: Localized }, lang: Language): string {
  return item.name[lang] || item.name.uz;
}

/** Yuk tashish — faqat yuk mashinalari */
export const CARGO_TRUCKS = [
  {
    id: "gazelle",
    name: { uz: "Gazelle (1.5t)", en: "Gazelle (1.5t)", ru: "Газель (1.5т)" },
    capacityTon: 1.5,
    priceMultiplier: 1,
    plate: "01 Y 101 AA",
  },
  {
    id: "isuzu",
    name: { uz: "Isuzu (3t)", en: "Isuzu (3t)", ru: "Isuzu (3т)" },
    capacityTon: 3,
    priceMultiplier: 1.45,
    plate: "01 Y 202 BB",
  },
  {
    id: "fuso",
    name: { uz: "Fuso (5t)", en: "Fuso (5t)", ru: "Fuso (5т)" },
    capacityTon: 5,
    priceMultiplier: 1.9,
    plate: "01 Y 303 CC",
  },
  {
    id: "kamaz",
    name: { uz: "Kamaz (10t)", en: "Kamaz (10t)", ru: "КамАЗ (10т)" },
    capacityTon: 10,
    priceMultiplier: 2.8,
    plate: "01 Y 404 DD",
  },
];

/** Yetkazib berish — faqat yengil mashinalar, pochta/zakaz */
export const DELIVERY_VEHICLES = [
  {
    id: "matiz",
    name: { uz: "Chevrolet Matiz", en: "Chevrolet Matiz", ru: "Chevrolet Matiz" },
    role: { uz: "Kichik pochta", en: "Small parcels", ru: "Мелкая посылка" },
    priceMultiplier: 1,
    plate: "01 P 111 AA",
  },
  {
    id: "damas",
    name: { uz: "Damas (Pochta)", en: "Damas (Postal)", ru: "Damas (Почта)" },
    role: { uz: "Pochta va hujjat", en: "Mail & documents", ru: "Почта и документы" },
    priceMultiplier: 1.1,
    plate: "01 P 222 BB",
  },
  {
    id: "spark",
    name: { uz: "Spark (Kuryer)", en: "Spark (Courier)", ru: "Spark (Курьер)" },
    role: { uz: "Tez kuryer", en: "Express courier", ru: "Экспресс-курьер" },
    priceMultiplier: 1.15,
    plate: "01 P 333 CC",
  },
  {
    id: "cobalt",
    name: { uz: "Cobalt (Zakaz)", en: "Cobalt (Orders)", ru: "Cobalt (Заказы)" },
    role: { uz: "O'rta hajmli zakaz", en: "Medium orders", ru: "Средние заказы" },
    priceMultiplier: 1.2,
    plate: "01 P 444 DD",
  },
];

export const PARCEL_TYPES = [
  {
    id: "documents",
    name: { uz: "Hujjatlar / Pochta", en: "Documents / Mail", ru: "Документы / Почта" },
    priceAdd: 0,
  },
  {
    id: "small",
    name: { uz: "Kichik posilka", en: "Small parcel", ru: "Маленькая посылка" },
    priceAdd: 3000,
  },
  {
    id: "medium",
    name: { uz: "O'rta posilka", en: "Medium parcel", ru: "Средняя посылка" },
    priceAdd: 8000,
  },
];

/** Smart Parking — faqat parkovkalar */
export const PARKING_LOTS = [
  {
    id: "park-tc-a",
    name: { uz: "Tashkent City P1", en: "Tashkent City P1", ru: "Tashkent City P1" },
    lat: 41.3111,
    lng: 69.2405,
    spots: 120,
    freeSpots: 34,
    pricePerHour: 8000,
  },
  {
    id: "park-magic",
    name: { uz: "Magic City Parkovka", en: "Magic City Parking", ru: "Парковка Magic City" },
    lat: 41.3031,
    lng: 69.2486,
    spots: 85,
    freeSpots: 12,
    pricePerHour: 7000,
  },
  {
    id: "park-chorsu",
    name: { uz: "Chorsu Parkovka", en: "Chorsu Parking", ru: "Парковка Чорсу" },
    lat: 41.3216,
    lng: 69.2285,
    spots: 60,
    freeSpots: 8,
    pricePerHour: 5000,
  },
  {
    id: "park-amir",
    name: { uz: "Amir Temur Parkovka", en: "Amir Temur Parking", ru: "Парковка Амира Темура" },
    lat: 41.3113,
    lng: 69.2797,
    spots: 45,
    freeSpots: 5,
    pricePerHour: 6000,
  },
];

/** EV zaryadlash — faqat zaryad stansiyalari */
export const EV_STATIONS = [
  {
    id: "ev-magic",
    name: { uz: "EV Hub Magic City", en: "EV Hub Magic City", ru: "EV Hub Magic City" },
    lat: 41.3031,
    lng: 69.2486,
    connectors: "CCS2 / Type2",
    powerKw: 50,
    freePorts: 2,
    pricePer30Min: 15000,
  },
  {
    id: "ev-tc",
    name: { uz: "Tashkent City EV", en: "Tashkent City EV", ru: "Tashkent City EV" },
    lat: 41.3111,
    lng: 69.2405,
    connectors: "CCS2",
    powerKw: 150,
    freePorts: 1,
    pricePer30Min: 18000,
  },
  {
    id: "ev-minor",
    name: { uz: "Minor EV Station", en: "Minor EV Station", ru: "Станция Minor EV" },
    lat: 41.3331,
    lng: 69.2811,
    connectors: "Type2",
    powerKw: 22,
    freePorts: 3,
    pricePer30Min: 12000,
  },
  {
    id: "ev-chorsu",
    name: { uz: "Chorsu Fast Charge", en: "Chorsu Fast Charge", ru: "Chorsu Fast Charge" },
    lat: 41.3216,
    lng: 69.2285,
    connectors: "CCS2 / CHAdeMO",
    powerKw: 75,
    freePorts: 1,
    pricePer30Min: 16000,
  },
];

export const SERVICE_ROLE_HINTS: Record<string, Localized> = {
  taxi: {
    uz: "Yengil avtomobil — yo'lovchi tashish",
    en: "Passenger car — ride-hailing only",
    ru: "Легковой автомобиль — только перевозка пассажиров",
  },
  delivery: {
    uz: "Faqat yengil mashinalar — pochta va posilkalar yetkaziladi",
    en: "Light vehicles only — mail and parcel delivery",
    ru: "Только легковые авто — доставка почты и посылок",
  },
  cargo: {
    uz: "Faqat yuk mashinalari — og'ir yuk tashish",
    en: "Cargo trucks only — freight transport",
    ru: "Только грузовики — перевозка грузов",
  },
  parking: {
    uz: "Faqat parkovkalar — bo'sh joy band qilish",
    en: "Parking lots only — reserve a spot",
    ru: "Только парковки — бронирование места",
  },
  ev_charge: {
    uz: "Faqat EV zaryad stansiyalari",
    en: "EV charging stations only",
    ru: "Только станции зарядки EV",
  },
};
