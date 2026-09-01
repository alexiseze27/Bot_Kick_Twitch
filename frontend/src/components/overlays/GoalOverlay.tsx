import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { Heart, Award, DollarSign } from 'lucide-react';
import { BotConfig, OverlayGoalsConfig } from '../../types';

export const GoalOverlay: React.FC = () => {
  const [searchParams] = useSearchParams();
  const overlayKey = searchParams.get('key');
  const { socket } = useSocket();
  const [overlayConfig, setOverlayConfig] = useState<BotConfig | null>(null);
  const [liveGoal, setLiveGoal] = useState<OverlayGoalsConfig | null>(null);

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
          if (data.config) {
            setOverlayConfig(data.config);
            if (data.config.overlay?.goals) {
              setLiveGoal(data.config.overlay.goals);
            }
          }
        })
        .catch(console.error);

      if (socket) {
        socket.emit('auth:join', { overlayKey });
      }
    }
  }, [overlayKey, socket]);

  // Listen to live goal updates
  useEffect(() => {
    if (socket) {
      const handleGoalSync = (goals: OverlayGoalsConfig) => {
        setLiveGoal(goals);
      };

      socket.on('goal:sync', handleGoalSync);
      socket.on('overlay:init', (data) => {
        if (data.config?.overlay?.goals) {
          setLiveGoal(data.config.overlay.goals);
        }
      });

      return () => {
        socket.off('goal:sync', handleGoalSync);
      };
    }
  }, [socket]);

  const goal: OverlayGoalsConfig = liveGoal || overlayConfig?.overlay?.goals || {
    title: 'Meta de Seguidores',
    current: 0,
    target: 100,
    type: 'followers',
    platform: 'all',
    autoSyncLive: true,
    barColor: '#53FC18',
    bgColor: 'rgba(15, 23, 42, 0.8)',
    textColor: '#ffffff',
    showPercentage: true,
    borderRadius: 9999,
    height: 24,
  };

  const percentage = Math.min(100, Math.round((goal.current / Math.max(1, goal.target)) * 100));

  const getPlatformTag = () => {
    if (goal.platform === 'kick') return { label: 'KICK', color: 'bg-[#53FC18] text-black' };
    if (goal.platform === 'twitch') return { label: 'TWITCH', color: 'bg-[#9146FF] text-white' };
    return null;
  };

  const platformTag = getPlatformTag();

  return (
    <div className="w-screen h-screen bg-transparent p-6 flex items-center justify-center select-none pointer-events-none">
      <div
        className="w-full max-w-xl p-5 rounded-2xl shadow-2xl backdrop-blur-md transition-all border border-white/10"
        style={{
          backgroundColor: goal.bgColor || 'rgba(10, 15, 29, 0.85)',
          boxShadow: `0 0 30px ${goal.barColor || '#53FC18'}30`,
        }}
      >
        {/* Title Bar */}
        <div className="flex items-center justify-between mb-3" style={{ color: goal.textColor || '#ffffff' }}>
          <div className="flex items-center gap-2">
            {goal.type === 'followers' ? (
              <Heart className="w-5 h-5 text-pink-500 fill-pink-500 animate-pulse" />
            ) : goal.type === 'subs' ? (
              <Award className="w-5 h-5 text-purple-400" />
            ) : (
              <DollarSign className="w-5 h-5 text-emerald-400" />
            )}
            <span className="font-extrabold text-base tracking-wide uppercase">{goal.title}</span>

            {platformTag && (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${platformTag.color}`}>
                {platformTag.label}
              </span>
            )}
          </div>

          <div className="font-black text-base flex items-center gap-1.5">
            <span>{goal.current}</span>
            <span className="opacity-50">/</span>
            <span className="opacity-70">{goal.target}</span>
            {goal.showPercentage !== false && (
              <span className="text-xs ml-1.5 px-2 py-0.5 rounded-full bg-white/10 font-mono font-bold">
                {percentage}%
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar Container */}
        <div
          className="w-full bg-slate-800/80 overflow-hidden p-0.5 border border-white/10 relative shadow-inner"
          style={{
            height: `${goal.height || 24}px`,
            borderRadius: `${goal.borderRadius !== undefined ? goal.borderRadius : 9999}px`,
          }}
        >
          <div
            className="h-full transition-all duration-700 ease-out shadow-lg relative overflow-hidden"
            style={{
              width: `${percentage}%`,
              backgroundColor: goal.barColor || '#53FC18',
              borderRadius: `${goal.borderRadius !== undefined ? goal.borderRadius : 9999}px`,
              boxShadow: `0 0 15px ${goal.barColor || '#53FC18'}80`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};
