import type { VercelRequest, VercelResponse } from "@vercel/node";

function getSimulatedResponse(prompt: string, lang: string): string {
  const text = prompt.toLowerCase();

  if (lang === "uz") {
    if (text.includes("taksi") || text.includes("mashina") && !text.includes("yuk") && !text.includes("yengil")) {
      return "Taksi chaqiraman — yengil avtomobil yo'lovchi tashish uchun. Chorsu → Magic City, ~28 000 so'm.\n\n[BOOKING_ACTION: type=taxi, from=Chorsu, to=Magic City, price=28000]";
    }
    if (text.includes("hujjat") || text.includes("kuryer") || text.includes("pochta") || text.includes("yetkaz") || text.includes("posilka")) {
      return "Yetkazib berish — faqat yengil mashina (Damas/Matiz). Pochta va hujjatlar uchun kuryer yuboraman. Narx: 35 000 so'm.\n\n[BOOKING_ACTION: type=delivery, item=Hujjatlar/Pochta, price=35000]";
    }
    if (text.includes("yuk") || text.includes("gruz") || text.includes("tonna") || text.includes("gazelle") || text.includes("kamaz")) {
      return "Yuk tashish — faqat yuk mashinasi (Gazelle/Isuzu/Kamaz). 1.5 tonna yuk uchun ~210 000 so'm.\n\n[BOOKING_ACTION: type=cargo, from=Qo'yliq, to=Sebzor, price=210000]";
    }
    if (text.includes("parking") || text.includes("parkovka") || text.includes("to'xtash")) {
      return "Smart Parking — faqat parkovkalar. Tashkent City P1 da 34 ta bo'sh joy. 8 000 so'm/soat.\n\n[BOOKING_ACTION: type=parking, from=Tashkent City P1, price=8000]";
    }
    if (text.includes("zaryad") || text.includes("ev") || text.includes("elektr") || text.includes("zapravka")) {
      return "EV zaryadlash — faqat zaryad stansiyalari. Magic City EV Hub, 50kW, 15 000 so'm/30 daqiqa.\n\n[BOOKING_ACTION: type=ev_charge, from=EV Hub Magic City, price=15000]";
    }
    return "Salom! Men 404-GO AI yordamchisiman: taksi, pochta yetkazish (yengil mashina), yuk tashish (yuk mashinasi), parkovka va EV zaryad. Qaysi xizmat kerak?";
  }

  if (lang === "ru") {
    if (text.includes("такси")) {
      return "Вызову такси — легковой автомобиль. Чорсу → Magic City, ~28 000 сум.\n\n[BOOKING_ACTION: type=taxi, from=Chorsu, to=Magic City, price=28000]";
    }
    if (text.includes("доставк") || text.includes("курьер") || text.includes("почт") || text.includes("посыл")) {
      return "Доставка — только легковые авто (Damas/Matiz). Почта и документы, 35 000 сум.\n\n[BOOKING_ACTION: type=delivery, item=Hujjatlar/Pochta, price=35000]";
    }
    if (text.includes("груз") || text.includes("тонн")) {
      return "Грузоперевозки — только грузовики. ~210 000 сум.\n\n[BOOKING_ACTION: type=cargo, from=Qo'yliq, to=Sebzor, price=210000]";
    }
    if (text.includes("парк") || text.includes("стоянк")) {
      return "Парковка — только парковочные зоны. Tashkent City P1, 8000 сум/час.\n\n[BOOKING_ACTION: type=parking, from=Tashkent City P1, price=8000]";
    }
    if (text.includes("заряд") || text.includes("ev") || text.includes("электр")) {
      return "Зарядка EV — только зарядные станции. Magic City EV Hub, 15 000 сум.\n\n[BOOKING_ACTION: type=ev_charge, from=EV Hub Magic City, price=15000]";
    }
    return "Привет! Я помощник 404-GO: такси, доставка почты, грузовики, парковки и EV зарядка.";
  }

  if (text.includes("taxi") || text.includes("ride")) {
    return "Taxi — passenger car only. Chorsu → Magic City, ~28,000 UZS.\n\n[BOOKING_ACTION: type=taxi, from=Chorsu, to=Magic City, price=28000]";
  }
  if (text.includes("delivery") || text.includes("courier") || text.includes("mail") || text.includes("parcel")) {
    return "Delivery — light vehicles only (Damas/Matiz) for mail and parcels. 35,000 UZS.\n\n[BOOKING_ACTION: type=delivery, item=Hujjatlar/Pochta, price=35000]";
  }
  if (text.includes("cargo") || text.includes("freight") || text.includes("truck")) {
    return "Cargo — freight trucks only. ~210,000 UZS.\n\n[BOOKING_ACTION: type=cargo, from=Qo'yliq, to=Sebzor, price=210000]";
  }
  if (text.includes("parking")) {
    return "Parking lots only. Tashkent City P1, 8,000 UZS/hour.\n\n[BOOKING_ACTION: type=parking, from=Tashkent City P1, price=8000]";
  }
  if (text.includes("ev") || text.includes("charg")) {
    return "EV charging stations only. Magic City EV Hub, 15,000 UZS.\n\n[BOOKING_ACTION: type=ev_charge, from=EV Hub Magic City, price=15000]";
  }
  return "Hello! I am 404-GO AI: taxi, mail delivery (light cars), cargo trucks, parking lots, and EV charging.";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const { messages, userLanguage = "uz" } = body || {};

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages format" });
  }

  const lastMessage = messages[messages.length - 1]?.content || "";
  return res.status(200).json({ text: getSimulatedResponse(lastMessage, userLanguage) });
}
