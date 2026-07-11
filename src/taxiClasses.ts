import type { Language } from "../types";

export type TaxiClassId = "economy" | "comfort" | "business";

export interface TaxiClass {
  id: TaxiClassId;
  name: { uz: string; en: string; ru: string };
  desc: { uz: string; en: string; ru: string };
  /** Base price multiplier vs economy */
  multiplier: number;
  etaMin: number;
  seats: number;
  icon: "car" | "car-front" | "crown";
}

export const TAXI_CLASSES: TaxiClass[] = [
  {
    id: "economy",
    name: { uz: "Ekonom", en: "Economy", ru: "Эконом" },
    desc: { uz: "Arzon va qulay", en: "Affordable & practical", ru: "Доступно и удобно" },
    multiplier: 1,
    etaMin: 4,
    seats: 4,
    icon: "car",
  },
  {
    id: "comfort",
    name: { uz: "Komfort", en: "Comfort", ru: "Комфорт" },
    desc: { uz: "Yaxshi mashina, konditsioner", en: "Better car, A/C", ru: "Лучше авто, кондиционер" },
    multiplier: 1.35,
    etaMin: 5,
    seats: 4,
    icon: "car-front",
  },
  {
    id: "business",
    name: { uz: "Biznes", en: "Business", ru: "Бизнес" },
    desc: { uz: "Premium saloni", en: "Premium cabin", ru: "Премиум салон" },
    multiplier: 1.9,
    etaMin: 7,
    seats: 3,
    icon: "crown",
  },
];

export function getTaxiClass(id: TaxiClassId): TaxiClass {
  return TAXI_CLASSES.find((c) => c.id === id) || TAXI_CLASSES[0];
}

export function taxiClassLabel(id: TaxiClassId, lang: Language): string {
  return getTaxiClass(id).name[lang] || getTaxiClass(id).name.uz;
}
