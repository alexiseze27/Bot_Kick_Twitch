import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Timer } from '../types';
import { Timer as TimerIcon, Plus, Trash2, Edit2, Clock, MessageSquare, PlusCircle, X } from 'lucide-react';

export const Timers: React.FC = () => {
  const { token } = useAuth();
  const [timers, setTimers] = useState<Timer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTimer, setEditingTimer] = useState<Timer | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [messages, setMessages] = useState<string[]>(['']);
  const [intervalMinutes, setIntervalMinutes] = useState(15);
  const [chatLinesThreshold, setChatLinesThreshold] = useState(5);
  const [twitchEnabled, setTwitchEnabled] = useState(true);
  const [kickEnabled, setKickEnabled] = useState(true);

  const fetchTimers = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/user/timers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTimers(data);
      }
    } catch (e) {
      console.error('Error fetching timers:', e);
    }
  }, [token]);

  useEffect(() => {
    fetchTimers();
  }, [fetchTimers]);

  const openCreateModal = () => {
    setEditingTimer(null);
    setName('');
    setMessages(['🔔 ¡Recuerda seguir el canal y activar las notificaciones!']);
    setIntervalMinutes(15);
    setChatLinesThreshold(5);
    setTwitchEnabled(true);
    setKickEnabled(true);
    setIsModalOpen(true);
  };

  const openEditModal = (t: Timer) => {
    setEditingTimer(t);
    setName(t.name);
    setMessages(t.messages.length > 0 ? t.messages : ['']);
    setIntervalMinutes(t.intervalMinutes);
    setChatLinesThreshold(t.chatLinesThreshold);
    setTwitchEnabled(t.platforms.includes('twitch'));
    setKickEnabled(t.platforms.includes('kick'));
    setIsModalOpen(true);
  };

  const handleAddMessageField = () => {
    setMessages((prev) => [...prev, '']);
  };

  const handleMessageChange = (index: number, val: string) => {
    setMessages((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleRemoveMessageField = (index: number) => {
    if (messages.length === 1) return;
    setMessages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMessages = messages.map((m) => m.trim()).filter((m) => m.length > 0);
    if (!name.trim() || cleanMessages.length === 0 || !token) return;

    const platforms: ('twitch' | 'kick')[] = [];
    if (twitchEnabled) platforms.push('twitch');
    if (kickEnabled) platforms.push('kick');

    const payload = {
      name: name.trim(),
      messages: cleanMessages,
      intervalMinutes,
      chatLinesThreshold,
      platforms,
      enabled: editingTimer ? editingTimer.enabled : true,
    };

    try {
      if (editingTimer) {
        await fetch(`/api/user/timers/${editingTimer.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/user/timers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }
      setIsModalOpen(false);
      fetchTimers();
    } catch (e) {
      console.error('Error saving timer:', e);
    }
  };

  const handleToggle = async (t: Timer) => {
    if (!token) return;
    try {
      await fetch(`/api/user/timers/${t.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: !t.enabled }),
      });
      fetchTimers();
    } catch (e) {
      console.error('Error toggling timer:', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Deseas eliminar este temporizador?') || !token) return;
    try {
      await fetch(`/api/user/timers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTimers();
    } catch (e) {
      console.error('Error deleting timer:', e);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <TimerIcon className="w-6 h-6 text-indigo-400" /> Temporizadores Automáticos
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Envía mensajes periódicos en Twitch y Kick cada X minutos si el chat ha estado activo.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Crear Temporizador
        </button>
      </div>

      {/* Timers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {timers.map((timer) => (
          <div
            key={timer.id}
            className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-5"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-white text-base">{timer.name}</h3>
                <button
                  onClick={() => handleToggle(timer)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                    timer.enabled
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                  }`}
                >
                  {timer.enabled ? 'Activo' : 'Pausado'}
                </button>
              </div>

              {/* Timing info */}
              <div className="flex items-center gap-4 my-3 text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" /> Cada {timer.intervalMinutes} min
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" /> Mínimo {timer.chatLinesThreshold} líneas de chat
                </div>
              </div>

              {/* Messages list */}
              <div className="space-y-2 mt-4">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Mensajes en rotación ({timer.messages.length}):
                </div>
                {timer.messages.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200"
                  >
                    {m}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {timer.platforms.includes('twitch') && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Twitch
                  </span>
                )}
                {timer.platforms.includes('kick') && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#53FC18]/20 text-[#53FC18] border border-[#53FC18]/30">
                    Kick
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(timer)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(timer.id)}
                  className="p-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add / Edit Timer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-6 animate-alert-zoom">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {editingTimer ? 'Editar Temporizador' : 'Nuevo Temporizador'}
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
                  Nombre descriptivo *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ej: Aviso de Discord y Redes"
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Mensajes en Rotación *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddMessageField}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Agregar Mensaje
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {messages.map((msg, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={msg}
                        onChange={(e) => handleMessageChange(idx, e.target.value)}
                        placeholder={`Mensaje #${idx + 1}`}
                        required
                        className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition"
                      />
                      {messages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMessageField(idx)}
                          className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/20"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Intervalo ({intervalMinutes} minutos)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    value={intervalMinutes}
                    onChange={(e) => setIntervalMinutes(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-500 mt-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Líneas mínimas de chat ({chatLinesThreshold})
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={chatLinesThreshold}
                    onChange={(e) => setChatLinesThreshold(parseInt(e.target.value, 10))}
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
                  Guardar Temporizador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
