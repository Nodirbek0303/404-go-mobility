/** Deep links / web URLs for Google Maps, Yandex Navigator, 2GIS */

export function googleMapsSearch(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function googleMapsDirections(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
) {
  return `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLng}&destination=${toLat},${toLng}&travelmode=driving`;
}

export function yandexMapsPoint(lat: number, lng: number) {
  return `https://yandex.com/maps/?pt=${lng},${lat}&z=16&l=map`;
}

export function yandexNavigatorRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
) {
  return `https://yandex.com/navi/?rtext=${fromLat},${fromLng}~${toLat},${toLng}&rtt=auto`;
}

export function twoGisPoint(lat: number, lng: number) {
  return `https://2gis.uz/tashkent/geo/${lng}%2C${lat}?m=${lng}%2C${lat}%2F16`;
}

export function openExternalMap(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}
