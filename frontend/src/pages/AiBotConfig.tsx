import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { AiBotConfig } from '../types';
import {
  Bot,
  Sparkles,
  Volume2,
  Shield,
  Palette,
  Play,
  Copy,
  Check,
  ExternalLink,
  Power,
  RefreshCw,
  Key,
  Flame,
  Laugh,
  Settings2,
} from 'lucide-react';

const personalityPresets = [
  {
    id: 'toxic_gamer',
    name: '😈 Tóxico Gamer & Burlón (Insultos Cómicos)',
    desc: 'Insulta con humor y se burla de los que hacen preguntas obvias.',
    prompt:
      'Eres un robot de stream sarcástico, burlón y muy divertido. Responde SIEMPRE DIRECTAMENTE a lo que te dicen o preguntan en el chat con comentarios cómicos, descansando al espectador o bromeando con humor de stream latinoamericano/español. Si te dicen "hola cómo estás" responde por ejemplo: "Hola @usuario, ¿y a vos qué te interesa si estoy bien? Igual sí, ando de diez con los circuitos a pleno... ¿y vos qué querés?". Si preguntan tonterías, trátalos de mancos/noobs con humor. Respuestas cortas (máximo 2 oraciones) y muy graciosas.',
  },
  {
    id: 'double_meaning',
    name: '🌶️ Doble Sentido & Humor Picante (Malpensado)',
    desc: 'Le busca el doble sentido y chistes pícaros a todas las preguntas.',
    prompt:
      'Eres un robot de stream pícaro, malpensado y con mucho sentido del humor. A cualquier cosa que te digan o pregunten en el chat, responde directamente buscándole un doble sentido cómico, chiste pícaro o insinuación divertida sin cruzar el límite extremo de censura. Mantén las respuestas cortas (máximo 2 oraciones) y muy graciosas para entretener a los espectadores.',
  },
  {
    id: 'gamer_fun',
    name: '🤖 Gamer Divertido & Buena Onda',
    desc: 'Simpático, carismático y con humor gamer para todo público.',
    prompt:
      'Eres RoboStream, el simpático asistente robótico del canal. El streamer fue a buscar agua/snacks y vuelve enseguida. Tu misión es entretener al chat con humor gamer, responder con buena onda y en español breve (máximo 2 oraciones).',
  },
  {
    id: 'cyber_scifi',
    name: '👽 Cyberpunk Sci-Fi',
    desc: 'Inteligencia artificial avanzada, eficiente y sarcástica de una nave.',
    prompt:
      'Eres una inteligencia artificial avanzada y sarcástica de una nave espacial en el año 2099. Responde con tecnicismos futuristas, diagnósticos de circuitos y comentarios agudos en español breve.',
  },
  {
    id: 'epic_guardian',
    name: '🛡️ Guardián del Stream',
    desc: 'Centinela protector que habla como guerrero de anime o fantasía.',
    prompt:
      'Eres el centinela supremo y protector del canal. El capitán streamer está temporalmente AFK. Mantén el orden en el chat, recuerda seguir el canal y responde preguntas de forma épica y heroica en español (máximo 2 frases).',
  },
  {
    id: 'chill_friend',
    name: '☕ Asistente Servicial & Chill',
    desc: 'Tranquilo, educado y servicial para directos relajados.',
    prompt:
      'Eres el asistente personal del canal. El streamer se tomó una pequeña pausa. Responde amablemente todas las preguntas de los espectadores, agradece su presencia y diles que el directo continuará en breve.',
  },
];

const robotThemes = [
  {
    id: 'cyber-robot',
    name: 'Cyber Bot Clásico',
    desc: 'Sin rebordes en el medio, diseño unificado y futurista con visor LED.',
    badge: 'Popular',
  },
  {
    id: 'mech-warrior',
    name: 'Gundam / Mecha Cyberpunk',
    desc: 'Blindaje angulado, antenas de batalla y visor táctico agresivo.',
    badge: 'Táctico',
  },
  {
    id: 'chibi-cute',
    name: 'Kawaii / Chibi Bot',
    desc: 'Cabecita redonda, mejillas sonrojadas y expresiones adorables.',
    badge: 'Tierno',
  },
  {
    id: 'retro-arcade',
    name: 'Retro 8-Bit Arcade CRT',
    desc: 'Monitor arcade vintage con ojos pixelados y scanlines.',
    badge: 'Retro',
  },
  {
    id: 'alien-orb',
    name: 'Orbe Holográfico / Jarvis',
    desc: 'Esfera cuántica flotante de energía pura con anillos orbitales.',
    badge: 'Sci-Fi',
  },
  {
    id: 'cat-bot',
    name: 'Neko Cyber Cat',
    desc: 'Robot gatuno futurista con orejas cibernéticas y bigotes LED.',
    badge: 'Gatito',
  },
];

