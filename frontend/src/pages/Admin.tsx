import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GlobalBotConfig } from '../types';
import {
  Bot,
  Users,
  Radio,
  Activity,
  Save,
  RefreshCw,
  LogIn,
  Crown,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  Eye,
  EyeOff,
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  adminsCount: number;
  twitch: {
    connectedChannels: number;
    messages: number;
    botConnected: boolean;
    botIsAuth: boolean;
    globalBotUser: string;
  };
  kick: {
    connectedChannels: number;
    messages: number;
    pusherConnected: boolean;
    globalBotUser: string;
  };
  activity: {
    totalCommandsExecuted: number;
    totalAlertsTriggered: number;
    totalMessages: number;
  };
}

interface AdminUserItem {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatar: string;
  role: 'admin' | 'user';
  createdAt: number;
  overlayKey: string;
  accounts: {
    twitch: { channel: string; username: string; botUsername?: string; connected: boolean } | null;
    kick: { channel: string; username: string; botUsername?: string; connected: boolean } | null;
  };
  stats: {
    twitchMessagesCount: number;
    kickMessagesCount: number;
    commandsExecutedCount: number;
    alertsTriggeredCount: number;
  };
  commandsCount: number;
  timersCount: number;
  mediaGalleryCount: number;
}

export const AdminPage: React.FC = () => {
  const { user, token, impersonateUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'bots' | 'users' | 'metrics'>('bots');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usersList, setUsersList] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');

  // Global Config Form State
  const [globalConfig, setGlobalConfig] = useState<GlobalBotConfig>({
    twitch: {
      enabled: true,
      botUsername: '',
      botToken: '',
      clientId: '',
      clientSecret: '',
    },
    kick: {
      enabled: true,
      botUsername: '',
      botToken: '',
      clientId: '',
      clientSecret: '',
      pusherKey: '32cbd69e4b950bf97679',
      pusherCluster: 'us2',
    },
  });

  const [showTwitchToken, setShowTwitchToken] = useState(false);
  const [showKickToken, setShowKickToken] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSaveMsg, setConfigSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // User Actions State
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Redirect non-admins
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const fetchData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [statsRes, configRes, usersRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/global-config', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (configRes.ok) setGlobalConfig(await configRes.json());
      if (usersRes.ok) setUsersList(await usersRes.json());
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleSaveGlobalConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSavingConfig(true);
    setConfigSaveMsg(null);

    try {
      const res = await fetch('/api/admin/global-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(globalConfig),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setConfigSaveMsg({ type: 'success', text: '¡Configuración global de bots guardada y sincronizada!' });
        await fetchData();
      } else {
        setConfigSaveMsg({ type: 'error', text: data.error || 'Error al guardar configuración global' });
      }
    } catch (err: any) {
      setConfigSaveMsg({ type: 'error', text: err.message || 'Error de conexión' });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleImpersonate = async (targetUser: AdminUserItem) => {
    if (!confirm(`¿Deseas iniciar sesión y configurar la cuenta de @${targetUser.displayName || targetUser.username}? Podrás volver a tu cuenta de administrador en cualquier momento.`)) return;

    setActionLoadingId(targetUser.id);
    const res = await impersonateUser(targetUser.id);
    setActionLoadingId(null);

    if (res.success) {
      navigate('/');
    } else {
      alert(res.error || 'No se pudo acceder a la cuenta del usuario.');
    }
  };

  const handleToggleRole = async (targetUser: AdminUserItem) => {
    const nextRole = targetUser.role === 'admin' ? 'user' : 'admin';
    if (!confirm(`¿Cambiar el rol de @${targetUser.username} a "${nextRole.toUpperCase()}"?`)) return;

    try {
      setActionLoadingId(targetUser.id);
      const res = await fetch(`/api/admin/users/${targetUser.id}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: nextRole }),
      });

      const data = await res.json();
      if (res.ok) {
        await fetchData();
      } else {
        alert(data.error || 'Error al actualizar rol');
      }
    } catch (e: any) {
      alert(e.message || 'Error de conexión');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async (targetUser: AdminUserItem) => {
    if (!confirm(`⚠️ ¿Estás seguro de que deseas eliminar la cuenta de @${targetUser.username}? Esta acción borrará todas sus alertas, comandos y configuración.`)) return;

    try {
      setActionLoadingId(targetUser.id);
      const res = await fetch(`/api/admin/users/${targetUser.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        await fetchData();
      } else {
        alert(data.error || 'Error al eliminar usuario');
      }
    } catch (e: any) {
      alert(e.message || 'Error de conexión');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      u.username.toLowerCase().includes(query) ||
      u.displayName.toLowerCase().includes(query) ||
      (u.accounts.twitch?.channel || '').toLowerCase().includes(query) ||
      (u.accounts.kick?.channel || '').toLowerCase().includes(query);

    const matchesRole = roleFilter === 'all' ? true : u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                Panel de Administración Centralizado
              </h1>
              <p className="text-xs text-slate-400">
                Gestión de Bots Maestros Globales, Métricas de la Plataforma y Acceso a Cuentas de Streamers.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition self-start cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          <span>Actualizar Datos</span>
        </button>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Streamers Registrados</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-white">{stats?.totalUsers || 0}</div>
          <div className="text-[11px] text-slate-500">
            {stats?.adminsCount || 1} administrador(es) activos
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-purple-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs text-purple-300 font-semibold">
            <span>Canales en Twitch</span>
            <Radio className="w-4 h-4 text-[#9146FF]" />
          </div>
          <div className="text-3xl font-black text-purple-300 font-mono">
            {stats?.twitch?.connectedChannels || 0}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${stats?.twitch?.botConnected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            <span>Bot Global: {stats?.twitch?.globalBotUser || 'No configurado'}</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-[#53FC18]/30 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#53FC18] font-semibold">
            <span>Canales en Kick</span>
            <Radio className="w-4 h-4 text-[#53FC18]" />
          </div>
          <div className="text-3xl font-black text-[#53FC18] font-mono">
            {stats?.kick?.connectedChannels || 0}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${stats?.kick?.pusherConnected ? 'bg-[#53FC18]' : 'bg-slate-500'}`} />
            <span>Bot Global: {stats?.kick?.globalBotUser || 'No configurado'}</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Actividad Global</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400 font-mono">
            {stats?.activity?.totalCommandsExecuted || 0}
          </div>
          <div className="text-[11px] text-slate-500">
            Comandos ejecutados | {stats?.activity?.totalAlertsTriggered || 0} alertas disparadas
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('bots')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'bots'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Bots Globales Maestros (Twitch & Kick)</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'users'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gestión de Cuentas & Usuarios ({usersList.length})</span>
        </button>
      </div>

      {/* TAB 1: BOTS GLOBALES MAESTROS */}
      {activeTab === 'bots' && (
        <form onSubmit={handleSaveGlobalConfig} className="space-y-6">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
            💡 <strong>¿Cómo funcionan los Bots Globales?</strong> Al ingresar las credenciales de tu Bot Maestro de Twitch y de Kick en este panel, todos los streamers registrados se conectarán a través de ellos de forma automática. Tus streamers no tendrán que preocuparse por crear tokens ni claves de desarrollador.
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Twitch Master Bot */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-purple-500/30 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#9146FF] flex items-center justify-center font-black text-white text-sm shadow">
                    Tw
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Bot Maestro de Twitch</h3>
                    <p className="text-xs text-slate-400">Responderá comandos en todos los canales de Twitch</p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-slate-400 font-semibold">Activo</span>
                  <input
                    type="checkbox"
                    checked={globalConfig.twitch.enabled}
                    onChange={(e) =>
                      setGlobalConfig({
                        ...globalConfig,
                        twitch: { ...globalConfig.twitch, enabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-[#9146FF] cursor-pointer"
                  />
                </label>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-semibold">Nombre de Usuario del Bot en Twitch</label>
                  <input
                    type="text"
                    placeholder="ej: MiBot_Master o StreamBot"
                    value={globalConfig.twitch.botUsername}
                    onChange={(e) =>
                      setGlobalConfig({
                        ...globalConfig,
                        twitch: { ...globalConfig.twitch, botUsername: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
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
                  <div className="relative">
                    <input
                      type={showTwitchToken ? 'text' : 'password'}
                      placeholder="oauth:xxxxxxxxxxxxxxxxxxxxxx"
                      value={globalConfig.twitch.botToken}
                      onChange={(e) =>
                        setGlobalConfig({
                          ...globalConfig,
                          twitch: { ...globalConfig.twitch, botToken: e.target.value },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTwitchToken(!showTwitchToken)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showTwitchToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Client ID de Twitch (opcional)</label>
                    <input
                      type="text"
                      placeholder="Client ID de Twitch Developer"
                      value={globalConfig.twitch.clientId || ''}
                      onChange={(e) =>
                        setGlobalConfig({
                          ...globalConfig,
                          twitch: { ...globalConfig.twitch, clientId: e.target.value },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Client Secret (opcional)</label>
                    <input
                      type="password"
                      placeholder="Client Secret"
                      value={globalConfig.twitch.clientSecret || ''}
                      onChange={(e) =>
                        setGlobalConfig({
                          ...globalConfig,
                          twitch: { ...globalConfig.twitch, clientSecret: e.target.value },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Kick Master Bot */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-[#53FC18]/30 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#53FC18] flex items-center justify-center font-black text-black text-sm shadow">
                    Ki
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Bot Maestro de Kick</h3>
                    <p className="text-xs text-slate-400">Responderá comandos en todos los canales de Kick</p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-slate-400 font-semibold">Activo</span>
                  <input
                    type="checkbox"
                    checked={globalConfig.kick.enabled}
                    onChange={(e) =>
                      setGlobalConfig({
                        ...globalConfig,
                        kick: { ...globalConfig.kick, enabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-[#53FC18] cursor-pointer"
                  />
                </label>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-semibold">Nombre de Usuario del Bot en Kick</label>
                  <input
                    type="text"
                    placeholder="ej: StreamBot_Kick"
                    value={globalConfig.kick.botUsername}
                    onChange={(e) =>
                      setGlobalConfig({
                        ...globalConfig,
                        kick: { ...globalConfig.kick, botUsername: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#53FC18]"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-300 font-semibold">Token de Acceso / Bot Token de Kick</label>
                    <a
                      href="https://kick.com/settings/developer"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-green-400 hover:underline"
                    >
                      Kick Developer Portal ↗
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showKickToken ? 'text' : 'password'}
                      placeholder="Bearer token de Kick o token de desarrollador"
                      value={globalConfig.kick.botToken}
                      onChange={(e) =>
                        setGlobalConfig({
                          ...globalConfig,
                          kick: { ...globalConfig.kick, botToken: e.target.value },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#53FC18] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKickToken(!showKickToken)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showKickToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Pusher Key</label>
                    <input
                      type="text"
                      value={globalConfig.kick.pusherKey || '32cbd69e4b950bf97679'}
                      onChange={(e) =>
                        setGlobalConfig({
                          ...globalConfig,
                          kick: { ...globalConfig.kick, pusherKey: e.target.value },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Cluster</label>
                    <input
                      type="text"
                      value={globalConfig.kick.pusherCluster || 'us2'}
                      onChange={(e) =>
                        setGlobalConfig({
                          ...globalConfig,
                          kick: { ...globalConfig.kick, pusherCluster: e.target.value },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {configSaveMsg && (
            <div
              className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                configSaveMsg.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {configSaveMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span>{configSaveMsg.text}</span>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSavingConfig}
              className="px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-xl shadow-amber-500/25 transition active:scale-95 cursor-pointer"
            >
              {isSavingConfig ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Guardar Configuración Global & Sincronizar Bots</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: GESTIÓN DE USUARIOS */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por usuario o canal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto">
              <span className="text-xs text-slate-400 font-semibold">Filtrar por Rol:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="all">Todos ({usersList.length})</option>
                <option value="admin">Solo Administradores</option>
                <option value="user">Solo Streamers</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/50">
                    <th className="p-4 pl-6">Usuario</th>
                    <th className="p-4">Rol</th>
                    <th className="p-4">Canales Vinculados</th>
                    <th className="p-4">Comandos / Alertas</th>
                    <th className="p-4">Creado</th>
                    <th className="p-4 pr-6 text-right">Acciones de Administrador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No se encontraron usuarios coincidentes.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelf = u.id === user?.id;
                      const isLoadingAction = actionLoadingId === u.id;

                      return (
                        <tr key={u.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-4 pl-6">
                            <div className="flex items-center gap-3">
                              <img
                                src={u.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.username}`}
                                alt={u.displayName}
                                className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 object-cover"
                              />
                              <div>
                                <div className="font-bold text-white flex items-center gap-1.5">
                                  <span>{u.displayName || u.username}</span>
                                  {isSelf && (
                                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                                      Tú
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono">@{u.username}</div>
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                u.role === 'admin'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              }`}
                            >
                              {u.role === 'admin' && <Crown className="w-3 h-3 text-amber-400" />}
                              <span>{u.role === 'admin' ? 'Administrador' : 'Streamer'}</span>
                            </span>
                          </td>

                          <td className="p-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {u.accounts.twitch?.connected ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/25 text-[11px] font-mono">
                                  Twitch: #{u.accounts.twitch.channel}
                                </span>
                              ) : null}
                              {u.accounts.kick?.connected ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#53FC18]/15 text-[#53FC18] border border-[#53FC18]/25 text-[11px] font-mono">
                                  Kick: @{u.accounts.kick.channel}
                                </span>
                              ) : null}
                              {!u.accounts.twitch?.connected && !u.accounts.kick?.connected && (
                                <span className="text-slate-500 text-[11px]">Sin canales</span>
                              )}
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="text-slate-300 font-mono text-xs">
                              {u.commandsCount} comandos | {u.stats.alertsTriggeredCount || 0} alertas
                            </div>
                          </td>

                          <td className="p-4 text-slate-400 text-[11px]">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>

                          <td className="p-4 pr-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Impersonate Button */}
                              {!isSelf && (
                                <button
                                  onClick={() => handleImpersonate(u)}
                                  disabled={isLoadingAction}
                                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
                                  title="Ingresar como este usuario para configurar sus alertas y comandos"
                                >
                                  <LogIn className="w-3.5 h-3.5" />
                                  <span>Configurar Cuenta</span>
                                </button>
                              )}

                              {/* Role Switch */}
                              {!isSelf && (
                                <button
                                  onClick={() => handleToggleRole(u)}
                                  disabled={isLoadingAction}
                                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                                  title={u.role === 'admin' ? 'Quitar rango de Administrador' : 'Hacer Administrador'}
                                >
                                  <Crown className={`w-4 h-4 ${u.role === 'admin' ? 'text-amber-400' : 'text-slate-400'}`} />
                                </button>
                              )}

                              {/* Delete Account */}
                              {!isSelf && (
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  disabled={isLoadingAction}
                                  className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
                                  title="Eliminar Cuenta"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
