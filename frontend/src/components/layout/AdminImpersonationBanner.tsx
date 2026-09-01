import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Crown, ArrowLeft } from 'lucide-react';

export const AdminImpersonationBanner: React.FC = () => {
  const { isImpersonating, user, stopImpersonating } = useAuth();

  if (!isImpersonating || !user) return null;

  return (
    <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 px-4 py-2 text-xs font-bold shadow-lg z-50 flex items-center justify-between sticky top-0 border-b border-amber-400">
      <div className="flex items-center gap-2">
        <Crown className="w-4 h-4 text-slate-950 animate-bounce" />
        <span>
          MODO ADMINISTRADOR: Estás gestionando y configurando la cuenta de{' '}
          <span className="bg-slate-950 text-amber-300 px-2 py-0.5 rounded-full font-black font-mono">
            @{user.displayName || user.username}
          </span>{' '}
          ({user.accounts?.twitch?.channel ? `Twitch: #${user.accounts.twitch.channel}` : ''}{' '}
          {user.accounts?.kick?.channel ? `Kick: @${user.accounts.kick.channel}` : ''})
        </span>
      </div>

      <button
        onClick={() => stopImpersonating()}
        className="bg-slate-950 hover:bg-slate-900 text-white px-3.5 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 shadow transition active:scale-95 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
        <span>Volver a mi Cuenta de Admin</span>
      </button>
    </div>
  );
};
