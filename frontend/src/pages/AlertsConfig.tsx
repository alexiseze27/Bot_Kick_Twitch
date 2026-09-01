import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { SingleAlertConfig, BotConfig } from '../types';
import { MediaSelectorModal } from '../components/MediaSelectorModal';
import { createDefaultSingleAlert } from '../constants/defaultAlertsHelper';
import {
  Bell,
  Play,
  Volume2,
  Sparkles,
  Save,
  CheckCircle,
  Copy,
  Radio,
  Type,
  Layout,
  Music,
  Film,
  Heart,
  Gift,
  Zap,
  DollarSign,
  Flame,
  Award,
  Box,
  Maximize2
} from 'lucide-react';

type AlertEventType = 'follow' | 'sub' | 'gift' | 'raid' | 'tip' | 'cheer';

interface EventMeta {
  type: AlertEventType;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  defaultTokens: string[];
}

const ALERT_EVENTS: EventMeta[] = [
  { type: 'follow', label: 'Seguidores (Follow)', icon: Heart, color: '#53FC18', defaultTokens: ['{user}'] },
  { type: 'sub', label: 'Suscripciones (Sub)', icon: Award, color: '#9146FF', defaultTokens: ['{user}', '{tier}'] },
  { type: 'gift', label: 'Subs Regaladas (Gift)', icon: Gift, color: '#EC4899', defaultTokens: ['{user}', '{amount}'] },
  { type: 'raid', label: 'Raids', icon: Flame, color: '#F59E0B', defaultTokens: ['{user}', '{viewers}'] },
  { type: 'tip', label: 'Donaciones (Tips)', icon: DollarSign, color: '#10B981', defaultTokens: ['{user}', '{amount}', '{message}'] },
  { type: 'cheer', label: 'Bits (Cheers)', icon: Zap, color: '#06B6D4', defaultTokens: ['{user}', '{amount}'] },
];

