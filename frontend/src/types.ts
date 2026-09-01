export interface SingleAlertConfig {
  enabled: boolean;
  messageTemplate: string;
  mediaType: 'image' | 'video' | 'gif' | 'none';
  mediaUrl: string;
  soundUrl: string;
  soundVolume: number; // 0 to 1
  duration: number; // in seconds
  animation: 'none' | 'bounce' | 'fade' | 'slide' | 'zoom' | 'flip' | 'pulse';
  layout: 'top-bottom' | 'side-by-side' | 'overlay';
  cardStyle: 'transparent' | 'card' | 'glass' | 'minimal';
  showBorder: boolean;
  showGlow: boolean;
  showBadge: boolean;
  showConfetti: boolean;
  textColor: string;
  titleColor: string;
  glowColor: string;
  fontSize: number; // in px
  mediaSize: number; // in px (80 - 450)
  ttsEnabled: boolean;
  ttsVoice: string;
  ttsVolume: number; // 0 to 1
}

export interface OverlayAlertsConfig {
  soundUrl: string;
  soundVolume: number;
  duration: number;
  animation: 'none' | 'bounce' | 'fade' | 'slide' | 'zoom' | 'flip' | 'pulse';
  ttsEnabled: boolean;
  ttsVoice: string;
  followMessage: string;
  subMessage: string;
  giftSubMessage: string;
  raidMessage: string;
  tipMessage: string;
  bannerImg?: string;
  events?: {
    follow?: SingleAlertConfig;
    sub?: SingleAlertConfig;
    gift?: SingleAlertConfig;
    raid?: SingleAlertConfig;
    tip?: SingleAlertConfig;
    cheer?: SingleAlertConfig;
  };
}

export interface OverlayChatConfig {
  theme: 'transparent' | 'clean-dark' | 'glass' | 'bubble' | 'retro' | 'minimal';
  fontSize: number;
  showPlatformBadges: boolean;
  showUserBadges: boolean;
  fadeTime: number;
  maxMessages: number;
  hideCommands: boolean;
}

export interface OverlayGoalsConfig {
  title: string;
  current: number;
  target: number;
  type: 'followers' | 'subs' | 'donations';
  platform: 'all' | 'twitch' | 'kick';
  autoSyncLive: boolean;
  barColor: string;
  bgColor: string;
  textColor: string;
  showPercentage: boolean;
  borderRadius: number;
  height: number;
}

export interface SubathonEventWeights {
  followSeconds: number;
  subSeconds: number;
  giftSubSeconds: number;
  bitsSecondsPer100: number;
  tipSecondsPerDollar: number;
  raidSecondsPerViewer: number;
}

export interface SubathonStyleConfig {
  theme: 'neon' | 'glass' | 'cyberpunk' | 'retro' | 'clean';
  fontSize: number;
  clockColor: string;
  labelColor: string;
  glowColor: string;
  soundOnTimeAdded: boolean;
  soundUrl: string;
  title: string;
}

export interface SubathonState {
  active: boolean;
  paused: boolean;
  remainingSeconds: number;
  initialSeconds: number;
  maxSeconds: number;
  lastUpdatedAt: number;
  totalTimeAdded: number;
}

export interface SubathonLog {
  id: string;
  timestamp: number;
  user: string;
  platform: 'twitch' | 'kick' | 'manual';
  type: string;
  secondsAdded: number;
}

export interface SubathonConfig {
  enabled: boolean;
  weights: SubathonEventWeights;
  style: SubathonStyleConfig;
  state: SubathonState;
  logs: SubathonLog[];
}

export interface AiBotTtsConfig {
  enabled: boolean;
  voice: string;
  volume: number;
  rate: number;
  pitch: number;
}

export interface AiBotAvatarConfig {
  theme: 'cyber-robot' | 'mech-warrior' | 'chibi-cute' | 'retro-arcade' | 'alien-orb' | 'cat-bot';
  primaryColor: string;
  secondaryColor: string;
  bodyColor?: string;
  robotName: string;
  showSpeechBubble: boolean;
  bubbleStyle?: 'cyber' | 'minimal' | 'retro' | 'comic' | 'dark';
  bubbleBgColor?: string;
  bubbleTextColor?: string;
  bubbleDuration: number;
  scale: number;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center' | 'bottom-center';
  showGlow?: boolean;
  showEnergyRings?: boolean;
  showAntenna?: boolean;
  showStatusPill?: boolean;
  showTriggerBadge?: boolean;
  promptPreset?: string;
}

