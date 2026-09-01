import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Check, CheckCircle2, RefreshCw, User } from 'lucide-react';

export const OAuthConsent: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const platform = (searchParams.get('platform') || 'kick') as 'kick' | 'twitch';
  const state = searchParams.get('state') || '';
  const isKick = platform === 'kick';

  const [channel, setChannel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      if (isKick && currentUser.accounts?.kick?.channel) {
        setChannel(currentUser.accounts.kick.channel);
      } else if (!isKick && currentUser.accounts?.twitch?.channel) {
        setChannel(currentUser.accounts.twitch.channel);
      } else {
        setChannel(currentUser.username);
      }
    }
  }, [currentUser, isKick]);

  const handleAuthorize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channel.trim()) {
      setError(`Por favor ingresa tu nombre de usuario en ${isKick ? 'Kick' : 'Twitch'}.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/oauth-authorize-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          channel: channel.trim(),
          linkWithUserId: state.startsWith('link_') && currentUser ? currentUser.id : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('streambot_token', data.token);
        window.location.href = '/';
      } else {
        setError(data.error || 'Error al autorizar aplicación');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/login');
  };

  const permissions = isKick
    ? [
        'Escribir en el feed del chat',
        'Leer información del canal',
        'Leer información de usuario (incluyendo la dirección de correo electrónico)',
        'Suscríbete a los eventos (leer el chat, seguir, suscribirse, regalos)',
        'Actualizar información del canal',
        'Ejecuta acciones de moderación para moderadores',
        'Lee la información relacionada (KICKs) (posiciones, etc.)',
        'Lee más información sobre los Puntos del Canal en un canal',
        'Lee, agrega, edita y borra las recompensas de los Puntos del Canal de un canal',
      ]
    : [
        'Ver tu dirección de correo electrónico',
        'Leer mensajes del chat en tiempo real',
        'Enviar mensajes en el chat del canal',
        'Recibir eventos de suscripciones y renovaciones',
        'Recibir alertas de donaciones de Bits / Cheers',
        'Ver la lista de seguidores del canal',
      ];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 select-none relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]"
      style={{
        background: isKick
          ? 'radial-gradient(circle at 10% 50%, rgba(83, 252, 24, 0.25), transparent 40%), radial-gradient(circle at 90% 50%, rgba(83, 252, 24, 0.2), transparent 40%), #0c100e'
          : 'radial-gradient(circle at 10% 50%, rgba(145, 70, 255, 0.25), transparent 40%), radial-gradient(circle at 90% 50%, rgba(145, 70, 255, 0.2), transparent 40%), #090812',
      }}
    >
      {/* Background geometric pixel grid accents */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#53fc18_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Main Authorization Card */}
      <div className="w-full max-w-lg bg-[#111613]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6 relative z-10 text-slate-200">
        {/* Brand Logo Header */}
        <div className="flex items-center gap-2">
          {isKick ? (
            <div className="flex items-center gap-1.5">
              <span className="text-3xl font-black tracking-tighter text-[#53FC18] font-mono">
                KICK
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#53FC18]/20 text-[#53FC18] border border-[#53FC18]/30 font-mono">
                BETA
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black tracking-tight text-[#9146FF]">
                TWITCH
              </span>
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-1.5">
            StreamBot <CheckCircle2 className="w-5 h-5 text-[#53FC18] fill-[#53FC18]/20 inline" /> quiere acceder a tu cuenta de {isKick ? 'Kick' : 'Twitch'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Esto permitirá que StreamBot:
          </p>
        </div>

        {/* Permissions List */}
        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-2">
          {permissions.map((perm, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
              <div
                className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 ${
                  isKick ? 'bg-[#53FC18] text-black font-black' : 'bg-[#9146FF] text-white font-black'
                }`}
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span className="leading-tight">{perm}</span>
            </div>
          ))}
        </div>

        {/* Account Confirmation / Channel Input */}
        <form onSubmit={handleAuthorize} className="space-y-4 pt-3 border-t border-white/10">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Confirmar Nombre de Usuario en {isKick ? 'Kick' : 'Twitch'} *
            </label>
            <div className="flex items-center gap-2 bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 focus-within:border-[#53FC18]">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                placeholder={isKick ? 'ej: alexistv' : 'ej: alexistv'}
                required
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="text-[11px] text-slate-400 leading-relaxed">
            Asegúrate de que confías en StreamBot, porque podrías estar compartiendo información sobre tu cuenta de {isKick ? 'Kick' : 'Twitch'}. Puedes revocar el permiso de acceso en cualquier momento en 'Conexiones' en los ajustes de tu cuenta.
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-3 rounded-2xl bg-black/40 hover:bg-black/60 text-slate-300 text-xs font-bold transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading || !channel.trim()}
              className={`px-8 py-3 rounded-2xl font-black text-xs shadow-lg transition flex items-center gap-2 ${
                isKick
                  ? 'bg-[#53FC18] hover:bg-[#46db13] text-black shadow-green-500/25'
                  : 'bg-[#9146FF] hover:bg-[#7e32eb] text-white shadow-purple-600/25'
              }`}
            >
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
              Permitir acceso
            </button>
          </div>
        </form>

        {channel && (
          <div className="text-center text-[11px] text-slate-500 pt-1">
            Sesión iniciada como <span className="font-semibold text-slate-300">{channel}</span>
          </div>
        )}
      </div>
    </div>
  );
};
