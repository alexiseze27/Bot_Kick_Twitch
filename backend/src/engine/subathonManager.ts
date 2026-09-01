import { userStore } from '../db/store';
import { eventBus } from './eventBus';
import { AlertEvent, SubathonConfig, SubathonLog, User } from '../types';

export class SubathonManager {
  private timerInterval: NodeJS.Timeout | null = null;
  private ioInstance: any = null;

  constructor() {
    this.startTicker();
    this.setupEventListeners();
  }

  public setSocketServer(io: any) {
    this.ioInstance = io;
  }

  private startTicker() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      this.tick();
    }, 1000);
  }

  private tick() {
    const users = userStore.getAllUsers();
    let hasChanges = false;

    for (const user of users) {
      const subathon = user.config?.overlay?.subathon;
      if (!subathon || !subathon.enabled) continue;

      const state = subathon.state;
      if (state.active && !state.paused && state.remainingSeconds > 0) {
        state.remainingSeconds = Math.max(0, state.remainingSeconds - 1);
        state.lastUpdatedAt = Date.now();
        hasChanges = true;

        if (state.remainingSeconds === 0) {
          state.active = false;
          if (this.ioInstance) {
            this.ioInstance.to(`user:${user.id}`).emit('subathon:ended', { userId: user.id });
          }
        }

        // Broadcast tick every second
        if (this.ioInstance) {
          this.ioInstance.to(`user:${user.id}`).emit('subathon:tick', {
            userId: user.id,
            remainingSeconds: state.remainingSeconds,
            active: state.active,
            paused: state.paused,
          });
        }
      }
    }

    if (hasChanges) {
      userStore.save();
    }
  }

  private setupEventListeners() {
    eventBus.on('alert:event', (alert: AlertEvent) => {
      this.handleAlertEvent(alert);
    });
  }

  public handleAlertEvent(alert: AlertEvent) {
    let user: User | undefined;
    if (alert.userId) {
      user = userStore.getUserById(alert.userId);
    }
    if (!user) {
      if (alert.platform === 'twitch') {
        user = userStore.getUserByTwitchChannel(alert.channel);
      } else if (alert.platform === 'kick') {
        user =
          userStore.getUserByKickChannel(alert.channel) ||
          userStore.getUserByKickChannel(alert.channel.replace(/-/g, '_')) ||
          userStore.getUserByKickChannel(alert.channel.replace(/_/g, '-'));
      }
    }

    if (!user) return;

    const subathon = user.config?.overlay?.subathon;
    if (!subathon || !subathon.enabled) return;

    const weights = subathon.weights;
    let secondsToAdd = 0;

    switch (alert.type) {
      case 'follow':
        secondsToAdd = weights.followSeconds || 0;
        break;
      case 'sub':
        secondsToAdd = weights.subSeconds || 0;
        break;
      case 'gift':
        secondsToAdd = (weights.giftSubSeconds || 0) * (alert.amount || 1);
        break;
      case 'cheer':
        secondsToAdd = Math.round(((alert.amount || 0) / 100) * (weights.bitsSecondsPer100 || 0));
        break;
      case 'tip':
        secondsToAdd = Math.round((alert.amount || 0) * (weights.tipSecondsPerDollar || 0));
        break;
      case 'raid':
        secondsToAdd = (alert.amount || 0) * (weights.raidSecondsPerViewer || 0);
        break;
    }

    if (secondsToAdd > 0) {
      this.addTime(user, secondsToAdd, alert.user, alert.platform, alert.type);
    }
  }

  public addTime(
    user: User,
    seconds: number,
    username: string,
    platform: 'twitch' | 'kick' | 'manual',
    eventType: string
  ) {
    const subathon = user.config?.overlay?.subathon;
    if (!subathon) return;

    const state = subathon.state;
    state.remainingSeconds = (state.remainingSeconds || 0) + seconds;

    // Apply max cap if defined
    if (state.maxSeconds && state.maxSeconds > 0) {
      state.remainingSeconds = Math.min(state.maxSeconds, state.remainingSeconds);
    }

    state.totalTimeAdded = (state.totalTimeAdded || 0) + seconds;
    state.lastUpdatedAt = Date.now();

    // Log entry
    const log: SubathonLog = {
      id: `slog_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      timestamp: Date.now(),
      user: username,
      platform,
      type: eventType,
      secondsAdded: seconds,
    };

    if (!subathon.logs) subathon.logs = [];
    subathon.logs.unshift(log);
    if (subathon.logs.length > 50) subathon.logs = subathon.logs.slice(0, 50);

    userStore.save();

    // Broadcast to user room & overlay
    if (this.ioInstance) {
      this.ioInstance.to(`user:${user.id}`).emit('subathon:timeAdded', {
        userId: user.id,
        secondsAdded: seconds,
        log,
        remainingSeconds: state.remainingSeconds,
      });
      this.ioInstance.to(`user:${user.id}`).emit('subathon:sync', subathon);
    }
  }

  public handleUserAction(
    userId: string,
    action: 'start' | 'pause' | 'resume' | 'reset' | 'add' | 'subtract',
    payload?: any
  ): SubathonConfig | null {
    const user = userStore.getUserById(userId);
    if (!user) return null;

    if (!user.config.overlay.subathon) {
      user.config.overlay.subathon = {
        enabled: true,
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
          remainingSeconds: 7200,
          initialSeconds: 7200,
          maxSeconds: 86400,
          lastUpdatedAt: Date.now(),
          totalTimeAdded: 0,
        },
        logs: [],
      };
    }

    const subathon = user.config.overlay.subathon;
    const state = subathon.state;

    switch (action) {
      case 'start':
        state.active = true;
        state.paused = false;
        if (payload?.seconds) {
          state.remainingSeconds = payload.seconds;
          state.initialSeconds = payload.seconds;
        }
        break;
      case 'pause':
        state.paused = true;
        break;
      case 'resume':
        state.active = true;
        state.paused = false;
        break;
      case 'reset':
        state.active = false;
        state.paused = false;
        state.remainingSeconds = state.initialSeconds || 7200;
        state.totalTimeAdded = 0;
        subathon.logs = [];
        break;
      case 'add':
        const secToAdd = payload?.seconds || 300;
        this.addTime(user, secToAdd, user.displayName || 'Streamer', 'manual', 'Manual');
        return user.config.overlay.subathon;
      case 'subtract':
        const secToSub = payload?.seconds || 300;
        state.remainingSeconds = Math.max(0, state.remainingSeconds - secToSub);
        break;
    }

    state.lastUpdatedAt = Date.now();
    userStore.save();

    if (this.ioInstance) {
      this.ioInstance.to(`user:${user.id}`).emit('subathon:sync', subathon);
    }

    return subathon;
  }
}

export const subathonManager = new SubathonManager();
