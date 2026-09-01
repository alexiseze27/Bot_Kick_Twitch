import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { BotConfig, UserStats, ChatMessage, AlertEvent, AiSpeechEvent, AiStatusEvent } from '../types';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  config: BotConfig | null;
  stats: UserStats;
  chatMessages: ChatMessage[];
  latestAlert: AlertEvent | null;
  latestAiSpeech: AiSpeechEvent | null;
  aiStatus: AiStatusEvent | null;
  triggerTestAlert: (type: AlertEvent['type'], platform?: 'twitch' | 'kick', userName?: string, amount?: number) => void;
  sendChatMessage: (platform: 'twitch' | 'kick', message: string) => void;
  updateConfig: (newConfig: Partial<BotConfig>) => Promise<void>;
  fetchUserConfig: () => Promise<void>;
}

const defaultStats: UserStats = {
  twitchMessagesCount: 0,
  kickMessagesCount: 0,
  commandsExecutedCount: 0,
  alertsTriggeredCount: 0,
  startedAt: Date.now(),
};

const SocketContext = createContext<SocketContextValue | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [stats, setStats] = useState<UserStats>(defaultStats);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [latestAlert, setLatestAlert] = useState<AlertEvent | null>(null);
  const [latestAiSpeech, setLatestAiSpeech] = useState<AiSpeechEvent | null>(null);
  const [aiStatus, setAiStatus] = useState<AiStatusEvent | null>(null);

  const fetchUserConfig = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/user/config', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const cfg = await res.json();
        setConfig(cfg);
      }
      const statsRes = await fetch('/api/user/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsRes.ok) {
        const st = await statsRes.json();
        setStats(st);
      }
    } catch (e) {
      console.error('Error fetching user config:', e);
    }
  }, [token]);

  useEffect(() => {
    if (user?.config) {
      setConfig(user.config);
    }
    if (user?.stats) {
      setStats(user.stats);
    }
  }, [user]);

  useEffect(() => {
    const socketHost = window.location.hostname === 'localhost' && window.location.port === '5173'
      ? 'http://localhost:3001'
      : window.location.origin;

    const s = io(socketHost, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    s.on('connect', () => {
      setIsConnected(true);
      if (token) {
        s.emit('auth:join', { token });
      }
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('user:sync', (data) => {
      if (data.config) setConfig(data.config);
      if (data.stats) setStats(data.stats);
    });

    s.on('chat:message', (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev, msg].slice(-100));
    });

    s.on('alert:show', (alert: AlertEvent) => {
      setLatestAlert(alert);
    });

    s.on('ai:speech', (speech: AiSpeechEvent) => {
      setLatestAiSpeech(speech);
    });

    s.on('ai:status', (status: AiStatusEvent) => {
      setAiStatus(status);
      if (status.config) {
        setConfig((prev) => (prev ? { ...prev, overlay: { ...prev.overlay, aiBot: status.config } } : prev));
      }
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [token]);

  const triggerTestAlert = useCallback(
    async (type: AlertEvent['type'], platform: 'twitch' | 'kick' = 'twitch', userName: string = 'StreamerFan', amount?: number) => {
      if (!token) return;
      try {
        await fetch('/api/user/test-alert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ type, platform, userName, amount }),
        });
      } catch (e) {}
    },
    [token]
  );

  const sendChatMessage = useCallback(
    (platform: 'twitch' | 'kick', message: string) => {
      if (socket) {
        socket.emit('chat:send', { platform, message });
      }
    },
    [socket]
  );

  const updateConfig = useCallback(
    async (newConfig: Partial<BotConfig>) => {
      if (!token) return;
      try {
        const res = await fetch('/api/user/config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newConfig),
        });
        if (res.ok) {
          const saved = await res.json();
          setConfig(saved);
        }
      } catch (e) {
        console.error('Error updating config:', e);
      }
    },
    [token]
  );

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        config,
        stats,
        chatMessages,
        latestAlert,
        latestAiSpeech,
        aiStatus,
        triggerTestAlert,
        sendChatMessage,
        updateConfig,
        fetchUserConfig,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
