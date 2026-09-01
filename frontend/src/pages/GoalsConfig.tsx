import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import {
  Target,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Heart,
  RefreshCw,
  Sliders
} from 'lucide-react';

export const GoalsConfig: React.FC = () => {
  const { config, updateConfig } = useSocket();
  const { user, token } = useAuth();
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [syncingFollowers, setSyncingFollowers] = useState(false);
  const [liveCounts, setLiveCounts] = useState<{ kick: number; twitch: number; total: number } | null>(null);

  // Form states
  const [title, setTitle] = useState('Meta de Seguidores');
  const [current, setCurrent] = useState(0);
  const [target, setTarget] = useState(100);
  const [type, setType] = useState<'followers' | 'subs' | 'donations'>('followers');
  const [platform, setPlatform] = useState<'all' | 'twitch' | 'kick'>('all');
  const [autoSyncLive, setAutoSyncLive] = useState(true);
  const [barColor, setBarColor] = useState('#53FC18');
  const [bgColor, setBgColor] = useState('rgba(15, 23, 42, 0.8)');
  const [textColor, setTextColor] = useState('#ffffff');
  const [showPercentage, setShowPercentage] = useState(true);
  const [borderRadius, setBorderRadius] = useState(9999);
  const [height, setHeight] = useState(24);

  useEffect(() => {
    if (config?.overlay?.goals) {
      const g = config.overlay.goals;
      setTitle(g.title || 'Meta de Seguidores');
      setCurrent(g.current !== undefined ? g.current : 0);
      setTarget(g.target || 100);
      setType(g.type || 'followers');
      setPlatform(g.platform || 'all');
      setAutoSyncLive(g.autoSyncLive !== undefined ? g.autoSyncLive : true);
      setBarColor(g.barColor || '#53FC18');
      setBgColor(g.bgColor || 'rgba(15, 23, 42, 0.8)');
      setTextColor(g.textColor || '#ffffff');
      setShowPercentage(g.showPercentage !== undefined ? g.showPercentage : true);
      setBorderRadius(g.borderRadius !== undefined ? g.borderRadius : 9999);
      setHeight(g.height || 24);
    }
  }, [config]);

  useEffect(() => {
    fetchLiveFollowerCounts();
  }, [token]);

  const fetchLiveFollowerCounts = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/user/followers-count', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLiveCounts(data);
      }
    } catch (e) {}
  };

  const handleSyncFollowers = async () => {
    if (!token) return;
    setSyncingFollowers(true);
    try {
      const res = await fetch('/api/user/sync-goal-followers', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCurrent(data.current);
        await fetchLiveFollowerCounts();
      }
    } catch (e) {
      console.error('Error syncing followers:', e);
    } finally {
      setSyncingFollowers(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateConfig({
      overlay: {
        ...(config?.overlay || ({} as any)),
        goals: {
          title,
          current,
          target,
          type,
          platform,
          autoSyncLive,
          barColor,
          bgColor,
          textColor,
          showPercentage,
          borderRadius,
          height,
        },
      },
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const obsOverlayUrl = `${window.location.origin}/overlay/goals?key=${user?.overlayKey || ''}`;

  const copyOverlayUrl = () => {
    navigator.clipboard.writeText(obsOverlayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const percentage = Math.min(100, Math.round((current / Math.max(1, target)) * 100));

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-emerald-400" /> Barra de Metas en Vivo (Goals)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Lee tus seguidores reales de Kick y Twitch y avanza la barra de progreso automáticamente en OBS.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={copyOverlayUrl}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
            <span>{copied ? '¡URL Copiada!' : 'Copiar URL para OBS'}</span>
          </button>
          <a
            href={obsOverlayUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" /> Abrir Overlay
          </a>
        </div>
      </div>

      {/* Live Followers Quick Sync Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Heart className="w-4 h-4 text-pink-500 fill-pink-500" /> Seguidores Actuales en tus Canales
          </div>
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#53FC18]/10 border border-[#53FC18]/30">
              <span className="w-2 h-2 rounded-full bg-[#53FC18]" />
              <span className="text-xs font-bold text-[#53FC18]">
                Kick: {liveCounts ? liveCounts.kick : '...'}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#9146FF]/10 border border-[#9146FF]/30">
              <span className="w-2 h-2 rounded-full bg-[#9146FF]" />
              <span className="text-xs font-bold text-[#9146FF]">
                Twitch: {liveCounts ? liveCounts.twitch : '...'}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200">
              <span className="text-xs font-bold">
                Total Combinado: {liveCounts ? liveCounts.total : '...'}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSyncFollowers}
          disabled={syncingFollowers}
          className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${syncingFollowers ? 'animate-spin' : ''}`} />
          <span>{syncingFollowers ? 'Leyendo...' : 'Sincronizar Seguidores Ahora'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings Form */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <h3 className="font-bold text-white text-base pb-3 border-b border-slate-800 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" /> Configuración de la Meta
            </h3>

            {/* Platform Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">
                Plataforma de la Meta
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'all', label: '🌐 Ambos (Total)', color: 'text-indigo-400' },
                  { id: 'kick', label: '💚 Solo Kick', color: 'text-[#53FC18]' },
                  { id: 'twitch', label: '💜 Solo Twitch', color: 'text-[#9146FF]' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPlatform(p.id as any);
                      if (liveCounts) {
                        if (p.id === 'kick') setCurrent(liveCounts.kick);
                        else if (p.id === 'twitch') setCurrent(liveCounts.twitch);
                        else setCurrent(liveCounts.total);
                      }
                    }}
                    className={`p-3 rounded-2xl border text-center transition font-bold text-xs cursor-pointer ${
                      platform === p.id
                        ? 'border-emerald-500 bg-emerald-950/30 text-white ring-1 ring-emerald-500/30'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className={p.color}>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Título de la Meta *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ej: Meta de Seguidores 2026"
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none transition"
              />
            </div>

            {/* Current & Target */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Cantidad Actual (Leída automáticamente)
                </label>
                <input
                  type="number"
                  min="0"
                  value={current}
                  onChange={(e) => setCurrent(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Meta Objetivo (Target) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={target}
                  onChange={(e) => setTarget(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Color de la Barra
                </label>
                <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-950 border border-slate-800">
                  <input
                    type="color"
                    value={barColor}
                    onChange={(e) => setBarColor(e.target.value)}
                    className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={barColor}
                    onChange={(e) => setBarColor(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Color de Texto
                </label>
                <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-950 border border-slate-800">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Height & Style Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>Grosor de la Barra</span>
                  <span className="text-emerald-400">{height}px</span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="50"
                  step="2"
                  value={height}
                  onChange={(e) => setHeight(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-xs font-bold text-slate-300">Mostrar Porcentaje (%)</span>
                <input
                  type="checkbox"
                  checked={showPercentage}
                  onChange={(e) => setShowPercentage(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            {savedSuccess && (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <Check className="w-4 h-4" /> ¡Guardado con éxito!
              </span>
            )}
            <button
              type="submit"
              className="px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 transition cursor-pointer"
            >
              Guardar Barra de Metas
            </button>
          </div>
        </form>

        {/* Live Preview Box */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 sticky top-8">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" /> Vista Previa en OBS
            </h3>
            <p className="text-xs text-slate-400">
              Así se verá flotando en tu transmisión en OBS Studio:
            </p>

            <div className="p-6 rounded-2xl bg-slate-950/90 border border-slate-800/80 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
              <div className="flex items-center justify-between mb-3" style={{ color: textColor }}>
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-500 fill-pink-500 animate-pulse" />
                  <span className="font-extrabold text-sm tracking-wide uppercase">{title}</span>
                </div>
                <div className="font-black text-sm flex items-center gap-1.5">
                  <span>{current}</span>
                  <span className="opacity-50">/</span>
                  <span className="opacity-70">{target}</span>
                  {showPercentage && (
                    <span className="text-xs ml-1.5 px-2 py-0.5 rounded-full bg-white/10 font-mono font-bold">
                      {percentage}%
                    </span>
                  )}
                </div>
              </div>

              <div
                className="w-full bg-slate-800/80 overflow-hidden p-0.5 border border-white/10 relative shadow-inner"
                style={{
                  height: `${height}px`,
                  borderRadius: `${borderRadius}px`,
                }}
              >
                <div
                  className="h-full transition-all duration-700 relative overflow-hidden"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: barColor,
                    borderRadius: `${borderRadius}px`,
                    boxShadow: `0 0 15px ${barColor}80`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
