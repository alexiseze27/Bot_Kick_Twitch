import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import {
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Crown,
  Shield,
  Star,
} from 'lucide-react';

export const ChatConfig: React.FC = () => {
  const { config, updateConfig } = useSocket();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states
  const [theme, setTheme] = useState<'transparent' | 'clean-dark' | 'glass' | 'bubble' | 'retro' | 'minimal'>('transparent');
  const [fontSize, setFontSize] = useState(18);
  const [showPlatformBadges, setShowPlatformBadges] = useState(true);
  const [showUserBadges, setShowUserBadges] = useState(true);
  const [fadeTime, setFadeTime] = useState(20);
  const [maxMessages, setMaxMessages] = useState(30);
  const [hideCommands, setHideCommands] = useState(true);

  useEffect(() => {
    if (config?.overlay?.chat) {
      const c = config.overlay.chat;
      setTheme(c.theme || 'transparent');
      setFontSize(c.fontSize || 18);
      setShowPlatformBadges(c.showPlatformBadges !== undefined ? c.showPlatformBadges : true);
      setShowUserBadges(c.showUserBadges !== undefined ? c.showUserBadges : true);
      setFadeTime(c.fadeTime !== undefined ? c.fadeTime : 20);
      setMaxMessages(c.maxMessages || 30);
      setHideCommands(c.hideCommands !== undefined ? c.hideCommands : true);
    }
  }, [config]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateConfig({
      overlay: {
        ...(config?.overlay || ({} as any)),
        chat: {
          theme,
          fontSize,
          showPlatformBadges,
          showUserBadges,
          fadeTime,
          maxMessages,
          hideCommands,
        },
      },
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const obsOverlayUrl = `${window.location.origin}/overlay/chat?key=${user?.overlayKey || ''}`;

  const copyOverlayUrl = () => {
    navigator.clipboard.writeText(obsOverlayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-400" /> Configuración de Chat para OBS
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Personaliza el tema, tipografía y estilo del widget de chat unificado para OBS Studio.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyOverlayUrl}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
            <span>{copied ? '¡URL Copiada!' : 'Copiar URL de OBS'}</span>
          </button>
          <a
            href={obsOverlayUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" /> Abrir Overlay
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings Form */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            <h3 className="font-bold text-white text-base pb-3 border-b border-slate-800">
              Estilo Visual & Opciones
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tema Visual del Chat
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: 'transparent', label: '🪟 100% Transparente (Recomendado)', desc: 'Sin fondo, texto libre con sombra' },
                    { id: 'clean-dark', label: '🔲 Caja Oscura Suave', desc: 'Fondo negro redondeado semitransparente' },
                    { id: 'glass', label: '💎 Glassmorphism', desc: 'Efecto cristal con blur' },
                    { id: 'bubble', label: '💬 Burbujas de Chat', desc: 'Mensajes con bordes de color' },
                    { id: 'retro', label: '🕹️ Retro Arcade', desc: 'Estilo pixel verde gamer' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id as any)}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                        theme === t.id
                          ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500/30'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{t.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Tamaño de Fuente ({fontSize}px)
                  </label>
                </div>
                <input
                  type="range"
                  min="14"
                  max="32"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Tiempo de Desvanecimiento ({fadeTime === 0 ? 'Nunca (Permanente)' : `${fadeTime} segundos`})
                  </label>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="5"
                  value={fadeTime}
                  onChange={(e) => setFadeTime(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div className="pt-2 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer text-xs font-semibold text-slate-300">
                  <input
                    type="checkbox"
                    checked={showPlatformBadges}
                    onChange={(e) => setShowPlatformBadges(e.target.checked)}
                    className="rounded accent-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Mostrar insignias de plataforma (TWITCH / KICK)</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer text-xs font-semibold text-slate-300">
                  <input
                    type="checkbox"
                    checked={showUserBadges}
                    onChange={(e) => setShowUserBadges(e.target.checked)}
                    className="rounded accent-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Mostrar insignias de usuario (Broadcaster, Mod, VIP, Sub)</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer text-xs font-semibold text-slate-300">
                  <input
                    type="checkbox"
                    checked={hideCommands}
                    onChange={(e) => setHideCommands(e.target.checked)}
                    className="rounded accent-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Ocultar mensajes que inicien con ! (Comandos de chat)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            {savedSuccess && (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <Check className="w-4 h-4" /> ¡Guardado!
              </span>
            )}
            <button
              type="submit"
              className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-lg shadow-indigo-600/30 transition cursor-pointer"
            >
              Guardar Configuración de Chat
            </button>
          </div>
        </form>

        {/* Live Preview Box */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 sticky top-8">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" /> Vista Previa en OBS
            </h3>
            <p className="text-xs text-slate-400">
              Renderizado con transparencia idéntico a OBS Studio:
            </p>

            {/* Simulated OBS Box */}
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/80 min-h-[300px] flex flex-col justify-end space-y-2.5 overflow-hidden bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
              {/* Twitch Sample Message */}
              <div
                className={`flex items-start gap-2.5 px-3 py-1.5 transition ${
                  theme === 'glass'
                    ? 'bg-slate-900/50 backdrop-blur rounded-xl border border-white/10'
                    : theme === 'bubble'
                    ? 'bg-slate-800/80 rounded-2xl border-l-4 border-indigo-500'
                    : theme === 'retro'
                    ? 'bg-black font-mono border border-green-500'
                    : theme === 'clean-dark'
                    ? 'bg-black/60 rounded-xl border border-white/10'
                    : 'bg-transparent border-0'
                }`}
                style={{
                  fontSize: `${fontSize}px`,
                  textShadow: theme === 'transparent' || theme === 'minimal'
                    ? '0 1px 3px rgba(0,0,0,0.9), 0 2px 6px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,1)'
                    : undefined,
                }}
              >
                {showPlatformBadges && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-[#9146FF] text-white shrink-0 mt-0.5">
                    TWITCH
                  </span>
                )}
                {showUserBadges && (
                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <Shield className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                  </div>
                )}
                <div className="leading-snug break-words">
                  <span className="font-black text-[#a970ff] mr-1.5">StreamerAlexis:</span>
                  <span className="text-white font-semibold">¡Bienvenidos a todos al directo de hoy! 🔥</span>
                </div>
              </div>

              {/* Kick Sample Message */}
              <div
                className={`flex items-start gap-2.5 px-3 py-1.5 transition ${
                  theme === 'glass'
                    ? 'bg-slate-900/50 backdrop-blur rounded-xl border border-white/10'
                    : theme === 'bubble'
                    ? 'bg-slate-800/80 rounded-2xl border-l-4 border-indigo-500'
                    : theme === 'retro'
                    ? 'bg-black font-mono border border-green-500'
                    : theme === 'clean-dark'
                    ? 'bg-black/60 rounded-xl border border-white/10'
                    : 'bg-transparent border-0'
                }`}
                style={{
                  fontSize: `${fontSize}px`,
                  textShadow: theme === 'transparent' || theme === 'minimal'
                    ? '0 1px 3px rgba(0,0,0,0.9), 0 2px 6px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,1)'
                    : undefined,
                }}
              >
                {showPlatformBadges && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-[#53FC18] text-black shrink-0 mt-0.5 font-extrabold">
                    KICK
                  </span>
                )}
                {showUserBadges && (
                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    <Star className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                  </div>
                )}
                <div className="leading-snug break-words">
                  <span className="font-black text-[#53FC18] mr-1.5">GamerKick_99:</span>
                  <span className="text-white font-semibold">¡Tremenda jugada bro, GG! 💚</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
