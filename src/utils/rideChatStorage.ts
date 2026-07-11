import type { DriverChatMessage } from "../types";

const PREFIX = "404_taxi_chat_";

export function rideChatKey(orderId: string): string {
  return `${PREFIX}${orderId}`;
}

export function loadRideChat(orderId: string): DriverChatMessage[] {
  if (!orderId) return [];
  try {
    const raw = localStorage.getItem(rideChatKey(orderId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DriverChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRideChat(orderId: string, messages: DriverChatMessage[]): void {
  if (!orderId) return;
  localStorage.setItem(rideChatKey(orderId), JSON.stringify(messages));
  window.dispatchEvent(new CustomEvent("ride-chat-updated", { detail: { orderId } }));
}

export function appendRideChat(orderId: string, message: DriverChatMessage): DriverChatMessage[] {
  const next = [...loadRideChat(orderId), message];
  saveRideChat(orderId, next);
  return next;
}

export function mergeRideChat(orderId: string, local: DriverChatMessage[]): DriverChatMessage[] {
  const stored = loadRideChat(orderId);
  if (stored.length === 0 && local.length > 0) {
    saveRideChat(orderId, local);
    return local;
  }
  if (local.length > stored.length) {
    saveRideChat(orderId, local);
    return local;
  }
  return stored;
}

export function subscribeRideChat(
  orderId: string,
  onMessages: (messages: DriverChatMessage[]) => void
): () => void {
  if (!orderId) return () => {};

  const emit = () => onMessages(loadRideChat(orderId));

  const onCustom = (e: Event) => {
    const detail = (e as CustomEvent<{ orderId?: string }>).detail;
    if (!detail?.orderId || detail.orderId === orderId) emit();
  };

  const onStorage = (e: StorageEvent) => {
    if (e.key === rideChatKey(orderId)) emit();
  };

  window.addEventListener("ride-chat-updated", onCustom);
  window.addEventListener("storage", onStorage);
  const poll = window.setInterval(emit, 2500);

  emit();
  return () => {
    window.removeEventListener("ride-chat-updated", onCustom);
    window.removeEventListener("storage", onStorage);
    clearInterval(poll);
  };
}

export function nowChatTime(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
