"use client";

import { useEffect, useState, useRef, useCallback } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3005";

export interface NotificationEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export function useNotifications(options?: { maxEvents?: number; filter?: string[] }) {
  const { maxEvents = 50, filter } = options || {};
  const [events, setEvents] = useState<NotificationEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const [lastEvent, setLastEvent] = useState<NotificationEvent | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => {
      setIsConnected(false);
      timerRef.current = setTimeout(connect, 3000);
    };
    ws.onerror = () => ws.close();
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const notificationEvent: NotificationEvent = {
          type: msg.type || "",
          data: msg.data || msg,
          timestamp: new Date().toISOString(),
        };
        if (!filter || filter.includes(notificationEvent.type)) {
          setEvents((prev) => [notificationEvent, ...prev].slice(0, maxEvents));
          setLastEvent(notificationEvent);
        }
      } catch {
        // ignore
      }
    };
  }, [filter?.join(","), maxEvents]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      clearTimeout(timerRef.current);
    };
  }, [connect]);

  const clearEvents = useCallback(() => setEvents([]), []);

  return { events, lastEvent, isConnected, clearEvents };
}
