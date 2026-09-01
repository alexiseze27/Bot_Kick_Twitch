import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { ChatMessage } from '../types';
import {
  Activity,
  MessageSquare,
  Sparkles,
  Zap,
  TrendingUp,
  Send,
  Copy,
  Check,
  ExternalLink,
  Radio,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { stats, chatMessages, sendChatMessage } = useSocket();
  const { user } = useAuth();
  const [chatInput, setChatInput] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<'twitch' | 'kick'>('twitch');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(selectedPlatform, chatInput.trim());
    setChatInput('');
  };

  const copyUrl = (path: string) => {
    const keyParam = user?.overlayKey ? `?key=${user.overlayKey}` : '';
    const url = `${window.location.origin}${path}${keyParam}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(path);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const hasTwitch = !!user?.accounts?.twitch?.connected;
  const hasKick = !!user?.accounts?.kick?.connected;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-indigo-950/70 via-purple-950/50 to-slate-900 border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            ¡Hola, {user?.displayName || 'Streamer'}! <Sparkles className="w-5 h-5 text-amber-400" />
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Gestiona tus chats y alertas en tiempo real para Twitch y Kick de forma centralizada.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasTwitch || hasKick ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              Bot Activo en Streaming
            </div>
          ) : (
            <Link
              to="/connections"
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition"
            >
              <Radio className="w-4 h-4" /> Vincular Canales
            </Link>
          )}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Msgs Twitch</span>
            <div className="p-2 rounded-xl bg-purple-500/10">
              <MessageSquare className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{stats.twitchMessagesCount}</div>
          <p className="text-xs text-slate-400 mt-1">Recibidos en tu canal</p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Msgs Kick</span>
            <div className="p-2 rounded-xl bg-emerald-500/10">
              <MessageSquare className="w-4 h-4 text-[#53FC18]" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{stats.kickMessagesCount}</div>
          <p className="text-xs text-slate-400 mt-1">Recibidos en tu canal</p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-indigo-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Comandos</span>
            <div className="p-2 rounded-xl bg-indigo-500/10">
              <Zap className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{stats.commandsExecutedCount}</div>
          <p className="text-xs text-slate-400 mt-1">Ejecutados por el bot</p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-pink-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Alertas OBS</span>
            <div className="p-2 rounded-xl bg-pink-500/10">
              <TrendingUp className="w-4 h-4 text-pink-400" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{stats.alertsTriggeredCount}</div>
          <p className="text-xs text-slate-400 mt-1">Disparadas a pantalla</p>
        </div>
      </div>

      {/* Main Content Grid: Live Chat & OBS URLs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Unified Live Chat Feed Preview */}
        <div className="lg:col-span-2 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl flex flex-col h-[520px]">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-white text-sm">Chat Unificado en Vivo</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {chatMessages.length} mensajes
            </span>
          </div>

          {/* Messages list */}
          <div className="flex-1 p-4 overflow-y-auto space-y-2.5 bg-slate-950/40">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-6">
                <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm font-medium">Esperando mensajes en tus canales conectados...</p>
                <p className="text-xs mt-1 text-slate-400">
                  {hasTwitch || hasKick
                    ? 'Los mensajes de Twitch y Kick aparecerán aquí automáticamente en tiempo real.'
                    : 'Vincula tu canal de Twitch o Kick en Cuentas & Conexión para comenzar.'}
                </p>
              </div>
            ) : (
              chatMessages.map((msg: ChatMessage) => {
                const isKick = msg.platform === 'kick';
                return (
                  <div
                    key={msg.id}
                    className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition"
                  >
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase shrink-0 mt-0.5 ${
                        isKick ? 'bg-[#53FC18] text-black' : 'bg-[#9146FF] text-white'
                      }`}
                    >
                      {isKick ? 'KICK' : 'TWITCH'}
                    </span>
                    <div className="flex-1 text-xs">
                      <span
                        className="font-bold mr-1.5"
                        style={{ color: msg.user.color || (isKick ? '#53FC18' : '#a970ff') }}
                      >
                        {msg.user.displayName || msg.user.username}:
                      </span>
                      <span className="text-slate-200">{msg.message}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Chat message sender */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900 flex items-center gap-2">
            <div className="flex rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedPlatform('twitch')}
                className={`px-2.5 py-1 text-xs font-bold transition ${
                  selectedPlatform === 'twitch' ? 'bg-[#9146FF] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Twitch
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlatform('kick')}
                className={`px-2.5 py-1 text-xs font-bold transition ${
                  selectedPlatform === 'kick' ? 'bg-[#53FC18] text-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Kick
              </button>
            </div>

            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`Escribir en el chat de ${selectedPlatform.toUpperCase()}...`}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />

            <button
              type="submit"
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition"
            >
              <Send className="w-3.5 h-3.5" /> Enviar
            </button>
          </form>
        </div>

        {/* OBS Overlays URLs Box */}
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div>
              <h3 className="font-bold text-white text-base">Tus URLs Privadas para OBS</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Pega estas URLs en OBS como <b>Navegador (Browser Source)</b> con tu clave única.
              </p>
            </div>

            {/* Alert Box URL */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                <span>🔔 Alertas (Follows, Subs, Tips)</span>
                <a
                  href={`/overlay/alerts?key=${user?.overlayKey || ''}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[11px]"
                >
                  Abrir <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/overlay/alerts?key=${user?.overlayKey || ''}`}
                  className="flex-1 bg-slate-900 text-slate-300 text-[11px] font-mono px-2.5 py-1.5 rounded-lg border border-slate-800 select-all"
                />
                <button
                  onClick={() => copyUrl('/overlay/alerts')}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 transition"
                >
                  {copiedUrl === '/overlay/alerts' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl === '/overlay/alerts' ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {/* Chat Box URL */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                <span>💬 Chat Unificado Transparente</span>
                <a
                  href={`/overlay/chat?key=${user?.overlayKey || ''}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[11px]"
                >
                  Abrir <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/overlay/chat?key=${user?.overlayKey || ''}`}
                  className="flex-1 bg-slate-900 text-slate-300 text-[11px] font-mono px-2.5 py-1.5 rounded-lg border border-slate-800 select-all"
                />
                <button
                  onClick={() => copyUrl('/overlay/chat')}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 transition"
                >
                  {copiedUrl === '/overlay/chat' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl === '/overlay/chat' ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {/* Goals URL */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                <span>🎯 Barra de Metas (Goals)</span>
                <a
                  href={`/overlay/goals?key=${user?.overlayKey || ''}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[11px]"
                >
                  Abrir <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/overlay/goals?key=${user?.overlayKey || ''}`}
                  className="flex-1 bg-slate-900 text-slate-300 text-[11px] font-mono px-2.5 py-1.5 rounded-lg border border-slate-800 select-all"
                />
                <button
                  onClick={() => copyUrl('/overlay/goals')}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 transition"
                >
                  {copiedUrl === '/overlay/goals' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl === '/overlay/goals' ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
