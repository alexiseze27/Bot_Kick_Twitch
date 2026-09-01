import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { AiBotConfig, AiSpeechEvent } from '../../types';
import { Sparkles, MessageSquare, Volume2 } from 'lucide-react';

const defaultAiConfig: AiBotConfig = {
  enabled: true,
  isAfk: true,
  triggerCommand: '!ia',
  provider: 'mock',
  systemPrompt: '',
  maxTokens: 120,
  cooldownSeconds: 8,
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
    promptPreset: 'gamer_fun',
  },
};

export const AiBotOverlay: React.FC = () => {
  const [searchParams] = useSearchParams();
  const overlayKey = searchParams.get('key');
  const { socket, latestAiSpeech, aiStatus } = useSocket();

  const [aiConfig, setAiConfig] = useState<AiBotConfig>(defaultAiConfig);
  const [isAfk, setIsAfk] = useState<boolean>(false);
  const [robotState, setRobotState] = useState<'idle' | 'thinking' | 'speaking'>('idle');
  const [currentSpeech, setCurrentSpeech] = useState<AiSpeechEvent | null>(null);
  const [displayedText, setDisplayedText] = useState<string>('');
  const [speechQueue, setSpeechQueue] = useState<AiSpeechEvent[]>([]);
  const isSpeakingRef = useRef(false);
  const bubbleTimeoutRef = useRef<any>(null);

  // Set transparent background for OBS overlay
  useEffect(() => {
    document.documentElement.classList.add('overlay-mode');
    document.body.classList.add('overlay-mode');

    return () => {
      document.documentElement.classList.remove('overlay-mode');
      document.body.classList.remove('overlay-mode');
    };
  }, []);

  // Fetch initial configuration by overlayKey
  useEffect(() => {
    if (overlayKey) {
      fetch(`/api/overlay/data?key=${overlayKey}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.config?.overlay?.aiBot) {
            setAiConfig({ ...defaultAiConfig, ...data.config.overlay.aiBot });
            setIsAfk(!!data.config.overlay.aiBot.isAfk);
          }
        })
        .catch(console.error);

      if (socket) {
        socket.emit('auth:join', { overlayKey });
      }
    }
  }, [overlayKey, socket]);

  // Listen to live AFK status and config updates
  useEffect(() => {
    if (aiStatus) {
      setIsAfk(aiStatus.isAfk);
      if (aiStatus.config) {
        setAiConfig({ ...defaultAiConfig, ...aiStatus.config });
      }
    }
  }, [aiStatus]);

  // Queue speech events
  useEffect(() => {
    if (latestAiSpeech) {
      setSpeechQueue((prev) => [...prev, latestAiSpeech]);
    }
  }, [latestAiSpeech]);

  // Process speech queue
  useEffect(() => {
    if (speechQueue.length > 0 && !isSpeakingRef.current) {
      const nextSpeech = speechQueue[0];
      setSpeechQueue((prev) => prev.slice(1));
      handleSpeak(nextSpeech);
    }
  }, [speechQueue]);

  const handleSpeak = (speech: AiSpeechEvent) => {
    isSpeakingRef.current = true;
    setCurrentSpeech(speech);
    setRobotState('speaking');
    setDisplayedText('');

    // Typewriter effect for speech bubble
    let charIndex = 0;
    const fullText = speech.response;
    const typeInterval = setInterval(() => {
      if (charIndex < fullText.length) {
        setDisplayedText(fullText.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeInterval);
      }
    }, 22);

    // Trigger TTS in browser if enabled
    if (aiConfig.tts?.enabled !== false && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(speech.response);

        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const selectedVoice = voices.find(
            (v) => v.name === aiConfig.tts.voice || v.lang === aiConfig.tts.voice || v.lang.startsWith('es')
          );
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
        }

        utterance.volume = aiConfig.tts.volume !== undefined ? aiConfig.tts.volume : 0.9;
        utterance.rate = aiConfig.tts.rate !== undefined ? aiConfig.tts.rate : 1.0;
        utterance.pitch = aiConfig.tts.pitch !== undefined ? aiConfig.tts.pitch : 1.0;

        utterance.onend = () => finishSpeaking();
        utterance.onerror = () => finishSpeaking();

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.error('Speech synthesis error:', e);
        finishSpeaking();
      }
    } else {
      const duration = Math.max(3500, speech.response.length * 65);
      setTimeout(finishSpeaking, duration);
    }
  };

  const finishSpeaking = () => {
    setRobotState('idle');
    isSpeakingRef.current = false;

    if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    const bubbleDuration = (aiConfig.avatar?.bubbleDuration || 8) * 1000;

    bubbleTimeoutRef.current = setTimeout(() => {
      setCurrentSpeech(null);
      setDisplayedText('');
    }, bubbleDuration);
  };

  if (!isAfk) {
    return <div className="w-screen h-screen bg-transparent pointer-events-none" />;
  }

  const primary = aiConfig.avatar?.primaryColor || '#53FC18';
  const secondary = aiConfig.avatar?.secondaryColor || '#9146FF';
  const bodyColor = aiConfig.avatar?.bodyColor || '#0f172a';
  const robotName = aiConfig.avatar?.robotName || 'RoboStream';
  const scale = aiConfig.avatar?.scale || 1.0;
  const position = aiConfig.avatar?.position || 'bottom-right';
  const theme = aiConfig.avatar?.theme || 'cyber-robot';
  const showGlow = aiConfig.avatar?.showGlow !== false;
  const showEnergyRings = aiConfig.avatar?.showEnergyRings !== false;
  const showAntenna = aiConfig.avatar?.showAntenna !== false;
  const showStatusPill = aiConfig.avatar?.showStatusPill !== false;
  const showTriggerBadge = aiConfig.avatar?.showTriggerBadge !== false;
  const bubbleStyle = aiConfig.avatar?.bubbleStyle || 'cyber';

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-8 left-8 items-start';
      case 'top-right':
        return 'top-8 right-8 items-end';
      case 'top-left':
        return 'top-8 left-8 items-start';
      case 'bottom-center':
        return 'bottom-8 left-1/2 -translate-x-1/2 items-center';
      case 'center':
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center';
      case 'bottom-right':
      default:
        return 'bottom-8 right-8 items-end';
    }
  };

  // Helper to render the specific Robot Theme SVG
  const renderRobotModel = () => {
    switch (theme) {
      // 1. MECH WARRIOR / GUNDAM CYBERPUNK
      case 'mech-warrior':
        return (
          <svg viewBox="0 0 200 200" className="w-44 h-44">
            <defs>
              <linearGradient id="mechGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor={bodyColor} />
              </linearGradient>
            </defs>

            {/* Twin Angular Battle Antennas */}
            {showAntenna && (
              <>
                <polygon points="45,45 30,10 50,35" fill={primary} />
                <polygon points="155,45 170,10 150,35" fill={primary} />
              </>
            )}

            {/* Armored Angular Head Frame */}
            <polygon
              points="100,28 165,55 155,130 100,165 45,130 35,55"
              fill="url(#mechGrad)"
              stroke={primary}
              strokeWidth="3.5"
              strokeLinejoin="round"
            />

            {/* Hexagonal Tactical Visor */}
            <polygon
              points="100,52 145,70 140,110 100,128 60,110 55,70"
              fill="#020617"
              stroke={secondary}
              strokeWidth="2"
              strokeLinejoin="round"
            />

            {/* Sharp Cyber Eyes */}
            {robotState === 'speaking' ? (
              <path
                d="M 68 85 L 90 92 L 100 88 L 110 92 L 132 85"
                fill="none"
                stroke={primary}
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <>
                <polygon points="70,82 92,88 72,94" fill={primary} />
                <polygon points="130,82 108,88 128,94" fill={primary} />
              </>
            )}

            {/* Audio Vents Mouth */}
            {robotState === 'speaking' ? (
              <g>
                <line x1="82" y1="112" x2="82" y2="122" stroke={primary} strokeWidth="3" strokeLinecap="round" />
                <line x1="91" y1="110" x2="91" y2="124" stroke={secondary} strokeWidth="3" strokeLinecap="round" />
                <line x1="100" y1="108" x2="100" y2="126" stroke={primary} strokeWidth="3.5" strokeLinecap="round" />
                <line x1="109" y1="110" x2="109" y2="124" stroke={secondary} strokeWidth="3" strokeLinecap="round" />
                <line x1="118" y1="112" x2="118" y2="122" stroke={primary} strokeWidth="3" strokeLinecap="round" />
              </g>
            ) : (
              <line x1="88" y1="116" x2="112" y2="116" stroke={secondary} strokeWidth="3" strokeLinecap="round" />
            )}

            {/* Shoulder Jet Accents */}
            <polygon points="25,110 40,85 45,130" fill="#334155" stroke={primary} strokeWidth="2" />
            <polygon points="175,110 160,85 155,130" fill="#334155" stroke={primary} strokeWidth="2" />
          </svg>
        );

      // 2. CHIBI CUTE / KAWAII COMPANION BOT
      case 'chibi-cute':
        return (
          <svg viewBox="0 0 200 200" className="w-44 h-44">
            <defs>
              <radialGradient id="chibiGrad" cx="40%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="100%" stopColor={bodyColor} />
              </radialGradient>
            </defs>

            {/* Bouncy Ball Antenna */}
            {showAntenna && (
              <>
                <line x1="100" y1="38" x2="100" y2="18" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
                <circle cx="100" cy="14" r="9" fill={primary} className={robotState === 'speaking' ? 'animate-ping' : ''} />
              </>
            )}

            {/* Cute Ear Bumps */}
            <circle cx="34" cy="95" r="16" fill="#1e293b" stroke={primary} strokeWidth="2.5" />
            <circle cx="166" cy="95" r="16" fill="#1e293b" stroke={primary} strokeWidth="2.5" />

            {/* Smooth Rounded Head */}
            <rect
              x="38"
              y="38"
              width="124"
              height="115"
              rx="48"
              fill="url(#chibiGrad)"
              stroke={primary}
              strokeWidth="3.5"
            />

            {/* Face Screen */}
            <rect
              x="50"
              y="52"
              width="100"
              height="86"
              rx="34"
              fill="#020617"
              stroke="#1e293b"
              strokeWidth="2"
            />

            {/* Glowing Blush Cheeks */}
            <circle cx="65" cy="105" r="8" fill={secondary} opacity="0.75" />
            <circle cx="135" cy="105" r="8" fill={secondary} opacity="0.75" />

            {/* Big Expressive Eyes */}
            {robotState === 'speaking' ? (
              // Happy squint anime curves
              <>
                <path d="M 64 86 Q 76 70 88 86" fill="none" stroke={primary} strokeWidth="5.5" strokeLinecap="round" />
                <path d="M 112 86 Q 124 70 136 86" fill="none" stroke={primary} strokeWidth="5.5" strokeLinecap="round" />
              </>
            ) : (
              // Cute Big Anime Pupils
              <>
                <circle cx="76" cy="84" r="13" fill={primary} />
                <circle cx="124" cy="84" r="13" fill={primary} />
                <circle cx="73" cy="80" r="4" fill="#ffffff" />
                <circle cx="121" cy="80" r="4" fill="#ffffff" />
                <circle cx="79" cy="88" r="2" fill="#ffffff" />
                <circle cx="127" cy="88" r="2" fill="#ffffff" />
              </>
            )}

            {/* Heart Mouth / Smile */}
            {robotState === 'speaking' ? (
              <path d="M 92 106 Q 100 120 108 106 Z" fill={secondary} stroke={primary} strokeWidth="1.5" />
            ) : (
              <path d="M 92 108 Q 100 116 108 108" fill="none" stroke={secondary} strokeWidth="3.5" strokeLinecap="round" />
            )}
          </svg>
        );

      // 3. RETRO ARCADE / CRT 8-BIT BOT
      case 'retro-arcade':
        return (
          <svg viewBox="0 0 200 200" className="w-44 h-44">
            {/* Rabbit Ear TV Antennas */}
            {showAntenna && (
              <>
                <line x1="85" y1="40" x2="60" y2="15" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
                <line x1="115" y1="40" x2="140" y2="15" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
                <circle cx="58" cy="13" r="5" fill={primary} />
                <circle cx="142" cy="13" r="5" fill={primary} />
              </>
            )}

            {/* Vintage CRT Monitor Casing */}
            <rect
              x="32"
              y="38"
              width="136"
              height="115"
              rx="18"
              fill={bodyColor}
              stroke={primary}
              strokeWidth="4"
            />

            {/* CRT Screen with Scanlines */}
            <rect x="44" y="50" width="94" height="78" rx="10" fill="#05140b" stroke="#14532d" strokeWidth="2" />

            {/* Side Control Knobs */}
            <circle cx="152" cy="65" r="5" fill="#334155" stroke={primary} strokeWidth="1.5" />
            <circle cx="152" cy="85" r="5" fill="#334155" stroke={primary} strokeWidth="1.5" />
            <line x1="146" y1="108" x2="158" y2="108" stroke={secondary} strokeWidth="2" />
            <line x1="146" y1="115" x2="158" y2="115" stroke={secondary} strokeWidth="2" />

            {/* 8-Bit Pixel Eyes */}
            {robotState === 'speaking' ? (
              <>
                {/* Pixelated Happy Eyes ( > < ) */}
                <polyline points="62,80 74,88 62,96" fill="none" stroke={primary} strokeWidth="4.5" strokeLinecap="square" />
                <polyline points="120,80 108,88 120,96" fill="none" stroke={primary} strokeWidth="4.5" strokeLinecap="square" />
              </>
            ) : (
              <>
                {/* Blocky Matrix Pixels */}
                <rect x="62" y="76" width="14" height="14" fill={primary} />
                <rect x="106" y="76" width="14" height="14" fill={primary} />
              </>
            )}

            {/* Pixel Mouth */}
            {robotState === 'speaking' ? (
              <rect x="80" y="105" width="22" height="8" fill={secondary} />
            ) : (
              <rect x="82" y="108" width="18" height="4" fill={secondary} />
            )}

            {/* TV Stand Base */}
            <polygon points="75,153 125,153 135,170 65,170" fill="#1e293b" stroke={primary} strokeWidth="2" />
          </svg>
        );

      // 4. ALIEN ORB / HOLOGRAPHIC AI CORE (JARVIS)
      case 'alien-orb':
        return (
          <svg viewBox="0 0 200 200" className="w-44 h-44">
            <defs>
              <radialGradient id="plasmaGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="35%" stopColor={primary} />
                <stop offset="75%" stopColor={secondary} />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>

            {/* Quantum Orbital Rings */}
            <ellipse
              cx="100"
              cy="100"
              rx="78"
              ry="32"
              fill="none"
              stroke={primary}
              strokeWidth="2.5"
              strokeDasharray="8 6"
              className="animate-spin"
              style={{ animationDuration: '6s' }}
            />
            <ellipse
              cx="100"
              cy="100"
              rx="32"
              ry="78"
              fill="none"
              stroke={secondary}
              strokeWidth="2"
              strokeDasharray="6 6"
              className="animate-spin"
              style={{ animationDuration: '9s' }}
            />

            {/* Glowing Plasma Sphere */}
            <circle cx="100" cy="100" r="46" fill="url(#plasmaGrad)" className={robotState === 'speaking' ? 'animate-pulse' : ''} />
            <circle cx="100" cy="100" r="28" fill="#020617" stroke={primary} strokeWidth="2.5" />

            {/* AI Iris Core Eye */}
            {robotState === 'speaking' ? (
              <circle cx="100" cy="100" r="14" fill={primary} className="animate-ping" />
            ) : (
              <>
                <circle cx="100" cy="100" r="10" fill={primary} />
                <circle cx="100" cy="100" r="4" fill="#ffffff" />
              </>
            )}

            {/* Holographic Concentric Ticks */}
            <circle cx="100" cy="100" r="62" fill="none" stroke={primary} strokeWidth="1" strokeDasharray="3 14" />
          </svg>
        );

      // 5. NEKO CYBER CAT BOT
      case 'cat-bot':
        return (
          <svg viewBox="0 0 200 200" className="w-44 h-44">
            <defs>
              <linearGradient id="catGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="100%" stopColor={bodyColor} />
              </linearGradient>
            </defs>

            {/* Cyber Robotic Cat Ears */}
            <polygon
              points="45,60 25,18 75,42"
              fill={bodyColor}
              stroke={primary}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <polygon points="45,52 35,28 65,42" fill={secondary} />

            <polygon
              points="155,60 175,18 125,42"
              fill={bodyColor}
              stroke={primary}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <polygon points="155,52 165,28 135,42" fill={secondary} />

            {/* Cat Head Base */}
            <rect
              x="36"
              y="45"
              width="128"
              height="105"
              rx="40"
              fill="url(#catGrad)"
              stroke={primary}
              strokeWidth="3.5"
            />

            {/* Visor Area */}
            <rect x="48" y="58" width="104" height="78" rx="28" fill="#020617" stroke="#1e293b" strokeWidth="2" />

            {/* Digital Whiskers */}
            <line x1="28" y1="92" x2="44" y2="94" stroke={primary} strokeWidth="2" strokeLinecap="round" />
            <line x1="28" y1="104" x2="44" y2="102" stroke={primary} strokeWidth="2" strokeLinecap="round" />
            <line x1="172" y1="92" x2="156" y2="94" stroke={primary} strokeWidth="2" strokeLinecap="round" />
            <line x1="172" y1="104" x2="156" y2="102" stroke={primary} strokeWidth="2" strokeLinecap="round" />

            {/* Feline Eyes */}
            {robotState === 'speaking' ? (
              <>
                <path d="M 64 88 Q 76 74 88 88" fill="none" stroke={primary} strokeWidth="5" strokeLinecap="round" />
                <path d="M 112 88 Q 124 74 136 88" fill="none" stroke={primary} strokeWidth="5" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="76" cy="86" rx="10" ry="12" fill={primary} />
                <ellipse cx="124" cy="86" rx="10" ry="12" fill={primary} />
                {/* Slit Pupils */}
                <ellipse cx="76" cy="86" rx="3" ry="10" fill="#020617" />
                <ellipse cx="124" cy="86" rx="3" ry="10" fill="#020617" />
              </>
            )}

            {/* Cat Mouth ( :3 ) */}
            <path
              d="M 90 108 Q 95 116 100 110 Q 105 116 110 108"
              fill="none"
              stroke={secondary}
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        );

      // DEFAULT: CYBER-ROBOT (Clean & Seamless, NO middle border!)
      case 'cyber-robot':
      default:
        return (
          <svg viewBox="0 0 200 200" className="w-44 h-44">
            <defs>
              <linearGradient id="cyberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor={bodyColor} />
              </linearGradient>
            </defs>

            {/* Antenna */}
            {showAntenna && (
              <>
                <line x1="100" y1="35" x2="100" y2="12" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
                <circle
                  cx="100"
                  cy="10"
                  r={robotState === 'speaking' ? 8 : 6}
                  fill={primary}
                  className={robotState === 'speaking' ? 'animate-ping' : ''}
                />
              </>
            )}

            {/* Side Audio Receivers */}
            <rect x="22" y="65" width="14" height="34" rx="7" fill="#334155" stroke={primary} strokeWidth="2" />
            <rect x="164" y="65" width="14" height="34" rx="7" fill="#334155" stroke={primary} strokeWidth="2" />

            {/* Seamless Unified Head/Chassis (No middle dividing border!) */}
            <rect
              x="34"
              y="35"
              width="132"
              height="120"
              rx="28"
              fill="url(#cyberGrad)"
              stroke={primary}
              strokeWidth="3.5"
            />

            {/* Visor Area */}
            <rect
              x="46"
              y="48"
              width="108"
              height="68"
              rx="18"
              fill="#020617"
              stroke="#1e293b"
              strokeWidth="2"
            />

            {/* Expressive LED Eyes */}
            {robotState === 'speaking' ? (
              <>
                <path d="M 60 76 Q 74 58 88 76" fill="none" stroke={primary} strokeWidth="5.5" strokeLinecap="round" />
                <path d="M 112 76 Q 126 58 140 76" fill="none" stroke={primary} strokeWidth="5.5" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="74" cy="74" r="10" fill={primary} />
                <circle cx="126" cy="74" r="10" fill={primary} />
                <circle cx="78" cy="70" r="3.5" fill="#ffffff" />
                <circle cx="130" cy="70" r="3.5" fill="#ffffff" />
              </>
            )}

            {/* Mouth / Audio Equalizer Waveform */}
            {robotState === 'speaking' ? (
              <g>
                <rect x="74" y="96" width="4" height="12" rx="2" fill={secondary}>
                  <animate attributeName="height" values="4;14;6;14;4" dur="0.4s" repeatCount="indefinite" />
                  <animate attributeName="y" values="100;95;99;95;100" dur="0.4s" repeatCount="indefinite" />
                </rect>
                <rect x="84" y="92" width="4" height="18" rx="2" fill={primary}>
                  <animate attributeName="height" values="8;18;10;18;8" dur="0.3s" repeatCount="indefinite" />
                  <animate attributeName="y" values="98;93;97;93;98" dur="0.3s" repeatCount="indefinite" />
                </rect>
                <rect x="94" y="89" width="4" height="22" rx="2" fill={primary}>
                  <animate attributeName="height" values="6;22;12;22;6" dur="0.35s" repeatCount="indefinite" />
                  <animate attributeName="y" values="99;91;96;91;99" dur="0.35s" repeatCount="indefinite" />
                </rect>
                <rect x="104" y="92" width="4" height="18" rx="2" fill={primary}>
                  <animate attributeName="height" values="8;18;6;18;8" dur="0.25s" repeatCount="indefinite" />
                  <animate attributeName="y" values="98;93;99;93;98" dur="0.25s" repeatCount="indefinite" />
                </rect>
                <rect x="114" y="96" width="4" height="12" rx="2" fill={secondary}>
                  <animate attributeName="height" values="4;14;6;14;4" dur="0.4s" repeatCount="indefinite" />
                  <animate attributeName="y" values="100;95;99;95;100" dur="0.4s" repeatCount="indefinite" />
                </rect>
              </g>
            ) : (
              <path d="M 85 98 Q 100 106 115 98" fill="none" stroke={secondary} strokeWidth="3.5" strokeLinecap="round" />
            )}

            {/* Seamless Bottom Energy Core Pill */}
            <rect x="80" y="128" width="40" height="12" rx="6" fill="#020617" stroke={secondary} strokeWidth="1.5" />
            <circle
              cx="100"
              cy="134"
              r="4"
              fill={primary}
              className={robotState === 'speaking' ? 'animate-ping' : 'animate-pulse'}
            />
          </svg>
        );
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen pointer-events-none select-none overflow-hidden font-sans">
      <div
        className={`absolute flex flex-col items-center ${getPositionClasses()}`}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: position.includes('left')
            ? 'bottom left'
            : position.includes('right')
            ? 'bottom right'
            : 'bottom center',
        }}
      >
        {/* Robot Main Avatar Unit (Fixed Anchor Box) */}
        <div className="relative flex flex-col items-center w-52">
          {/* Floating Speech Bubble Anchored Above the Robot without pushing the layout */}
          {currentSpeech && aiConfig.avatar?.showSpeechBubble !== false && (
            <div
              className={`absolute bottom-full mb-3 w-[360px] md:w-[420px] p-4 rounded-3xl border shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95 pointer-events-none z-30 ${
                position.includes('left')
                  ? 'left-0'
                  : position.includes('right')
                  ? 'right-0'
                  : 'left-1/2 -translate-x-1/2'
              } ${
                bubbleStyle === 'minimal'
                  ? 'bg-slate-900/85 backdrop-blur-xl border-slate-700/60 text-white'
                  : bubbleStyle === 'retro'
                  ? 'bg-black/95 border-2 font-mono text-emerald-300'
                  : bubbleStyle === 'comic'
                  ? 'bg-slate-950 border-4 border-white text-white'
                  : 'bg-slate-950/95 backdrop-blur-md border-slate-700/80 text-white'
              }`}
              style={{
                borderColor: bubbleStyle === 'retro' ? primary : `${primary}80`,
                boxShadow: showGlow ? `0 0 35px ${primary}35, 0 15px 35px rgba(0,0,0,0.85)` : undefined,
                backgroundColor: aiConfig.avatar?.bubbleBgColor || undefined,
                color: aiConfig.avatar?.bubbleTextColor || undefined,
              }}
            >
              {/* Header with Viewer Info */}
              <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-950 flex items-center gap-1 shadow-sm"
                    style={{ backgroundColor: primary }}
                  >
                    <MessageSquare className="w-3 h-3" />
                    {currentSpeech.platform}
                  </span>
                  <span className="text-xs font-bold text-white tracking-wide">
                    @{currentSpeech.user}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {robotState === 'speaking' ? (
                    <span className="flex items-center gap-1 text-emerald-400 animate-pulse font-bold">
                      <Volume2 className="w-3 h-3" /> RESPONDIENDO
                    </span>
                  ) : (
                    'RESPUESTA'
                  )}
                </span>
              </div>

              {/* Question prompt */}
              <div className="text-[11px] text-slate-400 italic mb-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                "{currentSpeech.question}"
              </div>

              {/* AI Text Response */}
              <div className="text-sm font-semibold leading-relaxed drop-shadow">
                {displayedText}
                {robotState === 'speaking' && (
                  <span className="inline-block w-2 h-4 ml-1.5 bg-emerald-400 animate-pulse align-middle" />
                )}
              </div>

              {/* Speech Bubble Pointer / Triangle */}
              <div
                className={`absolute top-full w-0 h-0 border-x-8 border-x-transparent border-t-8 ${
                  position.includes('left')
                    ? 'left-16'
                    : position.includes('right')
                    ? 'right-16'
                    : 'left-1/2 -translate-x-1/2'
                }`}
                style={{ borderTopColor: bubbleStyle === 'retro' ? primary : '#020617' }}
              />
            </div>
          )}

          {/* Status Floating Pill */}
          {showStatusPill && (
            <div
              className="mb-2 px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-2 shadow-xl backdrop-blur-md border border-slate-700 bg-slate-950/90 text-white"
              style={{ borderColor: primary }}
            >
              <span
                className="w-2 h-2 rounded-full animate-ping"
                style={{ backgroundColor: primary }}
              />
              <span>{robotName}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-mono">
                AFK
              </span>
            </div>
          )}

          {/* SVG Robot Container (Fixed dimensions, stable position) */}
          <div
            className="relative w-48 h-48 flex items-center justify-center"
            style={{
              filter: showGlow ? `drop-shadow(0 0 25px ${primary}65)` : undefined,
            }}
          >
            {/* Ambient Outer Rings */}
            {showEnergyRings && (
              <>
                <div
                  className="absolute inset-0 rounded-full border-2 border-dashed opacity-40 animate-spin"
                  style={{
                    borderColor: primary,
                    animationDuration: robotState === 'speaking' ? '5s' : '14s',
                  }}
                />
                <div
                  className="absolute inset-2 rounded-full border opacity-30 animate-pulse"
                  style={{ borderColor: secondary }}
                />
              </>
            )}

            {/* Rendered Robot Model */}
            <div className="flex items-center justify-center">
              {renderRobotModel()}
            </div>
          </div>

          {/* Prompt Instruction Badge */}
          {showTriggerBadge && (
            <div
              className="mt-2 px-3 py-1 rounded-xl text-xs font-bold text-white bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-xl flex items-center gap-1.5"
              style={{ borderColor: `${primary}50` }}
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: primary }} />
              <span>
                Escribe <span className="font-mono text-emerald-400">{aiConfig.triggerCommand || '!ia'}</span> para hablar
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
