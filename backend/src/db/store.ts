import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User, BotConfig, Command, Timer, ConnectedAccount, UserStats, MediaAsset, SingleAlertConfig, SubathonConfig, GlobalBotConfig } from '../types';

const DATA_DIR = path.join(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const GLOBAL_CONFIG_FILE = path.join(DATA_DIR, 'global_config.json');

export function createDefaultGlobalBotConfig(): GlobalBotConfig {
  return {
    twitch: {
      enabled: true,
      botUsername: process.env.TWITCH_BOT_USERNAME || '',
      botToken: process.env.TWITCH_BOT_OAUTH_TOKEN || '',
      clientId: process.env.TWITCH_CLIENT_ID || '',
      clientSecret: process.env.TWITCH_CLIENT_SECRET || '',
    },
    kick: {
      enabled: true,
      botUsername: process.env.KICK_BOT_USERNAME || '',
      botToken: process.env.KICK_BOT_TOKEN || '',
      clientId: process.env.KICK_CLIENT_ID || '',
      clientSecret: process.env.KICK_CLIENT_SECRET || '',
      pusherKey: '32cbd69e4b950bf97679',
      pusherCluster: 'us2',
    },
  };
}

export function createDefaultSingleAlert(type: 'follow' | 'sub' | 'gift' | 'raid' | 'tip' | 'cheer'): SingleAlertConfig {
  switch (type) {
    case 'follow':
      return {
        enabled: true,
        messageTemplate: '{user} ¡Ahora te sigue!',
        mediaType: 'gif',
        mediaUrl: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
        soundUrl: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
        soundVolume: 0.8,
        duration: 6,
        animation: 'bounce',
        layout: 'top-bottom',
        cardStyle: 'transparent',
        showBorder: false,
        showGlow: false,
        showBadge: false,
        showConfetti: true,
        textColor: '#ffffff',
        titleColor: '#53FC18',
        glowColor: '#53FC18',
        fontSize: 26,
        mediaSize: 180,
        ttsEnabled: false,
        ttsVoice: 'es-ES',
        ttsVolume: 0.8,
      };
    case 'sub':
      return {
        enabled: true,
        messageTemplate: '{user} ¡Se ha suscrito al canal!',
        mediaType: 'gif',
        mediaUrl: 'https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif',
        soundUrl: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
        soundVolume: 0.85,
        duration: 7,
        animation: 'zoom',
        layout: 'top-bottom',
        cardStyle: 'transparent',
        showBorder: false,
        showGlow: false,
        showBadge: false,
        showConfetti: true,
        textColor: '#ffffff',
        titleColor: '#9146FF',
        glowColor: '#9146FF',
        fontSize: 26,
        mediaSize: 180,
        ttsEnabled: false,
        ttsVoice: 'es-ES',
        ttsVolume: 0.8,
      };
    case 'gift':
      return {
        enabled: true,
        messageTemplate: '{user} regaló {amount} suscripciones!',
        mediaType: 'gif',
        mediaUrl: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',
        soundUrl: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
        soundVolume: 0.9,
        duration: 7,
        animation: 'slide',
        layout: 'top-bottom',
        cardStyle: 'transparent',
        showBorder: false,
        showGlow: false,
        showBadge: false,
        showConfetti: true,
        textColor: '#ffffff',
        titleColor: '#EC4899',
        glowColor: '#EC4899',
        fontSize: 26,
        mediaSize: 180,
        ttsEnabled: false,
        ttsVoice: 'es-ES',
        ttsVolume: 0.8,
      };
    case 'raid':
      return {
        enabled: true,
        messageTemplate: '{user} llegó con una raid de {amount} personas!',
        mediaType: 'gif',
        mediaUrl: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
        soundUrl: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
        soundVolume: 0.9,
        duration: 8,
        animation: 'flip',
        layout: 'top-bottom',
        cardStyle: 'transparent',
        showBorder: false,
        showGlow: false,
        showBadge: false,
        showConfetti: true,
        textColor: '#ffffff',
        titleColor: '#F59E0B',
        glowColor: '#F59E0B',
        fontSize: 26,
        mediaSize: 180,
        ttsEnabled: false,
        ttsVoice: 'es-ES',
        ttsVolume: 0.8,
      };
    case 'tip':
      return {
        enabled: true,
        messageTemplate: '{user} envió una donación de ${amount}!',
        mediaType: 'gif',
        mediaUrl: 'https://media.giphy.com/media/67ThDxtWS4Y92/giphy.gif',
        soundUrl: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3',
        soundVolume: 0.9,
        duration: 7,
        animation: 'pulse',
        layout: 'top-bottom',
        cardStyle: 'transparent',
        showBorder: false,
        showGlow: false,
        showBadge: false,
        showConfetti: true,
        textColor: '#ffffff',
        titleColor: '#10B981',
        glowColor: '#10B981',
        fontSize: 26,
        mediaSize: 180,
        ttsEnabled: false,
        ttsVoice: 'es-ES',
        ttsVolume: 0.8,
      };
    case 'cheer':
      return {
        enabled: true,
        messageTemplate: '{user} envió {amount} bits!',
        mediaType: 'gif',
        mediaUrl: 'https://media.giphy.com/media/l41lT4n6ylgW2hh04/giphy.gif',
        soundUrl: 'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3',
        soundVolume: 0.85,
        duration: 6,
        animation: 'bounce',
        layout: 'top-bottom',
        cardStyle: 'transparent',
        showBorder: false,
        showGlow: false,
        showBadge: false,
        showConfetti: true,
        textColor: '#ffffff',
        titleColor: '#06B6D4',
        glowColor: '#06B6D4',
        fontSize: 26,
        mediaSize: 180,
        ttsEnabled: false,
        ttsVoice: 'es-ES',
        ttsVolume: 0.8,
      };
  }
}

export function createDefaultBotConfig(): BotConfig {
  return {
    overlay: {
      alerts: {
        soundUrl: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
        soundVolume: 0.8,
        duration: 6,
        animation: 'bounce',
        ttsEnabled: false,
        ttsVoice: 'es-ES',
        followMessage: '{user} ¡Ahora te sigue!',
        subMessage: '{user} ¡Se ha suscrito al canal!',
        giftSubMessage: '{user} regaló {amount} suscripciones!',
        raidMessage: '{user} llegó con una raid de {viewers} personas!',
        tipMessage: '{user} envió una donación de ${amount}!',
        bannerImg: '',
        events: {
          follow: createDefaultSingleAlert('follow'),
          sub: createDefaultSingleAlert('sub'),
          gift: createDefaultSingleAlert('gift'),
          raid: createDefaultSingleAlert('raid'),
          tip: createDefaultSingleAlert('tip'),
          cheer: createDefaultSingleAlert('cheer'),
        },
      },
      chat: {
        theme: 'clean-dark',
        fontSize: 18,
        showPlatformBadges: true,
        showUserBadges: true,
        fadeTime: 20,
        maxMessages: 30,
        hideCommands: true,
      },
      goals: {
        title: 'Meta de Seguidores',
        current: 0,
        target: 100,
        type: 'followers',
        platform: 'all',
        autoSyncLive: true,
        barColor: '#53FC18',
        bgColor: 'rgba(15, 23, 42, 0.8)',
        textColor: '#ffffff',
        showPercentage: true,
        borderRadius: 9999,
        height: 24,
      },
      subathon: createDefaultSubathonConfig(),
    },
  };
}

export function createDefaultSubathonConfig(): SubathonConfig {
  return {
    enabled: false,
    weights: {
      followSeconds: 30,
      subSeconds: 300,
      giftSubSeconds: 300,
      bitsSecondsPer100: 60,
      tipSecondsPerDollar: 60,
      raidSecondsPerViewer: 5,
    },
    style: {
      theme: 'neon',
      fontSize: 48,
      clockColor: '#53FC18',
      labelColor: '#ffffff',
      glowColor: '#53FC18',
      soundOnTimeAdded: true,
      soundUrl: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
      title: 'STREAM EXTENSIBLE',
    },
    state: {
      active: false,
      paused: false,
      remainingSeconds: 7200, // 2 hours
      initialSeconds: 7200,
      maxSeconds: 86400, // 24 hours cap
      lastUpdatedAt: Date.now(),
      totalTimeAdded: 0,
    },
    logs: [],
  };
}

export function createDefaultCommands(): Command[] {
  return [
    {
      id: 'cmd-1',
      name: '!redes',
      response: 'Sígueme en mis redes sociales: 📸 Instagram: instagram.com/tu_usuario | 🐦 Twitter/X: x.com/tu_usuario | 📺 YouTube: youtube.com/@tu_canal',
      enabled: true,
      permission: 'everyone',
      cooldown: 5,
      useCount: 0,
      platforms: ['twitch', 'kick'],
    },
    {
      id: 'cmd-2',
      name: '!discord',
      response: 'Únete a nuestra comunidad de Discord para jugar juntos y enterarte de cuando prendemos directo: https://discord.gg/ejemplo 🎮',
      enabled: true,
      permission: 'everyone',
      cooldown: 5,
      useCount: 0,
      platforms: ['twitch', 'kick'],
    },
    {
      id: 'cmd-3',
      name: '!bot',
      response: '🤖 StreamBot activado en Twitch y Kick funcionando al 100%.',
      enabled: true,
      permission: 'everyone',
      cooldown: 10,
      useCount: 0,
      platforms: ['twitch', 'kick'],
    },
    {
      id: 'cmd-4',
      name: '!so',
      response: '¡Vayan a darle un gran follow a {touser} en su canal! Pásense por https://twitch.tv/{touser} o https://kick.com/{touser} 💜💚',
      enabled: true,
      permission: 'mod',
      cooldown: 3,
      useCount: 0,
      platforms: ['twitch', 'kick'],
    },
    {
      id: 'cmd-5',
      name: '!dado',
      response: '🎲 {user} tiró el dado y sacó un: {random:1-6}!',
      enabled: true,
      permission: 'everyone',
      cooldown: 3,
      useCount: 0,
      platforms: ['twitch', 'kick'],
    },
    {
      id: 'cmd-6',
      name: '!ruleta',
      response: '🔫 {user} juega a la ruleta rusa... {random:¡CLIC! Te salvaste por los pelos.,¡PUM! 💥 Te has disparado en el pie.,¡CLIC! La bala no salió.,¡PUM! 💀 Has muerto en el intento.}',
      enabled: true,
      permission: 'everyone',
      cooldown: 5,
      useCount: 0,
      platforms: ['twitch', 'kick'],
    },
  ];
}

export function createDefaultTimers(): Timer[] {
  return [
    {
      id: 'timer-1',
      name: 'Recordatorio Redes Sociales',
      messages: [
        '🔔 ¡Recuerda seguir el canal y activar las notificaciones para no perderte ningún directo!',
        '💬 No olvides unirte a nuestro Discord con !discord para enterarte de avisos y eventos.',
        '🌟 Apoya el directo dejando tu follow o suscripción para mejorar la calidad del stream.',
      ],
      intervalMinutes: 15,
      chatLinesThreshold: 5,
      enabled: false,
      platforms: ['twitch', 'kick'],
    },
  ];
}

export function generateOverlayKey(): string {
  return `key_${crypto.randomBytes(16).toString('hex')}`;
}

export interface MultiUserDatabase {
  users: User[];
}

export class UserStore {
  private users: User[] = [];
  private globalConfig: GlobalBotConfig = createDefaultGlobalBotConfig();

  constructor() {
    this.ensureDirectory();
    this.load();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private load() {
    // 1. Load Global Config
    try {
      if (fs.existsSync(GLOBAL_CONFIG_FILE)) {
        const rawGlobal = fs.readFileSync(GLOBAL_CONFIG_FILE, 'utf-8');
        const parsedGlobal = JSON.parse(rawGlobal);
        this.globalConfig = {
          ...createDefaultGlobalBotConfig(),
          ...parsedGlobal,
          twitch: {
            ...createDefaultGlobalBotConfig().twitch,
            ...(parsedGlobal.twitch || {}),
          },
          kick: {
            ...createDefaultGlobalBotConfig().kick,
            ...(parsedGlobal.kick || {}),
          },
        };
      } else {
        this.saveGlobalConfig();
      }
    } catch (e) {
      console.error('Error reading global_config.json', e);
    }

    // 2. Load Users
    try {
      if (fs.existsSync(USERS_FILE)) {
        const raw = fs.readFileSync(USERS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.users = parsed.users || [];
        // Ensure every user has default event alerts if missing and assign admin role to owner
        this.users.forEach((u, index) => {
          if (!u.role) {
            const isOwner = u.username === 'tupac_33' || u.username === 'tupac-33' || index === 0;
            u.role = isOwner ? 'admin' : 'user';
          }
          if (!u.config.overlay.alerts.events) {
            u.config.overlay.alerts.events = {
              follow: createDefaultSingleAlert('follow'),
              sub: createDefaultSingleAlert('sub'),
              gift: createDefaultSingleAlert('gift'),
              raid: createDefaultSingleAlert('raid'),
              tip: createDefaultSingleAlert('tip'),
              cheer: createDefaultSingleAlert('cheer'),
            };
          }
          if (!u.mediaGallery) {
            u.mediaGallery = [];
          }
        });
        return;
      }
    } catch (e) {
      console.error('Error reading users.json, initializing empty db', e);
    }
    this.users = [];
    this.save();
  }

  public save() {
    try {
      this.ensureDirectory();
      fs.writeFileSync(USERS_FILE, JSON.stringify({ users: this.users }, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save to users.json', e);
    }
  }

  public saveGlobalConfig() {
    try {
      this.ensureDirectory();
      fs.writeFileSync(GLOBAL_CONFIG_FILE, JSON.stringify(this.globalConfig, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save global_config.json', e);
    }
  }

  public getGlobalConfig(): GlobalBotConfig {
    return this.globalConfig;
  }

  public updateGlobalConfig(newConfig: Partial<GlobalBotConfig>): GlobalBotConfig {
    this.globalConfig = {
      ...this.globalConfig,
      ...newConfig,
      twitch: {
        ...this.globalConfig.twitch,
        ...(newConfig.twitch || {}),
      },
      kick: {
        ...this.globalConfig.kick,
        ...(newConfig.kick || {}),
      },
    };
    this.saveGlobalConfig();
    return this.globalConfig;
  }

  public setUserRole(userId: string, role: 'admin' | 'user'): User | null {
    const user = this.getUserById(userId);
    if (!user) return null;
    user.role = role;
    this.save();
    return user;
  }

  public deleteUser(userId: string): boolean {
    const initialLen = this.users.length;
    this.users = this.users.filter((u) => u.id !== userId);
    if (this.users.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public getAllUsers(): User[] {
    return this.users;
  }

  public getUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  public getUserByOverlayKey(key: string): User | undefined {
    return this.users.find((u) => u.overlayKey === key);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  }

  public getUserByUsername(username: string): User | undefined {
    const clean = username.toLowerCase().replace(/^[#@]/, '');
    const cleanHyphen = clean.replace(/_/g, '-');
    const cleanUnderscore = clean.replace(/-/g, '_');

    // Sort users so that users with connected accounts and active configurations are matched first
    const sorted = [...this.users].sort((a, b) => {
      const aCount = (a.accounts.twitch ? 1 : 0) + (a.accounts.kick ? 1 : 0);
      const bCount = (b.accounts.twitch ? 1 : 0) + (b.accounts.kick ? 1 : 0);
      return bCount - aCount;
    });

    return sorted.find((u) => {
      const un = u.username.toLowerCase();
      const dn = (u.displayName || '').toLowerCase();
      return un === clean || un === cleanHyphen || un === cleanUnderscore || dn === clean || dn === cleanHyphen || dn === cleanUnderscore;
    });
  }

  public getUserByTwitchChannel(channel: string): User | undefined {
    const clean = channel.toLowerCase().replace(/^#/, '');
    const cleanHyphen = clean.replace(/_/g, '-');
    const cleanUnderscore = clean.replace(/-/g, '_');

    const sorted = [...this.users].sort((a, b) => {
      const aCount = (a.accounts.twitch ? 1 : 0) + (a.accounts.kick ? 1 : 0);
      const bCount = (b.accounts.twitch ? 1 : 0) + (b.accounts.kick ? 1 : 0);
      return bCount - aCount;
    });

    return sorted.find((u) => {
      if (!u.accounts.twitch) return false;
      const ch = (u.accounts.twitch.channel || '').toLowerCase();
      const un = (u.accounts.twitch.username || u.username || '').toLowerCase();
      return (
        ch === clean ||
        ch === cleanHyphen ||
        ch === cleanUnderscore ||
        un === clean ||
        un === cleanHyphen ||
        un === cleanUnderscore
      );
    });
  }

  public getUserByKickChannel(channel: string): User | undefined {
    const clean = channel.toLowerCase().replace(/^@/, '');
    const cleanHyphen = clean.replace(/_/g, '-');
    const cleanUnderscore = clean.replace(/-/g, '_');

    const sorted = [...this.users].sort((a, b) => {
      const aCount = (a.accounts.twitch ? 1 : 0) + (a.accounts.kick ? 1 : 0);
      const bCount = (b.accounts.twitch ? 1 : 0) + (b.accounts.kick ? 1 : 0);
      return bCount - aCount;
    });

    return sorted.find((u) => {
      if (!u.accounts.kick) return false;
      const ch = (u.accounts.kick.channel || '').toLowerCase();
      const un = (u.accounts.kick.username || u.username || '').toLowerCase();
      return (
        ch === clean ||
        ch === cleanHyphen ||
        ch === cleanUnderscore ||
        un === clean ||
        un === cleanHyphen ||
        un === cleanUnderscore
      );
    });
  }

  public findUserByPlatformChannel(platform: 'twitch' | 'kick', channel: string): User | undefined {
    const clean = channel.toLowerCase().replace(/^[#@]/, '');
    const cleanHyphen = clean.replace(/_/g, '-');
    const cleanUnderscore = clean.replace(/-/g, '_');

    const sorted = [...this.users].sort((a, b) => {
      const aCount = (a.accounts.twitch ? 1 : 0) + (a.accounts.kick ? 1 : 0);
      const bCount = (b.accounts.twitch ? 1 : 0) + (b.accounts.kick ? 1 : 0);
      return bCount - aCount;
    });

    // 1. Direct platform channel match
    const directMatch = sorted.find((u) => {
      const acc = u.accounts[platform];
      if (!acc) return false;
      const ch = (acc.channel || '').toLowerCase();
      const un = (acc.username || '').toLowerCase();
      return (
        ch === clean ||
        ch === cleanHyphen ||
        ch === cleanUnderscore ||
        un === clean ||
        un === cleanHyphen ||
        un === cleanUnderscore
      );
    });
    if (directMatch) return directMatch;

    // 2. Any other platform channel match
    const otherPlatform = platform === 'twitch' ? 'kick' : 'twitch';
    const otherMatch = sorted.find((u) => {
      const acc = u.accounts[otherPlatform];
      if (!acc) return false;
      const ch = (acc.channel || '').toLowerCase();
      const un = (acc.username || '').toLowerCase();
      return (
        ch === clean ||
        ch === cleanHyphen ||
        ch === cleanUnderscore ||
        un === clean ||
        un === cleanHyphen ||
        un === cleanUnderscore
      );
    });
    if (otherMatch) return otherMatch;

    // 3. Username match
    return sorted.find((u) => {
      const un = u.username.toLowerCase();
      const dn = (u.displayName || '').toLowerCase();
      return un === clean || un === cleanHyphen || un === cleanUnderscore || dn === clean || dn === cleanHyphen || dn === cleanUnderscore;
    });
  }

  public createUser(data: {
    username: string;
    displayName: string;
    email?: string;
    passwordHash?: string;
    avatar?: string;
    twitchAccount?: ConnectedAccount;
    kickAccount?: ConnectedAccount;
  }): User {
    const id = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const overlayKey = generateOverlayKey();
    const newUser: User = {
      id,
      username: data.username,
      displayName: data.displayName || data.username,
      email: data.email,
      passwordHash: data.passwordHash,
      avatar: data.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${data.username}`,
      overlayKey,
      createdAt: Date.now(),
      accounts: {
        twitch: data.twitchAccount,
        kick: data.kickAccount,
      },
      config: createDefaultBotConfig(),
      commands: createDefaultCommands(),
      timers: createDefaultTimers(),
      stats: {
        twitchMessagesCount: 0,
        kickMessagesCount: 0,
        commandsExecutedCount: 0,
        alertsTriggeredCount: 0,
        startedAt: Date.now(),
      },
      mediaGallery: [],
    };

    this.users.push(newUser);
    this.save();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;

    this.users[idx] = {
      ...this.users[idx],
      ...updates,
    };
    this.save();
    return this.users[idx];
  }

  public updateUserConfig(userId: string, newConfig: Partial<BotConfig>): BotConfig | null {
    const user = this.getUserById(userId);
    if (!user) return null;

    user.config = {
      ...user.config,
      ...newConfig,
      overlay: {
        ...user.config.overlay,
        ...(newConfig.overlay || {}),
        alerts: {
          ...user.config.overlay.alerts,
          ...(newConfig.overlay?.alerts || {}),
          events: {
            ...(user.config.overlay.alerts?.events || {}),
            ...(newConfig.overlay?.alerts?.events || {}),
          },
        },
        chat: {
          ...user.config.overlay.chat,
          ...(newConfig.overlay?.chat || {}),
        },
        goals: {
          ...user.config.overlay.goals,
          ...(newConfig.overlay?.goals || {}),
        },
      },
    };
    this.save();
    return user.config;
  }

  public addMediaAsset(userId: string, asset: MediaAsset): User | null {
    const user = this.getUserById(userId);
    if (!user) return null;

    if (!user.mediaGallery) {
      user.mediaGallery = [];
    }
    user.mediaGallery.unshift(asset);
    this.save();
    return user;
  }

  public deleteMediaAsset(userId: string, assetId: string): User | null {
    const user = this.getUserById(userId);
    if (!user || !user.mediaGallery) return null;

    user.mediaGallery = user.mediaGallery.filter((a) => a.id !== assetId);
    this.save();
    return user;
  }

  public linkAccount(userId: string, account: ConnectedAccount): User | null {
    const user = this.getUserById(userId);
    if (!user) return null;

    const cleanChannel = account.channel.toLowerCase().replace(/^[#@]/, '');
    const cleanHyphen = cleanChannel.replace(/_/g, '-');
    const cleanUnderscore = cleanChannel.replace(/-/g, '_');

    // 1. Remove this channel from any other user in the store to prevent duplicate identities
    this.users.forEach((otherUser) => {
      if (otherUser.id !== userId) {
        if (account.platform === 'twitch' && otherUser.accounts.twitch) {
          const otherCh = (otherUser.accounts.twitch.channel || '').toLowerCase();
          if (otherCh === cleanChannel || otherCh === cleanHyphen || otherCh === cleanUnderscore) {
            delete otherUser.accounts.twitch;
          }
        } else if (account.platform === 'kick' && otherUser.accounts.kick) {
          const otherCh = (otherUser.accounts.kick.channel || '').toLowerCase();
          if (otherCh === cleanChannel || otherCh === cleanHyphen || otherCh === cleanUnderscore) {
            delete otherUser.accounts.kick;
          }
        }
      }
    });

    // 2. Remove empty orphaned users (no connected accounts and no password)
    this.users = this.users.filter((u) => {
      if (u.id === userId) return true;
      const hasAccounts = !!u.accounts.twitch || !!u.accounts.kick;
      return hasAccounts || !!u.passwordHash;
    });

    // 3. Link account to the target user
    if (account.platform === 'twitch') {
      user.accounts.twitch = account;
    } else if (account.platform === 'kick') {
      user.accounts.kick = account;
    }

    this.save();
    return user;
  }

  public unlinkAccount(userId: string, platform: 'twitch' | 'kick'): User | null {
    const user = this.getUserById(userId);
    if (!user) return null;

    if (platform === 'twitch') {
      delete user.accounts.twitch;
    } else if (platform === 'kick') {
      delete user.accounts.kick;
    }
    this.save();
    return user;
  }

  public regenerateOverlayKey(userId: string): string | null {
    const user = this.getUserById(userId);
    if (!user) return null;

    user.overlayKey = generateOverlayKey();
    this.save();
    return user.overlayKey;
  }

  public incrementUserStat(userId: string, key: keyof UserStats, amount: number = 1) {
    const user = this.getUserById(userId);
    if (!user) return;
    if (typeof user.stats[key] === 'number') {
      user.stats[key] += amount;
      this.save();
    }
  }
}

export const userStore = new UserStore();
