import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Radio, Key, Unlink, ArrowRight, RefreshCw, Settings, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export const Connections: React.FC = () => {
  const { user, token, unlinkPlatform, regenerateOverlayKey, refreshUser } = useAuth();

  // Key regeneration state
  const [regenLoading, setRegenLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Kick Token Modal state
  const [showKickModal, setShowKickModal] = useState(false);
  const [kickTokenInput, setKickTokenInput] = useState(user?.accounts?.kick?.token || '');
  const [kickChannelInput, setKickChannelInput] = useState(user?.accounts?.kick?.channel || '');
  const [kickBotUsername, setKickBotUsername] = useState(user?.accounts?.kick?.username || '');
  const [isSavingKick, setIsSavingKick] = useState(false);
  const [kickSaveMsg, setKickSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Twitch Bot Modal state
  const [showTwitchBotModal, setShowTwitchBotModal] = useState(false);
  const [twitchBotUsernameInput, setTwitchBotUsernameInput] = useState(user?.accounts?.twitch?.botUsername || '');
  const [twitchBotTokenInput, setTwitchBotTokenInput] = useState(user?.accounts?.twitch?.botToken || '');
  const [isSavingTwitchBot, setIsSavingTwitchBot] = useState(false);
  const [twitchBotSaveMsg, setTwitchBotSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleLinkTwitchOAuth = () => {
    window.location.href = `/api/auth/twitch/redirect?state=link_${user?.id}`;
  };

  const handleLinkKickOAuth = () => {
    window.location.href = `/api/auth/kick/redirect?state=link_${user?.id}`;
  };

  const handleUnlink = async (platform: 'twitch' | 'kick') => {
    if (!confirm(`¿Estás seguro de que deseas desvincular tu cuenta de ${platform.toUpperCase()}?`)) return;
    await unlinkPlatform(platform);
  };

  const handleRegenerateKey = async () => {
    if (!confirm('¿Deseas regenerar tu clave privada de OBS? Tendrás que actualizar las URLs en OBS Studio.')) return;
    setRegenLoading(true);
    await regenerateOverlayKey();
    setRegenLoading(false);
  };

  const copyKey = () => {
    if (user?.overlayKey) {
      navigator.clipboard.writeText(user.overlayKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleSaveTwitchBot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTwitchBot(true);
    setTwitchBotSaveMsg(null);

    try {
      const res = await fetch('/api/user/twitch/bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          botUsername: twitchBotUsernameInput.trim(),
          botToken: twitchBotTokenInput.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTwitchBotSaveMsg({ type: 'success', text: '¡Bot de Twitch configurado y sincronizado!' });
        if (refreshUser) await refreshUser();
        setTimeout(() => setShowTwitchBotModal(false), 1500);
      } else {
        setTwitchBotSaveMsg({ type: 'error', text: data.error || 'Error al guardar bot de Twitch' });
      }
    } catch (err: any) {
      setTwitchBotSaveMsg({ type: 'error', text: err.message || 'Error de conexión' });
    } finally {
      setIsSavingTwitchBot(false);
    }
  };

  const handleSaveKickToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingKick(true);
    setKickSaveMsg(null);

    try {
      const res = await fetch('/api/user/kick/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          token: kickTokenInput.trim(),
          channel: kickChannelInput.trim(),
          botUsername: kickBotUsername.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setKickSaveMsg({ type: 'success', text: '¡Token y canal de Kick guardados y sincronizados!' });
        if (refreshUser) await refreshUser();
        setTimeout(() => setShowKickModal(false), 1500);
      } else {
        setKickSaveMsg({ type: 'error', text: data.error || 'Error al guardar token de Kick' });
      }
    } catch (err: any) {
      setKickSaveMsg({ type: 'error', text: err.message || 'Error de conexión' });
    } finally {
      setIsSavingKick(false);
    }
  };

  const hasTwitch = !!user?.accounts?.twitch?.connected;
  const hasKick = !!user?.accounts?.kick?.connected;
  const twitchBotName = user?.accounts?.twitch?.botUsername;

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Radio className="w-6 h-6 text-indigo-400" /> Cuentas & Canales Conectados
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Vincula tus cuentas de Twitch y Kick mediante OAuth 2.0 oficial para sincronizar chats y alertas en tiempo real.
        </p>
      </div>

      {/* Secret OBS Key Section */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
            <Key className="w-4 h-4 text-amber-400" /> Clave Privada de Overlays para OBS
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Esta clave asegura que solo las alertas y el chat de tu cuenta se muestren en tus fuentes de OBS.
          </p>
          <div className="mt-2 font-mono text-xs text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 inline-block">
            {user?.overlayKey || 'Cargando clave...'}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyKey}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            {copiedKey ? '¡Copiada!' : 'Copiar Clave'}
          </button>
          <button
            onClick={handleRegenerateKey}
            disabled={regenLoading}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${regenLoading ? 'animate-spin' : ''}`} /> Regenerar Clave
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Twitch Account Card */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-purple-500/30 shadow-xl flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#9146FF] flex items-center justify-center font-black text-white text-lg shadow-md shadow-purple-600/30">
                  Tw
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Twitch</h3>
                  <p className="text-xs text-slate-400">Canal y alertas oficiales de Twitch</p>
                </div>
              </div>

              <span
                className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 ${
                  hasTwitch
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${hasTwitch ? 'bg-purple-400 animate-pulse' : 'bg-slate-500'}`} />
                {hasTwitch ? 'Vinculado' : 'No Vinculado'}
              </span>
            </div>

            {hasTwitch ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-400">Canal Conectado:</div>
                    <span className="text-[10px] bg-purple-500/15 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/25 font-bold">
                      {twitchBotName ? `Bot: @${twitchBotName}` : 'Responde como Streamer'}
                    </span>
                  </div>
                  <div className="text-lg font-black text-purple-300 font-mono">
                    #{user?.accounts?.twitch?.channel}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {twitchBotName
                      ? `Los comandos se responderán con la cuenta del bot @${twitchBotName}.`
                      : 'Puedes configurar una cuenta de bot separada para responder comandos en tu chat.'}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setTwitchBotUsernameInput(user?.accounts?.twitch?.botUsername || '');
                      setTwitchBotTokenInput(user?.accounts?.twitch?.botToken || '');
                      setTwitchBotSaveMsg(null);
                      setShowTwitchBotModal(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-purple-400" />
                    <span>{twitchBotName ? 'Cambiar Cuenta del Bot de Twitch' : 'Usar Cuenta de Bot Dedicada'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleLinkTwitchOAuth}
                      className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Re-autenticar Twitch
                    </button>
                    <button
                      onClick={() => handleUnlink('twitch')}
                      className="py-2 px-3.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                      title="Desvincular Twitch"
                    >
                      <Unlink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                <p className="text-xs text-slate-400">
                  Conecta tu cuenta oficial de Twitch mediante OAuth 2.0 para activar comandos y alertas de tu canal.
                </p>
                <button
                  onClick={handleLinkTwitchOAuth}
                  className="w-full py-3 px-4 rounded-2xl bg-[#9146FF] hover:bg-[#7c2fe8] text-white font-extrabold text-xs flex items-center justify-between shadow-lg shadow-purple-600/25 transition group cursor-pointer"
                >
                  <span>Vincular con Twitch Oficial</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Kick Account Card */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-[#53FC18]/30 shadow-xl flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#53FC18] flex items-center justify-center font-black text-black text-lg shadow-md shadow-green-500/20">
                  Ki
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Kick</h3>
                  <p className="text-xs text-slate-400">Canal y alertas oficiales de Kick</p>
                </div>
              </div>

              <span
                className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 ${
                  hasKick
                    ? 'bg-[#53FC18]/20 text-[#53FC18] border border-[#53FC18]/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${hasKick ? 'bg-[#53FC18] animate-pulse' : 'bg-slate-500'}`} />
                {hasKick ? 'Vinculado' : 'No Vinculado'}
              </span>
            </div>

            {hasKick ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-400">Canal Conectado:</div>
                    <span className="text-[10px] bg-[#53FC18]/10 text-[#53FC18] px-2 py-0.5 rounded-full border border-[#53FC18]/20 font-bold">
                      {user?.accounts?.kick?.token ? 'Token Configurado' : 'Sin Token de Bot'}
                    </span>
                  </div>
                  <div className="text-lg font-black text-[#53FC18] font-mono">
                    @{user?.accounts?.kick?.channel}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Bot activo escuchando chat en vivo, suscripciones y follows.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setKickTokenInput(user?.accounts?.kick?.token || '');
                      setKickChannelInput(user?.accounts?.kick?.channel || '');
                      setKickBotUsername(user?.accounts?.kick?.username || '');
                      setKickSaveMsg(null);
                      setShowKickModal(true);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-[#53FC18]/20 hover:bg-[#53FC18]/30 border border-[#53FC18]/40 text-[#53FC18] font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" /> Token / Configuración de Kick
                  </button>
                  <button
                    onClick={() => handleUnlink('kick')}
                    className="py-2.5 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Unlink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                <p className="text-xs text-slate-400">
                  Conecta tu cuenta de Kick para activar comandos y alertas de tu canal.
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleLinkKickOAuth}
                    className="w-full py-3 px-4 rounded-2xl bg-[#53FC18] hover:bg-[#46d614] text-black font-extrabold text-xs flex items-center justify-between shadow-lg shadow-green-500/25 transition group cursor-pointer"
                  >
                    <span>Vincular con Kick Oficial</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                  </button>
                  <button
                    onClick={() => {
                      setKickTokenInput('');
                      setKickChannelInput(user?.username || '');
                      setKickBotUsername(user?.username || '');
                      setKickSaveMsg(null);
                      setShowKickModal(true);
                    }}
                    className="w-full py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" /> Configurar Manualmente con Token
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Kick Token & Config */}
      {showKickModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#53FC18] flex items-center justify-center font-bold text-black text-sm">
                  Ki
                </div>
                <h3 className="font-bold text-white text-base">Token & Canal de Kick</h3>
              </div>
              <button
                onClick={() => setShowKickModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveKickToken} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-semibold">Nombre del Canal en Kick</label>
                <input
                  type="text"
                  required
                  placeholder="ej: tupac_33"
                  value={kickChannelInput}
                  onChange={(e) => setKickChannelInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#53FC18]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-semibold">Nombre del Bot en Kick (opcional)</label>
                <input
                  type="text"
                  placeholder="Nombre de usuario del bot"
                  value={kickBotUsername}
                  onChange={(e) => setKickBotUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#53FC18]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-300 font-semibold">Token de Acceso / Bot Token de Kick</label>
                </div>
                <textarea
                  rows={3}
                  placeholder="Pega aquí tu token de Kick (OAuth Access Token o Developer Token)"
                  value={kickTokenInput}
                  onChange={(e) => setKickTokenInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#53FC18]"
                />
                <p className="text-[11px] text-slate-500">
                  💡 Necesario para que el bot pueda enviar mensajes de comandos (!redes, !dado, etc.) al chat de Kick.
                </p>
              </div>

              {kickSaveMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    kickSaveMsg.type === 'success'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {kickSaveMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{kickSaveMsg.text}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowKickModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingKick}
                  className="px-5 py-2 rounded-xl bg-[#53FC18] hover:bg-[#46d614] text-black font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-green-500/20"
                >
                  {isSavingKick ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Guardar & Conectar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Twitch Bot Dedicated Account */}
      {showTwitchBotModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#9146FF] flex items-center justify-center font-bold text-white text-sm">
                  Tw
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Cuenta de Bot para Twitch</h3>
                  <p className="text-[11px] text-slate-400">Responde comandos con un usuario separado en tu chat</p>
                </div>
              </div>
              <button
                onClick={() => setShowTwitchBotModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTwitchBot} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-semibold">Nombre de Usuario del Bot en Twitch</label>
                <input
                  type="text"
                  required
                  placeholder="ej: mibot_stream o nombre_de_tu_bot"
                  value={twitchBotUsernameInput}
                  onChange={(e) => setTwitchBotUsernameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#9146FF]"
                />
                <p className="text-[11px] text-slate-500">
                  El nombre de la cuenta secundaria que hablará en tu directo.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-300 font-semibold">Token OAuth del Bot de Twitch</label>
                  <a
                    href="https://twitchtokengenerator.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-purple-400 hover:underline"
                  >
                    Generar Token ↗
                  </a>
                </div>
                <input
                  type="password"
                  placeholder="oauth:xxxxxxxxxxxxxxxxxxxxxx"
                  value={twitchBotTokenInput}
                  onChange={(e) => setTwitchBotTokenInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#9146FF]"
                />
                <p className="text-[11px] text-slate-500">
                  Token generado iniciando sesión con la cuenta del bot (scopes necesarios: <code>chat:read</code> y <code>chat:edit</code>).
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-800/40 text-xs text-purple-200 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <span>💡 Paso importante en Twitch:</span>
                </div>
                <div className="text-[11px] text-purple-300">
                  Para que tu bot pueda responder sin restricciones ni límites de lentitud, dale rango de moderador en tu canal escribiendo en tu chat de Twitch:
                  <div className="mt-1 bg-black/50 px-2 py-1 rounded font-mono text-purple-200">
                    /mod {twitchBotUsernameInput || 'nombre_del_bot'}
                  </div>
                </div>
              </div>

              {twitchBotSaveMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    twitchBotSaveMsg.type === 'success'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {twitchBotSaveMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{twitchBotSaveMsg.text}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setTwitchBotUsernameInput('');
                    setTwitchBotTokenInput('');
                  }}
                  className="text-xs text-rose-400 hover:underline cursor-pointer"
                >
                  Quitar Bot (Volver a cuenta streamer)
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTwitchBotModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingTwitchBot}
                    className="px-5 py-2 rounded-xl bg-[#9146FF] hover:bg-[#7c2fe8] text-white font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/25"
                  >
                    {isSavingTwitchBot ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Guardar & Conectar Bot</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
