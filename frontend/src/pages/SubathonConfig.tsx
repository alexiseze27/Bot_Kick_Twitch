import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { SubathonConfig, SubathonLog } from '../types';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Save,
  CheckCircle,
  Copy,
  ExternalLink,
  Heart,
  Award,
  Gift,
  Zap,
  DollarSign,
  Flame,
  Volume2,
  Sliders,
  Activity
} from 'lucide-react';

export const SubathonConfigPage: React.FC = () => {
  const { socket } = useSocket();
  const { user, token } = useAuth();

  const [subathon, setSubathon] = useState<SubathonConfig | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedObs, setCopiedObs] = useState(false);
  const [recentFlash, setRecentFlash] = useState<string | null>(null);

  // Local editable form fields
  const [enabled, setEnabled] = useState(true);
  const [title, setTitle] = useState('STREAM EXTENSIBLE');
  const [theme, setTheme] = useState<'neon' | 'glass' | 'cyberpunk' | 'retro' | 'clean'>('neon');
  const [clockColor, setClockColor] = useState('#53FC18');
  const [labelColor, setLabelColor] = useState('#ffffff');
  const [glowColor, setGlowColor] = useState('#53FC18');
  const [fontSize, setFontSize] = useState(48);
  const [soundOnTimeAdded, setSoundOnTimeAdded] = useState(true);

  // Weights
  const [followSeconds, setFollowSeconds] = useState(30);
  const [subSeconds, setSubSeconds] = useState(300);
  const [giftSubSeconds, setGiftSubSeconds] = useState(300);
  const [bitsSecondsPer100, setBitsSecondsPer100] = useState(60);
  const [tipSecondsPerDollar, setTipSecondsPerDollar] = useState(60);
  const [raidSecondsPerViewer, setRaidSecondsPerViewer] = useState(5);

  // Initial & Max cap
  const [initialHours, setInitialHours] = useState(2);
  const [maxHours, setMaxHours] = useState(24);

  // Fetch initial subathon data
  useEffect(() => {
    if (!token) return;
    fetch('/api/user/subathon', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data: SubathonConfig) => {
        setSubathon(data);
        if (data) {
          setEnabled(data.enabled);
          setTitle(data.style?.title || 'STREAM EXTENSIBLE');
          setTheme(data.style?.theme || 'neon');
          setClockColor(data.style?.clockColor || '#53FC18');
          setLabelColor(data.style?.labelColor || '#ffffff');
          setGlowColor(data.style?.glowColor || '#53FC18');
          setFontSize(data.style?.fontSize || 48);
          setSoundOnTimeAdded(data.style?.soundOnTimeAdded !== undefined ? data.style.soundOnTimeAdded : true);

          setFollowSeconds(data.weights?.followSeconds || 30);
          setSubSeconds(data.weights?.subSeconds || 300);
          setGiftSubSeconds(data.weights?.giftSubSeconds || 300);
          setBitsSecondsPer100(data.weights?.bitsSecondsPer100 || 60);
          setTipSecondsPerDollar(data.weights?.tipSecondsPerDollar || 60);
          setRaidSecondsPerViewer(data.weights?.raidSecondsPerViewer || 5);

          setInitialHours(Math.round((data.state?.initialSeconds || 7200) / 3600));
          setMaxHours(Math.round((data.state?.maxSeconds || 86400) / 3600));
        }
      })
      .catch(console.error);
  }, [token]);

  // Listen to live Subathon socket ticks and events
  useEffect(() => {
    if (!socket) return;

    const handleSync = (data: SubathonConfig) => {
      setSubathon(data);
    };

    const handleTick = (data: { remainingSeconds: number; active: boolean; paused: boolean }) => {
      setSubathon((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          state: {
            ...prev.state,
            remainingSeconds: data.remainingSeconds,
            active: data.active,
            paused: data.paused,
          },
        };
      });
    };

    const handleTimeAdded = (data: { secondsAdded: number; log: SubathonLog; remainingSeconds: number }) => {
      setRecentFlash(`+${formatSecondsShort(data.secondsAdded)}`);
      setTimeout(() => setRecentFlash(null), 3000);

      setSubathon((prev) => {
        if (!prev) return prev;
        const newLogs = [data.log, ...(prev.logs || [])].slice(0, 50);
        return {
          ...prev,
          state: {
            ...prev.state,
            remainingSeconds: data.remainingSeconds,
            totalTimeAdded: (prev.state.totalTimeAdded || 0) + data.secondsAdded,
          },
          logs: newLogs,
        };
      });
    };

    socket.on('subathon:sync', handleSync);
    socket.on('subathon:tick', handleTick);
    socket.on('subathon:timeAdded', handleTimeAdded);

    return () => {
      socket.off('subathon:sync', handleSync);
      socket.off('subathon:tick', handleTick);
      socket.off('subathon:timeAdded', handleTimeAdded);
    };
  }, [socket]);

  const handleAction = async (action: 'start' | 'pause' | 'resume' | 'reset' | 'add' | 'subtract', seconds?: number) => {
    if (!token) return;
    try {
      const res = await fetch('/api/user/subathon/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, seconds }),
      });
      if (res.ok) {
        const data = await res.json();
        setSubathon(data);
      }
    } catch (e) {
      console.error('Error executing subathon action:', e);
    }
  };

  const handleSaveConfig = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/user/subathon/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enabled,
          weights: {
            followSeconds,
            subSeconds,
            giftSubSeconds,
            bitsSecondsPer100,
            tipSecondsPerDollar,
            raidSecondsPerViewer,
          },
          style: {
            title,
            theme,
            fontSize,
            clockColor,
            labelColor,
            glowColor,
            soundOnTimeAdded,
            soundUrl: subathon?.style?.soundUrl || 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
          },
          state: {
            initialSeconds: initialHours * 3600,
            maxSeconds: maxHours * 3600,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSubathon(data);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (e) {
      console.error('Error saving subathon config:', e);
    }
  };

  const obsOverlayUrl = `${window.location.origin}/overlay/subathon?key=${user?.overlayKey || ''}`;

  const copyObsUrl = () => {
    navigator.clipboard.writeText(obsOverlayUrl);
    setCopiedObs(true);
    setTimeout(() => setCopiedObs(false), 2000);
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

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

  const remaining = subathon?.state?.remainingSeconds || 0;
  const isActive = subathon?.state?.active && !subathon?.state?.paused;
  const isPaused = subathon?.state?.paused;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Timer className="w-6 h-6 text-amber-400" /> Sistema de Stream Extensible (Subathon)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Temporizador interactivo en tiempo real que suma tiempo automáticamente ante donaciones, suscripciones y follows.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveConfig}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            {saveSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-300" /> ¡Guardado!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Guardar Ajustes
              </>
            )}
          </button>
        </div>
      </div>

      {/* OBS URL Banner */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
            OBS
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>URL del Reloj Extensible para OBS Studio</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                100% Transparente
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-xl">
              {obsOverlayUrl}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyObsUrl}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-amber-400" /> {copiedObs ? '¡Copiado!' : 'Copiar URL para OBS'}
          </button>
          <a
            href={obsOverlayUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-600/30 transition cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Abrir Overlay
          </a>
        </div>
      </div>

      {/* Hero: Giant Interactive Live Clock & Quick Action Controls */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/50 border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Recent Flash Badge */}
        {recentFlash && (
          <div className="absolute top-6 right-6 px-4 py-1.5 rounded-2xl bg-emerald-500 text-slate-950 font-black text-sm animate-bounce shadow-xl flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> {recentFlash} añadido
          </div>
        )}

        <div className="flex flex-col items-center justify-center text-center space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-black tracking-widest uppercase text-slate-400 flex items-center justify-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-[#53FC18] animate-ping' : isPaused ? 'bg-amber-400' : 'bg-slate-600'}`} />
              {title} • {isActive ? 'EN VIVO (DESCONTANDO)' : isPaused ? 'EN PAUSA' : 'DETENIDO'}
            </span>
            <div
              className="text-6xl sm:text-7xl md:text-8xl font-black font-mono tracking-tight select-all drop-shadow-2xl transition-all"
              style={{
                color: clockColor,
                textShadow: `0 0 40px ${glowColor}60`,
              }}
            >
              {formatTime(remaining)}
            </div>
            <div className="text-xs text-slate-400 font-medium pt-1">
              Tiempo total sumado por el chat: <span className="text-emerald-400 font-bold font-mono">+{formatSecondsShort(subathon?.state?.totalTimeAdded || 0)}</span>
            </div>
          </div>

          {/* Primary Controls (Play, Pause, Reset) */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {!isActive ? (
              <button
                type="button"
                onClick={() => handleAction(isPaused ? 'resume' : 'start', initialHours * 3600)}
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" /> {isPaused ? 'Reanudar Extensible' : 'Iniciar Extensible'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleAction('pause')}
                className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-amber-600/30 transition cursor-pointer active:scale-95"
              >
                <Pause className="w-4 h-4 fill-white" /> Pausar Temporizador
              </button>
            )}

            <button
              type="button"
              onClick={() => handleAction('reset')}
              className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-2 border border-slate-700 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Reiniciar
            </button>
          </div>

          {/* Fast Manual Adjustments */}
          <div className="pt-2 border-t border-slate-800/80 w-full max-w-2xl flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 mr-2">Ajuste Manual:</span>
            {[
              { label: '+5m', sec: 300, isAdd: true },
              { label: '+15m', sec: 900, isAdd: true },
              { label: '+30m', sec: 1800, isAdd: true },
              { label: '+1h', sec: 3600, isAdd: true },
              { label: '-5m', sec: 300, isAdd: false },
              { label: '-15m', sec: 900, isAdd: false },
            ].map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={() => handleAction(btn.isAdd ? 'add' : 'subtract', btn.sec)}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition cursor-pointer ${
                  btn.isAdd
                    ? 'bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 hover:bg-emerald-900/60'
                    : 'bg-rose-950/60 border border-rose-800/50 text-rose-300 hover:bg-rose-900/60'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Rules / Weights (Left) & Style + Live Activity Log (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Event Rules & Weights (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" /> Reglas de Tiempo por Evento
              </h3>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                <span className="ml-2 text-xs font-bold text-slate-300">
                  {enabled ? 'Extensible Activo' : 'Desactivado'}
                </span>
              </label>
            </div>

            {/* Event Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Follow */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-pink-400">
                  <Heart className="w-4 h-4 fill-pink-400" /> Seguidor (Follow)
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={followSeconds}
                    onChange={(e) => setFollowSeconds(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                  <span className="text-xs text-slate-400 font-bold shrink-0">segundos</span>
                </div>
                <div className="text-[10px] text-slate-500">Equivale a: +{formatSecondsShort(followSeconds)}</div>
              </div>

              {/* Sub Tier 1 */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                  <Award className="w-4 h-4" /> Suscripción (Sub)
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={subSeconds}
                    onChange={(e) => setSubSeconds(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                  <span className="text-xs text-slate-400 font-bold shrink-0">segundos</span>
                </div>
                <div className="text-[10px] text-slate-500">Equivale a: +{formatSecondsShort(subSeconds)}</div>
              </div>

              {/* Gift Sub */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-pink-500">
                  <Gift className="w-4 h-4" /> Sub Regalada (Por cada 1)
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={giftSubSeconds}
                    onChange={(e) => setGiftSubSeconds(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                  <span className="text-xs text-slate-400 font-bold shrink-0">segundos</span>
                </div>
                <div className="text-[10px] text-slate-500">Ejemplo: 5 subs = +{formatSecondsShort(giftSubSeconds * 5)}</div>
              </div>

              {/* Bits / Cheers */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                  <Zap className="w-4 h-4" /> Bits (Por cada 100 bits)
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={bitsSecondsPer100}
                    onChange={(e) => setBitsSecondsPer100(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                  <span className="text-xs text-slate-400 font-bold shrink-0">segundos</span>
                </div>
                <div className="text-[10px] text-slate-500">500 bits = +{formatSecondsShort(bitsSecondsPer100 * 5)}</div>
              </div>

              {/* Tips / Donations */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <DollarSign className="w-4 h-4" /> Donación (Por cada $1 USD)
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={tipSecondsPerDollar}
                    onChange={(e) => setTipSecondsPerDollar(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                  <span className="text-xs text-slate-400 font-bold shrink-0">segundos</span>
                </div>
                <div className="text-[10px] text-slate-500">Donación de $10 = +{formatSecondsShort(tipSecondsPerDollar * 10)}</div>
              </div>

              {/* Raid */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-500">
                  <Flame className="w-4 h-4" /> Raid (Por cada espectador)
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={raidSecondsPerViewer}
                    onChange={(e) => setRaidSecondsPerViewer(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                  <span className="text-xs text-slate-400 font-bold shrink-0">segundos</span>
                </div>
                <div className="text-[10px] text-slate-500">Raid de 50 viewers = +{formatSecondsShort(raidSecondsPerViewer * 50)}</div>
              </div>
            </div>

            {/* Initial & Max Time Limits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  ⏱️ Tiempo Inicial al Iniciar
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={initialHours}
                    onChange={(e) => setInitialHours(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                  <span className="text-xs text-slate-400 font-bold shrink-0">Horas</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  🛑 Límite Máximo de Tiempo (Cap)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={maxHours}
                    onChange={(e) => setMaxHours(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                  <span className="text-xs text-slate-400 font-bold shrink-0">Horas (0=Sin límite)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Style Customization & Live Activity Feed (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Style Card */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" /> Estilo del Widget en OBS
            </h3>

            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Título Superior
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="STREAM EXTENSIBLE"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Color del Reloj
                </label>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <input
                    type="color"
                    value={clockColor}
                    onChange={(e) => setClockColor(e.target.value)}
                    className="w-7 h-7 rounded-lg bg-transparent border-0 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-300">{clockColor}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Brillo / Glow
                </label>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <input
                    type="color"
                    value={glowColor}
                    onChange={(e) => setGlowColor(e.target.value)}
                    className="w-7 h-7 rounded-lg bg-transparent border-0 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-300">{glowColor}</span>
                </div>
              </div>
            </div>

            {/* Font Size */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-xs font-bold text-slate-300">
                <span>Tamaño del Reloj</span>
                <span className="text-amber-400">{fontSize}px</span>
              </div>
              <input
                type="range"
                min="24"
                max="80"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Sound Toggle */}
            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-400" /> Sonido al Sumar Tiempo
              </span>
              <input
                type="checkbox"
                checked={soundOnTimeAdded}
                onChange={(e) => setSoundOnTimeAdded(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </label>
          </div>

          {/* Live Activity Feed */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" /> Historial Reciente de Tiempo Sumado
            </h3>

            {(!subathon?.logs || subathon.logs.length === 0) ? (
              <div className="text-center py-8 text-xs text-slate-500">
                Aún no hay eventos registrados en este extensible.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                {subathon.logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          log.platform === 'kick'
                            ? 'bg-[#53FC18]'
                            : log.platform === 'twitch'
                            ? 'bg-[#9146FF]'
                            : 'bg-amber-400'
                        }`}
                      />
                      <span className="font-bold text-white">{log.user}</span>
                      <span className="text-[10px] text-slate-400 uppercase">({log.type})</span>
                    </div>
                    <span className="font-mono font-black text-emerald-400">
                      +{formatSecondsShort(log.secondsAdded)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
