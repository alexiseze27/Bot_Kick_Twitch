import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ExternalLink, ArrowLeft } from 'lucide-react';

export const OAuthSetupGuide: React.FC = () => {
  const [searchParams] = useSearchParams();
  const platform = (searchParams.get('platform') || 'kick') as 'kick' | 'twitch';
  const isKick = platform === 'kick';

  const portalUrl = isKick ? 'https://dev.kick.com' : 'https://dev.twitch.tv/console/apps';
  const redirectUri = `http://localhost:3001/api/auth/${platform}/callback`;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 select-none relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]"
      style={{
        background: isKick
          ? 'radial-gradient(circle at 10% 50%, rgba(83, 252, 24, 0.2), transparent 40%), #0c100e'
          : 'radial-gradient(circle at 10% 50%, rgba(145, 70, 255, 0.2), transparent 40%), #090812',
      }}
    >
      <div className="w-full max-w-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg ${
                isKick ? 'bg-[#53FC18] text-black shadow-green-500/20' : 'bg-[#9146FF] text-white shadow-purple-600/30'
              }`}
            >
              {isKick ? 'Ki' : 'Tw'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                Conectar API Oficial de {isKick ? 'Kick' : 'Twitch'} OAuth 2.0
              </h1>
              <p className="text-xs text-slate-400">
                Configuración de tus credenciales de desarrollador para redirección oficial
              </p>
            </div>
          </div>

          <Link to="/login" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        {/* Steps */}
        <div className="space-y-4 text-xs leading-relaxed">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="font-bold text-white text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-mono">1</span>
              Abre el Portal de Desarrolladores de {isKick ? 'Kick' : 'Twitch'}
            </div>
            <p className="text-slate-400">
              Inicia sesión en el portal oficial y crea una nueva aplicación llamada <b>StreamBot</b>:
            </p>
            <a
              href={portalUrl}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                isKick ? 'bg-[#53FC18] hover:bg-[#46d814] text-black' : 'bg-[#9146FF] hover:bg-[#7e34ea] text-white'
              }`}
            >
              Ir a {isKick ? 'dev.kick.com' : 'dev.twitch.tv'} <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="font-bold text-white text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-mono">2</span>
              Configura la URL de Redirección (OAuth Redirect URI)
            </div>
            <p className="text-slate-400">
              En los ajustes de tu aplicación en {isKick ? 'Kick' : 'Twitch'}, pega exactamente esta URL:
            </p>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-emerald-400 text-xs select-all">
              {redirectUri}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="font-bold text-white text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-mono">3</span>
              Pega tus Claves en el archivo <code className="text-indigo-300">.env</code>
            </div>
            <p className="text-slate-400">
              Abre el archivo <b>.env</b> en la raíz del proyecto y coloca tu Client ID y Client Secret:
            </p>
            <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
              {isKick
                ? `KICK_CLIENT_ID=tu_client_id_de_kick\nKICK_CLIENT_SECRET=tu_client_secret_de_kick\nKICK_REDIRECT_URI=${redirectUri}`
                : `TWITCH_CLIENT_ID=tu_client_id_de_twitch\nTWITCH_CLIENT_SECRET=tu_client_secret_de_twitch\nTWITCH_REDIRECT_URI=${redirectUri}`}
            </pre>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <Link
            to="/login"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
          >
            Volver al Inicio
          </Link>
          <a
            href={portalUrl}
            target="_blank"
            rel="noreferrer"
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition"
          >
            Abrir Portal de Desarrolladores <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
