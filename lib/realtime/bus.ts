/** Real-time event bus — WebSocket/SSE uchun */

export type RealtimeEvent =
  | { type: "order_updated"; orderId: string; payload: unknown }
  | { type: "driver_location"; driverId: string; payload: unknown };

type Listener = (event: RealtimeEvent) => void;

declare global {
  // eslint-disable-next-line no-var
  var __404GO_RT__: { listeners: Set<Listener> } | undefined;
}

function bus() {
  if (!global.__404GO_RT__) global.__404GO_RT__ = { listeners: new Set() };
  return global.__404GO_RT__;
}

export function publishEvent(event: RealtimeEvent) {
  for (const fn of bus().listeners) fn(event);
}

export function subscribeEvents(fn: Listener): () => void {
  bus().listeners.add(fn);
  return () => bus().listeners.delete(fn);
}
