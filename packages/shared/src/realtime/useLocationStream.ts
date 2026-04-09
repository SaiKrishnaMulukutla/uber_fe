import { useEffect, useRef, useCallback } from 'react';

declare global { interface ImportMeta { env: Record<string, string | undefined> } }
const WS_BASE = import.meta.env['VITE_WS_BASE_URL'] ?? 'ws://localhost:8000';

interface LocationMessage {
  trip_id: string;
  lat: number;
  lng: number;
  ts: number;
}

interface UseLocationStreamOptions {
  tripId: string | null;
  token: string | null;
  onLocation: (msg: LocationMessage) => void;
  enabled?: boolean;
}

const MAX_RETRIES = 5;
const BASE_DELAY = 1000;

export function useLocationStream({
  tripId,
  token,
  onLocation,
  enabled = true,
}: UseLocationStreamOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onLocationRef = useRef(onLocation);
  onLocationRef.current = onLocation;

  const connect = useCallback(() => {
    if (!tripId || !token) return;

    const url = `${WS_BASE}/ws/trips/${tripId}?token=${token}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data as string) as LocationMessage;
        onLocationRef.current(msg);
        retriesRef.current = 0;
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      if (retriesRef.current < MAX_RETRIES) {
        const delay = Math.min(BASE_DELAY * 2 ** retriesRef.current, 30000);
        retriesRef.current++;
        timerRef.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [tripId, token]);

  useEffect(() => {
    if (!enabled || !tripId || !token) return;

    retriesRef.current = 0;
    connect();

    return () => {
      timerRef.current && clearTimeout(timerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [enabled, tripId, token, connect]);
}
