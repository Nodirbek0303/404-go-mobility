import { ServiceCategory, Booking, TransitRoute } from "./types";
import { computeRouteMetrics, nearestDriverDepot } from "./utils/geoCalc";

function enrichBooking(order: Booking): Booking {
  if (!order.fromCoords) return order;
  const metrics = computeRouteMetrics(order.fromCoords, order.toCoords ?? null, order.type, {});
  const enriched: Booking = {
    ...order,
    tripDistanceKm: metrics.distanceKm,
    tripDurationMin: metrics.durationMin,
    distance: order.toCoords ? `${metrics.distanceKm.toFixed(2)} km` : order.distance,
    duration: order.toCoords ? `${metrics.durationMin} min` : order.duration,
  };
  if (order.type === "taxi" && order.ridePhase && order.ridePhase !== "searching" && order.fromCoords) {
    const { depot, distanceKm } = nearestDriverDepot(order.fromCoords);
    enriched.driverStartCoords = depot;
    enriched.dispatchTotalKm = distanceKm;
    if (order.ridePhase === "arriving") {
      enriched.driverCoords = depot;
      enriched.driverDistanceKm = Math.round(distanceKm * 0.55 * 100) / 100;
    }
  }
  return enriched;
}

export const serviceCategories: ServiceCategory[] = [
  {
    id: "taxi",
    name: {
      uz: "Taksi",
      en: "Taxi",
      ru: "Такси",
    },
    icon: "Car",
    color: "from-amber-400 to-amber-600",
  },
  {
    id: "delivery",
    name: {
      uz: "Yetkazib berish",
      en: "Delivery",
      ru: "Доставка",
    },
    icon: "Package",
    color: "from-orange-400 to-orange-600",
  },
  {
    id: "cargo",
    name: {
      uz: "Yuk tashish",
      en: "Cargo Delivery",
      ru: "Грузоперевозки",
    },
    icon: "Truck",
    color: "from-blue-400 to-blue-600",
  },
  {
    id: "parking",
    name: {
      uz: "Smart Parking",
      en: "Smart Parking",
      ru: "Парковка",
    },
    icon: "SquarePlay",
    color: "from-cyan-400 to-cyan-600",
    badge: "P",
  },
  {
    id: "ev_charge",
    name: {
      uz: "EV zaryadlash",
      en: "EV Charging",
      ru: "Зарядка EV",
    },
    icon: "Zap",
    color: "from-violet-400 to-violet-600",
  },
];