export interface AiBotConfig {
  enabled: boolean;
  isAfk: boolean;
  triggerCommand: string;
  provider: 'gemini' | 'groq' | 'openai' | 'mock';
  apiKey?: string;
  model?: string;
  systemPrompt: string;
  maxTokens: number;
  cooldownSeconds: number;
  permission: 'everyone' | 'vip' | 'mod' | 'broadcaster';
  platforms: ('twitch' | 'kick')[];
  replyInChat?: boolean; // Default false: only speaks through the robot in OBS
  tts: AiBotTtsConfig;
  avatar: AiBotAvatarConfig;
}

export interface AiSpeechEvent {
  id: string;
  userId: string;
  platform: 'twitch' | 'kick' | 'test';
  user: string;
  question: string;
  response: string;
  timestamp: number;
}

export interface AiStatusEvent {
  userId: string;
  isAfk: boolean;
  enabled: boolean;
  config?: AiBotConfig;
}

export interface BotConfig {
  overlay: {
    alerts: OverlayAlertsConfig;
    chat: OverlayChatConfig;
    goals: OverlayGoalsConfig;
    subathon?: SubathonConfig;
    aiBot?: AiBotConfig;
  };
}

export interface ConnectedAccount {
  platform: 'twitch' | 'kick';
  channel: string;
  username: string;
  token?: string;
  botUsername?: string;
  botToken?: string;
  chatroomId?: number;
  channelId?: number;
  connected: boolean;
  botEnabled: boolean;
  avatar?: string;
}

export interface Command {
  id: string;
  name: string;
  response: string;
  enabled: boolean;
  permission: 'everyone' | 'vip' | 'mod' | 'broadcaster';
  cooldown: number;
  lastUsed?: number;
  useCount: number;
  platforms: ('twitch' | 'kick')[];
}

export interface Timer {
  id: string;
  name: string;
  messages: string[];
  intervalMinutes: number;
  chatLinesThreshold: number;
  enabled: boolean;
  platforms: ('twitch' | 'kick')[];
}

export interface UserStats {
  twitchMessagesCount: number;
  kickMessagesCount: number;
  commandsExecutedCount: number;
  alertsTriggeredCount: number;
  startedAt: number;
}

export interface MediaAsset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  size: number;
  createdAt: number;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatar: string;
  overlayKey: string;
  role?: 'admin' | 'user';
  createdAt: number;
  accounts: {
    twitch?: ConnectedAccount;
    kick?: ConnectedAccount;
  };
  config: BotConfig;
  commands: Command[];
  timers: Timer[];
  stats: UserStats;
  mediaGallery?: MediaAsset[];
}

export interface GlobalBotConfig {
  twitch: {
    enabled: boolean;
    botUsername: string;
    botToken: string;
    clientId?: string;
    clientSecret?: string;
  };
  kick: {
    enabled: boolean;
    botUsername: string;
    botToken: string;
    clientId?: string;
    clientSecret?: string;
    pusherKey?: string;
    pusherCluster?: string;
  };
}

export interface ChatMessage {
  id: string;
  userId?: string;
  platform: 'twitch' | 'kick';
  channel: string;
  user: {
    id?: string;
    username: string;
    displayName: string;
    color?: string;
    isBroadcaster: boolean;
    isMod: boolean;
    isVip: boolean;
    isSub: boolean;
    badges: string[];
  };
  message: string;
  timestamp: number;
  emotes?: any[];
}

export interface AlertEvent {
  id: string;
  userId?: string;
  platform: 'twitch' | 'kick';
  channel: string;
  type: 'follow' | 'sub' | 'gift' | 'raid' | 'tip' | 'cheer';
  user: string;
  amount?: number;
  message?: string;
  tier?: string;
  timestamp: number;
}
