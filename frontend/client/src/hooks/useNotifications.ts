import { useEffect, useRef, useState } from "react";
import api from "@/api/axios"; // your axios instance
import { Notification } from "@/api/notifications"; // type if you have one

type OnNotify = (payload: any) => void;

export default function useNotifications(onNotify?: OnNotify) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // fetch initial notifications
    let mounted = true;
    api.get("/notifications/").then((res) => {
      if (!mounted) return;
      setNotifications(res.data || []);
    }).catch(console.error);

    // connect websocket
    const token = localStorage.getItem("token");
    // use wss in prod and ws in dev
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const host = window.location.host; // includes port
    // include token as query param if your consumer supports token auth fallback
    const url = `${protocol}://${host}/ws/notifications/${token ? `?token=${token}` : ""}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => console.log("Notifications WS connected");
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        // push into state
        setNotifications((prev) => [payload, ...prev]);
        if (onNotify) onNotify(payload);
      } catch (err) {
        console.error("Failed to parse WS message", err);
      }
    };
    ws.onclose = () => console.log("Notifications WS closed");
    ws.onerror = (e) => console.error("WS error", e);

    return () => {
      mounted = false;
      ws.close();
      wsRef.current = null;
    };
  }, [onNotify]);

  const markAsRead = async (id: number) => {
    try {
      await api.post(`/notifications/${id}/read/`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (e) {
      console.error(e);
    }
  };

  return { notifications, markAsRead };
}
