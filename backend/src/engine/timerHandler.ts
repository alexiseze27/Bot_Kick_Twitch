import { userStore } from '../db/store';
import { eventBus } from './eventBus';
import { twitchConnector } from '../connectors/twitch';
import { kickConnector } from '../connectors/kick';
import { ChatMessage, Timer, User } from '../types';

export class MultiTenantTimerHandler {
  private chatCounts: Map<string, { twitch: number; kick: number }> = new Map(); // userId -> counts
  private timerIntervals: Map<string, NodeJS.Timeout> = new Map(); // timerId -> interval
  private timerMessageIndices: Map<string, number> = new Map();

  constructor() {
    this.init();
  }

  private init() {
    eventBus.on('chat:message', (msg: ChatMessage) => {
      if (!msg.userId) return;
      const current = this.chatCounts.get(msg.userId) || { twitch: 0, kick: 0 };
      if (msg.platform === 'twitch') {
        current.twitch++;
      } else if (msg.platform === 'kick') {
        current.kick++;
      }
      this.chatCounts.set(msg.userId, current);
    });

    this.reloadAllTimers();
  }

  public reloadAllTimers() {
    this.timerIntervals.forEach((interval) => clearInterval(interval));
    this.timerIntervals.clear();

    const users = userStore.getAllUsers();
    users.forEach((user) => {
      (user.timers || []).forEach((timer: Timer) => {
        if (timer.enabled && timer.intervalMinutes > 0 && timer.messages.length > 0) {
          this.startTimer(user, timer);
        }
      });
    });
  }

  private startTimer(user: User, timer: Timer) {
    let lastCounts = { ...(this.chatCounts.get(user.id) || { twitch: 0, kick: 0 }) };
    const intervalMs = Math.max(1, timer.intervalMinutes) * 60 * 1000;

    const intervalId = setInterval(async () => {
      const currentCounts = this.chatCounts.get(user.id) || { twitch: 0, kick: 0 };
      const currentIdx = this.timerMessageIndices.get(timer.id) || 0;
      const message = timer.messages[currentIdx % timer.messages.length];
      this.timerMessageIndices.set(timer.id, currentIdx + 1);

      // Check Twitch threshold
      if (timer.platforms.includes('twitch') && user.accounts.twitch?.connected) {
        const diff = currentCounts.twitch - lastCounts.twitch;
        if (diff >= timer.chatLinesThreshold) {
          lastCounts.twitch = currentCounts.twitch;
          await twitchConnector.sendMessage(message);
        }
      }

      // Check Kick threshold
      if (timer.platforms.includes('kick') && user.accounts.kick?.connected) {
        const diff = currentCounts.kick - lastCounts.kick;
        if (diff >= timer.chatLinesThreshold) {
          lastCounts.kick = currentCounts.kick;
          await kickConnector.sendMessage(message, user.accounts.kick.token);
        }
      }
    }, intervalMs);

    this.timerIntervals.set(timer.id, intervalId);
  }
}

export const timerHandler = new MultiTenantTimerHandler();
