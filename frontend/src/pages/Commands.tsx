import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Command } from '../types';
import {
  MessageSquareCode,
  Plus,
  Trash2,
  Edit2,
  X,
  Sparkles,
  Search,
} from 'lucide-react';

export const Commands: React.FC = () => {
  const { token } = useAuth();
  const [commands, setCommands] = useState<Command[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCommand, setEditingCommand] = useState<Command | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [response, setResponse] = useState('');
  const [permission, setPermission] = useState<Command['permission']>('everyone');
  const [cooldown, setCooldown] = useState(5);
  const [twitchEnabled, setTwitchEnabled] = useState(true);
  const [kickEnabled, setKickEnabled] = useState(true);

  const fetchCommands = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/user/commands', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCommands(data);
      }
    } catch (e) {
      console.error('Error fetching commands:', e);
    }
  }, [token]);

  useEffect(() => {
    fetchCommands();
  }, [fetchCommands]);

  const openCreateModal = () => {
    setEditingCommand(null);
    setName('!');
    setResponse('');
    setPermission('everyone');
    setCooldown(5);
    setTwitchEnabled(true);
    setKickEnabled(true);
    setIsModalOpen(true);
  };

  const openEditModal = (cmd: Command) => {
    setEditingCommand(cmd);
    setName(cmd.name);
    setResponse(cmd.response);
    setPermission(cmd.permission);
    setCooldown(cmd.cooldown);
    setTwitchEnabled(cmd.platforms.includes('twitch'));
    setKickEnabled(cmd.platforms.includes('kick'));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !response.trim() || !token) return;

    const platforms: ('twitch' | 'kick')[] = [];
    if (twitchEnabled) platforms.push('twitch');
    if (kickEnabled) platforms.push('kick');

    if (platforms.length === 0) {
      alert('Debes seleccionar al menos una plataforma (Twitch o Kick)');
      return;
    }

    const payload = {
      name: name.startsWith('!') ? name.trim() : `!${name.trim()}`,
      response: response.trim(),
      permission,
      cooldown,
      platforms,
      enabled: editingCommand ? editingCommand.enabled : true,
    };

    try {
      if (editingCommand) {
        await fetch(`/api/user/commands/${editingCommand.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/user/commands', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }
      setIsModalOpen(false);
      fetchCommands();
    } catch (e) {
      console.error('Error saving command:', e);
    }
  };

  const handleToggle = async (cmd: Command) => {
    if (!token) return;
    try {
      await fetch(`/api/user/commands/${cmd.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: !cmd.enabled }),
      });
      fetchCommands();
    } catch (e) {
      console.error('Error toggling command:', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este comando?') || !token) return;
    try {
      await fetch(`/api/user/commands/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCommands();
    } catch (e) {
      console.error('Error deleting command:', e);
    }
  };

  const insertVariable = (variable: string) => {
    setResponse((prev) => `${prev} ${variable}`);
  };

  const filteredCommands = commands.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.response.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquareCode className="w-6 h-6 text-indigo-400" /> Comandos Personalizados de Chat
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Crea comandos interactivos con variables dinámicas, permisos y cooldowns para Twitch y Kick.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Crear Comando
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <Search className="w-5 h-5 text-slate-400 ml-2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar comando por nombre o respuesta..."
          className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Commands Table / List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-bold uppercase text-slate-400 border-b border-slate-800 tracking-wider">
              <tr>
                <th className="px-6 py-4">Comando</th>
                <th className="px-6 py-4">Respuesta</th>
                <th className="px-6 py-4">Plataformas</th>
                <th className="px-6 py-4">Permiso</th>
                <th className="px-6 py-4">Cooldown</th>
                <th className="px-6 py-4">Uso</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCommands.map((cmd) => (
                <tr key={cmd.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-6 py-4 font-bold text-white font-mono flex items-center gap-2">
                    <span className="px-2 py-1 rounded-lg bg-indigo-900/40 border border-indigo-700/50 text-indigo-300 text-xs">
                      {cmd.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-md truncate text-slate-200">
                    {cmd.response}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {cmd.platforms.includes('twitch') && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Twitch
                        </span>
                      )}
                      {cmd.platforms.includes('kick') && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#53FC18]/20 text-[#53FC18] border border-[#53FC18]/30">
                          Kick
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 capitalize">
                      {cmd.permission === 'everyone' ? 'Todos' : cmd.permission}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-400">
                    {cmd.cooldown}s
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-400">
                    {cmd.useCount || 0}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggle(cmd)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          cmd.enabled
                            ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                        }`}
                      >
                        {cmd.enabled ? 'Activo' : 'Pausado'}
                      </button>
                      <button
                        onClick={() => openEditModal(cmd)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cmd.id)}
                        className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-6 animate-alert-zoom">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {editingCommand ? 'Editar Comando' : 'Nuevo Comando Personalizado'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre del Comando (incluye !) *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="!redes"
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Respuesta del Bot *
                  </label>
                </div>
                <textarea
                  rows={3}
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="¡Hola {user}! Síguenos en nuestras redes..."
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-sm text-white focus:outline-none transition"
                />

                {/* Variable tags helper */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 mr-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-400" /> Variables:
                  </span>
                  {[
                    '{user}',
                    '{touser}',
                    '{args}',
                    '{count}',
                    '{channel}',
                    '{streamer}',
                    '{time}',
                    '{random:1-100}',
                    '{random:1-6}',
                  ].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariable(v)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] font-mono border border-slate-700"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Permiso de Uso
                  </label>
                  <select
                    value={permission}
                    onChange={(e) => setPermission(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="everyone">Todos los usuarios</option>
                    <option value="vip">Solo VIPs y Mods</option>
                    <option value="mod">Solo Moderadores</option>
                    <option value="broadcaster">Solo el Streamer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Cooldown ({cooldown} segundos)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={cooldown}
                    onChange={(e) => setCooldown(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-500 mt-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Plataformas Activas
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/30 px-3 py-2 rounded-xl">
                    <input
                      type="checkbox"
                      checked={twitchEnabled}
                      onChange={(e) => setTwitchEnabled(e.target.checked)}
                      className="rounded accent-[#9146FF]"
                    />
                    Twitch
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#53FC18] bg-[#53FC18]/10 border border-[#53FC18]/30 px-3 py-2 rounded-xl">
                    <input
                      type="checkbox"
                      checked={kickEnabled}
                      onChange={(e) => setKickEnabled(e.target.checked)}
                      className="rounded accent-[#53FC18]"
                    />
                    Kick
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
                >
                  Guardar Comando
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
