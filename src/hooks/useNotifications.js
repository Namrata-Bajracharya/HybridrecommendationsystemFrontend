import { useState, useEffect, useCallback } from "react";
import { privateAgent } from "../Requests/AuthRequests";
import { NotificationAPI } from "../routes/Routes";
import { useSocket } from "../context/SocketContext";

const LS_NOTIFS = "kalleenepal_notifications";

export function useNotifications() {
  const { connected, on } = useSocket();
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [backendNotifs, setBackendNotifs] = useState([]);

  const refreshNotifs = useCallback(() => {
    privateAgent
      .get(NotificationAPI({}).getAll)
      .then((r) => setBackendNotifs(r.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!connected) return;
    const unsub1 = on("new_order", refreshNotifs);
    const unsub2 = on("order_status", refreshNotifs);
    return () => {
      unsub1();
      unsub2();
    };
  }, [connected, on, refreshNotifs]);

  useEffect(() => {
    privateAgent
      .get(NotificationAPI({}).getAll)
      .then((r) => setBackendNotifs(r.data || []))
      .catch(() => {});
  }, []);

  const refresh = useCallback(() => {
    const notifs = JSON.parse(localStorage.getItem(LS_NOTIFS) || "[]");
    const all = [...backendNotifs, ...notifs];
    setCount(all.filter((n) => !n.read).length);
  }, [backendNotifs]);

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 5000);
    return () => clearInterval(iv);
  }, [refresh]);

  const markRead = useCallback(
    (id) => {
      const notifs = JSON.parse(localStorage.getItem(LS_NOTIFS) || "[]");
      const updated = notifs.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      localStorage.setItem(LS_NOTIFS, JSON.stringify(updated));
      refresh();
    },
    [refresh]
  );

  const allNotifs = (() => {
    const local = JSON.parse(localStorage.getItem(LS_NOTIFS) || "[]");
    const merged = [...backendNotifs, ...local];
    const seen = new Set();
    return merged
      .filter((n) => {
        const key = n.id || n.message;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .toReversed();
  })();

  return { count, open, setOpen, markRead, allNotifs };
}
