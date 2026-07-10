export function getSimulatedResponse(prompt: string, lang: string): string {
  const text = prompt.toLowerCase();

  if (lang === "uz") {
    if (text.includes("taksi") || text.includes("mashina") || text.includes("borish") || text.includes("qayerga")) {
      return "Albatta! Siz uchun eng tezkor taksi xizmatini taklif qilaman. Chorsu maydonidan Magic City bog'igacha yo'nalish tayyor. Yo'l haqi: 28 000 so'm. Tasdiqlaysizmi?\n\n[BOOKING_ACTION: type=taxi, from=Chorsu, to=Magic City, price=28000]";
    }
    if (text.includes("hujjat") || text.includes("kuryer") || text.includes("dostavka") || text.includes("yetkaz")) {
      return "Kuryerlik xizmatini rasmiylashtirishga yordam beraman. 'Hujjatlar' paketi yetkazib berish narxi 35 000 so'm. Tayyormisiz?\n\n[BOOKING_ACTION: type=delivery, item=Hujjatlar, price=35000]";
    }
    if (text.includes("yuk") || text.includes("gruz") || text.includes("tonna")) {
      return "Yuk tashish xizmatini rasmiylashtirishga yordam beraman. 1.5 tonna yuk uchun narxi taxminan 210 000 so'm. Tasdiqlaysizmi?\n\n[BOOKING_ACTION: type=cargo, from=Qo'yliq, to=Sebzor, price=210000]";
    }
    if (text.includes("parking") || text.includes("parkovka") || text.includes("to'xtash")) {
      return "Eng yaqin Smart Parking joyini topdim! Tashkent City hududida bo'sh joy mavjud. Narxi: 8 000 so'm/soat. Band qilamizmi?\n\n[BOOKING_ACTION: type=parking, from=Tashkent City, price=8000]";
    }
    if (text.includes("zaryad") || text.includes("ev") || text.includes("elektr")) {
      return "Eng yaqin EV zaryadlash stansiyasi Magic City yaqinida. 30 daqiqalik zaryadlash narxi 15 000 so'm. Band qilamizmi?\n\n[BOOKING_ACTION: type=ev_charge, from=Magic City, price=15000]";
    }
    return "Salom! Men 404-GO AI aqlli mobil yordamchisiman. Sizga taksi chaqirish, yetkazib berish, yuk tashish, smart parking va EV zaryadlashda yordam beraman. Bugun qanday xizmat kerak?";
  }

  if (lang === "ru") {
    if (text.includes("такси") || text.includes("машин") || text.includes("ехать") || text.includes("куда")) {
      return "Конечно! Я подберу для вас самое быстрое такси. Маршрут от Чорсу до Magic City готов. Стоимость поездки: 28 000 сум. Подтверждаете?\n\n[BOOKING_ACTION: type=taxi, from=Chorsu, to=Magic City, price=28000]";
    }
    if (text.includes("доставк") || text.includes("курьер") || text.includes("документ")) {
      return "Я помогу оформить курьерскую доставку. Стоимость доставки документов: 35 000 сум. Оформляем?\n\n[BOOKING_ACTION: type=delivery, item=Hujjatlar, price=35000]";
    }
    return "Привет! Я умный помощник 404-GO. Я могу помочь вам вызвать такси, заказать доставку, перевезти груз, найти парковку или зарядить электромобиль. Какая услуга нужна?";
  }

  if (text.includes("taxi") || text.includes("ride") || text.includes("car") || text.includes("go to")) {
    return "Sure! I will match you with the fastest taxi. Route from Chorsu to Magic City is ready. Fare: 28,000 UZS. Would you like to confirm?\n\n[BOOKING_ACTION: type=taxi, from=Chorsu, to=Magic City, price=28000]";
  }
  if (text.includes("delivery") || text.includes("courier") || text.includes("document")) {
    return "I can help you arrange a courier delivery. Document delivery costs 35,000 UZS. Shall we proceed?\n\n[BOOKING_ACTION: type=delivery, item=Hujjatlar, price=35000]";
  }
  return "Hello! I am 404-GO AI Smart Assistant. I can help you call a taxi, arrange delivery, transport cargo, find smart parking, or locate EV charging. What service do you need today?";
}