export const AiBotConfigPage: React.FC = () => {
  const { user, token } = useAuth();

  const [config, setConfig] = useState<AiBotConfig>({
    enabled: true,
    isAfk: false,
    triggerCommand: '!ia',
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-3.5-flash',
    systemPrompt: personalityPresets[0].prompt,
    maxTokens: 120,
    cooldownSeconds: 6,
    permission: 'everyone',
    platforms: ['twitch', 'kick'],
    replyInChat: false,
    tts: {
      enabled: true,
      voice: 'es-ES',
      volume: 0.9,
      rate: 1.0,
      pitch: 1.0,
    },
    avatar: {
      theme: 'cyber-robot',
      primaryColor: '#53FC18',
      secondaryColor: '#9146FF',
      bodyColor: '#0f172a',
      robotName: 'RoboStream',
      showSpeechBubble: true,
      bubbleStyle: 'cyber',
      bubbleBgColor: 'rgba(2, 6, 23, 0.92)',
      bubbleTextColor: '#f8fafc',
      bubbleDuration: 8,
      scale: 1.0,
      position: 'bottom-right',
      showGlow: true,
      showEnergyRings: true,
      showAntenna: true,
      showStatusPill: true,
      showTriggerBadge: true,
      promptPreset: 'toxic_gamer',
    },
  });

  const [activeTab, setActiveTab] = useState<'ai' | 'avatar' | 'tts' | 'limits' | 'test'>('ai');
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Simulator test state
  const [testQuestion, setTestQuestion] = useState('¿Por qué juegas tan mal a los jueguitos?');
  const [testUser, setTestUser] = useState('EspectadorGamer');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Load available system TTS voices
  useEffect(() => {
    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        setSystemVoices(voices);
      }
    };

    loadVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Fetch initial config
  useEffect(() => {
    if (!token) return;
    fetch('/api/user/ai-config', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.config) {
          setConfig((prev) => ({
            ...prev,
            ...data.config,
            tts: { ...prev.tts, ...(data.config.tts || {}) },
            avatar: { ...prev.avatar, ...(data.config.avatar || {}) },
          }));
        }
      })
      .catch(console.error);
  }, [token]);

  const overlayUrl = useMemo(() => {
    if (!user?.overlayKey) return '';
    return `${window.location.origin}/overlay/ai-bot?key=${user.overlayKey}`;
  }, [user?.overlayKey]);

  const handleCopyUrl = () => {
    if (!overlayUrl) return;
    navigator.clipboard.writeText(overlayUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleSaveConfig = async () => {
    if (!token) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/user/ai-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Error saving AI config:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAfk = async () => {
    if (!token) return;
    const nextAfk = !config.isAfk;
    setConfig((prev) => ({ ...prev, isAfk: nextAfk }));

    try {
      await fetch('/api/user/ai-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isAfk: nextAfk }),
      });
    } catch (e) {
      console.error('Error toggling AFK status:', e);
    }
  };

  const handleTestTtsVoice = () => {
    if (!('speechSynthesis' in window)) {
      alert('Tu navegador no soporta síntesis de voz (TTS).');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance('¡Hola gente del directo! Soy el robot de inteligencia artificial en el canal.');
    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = voices.find(
      (v) => v.name === config.tts.voice || v.lang === config.tts.voice || v.lang.startsWith('es')
    );
    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.volume = config.tts.volume;
    utterance.rate = config.tts.rate;
    utterance.pitch = config.tts.pitch;

    window.speechSynthesis.speak(utterance);
  };

  const handleRunSimulator = async () => {
    if (!token) return;
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/user/ai-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: testQuestion,
          user: testUser,
        }),
      });

      const data = await res.json();
      if (res.ok && data.response) {
        setTestResult(data.response);
      } else {
        setTestResult(data.error || 'Error al generar respuesta simulada');
      }
    } catch (e: any) {
      setTestResult(e.message || 'Error de conexión');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
              <Bot className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                Robot IA para Directos (Modo AFK / Ya Vuelvo)
              </h1>
              <p className="text-xs text-slate-400">
                Avatar 3D/2D animado para OBS que responde con voz y texto a las preguntas de tu chat cuando te ausentas.
              </p>
            </div>
          </div>
        </div>

        {/* Action Toggle AFK & Save */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* AFK Live Toggle Button */}
          <button
            onClick={handleToggleAfk}
            className={`px-5 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer ${
              config.isAfk
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25 ring-2 ring-emerald-400/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            <Power className={`w-4 h-4 ${config.isAfk ? 'animate-pulse' : ''}`} />
            <span>{config.isAfk ? 'ROBOT VISIBLE EN OBS (AFK ON)' : 'ROBOT OCULTO EN OBS (AFK OFF)'}</span>
          </button>

          {/* Save Config */}
          <button
            onClick={handleSaveConfig}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{saveSuccess ? '¡Guardado!' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </div>

      {/* OBS URL Link Banner */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-indigo-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>URL de Fuente de Navegador para OBS Studio</span>
          </div>
          <p className="text-xs text-slate-400">
            Añade una fuente de navegador en OBS con esta URL. Resolución recomendada: <strong>1920x1080</strong> con fondo transparente.
          </p>
          <div className="font-mono text-xs text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 inline-block break-all">
            {overlayUrl || 'Cargando clave privada...'}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyUrl}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md shadow-indigo-600/20"
          >
            {copiedUrl ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copiedUrl ? '¡Copiada!' : 'Copiar URL para OBS'}</span>
          </button>
          <a
            href={overlayUrl}
            target="_blank"
            rel="noreferrer"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Abrir en pestaña nueva"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'ai' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Inteligencia & Personalidad</span>
        </button>

        <button
          onClick={() => setActiveTab('avatar')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'avatar' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Diseño del Robot & OBS</span>
        </button>

        <button
          onClick={() => setActiveTab('tts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'tts' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          <span>Voz del Robot (TTS)</span>
        </button>

        <button
          onClick={() => setActiveTab('limits')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'limits' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Comando & Permisos</span>
        </button>

        <button
          onClick={() => setActiveTab('test')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'test' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Play className="w-4 h-4" />
          <span>Simulador en Vivo</span>
        </button>
      </div>

      {/* TAB 1: INTELIGENCIA & PERSONALIDAD */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Provider & Model */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-400" />
                <span>Motor de Inteligencia Artificial</span>
              </h3>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-semibold">Proveedor de IA</label>
                <select
                  value={config.provider}
                  onChange={(e) => setConfig({ ...config, provider: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-semibold"
                >
                  <option value="gemini">Google Gemini (Recomendado - Gratis y Rápido)</option>
                  <option value="groq">Groq (Llama 3.3 Ultra Rápido)</option>
                  <option value="openai">OpenAI (ChatGPT / GPT-4o mini)</option>
                  <option value="mock">Simulador Local Inteligente (Sin API Key)</option>
                </select>
              </div>

              {config.provider !== 'mock' && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-slate-400 font-semibold">API Key del Proveedor</label>
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="text-[11px] text-indigo-400 hover:underline cursor-pointer"
                      >
                        {showApiKey ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={config.apiKey || ''}
                        onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                        placeholder="Ingresa tu API Key..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 pr-10"
                      />
                      <Key className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 font-semibold">Modelo</label>
                    <input
                      type="text"
                      value={config.model || ''}
                      onChange={(e) => setConfig({ ...config, model: e.target.value })}
                      placeholder={
                        config.provider === 'gemini'
                          ? 'gemini-3.5-flash'
                          : config.provider === 'groq'
                          ? 'llama-3.3-70b-versatile'
                          : 'gpt-4o-mini'
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Personality Presets & System Prompt */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    <span>Personalidad del Robot (System Prompt)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Elige una personalidad lista con un clic o personaliza el comportamiento libremente.
                  </p>
                </div>
              </div>

              {/* Presets Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {personalityPresets.map((preset) => {
                  const isSelected = config.avatar.promptPreset === preset.id || config.systemPrompt === preset.prompt;

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        setConfig({
                          ...config,
                          systemPrompt: preset.prompt,
                          avatar: { ...config.avatar, promptPreset: preset.id },
                        })
                      }
                      className={`p-3.5 rounded-2xl text-left transition-all flex flex-col justify-between border cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500/50 shadow-md shadow-indigo-500/15 ring-1 ring-indigo-500'
                          : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-white text-xs flex items-center justify-between">
                          <span>{preset.name}</span>
                          {preset.id === 'toxic_gamer' && <Flame className="w-3.5 h-3.5 text-rose-400" />}
                          {preset.id === 'double_meaning' && <Laugh className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">{preset.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Prompt Box */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs text-slate-300 font-semibold">Prompt del Sistema Activo</label>
                <textarea
                  rows={4}
                  value={config.systemPrompt}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      systemPrompt: e.target.value,
                      avatar: { ...config.avatar, promptPreset: 'custom' },
                    })
                  }
                  placeholder="Define cómo debe responder el robot a los espectadores..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DISEÑO DEL ROBOT & OBS */}
      {activeTab === 'avatar' && (
        <div className="space-y-6">
          {/* Models / Themes Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-400" />
              <span>Selecciona el Modelo Visual del Robot</span>
            </h3>
            <p className="text-xs text-slate-400">
              Elige el estilo estético del robot animado que se mostrará en tu overlay de OBS.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {robotThemes.map((m) => {
                const isSelected = (config.avatar.theme || 'cyber-robot') === m.id;

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setConfig({ ...config, avatar: { ...config.avatar, theme: m.id as any } })}
                    className={`p-4 rounded-2xl text-left transition-all border flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500'
                        : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-white text-sm">{m.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{m.desc}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                      <span className={isSelected ? 'text-indigo-400 font-bold' : 'text-slate-500'}>
                        {isSelected ? '✓ Seleccionado' : 'Hacer clic para elegir'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color & Visual Toggles */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Colors */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-400" />
                <span>Colores del Robot</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Primary LED Color */}
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-semibold">Color LED (Ojos / Luces)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.avatar.primaryColor}
                      onChange={(e) =>
                        setConfig({ ...config, avatar: { ...config.avatar, primaryColor: e.target.value } })
                      }
                      className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={config.avatar.primaryColor}
                      onChange={(e) =>
                        setConfig({ ...config, avatar: { ...config.avatar, primaryColor: e.target.value } })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs font-mono text-white"
                    />
                  </div>
                </div>

                {/* Secondary Accent */}
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-semibold">Color Secundario (Detalles)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.avatar.secondaryColor}
                      onChange={(e) =>
                        setConfig({ ...config, avatar: { ...config.avatar, secondaryColor: e.target.value } })
                      }
                      className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={config.avatar.secondaryColor}
                      onChange={(e) =>
                        setConfig({ ...config, avatar: { ...config.avatar, secondaryColor: e.target.value } })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs font-mono text-white"
                    />
                  </div>
                </div>

                {/* Body Chassis Color */}
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-semibold">Color del Chasis / Cuerpo</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.avatar.bodyColor || '#0f172a'}
                      onChange={(e) =>
                        setConfig({ ...config, avatar: { ...config.avatar, bodyColor: e.target.value } })
                      }
                      className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={config.avatar.bodyColor || '#0f172a'}
                      onChange={(e) =>
                        setConfig({ ...config, avatar: { ...config.avatar, bodyColor: e.target.value } })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs font-mono text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Robot Name & Position */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-semibold">Nombre del Robot</label>
                  <input
                    type="text"
                    value={config.avatar.robotName}
                    onChange={(e) =>
                      setConfig({ ...config, avatar: { ...config.avatar, robotName: e.target.value } })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-semibold">Posición en Pantalla (OBS)</label>
                  <select
                    value={config.avatar.position}
                    onChange={(e) =>
                      setConfig({ ...config, avatar: { ...config.avatar, position: e.target.value as any } })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="bottom-right">Esquina Inferior Derecha</option>
                    <option value="bottom-left">Esquina Inferior Izquierda</option>
                    <option value="bottom-center">Centro Inferior</option>
                    <option value="top-right">Esquina Superior Derecha</option>
                    <option value="top-left">Esquina Superior Izquierda</option>
                    <option value="center">Centro de Pantalla</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Visual Switches & Effects */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-indigo-400" />
                <span>Efectos Visuales & Elementos</span>
              </h3>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-white">Resplandor Neón (Glow)</div>
                    <div className="text-[11px] text-slate-400">Efecto de luz brillante alrededor del robot</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.avatar.showGlow !== false}
                    onChange={(e) =>
                      setConfig({ ...config, avatar: { ...config.avatar, showGlow: e.target.checked } })
                    }
                    className="w-4 h-4 accent-indigo-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-white">Anillos de Energía Giratorios</div>
                    <div className="text-[11px] text-slate-400">Anillos cuánticos orbitales alrededor del cuerpo</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.avatar.showEnergyRings !== false}
                    onChange={(e) =>
                      setConfig({ ...config, avatar: { ...config.avatar, showEnergyRings: e.target.checked } })
                    }
                    className="w-4 h-4 accent-indigo-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-white">Antena Superior</div>
                    <div className="text-[11px] text-slate-400">Antena con LED indicador en la cabeza</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.avatar.showAntenna !== false}
                    onChange={(e) =>
                      setConfig({ ...config, avatar: { ...config.avatar, showAntenna: e.target.checked } })
                    }
                    className="w-4 h-4 accent-indigo-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-white">Píldora Superior (AFK / Ya Vuelvo)</div>
                    <div className="text-[11px] text-slate-400">Muestra el nombre y estado sobre la cabeza</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.avatar.showStatusPill !== false}
                    onChange={(e) =>
                      setConfig({ ...config, avatar: { ...config.avatar, showStatusPill: e.target.checked } })
                    }
                    className="w-4 h-4 accent-indigo-500"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VOZ DEL ROBOT (TTS) */}
      {activeTab === 'tts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-indigo-400" />
                <span>Configuración de Voz (Text-to-Speech)</span>
              </h3>
              <p className="text-xs text-slate-400">
                La voz se reproduce automáticamente en el overlay de OBS cuando el robot responde una pregunta.
              </p>
            </div>

            <button
              onClick={handleTestTtsVoice}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span>Probar Voz Actual</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-xs text-slate-400 font-semibold">Seleccionar Voz del Navegador</label>
              <select
                value={config.tts.voice}
                onChange={(e) => setConfig({ ...config, tts: { ...config.tts, voice: e.target.value } })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="es-ES">Predeterminada (Español)</option>
                {systemVoices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                Detecta automáticamente todas las voces instaladas en Windows y OBS Browser.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Tono (Pitch / Efecto Robótico)</span>
                  <span className="text-indigo-400 font-mono">{config.tts.pitch.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.8"
                  step="0.1"
                  value={config.tts.pitch}
                  onChange={(e) =>
                    setConfig({ ...config, tts: { ...config.tts, pitch: parseFloat(e.target.value) } })
                  }
                  className="w-full accent-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Velocidad (Rate)</span>
                  <span className="text-indigo-400 font-mono">{config.tts.rate.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.5"
                  step="0.1"
                  value={config.tts.rate}
                  onChange={(e) =>
                    setConfig({ ...config, tts: { ...config.tts, rate: parseFloat(e.target.value) } })
                  }
                  className="w-full accent-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Volumen</span>
                  <span className="text-indigo-400 font-mono">{Math.round(config.tts.volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.tts.volume}
                  onChange={(e) =>
                    setConfig({ ...config, tts: { ...config.tts, volume: parseFloat(e.target.value) } })
                  }
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COMANDOS & LÍMITES */}
      {activeTab === 'limits' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            <span>Comando Disparador & Control de Spam</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-semibold">Comando para el Chat</label>
              <input
                type="text"
                value={config.triggerCommand}
                onChange={(e) => setConfig({ ...config, triggerCommand: e.target.value })}
                placeholder="!ia"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-500">Ejemplo: !ia ¿dónde está el streamer?</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-semibold">Cooldown / Tiempo de Espera (Segundos)</label>
              <input
                type="number"
                min="3"
                max="60"
                value={config.cooldownSeconds}
                onChange={(e) => setConfig({ ...config, cooldownSeconds: parseInt(e.target.value, 10) || 5 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-500">Evita que múltiples personas saturen el audio.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-semibold">¿Quién puede usar el comando?</label>
              <select
                value={config.permission}
                onChange={(e) => setConfig({ ...config, permission: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-semibold"
              >
                <option value="everyone">Todos los Espectadores</option>
                <option value="vip">VIPs, Mods y Streamer</option>
                <option value="mod">Solo Moderadores</option>
                <option value="broadcaster">Solo el Streamer</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SIMULADOR EN VIVO */}
      {activeTab === 'test' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Play className="w-5 h-5 text-emerald-400" />
                <span>Simulador de Preguntas y Respuestas</span>
              </h3>
              <p className="text-xs text-slate-400">
                Escribe una pregunta para probar cómo responde el robot con la personalidad configurada.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">Nombre del Espectador Simulado</label>
                <input
                  type="text"
                  value={testUser}
                  onChange={(e) => setTestUser(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">Pregunta del Chat</label>
                <textarea
                  rows={3}
                  value={testQuestion}
                  onChange={(e) => setTestQuestion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white"
                />
              </div>

              <button
                onClick={handleRunSimulator}
                disabled={isTesting}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
              >
                {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                <span>Simular Pregunta en Vivo</span>
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs text-slate-400 font-semibold">Resultado de la IA:</label>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 min-h-[140px] text-sm text-slate-200 leading-relaxed font-mono">
                {isTesting ? (
                  <div className="flex items-center gap-2 text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>Procesando respuesta con la personalidad seleccionada...</span>
                  </div>
                ) : testResult ? (
                  <div>{testResult}</div>
                ) : (
                  <span className="text-slate-500 italic">
                    Haz clic en "Simular Pregunta" para ver la respuesta aquí.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