const rawInitialOrders: Booking[] = [
  {
    id: "order-1",
    type: "taxi",
    title: {
      uz: "Taksi",
      en: "Taxi ride",
      ru: "Такси поездка",
    },
    subtitle: {
      uz: "Chorsu → Magic City",
      en: "Chorsu → Magic City",
      ru: "Чорсу → Magic City",
    },
    price: 28000,
    date: "Bugun, 14:30",
    status: "active",
    statusText: {
      uz: "Bajarilmoqda",
      en: "In progress",
      ru: "Выполняется",
    },
    from: "Chorsu, Toshkent",
    to: "Magic City, Toshkent",
    driverName: "Rustam Aliyev",
    driverFirstName: "Rustam",
    driverLastName: "Aliyev",
    driverPhone: "+998901234567",
    carName: "Chevrolet Onix",
    carNumber: "01 D 345 AB",
    rating: 4.9,
    duration: "18 daqiqa",
    distance: "12.4 km",
    ridePhase: "arriving",
    etaMinutes: 5,
    driverChat: [
      {
        id: "drv-init-1",
        sender: "driver",
        content: "Salom! Men Rustam Aliyev. Buyurtmangizni qabul qildim, yo'lga chiqyapman.",
        timestamp: "14:28",
      },
    ],
    fromCoords: { latitude: 41.3216, longitude: 69.2285 },
    toCoords: { latitude: 41.3031, longitude: 69.2486 },
  },
  {
    id: "order-2",
    type: "delivery",
    title: {
      uz: "Yetkazib berish",
      en: "Courier Delivery",
      ru: "Курьерская доставка",
    },
    subtitle: {
      uz: "Hujjatlar",
      en: "Documents",
      ru: "Документы",
    },
    price: 35000,
    date: "Kecha, 12:10",
    status: "completed",
    statusText: {
      uz: "Yetkazildi",
      en: "Delivered",
      ru: "Доставлено",
    },
    driverName: "Dina Karimova",
    carName: "Damas (Pochta)",
    carNumber: "01 P 222 BB",
    from: "Yunusobod block 4",
    to: "Tashkent City Block 5",
    duration: "25 min",
    fromCoords: { latitude: 41.3621, longitude: 69.2821 },
    toCoords: { latitude: 41.3111, longitude: 69.2405 },
  },
  {
    id: "order-3",
    type: "delivery",
    title: {
      uz: "Yetkazib berish",
      en: "Documents Courier",
      ru: "Доставка курьером",
    },
    subtitle: {
      uz: "Pochta / posilka",
      en: "Mail parcel",
      ru: "Почтовая посылка",
    },
    price: 38000,
    date: "11 May, 18:45",
    status: "completed",
    statusText: {
      uz: "Yetkazildi",
      en: "Delivered",
      ru: "Доставлено",
    },
    driverName: "Javohir Rahimov",
    carName: "Chevrolet Matiz",
    carNumber: "01 P 111 AA",
    from: "Amir Temur xiyoboni",
    to: "Chorsu bozori",
    fromCoords: { latitude: 41.3113, longitude: 69.2797 },
    toCoords: { latitude: 41.3216, longitude: 69.2285 },
  },
  {
    id: "order-4",
    type: "cargo",
    title: {
      uz: "Yuk tashish",
      en: "Cargo Delivery",
      ru: "Грузовые перевозки",
    },
    subtitle: {
      uz: "1.5 tonna yuk",
      en: "1.5 tons cargo",
      ru: "Груз 1.5 тонны",
    },
    price: 210000,
    date: "10 May, 09:20",
    status: "completed",
    statusText: {
      uz: "Bajarildi",
      en: "Completed",
      ru: "Выполнено",
    },
    driverName: "Bahodir Tursunov",
    carName: "Gazelle (1.5t)",
    carNumber: "01 Y 101 AA",
    from: "Qo'yliq bozori",
    to: "Sebzor, 15",
    fromCoords: { latitude: 41.2225, longitude: 69.2225 },
    toCoords: { latitude: 41.3323, longitude: 69.2523 },
  },
  {
    id: "order-5",
    type: "parking",
    title: {
      uz: "Smart Parking",
      en: "Smart Parking",
      ru: "Парковка",
    },
    subtitle: {
      uz: "Tashkent City P1",
      en: "Tashkent City P1",
      ru: "Tashkent City P1",
    },
    price: 8000,
    date: "9 May, 16:00",
    status: "completed",
    statusText: {
      uz: "Band qilindi",
      en: "Reserved",
      ru: "Забронировано",
    },
    from: "Tashkent City P1",
    driverName: "Smart Parking",
    carName: "Tashkent City P1",
    carNumber: "34/120 joy",
    fromCoords: { latitude: 41.3111, longitude: 69.2405 },
  },
  {
    id: "order-6",
    type: "ev_charge",
    title: {
      uz: "EV zaryadlash",
      en: "EV Charging",
      ru: "Зарядка EV",
    },
    subtitle: {
      uz: "EV Hub Magic City",
      en: "EV Hub Magic City",
      ru: "EV Hub Magic City",
    },
    price: 15000,
    date: "8 May, 11:30",
    status: "completed",
    statusText: {
      uz: "Zaryadlandi",
      en: "Charged",
      ru: "Заряжено",
    },
    from: "EV Hub Magic City",
    driverName: "EV Station",
    carName: "EV Hub Magic City",
    carNumber: "CCS2 · 50kW",
    fromCoords: { latitude: 41.3031, longitude: 69.2486 },
  },
];

export const initialOrders: Booking[] = rawInitialOrders.map(enrichBooking);

export const transitRoutes: TransitRoute[] = [
  {
    id: "transit-1",
    from: "Amir Temur xiyoboni",
    to: "Mustaqillik maydoni",
    lines: ["11", "18", "54"],
    type: "bus",
    timeMin: 2,
  },
  {
    id: "transit-2",
    from: "Amir Temur xiyoboni",
    to: "Mustaqillik maydoni",
    lines: ["7", "12", "45"],
    type: "metro",
    timeMin: 5,
  },
];
