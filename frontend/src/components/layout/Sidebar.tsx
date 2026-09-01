import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  MessageSquareCode,
  Timer,
  BellRing,
  MessageSquare,
  Target,
  Bot,
  Layers,
  Crown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navItems = [
    { to: '/', label: 'Panel Principal', icon: LayoutDashboard },
    { to: '/connections', label: 'Cuentas & Conexión', icon: Radio },
    { to: '/commands', label: 'Comandos de Chat', icon: MessageSquareCode },
    { to: '/timers', label: 'Temporizadores', icon: Timer },
  ];

  const overlayItems = [
    { to: '/alerts-config', label: 'Caja de Alertas', icon: BellRing },
    { to: '/ai-config', label: 'Robot IA (AFK)', icon: Bot },
    { to: '/chat-config', label: 'Chat para OBS', icon: MessageSquare },
    { to: '/goals-config', label: 'Metas de Stream', icon: Target },
    { to: '/subathon-config', label: 'Stream Extensible', icon: Timer },
  ];

  const hasTwitch = !!user?.accounts?.twitch?.connected;
  const hasKick = !!user?.accounts?.kick?.connected;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg text-white tracking-tight leading-none flex items-center gap-1.5">
            StreamBot <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">v1.0</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Twitch & Kick Hub</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Gestión del Bot
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Overlays para OBS</span>
            <Layers className="w-3.5 h-3.5" />
          </div>
          <nav className="space-y-1">
            {overlayItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Admin Navigation Section */}
        {user?.role === 'admin' && (
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
              <span>SuperAdmin</span>
              <Crown className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <nav className="space-y-1">
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/25'
                      : 'text-amber-300 hover:text-white hover:bg-amber-500/15 border border-amber-500/20'
                  }`
                }
              >
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Panel de Admin</span>
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      {/* Footer Platform Status */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="text-xs font-semibold text-slate-400 mb-2">Canales del Streamer</div>
        <div className="space-y-2">
          {/* Twitch Status */}
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${hasTwitch ? 'bg-purple-500 animate-pulse' : 'bg-slate-600'}`} />
              <span className="font-semibold text-slate-200">Twitch</span>
            </div>
            <span
              className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${
                hasTwitch ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {hasTwitch ? `#${user?.accounts?.twitch?.channel}` : 'Sin vincular'}
            </span>
          </div>

          {/* Kick Status */}
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${hasKick ? 'bg-[#53FC18] animate-pulse' : 'bg-slate-600'}`} />
              <span className="font-semibold text-slate-200">Kick</span>
            </div>
            <span
              className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${
                hasKick ? 'bg-[#53FC18]/20 text-[#53FC18]' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {hasKick ? `@${user?.accounts?.kick?.channel}` : 'Sin vincular'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
