import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { SubathonConfig, SubathonLog } from '../../types';
import { Timer, Sparkles } from 'lucide-react';
import { Howl } from 'howler';
import confetti from 'canvas-confetti';

export const SubathonOverlay: React.FC = () => {
  const [searchParams] = useSearchParams();
  const overlayKey = searchParams.get('key');
  const { socket } = useSocket();

  const [subathon, setSubathon] = useState<SubathonConfig | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(7200);
  const [addedBadge, setAddedBadge] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);

  // Ensure OBS transparent background
  useEffect(() => {
    document.documentElement.classList.add('overlay-mode');
    document.body.classList.add('overlay-mode');

    return () => {
      document.documentElement.classList.remove('overlay-mode');
      document.body.classList.remove('overlay-mode');
    };
  }, []);

  // Fetch initial overlay data
  useEffect(() => {
    if (overlayKey) {
      fetch(`/api/overlay/data?key=${overlayKey}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.config?.overlay?.subathon) {
            setSubathon(data.config.overlay.subathon);
            setRemainingSeconds(data.config.overlay.subathon.state?.remainingSeconds || 7200);
          }
        })
        .catch(console.error);

      if (socket) {
        socket.emit('auth:join', { overlayKey });
      }
    }
  }, [overlayKey, socket]);

  // Listen to live Subathon socket ticks & events
  useEffect(() => {
    if (!socket) return;

    const handleSync = (data: SubathonConfig) => {
      setSubathon(data);
      if (data.state?.remainingSeconds !== undefined) {
        setRemainingSeconds(data.state.remainingSeconds);
      }
    };

    const handleTick = (data: { remainingSeconds: number; active: boolean; paused: boolean }) => {
      setRemainingSeconds(data.remainingSeconds);
    };

    const handleTimeAdded = (data: { secondsAdded: number; log: SubathonLog; remainingSeconds: number }) => {
      setRemainingSeconds(data.remainingSeconds);
      setAddedBadge(`+${formatSecondsShort(data.secondsAdded)} (${data.log.user})`);
      setIsFlashing(true);

      // Play Sound
      if (subathon?.style?.soundOnTimeAdded !== false && subathon?.style?.soundUrl) {
        try {
          const sound = new Howl({
            src: [subathon.style.soundUrl],
            volume: 0.8,
            html5: true,
          });
          sound.play();
        } catch (e) {}
      }

      // Confetti effect
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#53FC18', '#9146FF', '#F59E0B', '#ffffff'],
        });
      } catch (e) {}

      setTimeout(() => {
        setIsFlashing(false);
      }, 1000);

      setTimeout(() => {
        setAddedBadge(null);
      }, 4000);
    };

    socket.on('subathon:sync', handleSync);
    socket.on('subathon:tick', handleTick);
    socket.on('subathon:timeAdded', handleTimeAdded);

    return () => {
      socket.off('subathon:sync', handleSync);
      socket.off('subathon:tick', handleTick);
      socket.off('subathon:timeAdded', handleTimeAdded);
    };
  }, [socket, subathon?.style?.soundUrl, subathon?.style?.soundOnTimeAdded]);

  const formatSecondsShort = (sec: number) => {
    if (sec >= 3600) {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      return `${h}h ${m > 0 ? `${m}m` : ''}`;
    }
    if (sec >= 60) {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}m ${s > 0 ? `${s}s` : ''}`;
    }
    return `${sec}s`;
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const style = subathon?.style || {
    title: 'STREAM EXTENSIBLE',
    theme: 'neon',
    fontSize: 48,
    clockColor: '#53FC18',
    labelColor: '#ffffff',
    glowColor: '#53FC18',
  };

  const fontSize = style.fontSize || 48;
  const clockColor = style.clockColor || '#53FC18';
  const glowColor = style.glowColor || '#53FC18';
  const title = style.title || 'STREAM EXTENSIBLE';

  return (
    <div className="w-screen h-screen bg-transparent p-6 flex items-center justify-center select-none pointer-events-none">
      <div
        className={`relative p-6 rounded-3xl backdrop-blur-md border border-white/10 transition-all duration-300 ${
          isFlashing ? 'scale-105 ring-4 ring-emerald-400/60 shadow-2xl' : ''
        }`}
        style={{
          backgroundColor: 'rgba(10, 15, 29, 0.85)',
          boxShadow: `0 0 40px ${glowColor}40`,
        }}
      >
        {/* Floating Time Added Badge */}
        {addedBadge && (
          <div className="absolute -top-4 right-4 px-3.5 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-xs animate-bounce shadow-xl flex items-center gap-1.5 z-20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{addedBadge}</span>
          </div>
        )}

        {/* Title */}
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4" style={{ color: clockColor }} />
            <span
              className="text-xs font-black tracking-widest uppercase drop-shadow"
              style={{ color: style.labelColor || '#ffffff' }}
            >
              {title}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#53FC18] animate-ping" />
            <span className="text-[10px] font-bold text-slate-400 font-mono">LIVE</span>
          </div>
        </div>

        {/* Giant Digital Clock */}
        <div
          className="font-black font-mono tracking-tight text-center select-all drop-shadow-2xl transition-all"
          style={{
            fontSize: `${fontSize}px`,
            color: clockColor,
            textShadow: `0 0 25px ${glowColor}70, 0 0 50px ${glowColor}30`,
          }}
        >
          {formatTime(remainingSeconds)}
        </div>
      </div>
    </div>
  );
};
