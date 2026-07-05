import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SOCKET_URL = "http://localhost:8000";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const listenersRef = useRef(new Map());

  useEffect(() => {
    const token = localStorage.getItem("kalleenepal_token");
    if (!token && !user) return;

    const socket = io(SOCKET_URL, {
      auth: { token: token || "" },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));

    socket.on("message", (data) => {
      const type = data?.type;
      if (type && listenersRef.current.has(type)) {
        listenersRef.current.get(type).forEach((fn) => fn(data));
      }
    });

    socketRef.current = socket;

    return () => {
      socket.close();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user?.id]);

  const on = useCallback((event, handler) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event).add(handler);
    return () => {
      const handlers = listenersRef.current.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) listenersRef.current.delete(event);
      }
    };
  }, []);

  const off = useCallback((event, handler) => {
    const handlers = listenersRef.current.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) listenersRef.current.delete(event);
    }
  }, []);

  return (
    <SocketContext.Provider value={{ connected, socket: socketRef.current, on, off }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
}
