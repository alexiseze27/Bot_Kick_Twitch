import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Heart, UserCheck, Users, DollarSign, LogOut } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { isConnected, triggerTestAlert } = useSocket();
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 flex items-center justify-between shrink-0 select-none">
      {/* Engine Status & Streamer Greeting */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
            }`}
          />
          <span className="text-xs font-semibold text-slate-300">
            {isConnected ? 'Motor en Vivo Conectado' : 'Conectando...'}
          </span>
        </div>
      </div>

      {/* Quick Test Alert Buttons & User Profile */}
      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400 mr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Probar Alerta:
          </span>

          <button
            onClick={() => triggerTestAlert('follow', 'twitch', 'AlexStreamer')}
            className="px-2.5 py-1.5 rounded-lg bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-pink-300 text-xs font-medium flex items-center gap-1.5 transition"
            title="Probar Alerta de Seguidor"
          >
            <Heart className="w-3.5 h-3.5 text-pink-400" /> Follow
          </button>

          <button
            onClick={() => triggerTestAlert('sub', 'kick', 'KickFanático', 1)}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-1.5 transition"
            title="Probar Alerta de Suscripción"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Sub
          </button>

          <button
            onClick={() => triggerTestAlert('raid', 'twitch', 'CompañeroGamer', 42)}
            className="px-2.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-medium flex items-center gap-1.5 transition"
            title="Probar Alerta de Raid"
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" /> Raid
          </button>

          <button
            onClick={() => triggerTestAlert('tip', 'kick', 'DonadorGenial', 15)}
            className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-1.5 transition"
            title="Probar Alerta de Donación"
          >
            <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Tip
          </button>
        </div>

        {/* User Pill & Logout */}
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
            <div className="flex items-center gap-2">
              <img
                src={user.avatar}
                alt={user.displayName}
                className="w-8 h-8 rounded-full border border-slate-700 bg-slate-800 object-cover"
              />
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-white leading-tight">{user.displayName}</div>
                <div className="text-[10px] text-slate-400 leading-tight">@{user.username}</div>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