export const AlertsConfig: React.FC = () => {
  const { config, updateConfig, triggerTestAlert } = useSocket();
  const { user } = useAuth();

  const [activeEvent, setActiveEvent] = useState<AlertEventType>('follow');
  const [selectedPlatform, setSelectedPlatform] = useState<'twitch' | 'kick'>('twitch');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedObs, setCopiedObs] = useState(false);

  // Media Modal state
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaModalMode, setMediaModalMode] = useState<'visual' | 'audio'>('visual');

  // Active Alert Config State
  const [currentAlert, setCurrentAlert] = useState<SingleAlertConfig>(() => createDefaultSingleAlert('follow'));

  // Sync state with current config
  useEffect(() => {
    const defaults = createDefaultSingleAlert(activeEvent);
    const userCfg = config?.overlay?.alerts?.events?.[activeEvent];
    if (userCfg) {
      setCurrentAlert({
        ...defaults,
        ...userCfg,
        mediaSize: userCfg.mediaSize || defaults.mediaSize || 180,
        fontSize: userCfg.fontSize || defaults.fontSize || 26,
      });
    } else {
      setCurrentAlert(defaults);
    }
  }, [config, activeEvent]);

  const handleAlertChange = (fields: Partial<SingleAlertConfig>) => {
    setCurrentAlert((prev) => ({ ...prev, ...fields }));
  };

  const handleSaveAll = async () => {
    if (!config) return;

    const existingEvents = config.overlay.alerts.events || {
      follow: createDefaultSingleAlert('follow'),
      sub: createDefaultSingleAlert('sub'),
      gift: createDefaultSingleAlert('gift'),
      raid: createDefaultSingleAlert('raid'),
      tip: createDefaultSingleAlert('tip'),
      cheer: createDefaultSingleAlert('cheer'),
    };

    const newConfig: Partial<BotConfig> = {
      overlay: {
        ...config.overlay,
        alerts: {
          ...config.overlay.alerts,
          events: {
            ...existingEvents,
            [activeEvent]: currentAlert,
          },
        },
      },
    };

    await updateConfig(newConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleTestThisAlert = () => {
    triggerTestAlert(activeEvent, selectedPlatform, user?.displayName || 'StreamFan', activeEvent === 'tip' ? 10 : 5);
  };

  const obsOverlayUrl = `${window.location.origin}/overlay/alerts?key=${user?.overlayKey || ''}`;

  const copyObsUrl = () => {
    navigator.clipboard.writeText(obsOverlayUrl);
    setCopiedObs(true);
    setTimeout(() => setCopiedObs(false), 2000);
  };

  const activeMeta = ALERT_EVENTS.find((e) => e.type === activeEvent)!;

  const isVideo = currentAlert.mediaType === 'video' || (currentAlert.mediaUrl && (currentAlert.mediaUrl.endsWith('.webm') || currentAlert.mediaUrl.endsWith('.mp4')));
  const mediaSize = currentAlert.mediaSize || 180;
  const fontSize = currentAlert.fontSize || 26;

  // Format message text with variables for preview
  const formattedSubtitle = currentAlert.messageTemplate
    .replace('{user}', user?.displayName || 'StreamFan')
    .replace('{amount}', '5')
    .replace('{tier}', 'Tier 1')
    .replace('{viewers}', '25')
    .replace('{message}', '¡Gran stream!');

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-400" /> Configuración de Alertas Multimedia
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Personaliza el video, GIF, imagen, sonido, tamaños, animaciones, bordes y estilos para cada tipo de alerta.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveAll}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            {saveSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-300" /> ¡Guardado!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>

      {/* OBS URL Banner */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
            OBS
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>URL del Overlay para Navegador en OBS Studio</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                100% Transparente
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-xl">
              {obsOverlayUrl}
            </div>
          </div>
        </div>

        <button
          onClick={copyObsUrl}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
        >
          <Copy className="w-3.5 h-3.5 text-indigo-400" /> {copiedObs ? '¡Copiado!' : 'Copiar URL para OBS'}
        </button>
      </div>

      {/* Event Tabs Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {ALERT_EVENTS.map((evt) => {
          const Icon = evt.icon;
          const isActive = activeEvent === evt.type;
          return (
            <button
              key={evt.type}
              onClick={() => setActiveEvent(evt.type)}
              className={`p-4 rounded-2xl border transition-all flex flex-col items-center text-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 hover:bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: `${evt.color}25`, color: evt.color }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-400'}`}>
                {evt.label.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Alert Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section: Enable & General */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <activeMeta.icon className="w-5 h-5" style={{ color: activeMeta.color }} />
                <h3 className="font-bold text-white text-base">Alerta de {activeMeta.label}</h3>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentAlert.enabled}
                  onChange={(e) => handleAlertChange({ enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                <span className="ml-2 text-xs font-bold text-slate-300">
                  {currentAlert.enabled ? 'Activada' : 'Desactivada'}
                </span>
              </label>
            </div>

            {/* Message Template */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-indigo-400" /> Plantilla de Mensaje
              </label>
              <input
                type="text"
                value={currentAlert.messageTemplate}
                onChange={(e) => handleAlertChange({ messageTemplate: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-medium text-xs focus:outline-none focus:border-indigo-500 transition"
                placeholder="Ejemplo: {user} ¡Ahora te sigue!"
              />
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="text-[10px] text-slate-500">Variables disponibles:</span>
                {activeMeta.defaultTokens.map((token) => (
                  <button
                    key={token}
                    type="button"
                    onClick={() =>
                      handleAlertChange({
                        messageTemplate: `${currentAlert.messageTemplate} ${token}`,
                      })
                    }
                    className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-300 hover:bg-indigo-900/60 transition cursor-pointer"
                  >
                    {token}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Selector */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-indigo-400" /> Disposición del Texto y Medio
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'top-bottom', label: 'Arriba / Abajo', desc: 'Medio arriba, texto abajo' },
                  { id: 'side-by-side', label: 'Lado a Lado', desc: 'Medio izquierda, texto derecha' },
                  { id: 'overlay', label: 'Superpuesto', desc: 'Texto colocado sobre el medio' },
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => handleAlertChange({ layout: l.id as any })}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      currentAlert.layout === l.id
                        ? 'border-indigo-500 bg-indigo-950/30 text-white ring-1 ring-indigo-500/30'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{l.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{l.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Multimedia & Sound */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Film className="w-5 h-5 text-indigo-400" /> Medios Visuales & Sonido
            </h3>

            {/* Visual Media Selector */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden">
                  {isVideo ? (
                    <video
                      key={currentAlert.mediaUrl}
                      src={currentAlert.mediaUrl}
                      className="w-full h-full object-contain"
                      muted
                      autoPlay
                      playsInline
                      loop
                    />
                  ) : currentAlert.mediaUrl ? (
                    <img
                      key={currentAlert.mediaUrl}
                      src={currentAlert.mediaUrl}
                      alt="Visual"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Film className="w-6 h-6 text-slate-600" />
                  )}
                </div>

                <div>
                  <div className="text-xs font-bold text-white">Imagen, GIF o Video WebM</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs font-mono">
                    {currentAlert.mediaUrl || 'Ningún medio seleccionado'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {currentAlert.mediaUrl && (
                  <button
                    type="button"
                    onClick={() => handleAlertChange({ mediaUrl: '', mediaType: 'none' })}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold transition cursor-pointer"
                    title="Quitar imagen/video"
                  >
                    Quitar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMediaModalMode('visual');
                    setMediaModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow cursor-pointer"
                >
                  Cambiar Medio
                </button>
              </div>
            </div>

            {/* Media & Font Size Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Media Size Slider & Step Buttons */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5 text-indigo-400" /> Tamaño de Imagen / Video
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAlertChange({ mediaSize: Math.max(40, mediaSize - 10) })}
                      className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center transition cursor-pointer"
                      title="Reducir 10px"
                    >
                      -
                    </button>
                    <span className="text-indigo-400 font-mono w-14 text-center">{mediaSize}px</span>
                    <button
                      type="button"
                      onClick={() => handleAlertChange({ mediaSize: Math.min(700, mediaSize + 10) })}
                      className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center transition cursor-pointer"
                      title="Aumentar 10px"
                    >
                      +
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min="40"
                  max="700"
                  step="5"
                  value={mediaSize}
                  onChange={(e) => handleAlertChange({ mediaSize: parseInt(e.target.value, 10) || 180 })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* Font Size Slider & Step Buttons */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-pink-400" /> Tamaño de Letra del Mensaje
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAlertChange({ fontSize: Math.max(10, fontSize - 1) })}
                      className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center transition cursor-pointer"
                      title="Reducir 1px"
                    >
                      -
                    </button>
                    <span className="text-pink-400 font-mono w-12 text-center">{fontSize}px</span>
                    <button
                      type="button"
                      onClick={() => handleAlertChange({ fontSize: Math.min(90, fontSize + 1) })}
                      className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center transition cursor-pointer"
                      title="Aumentar 1px"
                    >
                      +
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min="10"
                  max="90"
                  step="1"
                  value={fontSize}
                  onChange={(e) => handleAlertChange({ fontSize: parseInt(e.target.value, 10) || 26 })}
                  className="w-full accent-pink-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Sound Selector */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                  <Music className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Efecto de Sonido de la Alerta</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs font-mono">
                    {currentAlert.soundUrl || 'Sin sonido'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {currentAlert.soundUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      const audio = new Audio(currentAlert.soundUrl);
                      audio.volume = currentAlert.soundVolume;
                      audio.play().catch(() => {});
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                    title="Escuchar sonido"
                  >
                    <Play className="w-4 h-4 ml-0.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMediaModalMode('audio');
                    setMediaModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow cursor-pointer"
                >
                  Cambiar Sonido
                </button>
              </div>
            </div>

            {/* Volume & Duration Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> Volumen de Sonido
                  </span>
                  <span className="text-emerald-400">{Math.round(currentAlert.soundVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={currentAlert.soundVolume}
                  onChange={(e) => handleAlertChange({ soundVolume: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>⏱️ Duración en Pantalla</span>
                  <span className="text-indigo-400">{currentAlert.duration} segundos</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="20"
                  step="1"
                  value={currentAlert.duration}
                  onChange={(e) => handleAlertChange({ duration: parseInt(e.target.value, 10) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section: Customization (Fondo, Bordes, Efectos & Animaciones) */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" /> Estilo del Fondo, Borde & Efectos
            </h3>

            {/* Card Background Style */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5 text-indigo-400" /> Estilo del Fondo de la Alerta
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'transparent', label: 'Transparente', desc: 'Sin fondo, libre y flotante' },
                  { id: 'card', label: 'Caja Oscura', desc: 'Fondo oscuro semitransparente' },
                  { id: 'glass', label: 'Cristal / Glass', desc: 'Efecto blur moderno' },
                  { id: 'minimal', label: 'Minimal', desc: 'Fondo negro suave sutil' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleAlertChange({ cardStyle: st.id as any })}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      (currentAlert.cardStyle || 'transparent') === st.id
                        ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500/30'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{st.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{st.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Effect & Border Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Toggle Border */}
              <div
                onClick={() => handleAlertChange({ showBorder: !currentAlert.showBorder })}
                className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                  currentAlert.showBorder
                    ? 'border-indigo-500 bg-indigo-950/20 text-white'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-900/50'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">Borde Exterior de la Caja</div>
                  <div className="text-[10px] text-slate-500">Muestra u oculta el marco</div>
                </div>
                <div className={`text-xs font-bold px-2.5 py-1 rounded-lg ${currentAlert.showBorder ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {currentAlert.showBorder ? 'Activado' : 'Desactivado'}
                </div>
              </div>

              {/* Toggle Glow */}
              <div
                onClick={() => handleAlertChange({ showGlow: !currentAlert.showGlow })}
                className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                  currentAlert.showGlow
                    ? 'border-amber-500 bg-amber-950/20 text-white'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-900/50'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">Resplandor / Brillo Neón</div>
                  <div className="text-[10px] text-slate-500">Sombra iluminada exterior</div>
                </div>
                <div className={`text-xs font-bold px-2.5 py-1 rounded-lg ${currentAlert.showGlow ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {currentAlert.showGlow ? 'Activado' : 'Desactivado'}
                </div>
              </div>

              {/* Toggle Badge */}
              <div
                onClick={() => handleAlertChange({ showBadge: !currentAlert.showBadge })}
                className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                  currentAlert.showBadge
                    ? 'border-purple-500 bg-purple-950/20 text-white'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-900/50'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">Insignia (KICK/TWITCH)</div>
                  <div className="text-[10px] text-slate-500">Etiqueta superior en la alerta</div>
                </div>
                <div className={`text-xs font-bold px-2.5 py-1 rounded-lg ${currentAlert.showBadge ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {currentAlert.showBadge ? 'Mostrar' : 'Ocultar'}
                </div>
              </div>

              {/* Toggle Confetti */}
              <div
                onClick={() => handleAlertChange({ showConfetti: !currentAlert.showConfetti })}
                className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                  currentAlert.showConfetti
                    ? 'border-emerald-500 bg-emerald-950/20 text-white'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-900/50'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">Explosión de Confeti</div>
                  <div className="text-[10px] text-slate-500">Partículas de fiesta en OBS</div>
                </div>
                <div className={`text-xs font-bold px-2.5 py-1 rounded-lg ${currentAlert.showConfetti ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {currentAlert.showConfetti ? 'Activado' : 'Desactivado'}
                </div>
              </div>
            </div>

            {/* Animation Selector */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-300">Animación de Entrada y Salida</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {[
                  { id: 'none', label: '🚫 Ninguna' },
                  { id: 'bounce', label: 'Bounce' },
                  { id: 'zoom', label: 'Zoom' },
                  { id: 'slide', label: 'Slide' },
                  { id: 'flip', label: 'Flip' },
                  { id: 'pulse', label: 'Pulse' },
                  { id: 'fade', label: 'Fade' },
                ].map((anim) => (
                  <button
                    key={anim.id}
                    type="button"
                    onClick={() => handleAlertChange({ animation: anim.id as any })}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                      currentAlert.animation === anim.id
                        ? 'border-amber-500 bg-amber-950/40 text-amber-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {anim.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* Title Color */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Color del Título</label>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <input
                    type="color"
                    value={currentAlert.titleColor || '#53FC18'}
                    onChange={(e) => handleAlertChange({ titleColor: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono text-slate-300">{currentAlert.titleColor}</span>
                </div>
              </div>

              {/* Text Color */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Color de Texto</label>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <input
                    type="color"
                    value={currentAlert.textColor || '#ffffff'}
                    onChange={(e) => handleAlertChange({ textColor: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono text-slate-300">{currentAlert.textColor}</span>
                </div>
              </div>

              {/* Glow Color */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Color del Brillo (Glow)</label>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <input
                    type="color"
                    value={currentAlert.glowColor || '#53FC18'}
                    onChange={(e) => handleAlertChange({ glowColor: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono text-slate-300">{currentAlert.glowColor}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Preview & OBS Tester (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Preview Card */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl sticky top-8 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Radio className="w-5 h-5 text-indigo-400" /> Vista Previa en Vivo
              </h3>
              <span className="text-[11px] text-slate-500">Renderizado idéntico a OBS</span>
            </div>

            {/* Simulated OBS Canvas (Checkered Transparent Pattern) */}
            <div className="w-full min-h-[350px] rounded-2xl bg-slate-950/80 border border-slate-800/80 p-4 flex items-center justify-center relative overflow-hidden bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
              {/* Alert Render Box */}
              <div
                className={`p-6 max-w-md w-full transition-all flex items-center justify-center ${
                  currentAlert.layout === 'top-bottom'
                    ? 'flex-col text-center gap-4'
                    : currentAlert.layout === 'side-by-side'
                    ? 'flex-row text-left gap-4'
                    : 'relative flex flex-col items-center justify-center'
                } ${
                  currentAlert.cardStyle === 'card'
                    ? 'bg-slate-900/90 rounded-3xl'
                    : currentAlert.cardStyle === 'glass'
                    ? 'bg-slate-900/60 backdrop-blur-md rounded-3xl'
                    : currentAlert.cardStyle === 'minimal'
                    ? 'bg-black/40 rounded-2xl'
                    : 'bg-transparent'
                } ${
                  currentAlert.showBorder
                    ? 'border-2'
                    : 'border-0'
                }`}
                style={{
                  borderColor: currentAlert.showBorder ? currentAlert.glowColor || activeMeta.color : 'transparent',
                  boxShadow: currentAlert.showGlow ? `0 0 35px ${currentAlert.glowColor || activeMeta.color}35` : 'none',
                }}
              >
                {/* Platform Badge (Optional) */}
                {currentAlert.showBadge && (
                  <div
                    className={`absolute -top-3 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow z-20 ${
                      selectedPlatform === 'kick' ? 'bg-[#53FC18] text-black' : 'bg-[#9146FF] text-white'
                    }`}
                  >
                    {selectedPlatform === 'kick' ? 'KICK.COM' : 'TWITCH.TV'}
                  </div>
                )}

                {/* Layout: OVERLAY (Superpuesto) */}
                {currentAlert.layout === 'overlay' ? (
                  <div
                    className="relative flex items-center justify-center overflow-hidden rounded-2xl"
                    style={{ width: `${mediaSize}px`, height: `${mediaSize}px` }}
                  >
                    {/* Media as backdrop */}
                    {isVideo ? (
                      <video
                        key={currentAlert.mediaUrl}
                        src={currentAlert.mediaUrl}
                        className="w-full h-full object-contain"
                        muted
                        autoPlay
                        playsInline
                        loop
                      />
                    ) : currentAlert.mediaUrl ? (
                      <img
                        key={currentAlert.mediaUrl}
                        src={currentAlert.mediaUrl}
                        alt="Alert"
                        className="w-full h-full object-contain"
                      />
                    ) : null}

                    {/* Text placed directly ON TOP of media */}
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center z-10 rounded-2xl bg-black/35"
                      style={{
                        textShadow: '0 2px 8px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,1)',
                      }}
                    >
                      <div
                        className="font-black uppercase tracking-wide leading-tight drop-shadow-lg"
                        style={{
                          color: currentAlert.titleColor,
                          fontSize: `${Math.round(fontSize * 1.15)}px`,
                        }}
                      >
                        ¡NUEVO {activeEvent.toUpperCase()}!
                      </div>
                      <div
                        className="font-bold leading-snug drop-shadow mt-1"
                        style={{
                          color: currentAlert.textColor,
                          fontSize: `${fontSize}px`,
                        }}
                      >
                        {formattedSubtitle}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Media Item */}
                    {isVideo ? (
                      <div
                        style={{ width: `${mediaSize}px`, height: `${mediaSize}px` }}
                        className="flex items-center justify-center overflow-hidden rounded-2xl shrink-0"
                      >
                        <video
                          key={currentAlert.mediaUrl}
                          src={currentAlert.mediaUrl}
                          className="max-h-full max-w-full object-contain"
                          muted
                          autoPlay
                          playsInline
                          loop
                        />
                      </div>
                    ) : currentAlert.mediaUrl ? (
                      <div
                        style={{ width: `${mediaSize}px`, height: `${mediaSize}px` }}
                        className="flex items-center justify-center overflow-hidden shrink-0"
                      >
                        <img
                          key={currentAlert.mediaUrl}
                          src={currentAlert.mediaUrl}
                          alt="Alert"
                          className="max-h-full max-w-full object-contain drop-shadow-2xl"
                        />
                      </div>
                    ) : null}

                    {/* Text Item */}
                    <div className="space-y-1 flex-1">
                      <div
                        className="font-black tracking-wide uppercase drop-shadow-lg leading-tight"
                        style={{
                          color: currentAlert.titleColor,
                          fontSize: `${Math.round(fontSize * 1.15)}px`,
                        }}
                      >
                        ¡NUEVO {activeEvent.toUpperCase()}!
                      </div>
                      <div
                        className="font-bold drop-shadow leading-snug"
                        style={{
                          color: currentAlert.textColor,
                          fontSize: `${fontSize}px`,
                        }}
                      >
                        {formattedSubtitle}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Test Trigger Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Disparar Alerta de Prueba:</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setSelectedPlatform('twitch')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                      selectedPlatform === 'twitch' ? 'bg-[#9146FF] text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Twitch
                  </button>
                  <button
                    onClick={() => setSelectedPlatform('kick')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                      selectedPlatform === 'kick' ? 'bg-[#53FC18] text-black' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Kick
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestThisAlert}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer active:scale-95"
              >
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" /> Disparar en OBS ({activeMeta.label.split(' ')[0]})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Media Selector Modal */}
      <MediaSelectorModal
        isOpen={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        mode={mediaModalMode}
        currentUrl={mediaModalMode === 'visual' ? currentAlert.mediaUrl : currentAlert.soundUrl}
        onSelect={(url, mediaType, isAudio) => {
          if (isAudio) {
            handleAlertChange({ soundUrl: url });
          } else {
            handleAlertChange({ mediaUrl: url, mediaType });
          }
        }}
      />
    </div>
  );
};
