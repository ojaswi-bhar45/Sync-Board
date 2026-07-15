import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    if (!token || !user) return;

    let cancelled = false;
    let s = null;
    const base = import.meta.env.VITE_API_BASE_URL || '';
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

    const waitForBackend = async () => {
      for (let i = 0; i < 30; i++) {
        if (cancelled) return false;
        try {
          const res = await fetch(`${backendUrl}/health`);
          if (res.ok) return true;
        } catch {
          // backend not ready yet
        }
        if (!cancelled) await new Promise((r) => setTimeout(r, 1000));
      }
      return false;
    };

    const connectSocket = () => {
      s = io(base, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      s.on('connect', () => setConnected(true));
      s.on('disconnect', () => setConnected(false));
      s.on('connect_error', () => setConnected(false));

      s.on('user-online', ({ userId }) => {
        setOnlineUsers(prev => new Set(prev).add(userId));
      });

      s.on('user-offline', ({ userId }) => {
        setOnlineUsers(prev => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      });

      socketRef.current = s;
    };

    waitForBackend().then((ready) => {
      if (!cancelled && ready) connectSocket();
    });

    return () => {
      cancelled = true;
      if (s) {
        s.removeAllListeners();
        if (s.connected) s.disconnect();
      }
      socketRef.current = null;
      setConnected(false);
    };
  }, [token, user]);

  const joinProject = useCallback((projectId) => {
    socketRef.current?.emit('join-project', projectId);
  }, []);

  const leaveProject = useCallback((projectId) => {
    socketRef.current?.emit('leave-project', projectId);
  }, []);

  const onMessage = useCallback((handler) => {
    socketRef.current?.on('chat:message', handler);
    return () => socketRef.current?.off('chat:message', handler);
  }, []);

  const sendTyping = useCallback((projectId) => {
    socketRef.current?.emit('chat:typing', { projectId });
  }, []);

  const sendStopTyping = useCallback((projectId) => {
    socketRef.current?.emit('chat:stop-typing', { projectId });
  }, []);

  const onTyping = useCallback((handler) => {
    socketRef.current?.on('chat:typing', handler);
    return () => socketRef.current?.off('chat:typing', handler);
  }, []);

  const onStopTyping = useCallback((handler) => {
    socketRef.current?.on('chat:stop-typing', handler);
    return () => socketRef.current?.off('chat:stop-typing', handler);
  }, []);

  return (
    <SocketContext.Provider value={{
      socketRef,
      connected,
      onlineUsers,
      joinProject,
      leaveProject,
      onMessage,
      sendTyping,
      sendStopTyping,
      onTyping,
      onStopTyping,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
