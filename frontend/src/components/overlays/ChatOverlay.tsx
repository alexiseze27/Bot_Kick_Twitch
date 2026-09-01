import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { ChatMessage, BotConfig } from '../../types';
import { Shield, Crown, Gem, Star } from 'lucide-react';

interface DisplayMessage extends ChatMessage {
  createdAt: number;
}

export const ChatOverlay: React.FC = () => {
  const [searchParams] = useSearchParams();
  const overlayKey = searchParams.get('key');
  const { socket, chatMessages } = useSocket();

  const [overlayConfig, setOverlayConfig] = useState<BotConfig | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);

  // Ensure OBS transparent mode
  useEffect(() => {
    document.documentElement.classList.add('overlay-mode');
    document.body.classList.add('overlay-mode');

    return () => {
      document.documentElement.classList.remove('overlay-mode');
      document.body.classList.remove('overlay-mode');
    };
  }, []);

  useEffect(() => {
    if (overlayKey) {
      fetch(`/api/overlay/data?key=${overlayKey}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.config) setOverlayConfig(data.config);
        })
        .catch(console.error);

      if (socket) {
        socket.emit('auth:join', { overlayKey });
      }
    }
  }, [overlayKey, socket]);

  const chatConfig = overlayConfig?.overlay?.chat || {
    theme: 'transparent',
    fontSize: 18,
    showPlatformBadges: true,
    showUserBadges: true,
    fadeTime: 20,
    maxMessages: 30,
    hideCommands: true,
  };

  useEffect(() => {
    if (chatMessages.length === 0) return;

    const latest = chatMessages[chatMessages.length - 1];

    if (chatConfig.hideCommands && latest.message.trim().startsWith('!')) {
      return;
    }

    setMessages((prev) => {
      const exists = prev.some((m) => m.id === latest.id);
      if (exists) return prev;
      const updated = [...prev, { ...latest, createdAt: Date.now() }];
      return updated.slice(-chatConfig.maxMessages);
    });
  }, [chatMessages, chatConfig.hideCommands, chatConfig.maxMessages]);

  useEffect(() => {
    if (!chatConfig.fadeTime || chatConfig.fadeTime <= 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const expirationMs = chatConfig.fadeTime * 1000;
      setMessages((prev) => prev.filter((m) => now - m.createdAt < expirationMs));
    }, 1000);

    return () => clearInterval(interval);
  }, [chatConfig.fadeTime]);

  const getThemeClasses = () => {
    switch (chatConfig.theme) {
      case 'glass':
        return 'bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-xl shadow-lg';
      case 'bubble':
        return 'bg-slate-800/80 rounded-2xl p-3 shadow-md border-l-4 border-indigo-500';
      case 'retro':
        return 'bg-black/90 font-mono border-2 border-green-500 rounded-none shadow-[4px_4px_0px_#53FC18]';
      case 'clean-dark':
        return 'bg-black/60 rounded-xl border border-white/10 shadow-lg';
      case 'minimal':
      case 'transparent':
      default:
        return 'bg-transparent border-0 p-1 shadow-none';
    }
  };

  const isTransparent = (chatConfig.theme || 'transparent') === 'transparent' || chatConfig.theme === 'minimal';

  return (
    <div className="w-screen h-screen bg-transparent p-6 flex flex-col justify-end overflow-hidden select-none pointer-events-none">
      <div className="flex flex-col gap-2 max-w-xl w-full">
        {messages.map((msg) => {
          const isKick = msg.platform === 'kick';
          const userColor = msg.user.color || (isKick ? '#53FC18' : '#9146FF');

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 px-3 py-1.5 transition-all duration-300 animate-alert-slide ${getThemeClasses()}`}
              style={{
                fontSize: `${chatConfig.fontSize}px`,
                textShadow: isTransparent
                  ? '0 1px 3px rgba(0,0,0,0.9), 0 2px 6px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,1)'
                  : undefined,
              }}
            >
              {/* Platform Badge */}
              {chatConfig.showPlatformBadges && (
                <div
                  className={`px-2 py-0.5 rounded text-[11px] font-black tracking-wider uppercase flex items-center justify-center shrink-0 shadow-sm mt-0.5 ${
                    isKick ? 'bg-[#53FC18] text-black font-extrabold' : 'bg-[#9146FF] text-white'
                  }`}
                  style={{ fontSize: `${Math.max(10, chatConfig.fontSize - 6)}px` }}
                >
                  {isKick ? 'KICK' : 'TWITCH'}
                </div>
              )}

              {/* User Badges */}
              {chatConfig.showUserBadges && (
                <div className="flex items-center gap-1 shrink-0 mt-0.5">
                  {msg.user.isBroadcaster && (
                    <span title="Broadcaster">
                      <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                    </span>
                  )}
                  {msg.user.isMod && !msg.user.isBroadcaster && (
                    <span title="Moderator">
                      <Shield className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                    </span>
                  )}
                  {msg.user.isVip && (
                    <span title="VIP">
                      <Gem className="w-4 h-4 text-pink-400 fill-pink-400" />
                    </span>
                  )}
                  {msg.user.isSub && !msg.user.isBroadcaster && (
                    <span title="Subscriber">
                      <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                    </span>
                  )}
                </div>
              )}

              {/* Username and Message Body */}
              <div className="leading-snug break-words flex-1">
                <span
                  className="font-black mr-2 tracking-wide inline-block"
                  style={{ color: userColor }}
                >
                  {msg.user.displayName || msg.user.username}:
                </span>
                <span className="text-white font-semibold break-all">
                  {msg.message}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
