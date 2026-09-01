import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { AlertEvent, BotConfig, SingleAlertConfig } from '../../types';
import confetti from 'canvas-confetti';
import { Howl } from 'howler';
import { createDefaultSingleAlert } from '../../constants/defaultAlertsHelper';

export const AlertOverlay: React.FC = () => {
  const [searchParams] = useSearchParams();
  const overlayKey = searchParams.get('key');
  const { socket, latestAlert } = useSocket();

  const [overlayConfig, setOverlayConfig] = useState<BotConfig | null>(null);
  const [currentAlert, setCurrentAlert] = useState<AlertEvent | null>(null);
  const [activeConfig, setActiveConfig] = useState<SingleAlertConfig | null>(null);
  const [isShowing, setIsShowing] = useState(false);

  const alertQueue = useRef<AlertEvent[]>([]);
  const isProcessing = useRef(false);
  const processedAlertIds = useRef<Set<string>>(new Set());

  // Ensure OBS Overlay transparent background
  useEffect(() => {
    document.documentElement.classList.add('overlay-mode');
    document.body.classList.add('overlay-mode');

    return () => {
      document.documentElement.classList.remove('overlay-mode');
      document.body.classList.remove('overlay-mode');
    };
  }, []);

  // Authenticate overlay socket and fetch initial configuration
  useEffect(() => {
    if (overlayKey) {
      fetch(`/api/overlay/data?key=${overlayKey}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.config) setOverlayConfig(data.config);
        })
        .catch(console.error);

      if (socket) {
        socket.emit('auth:join', { overlayKey });
      }
    }
  }, [overlayKey, socket]);

  useEffect(() => {
    if (latestAlert) {
      // Deduplicate alerts
      if (processedAlertIds.current.has(latestAlert.id)) {
        return;
      }
      processedAlertIds.current.add(latestAlert.id);

      // Clean old IDs
      if (processedAlertIds.current.size > 500) {
        processedAlertIds.current.clear();
      }

      alertQueue.current.push(latestAlert);
      processQueue();
    }
  }, [latestAlert]);

  const getEventConfig = (type: AlertEvent['type']): SingleAlertConfig => {
    const defaults = createDefaultSingleAlert(type);
    const userCfg = overlayConfig?.overlay?.alerts?.events?.[type];
    return {
      ...defaults,
      ...userCfg,
      mediaSize: userCfg?.mediaSize || defaults.mediaSize || 180,
      fontSize: userCfg?.fontSize || defaults.fontSize || 26,
    };
  };

  const processQueue = () => {
    if (isProcessing.current || alertQueue.current.length === 0) return;

    isProcessing.current = true;
    const alert = alertQueue.current.shift()!;
    const cfg = getEventConfig(alert.type);

    if (!cfg.enabled) {
      isProcessing.current = false;
      processQueue();
      return;
    }

    setCurrentAlert(alert);
    setActiveConfig(cfg);
    setIsShowing(true);

    // 1. Play Sound with Howler
    if (cfg.soundUrl) {
      try {
        const sound = new Howl({
          src: [cfg.soundUrl],
          volume: cfg.soundVolume !== undefined ? cfg.soundVolume : 0.8,
          html5: true,
        });
        sound.play();
      } catch (e) {
        console.error('Error playing alert sound:', e);
      }
    }

    // 2. Trigger Confetti (if enabled)
    if (cfg.showConfetti !== false) {
      try {
        const colors =
          alert.platform === 'kick'
            ? ['#53FC18', '#3ebb12', '#ffffff']
            : ['#9146FF', '#772ce8', '#ffffff'];
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors,
        });
      } catch (e) {}
    }

    // 3. Trigger TTS
    if (cfg.ttsEnabled && 'speechSynthesis' in window) {
      try {
        let ttsText = `${alert.user}`;
        if (alert.type === 'follow') ttsText += ' te está siguiendo.';
        else if (alert.type === 'sub') ttsText += ' se ha suscrito al canal.';
        else if (alert.type === 'gift') ttsText += ` regaló ${alert.amount || 1} suscripciones.`;
        else if (alert.type === 'raid') ttsText += ` raideó con ${alert.amount || 0} espectadores.`;
        else if (alert.type === 'tip') ttsText += ` donó ${alert.amount || 0} dólares: ${alert.message || ''}`;
        else if (alert.type === 'cheer') ttsText += ` envió ${alert.amount || 0} bits: ${alert.message || ''}`;

        const utterance = new SpeechSynthesisUtterance(ttsText);
        utterance.lang = cfg.ttsVoice || 'es-ES';
        utterance.volume = cfg.ttsVolume !== undefined ? cfg.ttsVolume : 0.8;
        window.speechSynthesis.speak(utterance);
      } catch (e) {}
    }

    const displayDuration = (cfg.duration || 6) * 1000;

    setTimeout(() => {
      setIsShowing(false);
      setTimeout(() => {
        setCurrentAlert(null);
        setActiveConfig(null);
        isProcessing.current = false;
        processQueue();
      }, 600);
    }, displayDuration);
  };

  if (!currentAlert || !activeConfig || !isShowing) {
    return <div className="w-screen h-screen bg-transparent pointer-events-none" />;
  }

  const isKick = currentAlert.platform === 'kick';

  // Format message text with variables
  const formattedSubtitle = activeConfig.messageTemplate
    .replace('{user}', currentAlert.user)
    .replace('{amount}', `${currentAlert.amount || 1}`)
    .replace('{tier}', currentAlert.tier || 'Tier 1')
    .replace('{viewers}', `${currentAlert.amount || 0}`)
    .replace('{message}', currentAlert.message || '');

  const getAnimationClass = (anim: string) => {
    switch (anim) {
      case 'none':
        return '';
      case 'fade':
        return 'animate-fade-in';
      case 'slide':
        return 'animate-alert-slide';
      case 'zoom':
        return 'animate-alert-zoom';
      case 'flip':
        return 'animate-alert-flip';
      case 'pulse':
        return 'animate-pulse';
      default:
        return 'animate-alert-bounce';
    }
  };

  const animationClass = getAnimationClass(activeConfig.animation);
  const layout = activeConfig.layout || 'top-bottom';
  const cardStyle = activeConfig.cardStyle || 'transparent';

  const getCardBackgroundStyle = () => {
    switch (cardStyle) {
      case 'card':
        return 'bg-slate-950/90 rounded-3xl p-8';
      case 'glass':
        return 'bg-slate-900/60 backdrop-blur-md rounded-3xl p-8';
      case 'minimal':
        return 'bg-black/50 rounded-2xl p-6';
      case 'transparent':
      default:
        return 'bg-transparent p-4';
    }
  };

  const cardBackground = getCardBackgroundStyle();
  const glowColor = activeConfig.glowColor || (isKick ? '#53FC18' : '#9146FF');
  const isVideo = activeConfig.mediaType === 'video' || (activeConfig.mediaUrl && (activeConfig.mediaUrl.endsWith('.webm') || activeConfig.mediaUrl.endsWith('.mp4')));
  const mediaSize = activeConfig.mediaSize || 180;
  const fontSize = activeConfig.fontSize || 26;

  return (
    <div className="w-screen h-screen bg-transparent flex items-center justify-center p-8 select-none pointer-events-none">
      <div
        className={`relative max-w-3xl w-full transition-all ${cardBackground} ${animationClass} ${
          layout === 'top-bottom'
            ? 'flex flex-col items-center text-center gap-4'
            : layout === 'side-by-side'
            ? 'flex flex-row items-center text-left gap-6'
            : 'relative flex flex-col items-center justify-center text-center'
        } ${activeConfig.showBorder ? 'border-2' : 'border-0'}`}
        style={{
          borderColor: activeConfig.showBorder ? glowColor : 'transparent',
          boxShadow: activeConfig.showGlow ? `0 0 50px ${glowColor}40` : 'none',
        }}
      >
        {/* Platform Pill Badge (Optional) */}
        {activeConfig.showBadge && (
          <div
            className={`absolute -top-4 px-4 py-1 rounded-full text-xs font-black tracking-widest uppercase flex items-center gap-1.5 shadow-lg z-20 ${
              isKick ? 'bg-[#53FC18] text-black' : 'bg-[#9146FF] text-white'
            }`}
          >
            <span>{isKick ? 'KICK.COM' : 'TWITCH.TV'}</span>
          </div>
        )}

        {/* Layout: OVERLAY (Superpuesto) */}
        {layout === 'overlay' ? (
          <div
            className="relative flex items-center justify-center overflow-hidden rounded-2xl"
            style={{ width: `${mediaSize}px`, height: `${mediaSize}px` }}
          >
            {/* Media Background */}
            {isVideo ? (
              <video
                key={activeConfig.mediaUrl}
                src={activeConfig.mediaUrl}
                className="w-full h-full object-contain"
                muted
                autoPlay
                playsInline
                loop
              />
            ) : activeConfig.mediaUrl ? (
              <img
                key={activeConfig.mediaUrl}
                src={activeConfig.mediaUrl}
                alt="Alert"
                className="w-full h-full object-contain"
              />
            ) : null}

            {/* Superimposed Text Over Media */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center z-10 rounded-2xl bg-black/35"
              style={{
                textShadow: '0 2px 8px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,1)',
              }}
            >
              <h2
                className="font-black uppercase tracking-wider leading-tight drop-shadow-lg"
                style={{
                  color: activeConfig.titleColor || (isKick ? '#53FC18' : '#9146FF'),
                  fontSize: `${Math.round(fontSize * 1.15)}px`,
                }}
              >
                ¡NUEVO {currentAlert.type.toUpperCase()}!
              </h2>

              <p
                className="font-bold leading-snug drop-shadow-md mt-1"
                style={{
                  color: activeConfig.textColor || '#ffffff',
                  fontSize: `${fontSize}px`,
                }}
              >
                {formattedSubtitle}
              </p>

              {currentAlert.message && (
                <div className="mt-2 px-3 py-1 rounded-lg bg-black/70 border border-white/20 text-slate-200 text-xs italic max-w-xs break-words shadow">
                  "{currentAlert.message}"
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Media Item */}
            {isVideo ? (
              <div
                style={{ width: `${mediaSize}px`, height: `${mediaSize}px` }}
                className="flex items-center justify-center overflow-hidden rounded-2xl shrink-0"
              >
                <video
                  key={activeConfig.mediaUrl}
                  src={activeConfig.mediaUrl}
                  className="max-h-full max-w-full object-contain"
                  muted
                  autoPlay
                  playsInline
                  loop
                />
              </div>
            ) : activeConfig.mediaUrl ? (
              <div
                style={{ width: `${mediaSize}px`, height: `${mediaSize}px` }}
                className="flex items-center justify-center overflow-hidden shrink-0"
              >
                <img
                  key={activeConfig.mediaUrl}
                  src={activeConfig.mediaUrl}
                  alt="Alert"
                  className="max-h-full max-w-full object-contain drop-shadow-2xl"
                />
              </div>
            ) : null}

            {/* Text Container */}
            <div className="space-y-1.5 flex-1">
              <h2
                className="font-black tracking-wider uppercase drop-shadow-md leading-tight"
                style={{
                  color: activeConfig.titleColor || (isKick ? '#53FC18' : '#9146FF'),
                  fontSize: `${Math.round(fontSize * 1.15)}px`,
                }}
              >
                ¡NUEVO {currentAlert.type.toUpperCase()}!
              </h2>

              <p
                className="font-bold drop-shadow leading-snug"
                style={{
                  color: activeConfig.textColor || '#ffffff',
                  fontSize: `${fontSize}px`,
                }}
              >
                {formattedSubtitle}
              </p>

              {currentAlert.message && (
                <div className="mt-3 px-4 py-2 rounded-xl bg-black/60 border border-white/15 text-slate-200 text-base italic max-w-md break-words shadow-inner">
                  "{currentAlert.message}"
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
