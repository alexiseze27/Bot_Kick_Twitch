import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bot, LogIn, ArrowRight, RefreshCw } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithEmail } = useAuth();

  // Email login form
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;
    setLoading(true);
    setError(null);

    const res = await loginWithEmail(identifier, password);
    setLoading(false);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.error || 'Error al iniciar sesión');
    }
  };

  const handleTwitchOAuth = () => {
    window.location.href = '/api/auth/twitch/redirect';
  };

  const handleKickOAuth = () => {
    window.location.href = '/api/auth/kick/redirect';
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Ambient background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#53FC18]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-[#53FC18] flex items-center justify-center shadow-2xl shadow-purple-600/30 mb-4 animate-alert-bounce">
          <Bot className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          StreamBot <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#53FC18] font-mono border border-[#53FC18]/30">v1.0</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-sm">
          Plataforma unificada para streamers de Twitch y Kick estilo Botrix.live
        </p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative z-10">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">Iniciar Sesión</h2>
          <p className="text-xs text-slate-400 mt-1">Conecta con tu plataforma favorita para auto-vincular tu canal</p>
        </div>

        {/* Quick Social / Platform Logins */}
        <div className="space-y-3">
          {/* Twitch Button */}
          <button
            type="button"
            onClick={handleTwitchOAuth}
            className="w-full py-3.5 px-5 rounded-2xl bg-[#9146FF] hover:bg-[#7e34ea] text-white font-extrabold text-sm flex items-center justify-between shadow-lg shadow-purple-600/25 transition group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-black/20 flex items-center justify-center font-black text-xs">
                Tw
              </span>
              <span>Continuar con Twitch</span>
            </div>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </button>

          {/* Kick Button */}
          <button
            type="button"
            onClick={handleKickOAuth}
            className="w-full py-3.5 px-5 rounded-2xl bg-[#53FC18] hover:bg-[#46d814] text-black font-extrabold text-sm flex items-center justify-between shadow-lg shadow-green-500/20 transition group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-black/10 flex items-center justify-center font-black text-xs text-black">
                Ki
              </span>
              <span>Continuar con Kick</span>
            </div>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </button>
        </div>

        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-slate-800" />
          <span className="px-3 text-xs text-slate-500 uppercase font-semibold">o con tu cuenta</span>
          <div className="flex-1 border-t border-slate-800" />
        </div>

        {/* Standard Email Login */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Usuario o Correo Electrónico
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="tu_usuario o correo@ejemplo.com"
              required
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            Iniciar Sesión
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-slate-400">
          ¿No tienes una cuenta aún?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold underline">
            Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  );
};
