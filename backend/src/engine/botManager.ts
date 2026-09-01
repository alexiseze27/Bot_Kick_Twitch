import { userStore } from '../db/store';
import { eventBus } from './eventBus';
import { twitchConnector } from '../connectors/twitch';
import { kickConnector } from '../connectors/kick';
import { aiService, createDefaultAiBotConfig } from '../services/aiService';
import { ChatMessage, AlertEvent, User, Command } from '../types';

export class MultiTenantBotManager {
  private twitchJoinedChannels: Set<string> = new Set();
  private kickJoinedChannels: Set<string> = new Set();
  private aiLastUsedMap: Map<string, number> = new Map();

  constructor() {
    this.init();
  }

  private init() {
    // Listen for Twitch & Kick raw chat messages
    eventBus.on('chat:message', (msg: ChatMessage) => {
      this.routeChatMessage(msg);
    });

    // Listen for Twitch & Kick raw alerts
    eventBus.on('alert:event', (alert: AlertEvent) => {
      this.routeAlertEvent(alert);
    });
  }

  public async syncAllUsers() {
    const users = userStore.getAllUsers();
    console.log(`[BotManager] Synchronizing bot channels for ${users.length} users...`);

    for (const user of users) {
      await this.syncUser(user.id);
    }
  }

  public async syncUser(userId: string) {
    const user = userStore.getUserById(userId);
    if (!user) return;

    const globalConfig = userStore.getGlobalConfig();

    // Sync Twitch
    if (user.accounts.twitch && user.accounts.twitch.botEnabled && user.accounts.twitch.channel) {
      const channel = user.accounts.twitch.channel.toLowerCase().replace(/^#/, '');
      const botUser =
        user.accounts.twitch.botUsername ||
        globalConfig.twitch?.botUsername ||
        user.accounts.twitch.username ||
        channel;
      const botTok =
        user.accounts.twitch.botToken ||
        globalConfig.twitch?.botToken ||
        user.accounts.twitch.token;

      console.log(`[BotManager] Synchronizing Twitch channel #${channel} (Bot identity: @${botUser}) for user ${user.username}`);
      await twitchConnector.connect(
        channel,
        botUser,
        botTok
      );
      this.twitchJoinedChannels.add(channel);
    }

    // Sync Kick
    if (user.accounts.kick && user.accounts.kick.botEnabled && user.accounts.kick.channel) {
      const channel = user.accounts.kick.channel.toLowerCase().replace(/^@/, '');
      if (!this.kickJoinedChannels.has(channel)) {
        const kickBotUser =
          user.accounts.kick.username ||
          globalConfig.kick?.botUsername ||
          channel;
        const kickTok =
          user.accounts.kick.token ||
          globalConfig.kick?.botToken;

        console.log(`[BotManager] Joining Kick channel @${channel} (Bot identity: @${kickBotUser}) for user ${user.username}`);
        await kickConnector.connect(
          channel,
          kickBotUser,
          kickTok,
          user.accounts.kick.chatroomId,
          user.accounts.kick.channelId
        );
        this.kickJoinedChannels.add(channel);
      }
    }
  }

  private async routeChatMessage(msg: ChatMessage) {
    // Find the user who owns this channel
    const user = userStore.findUserByPlatformChannel(msg.platform, msg.channel);

    if (!user) {
      console.log(`[BotManager] Unmatched message on ${msg.platform} #${msg.channel} from @${msg.user.username}`);
      return;
    }

    msg.userId = user.id;
    userStore.incrementUserStat(
      user.id,
      msg.platform === 'twitch' ? 'twitchMessagesCount' : 'kickMessagesCount',
      1
    );

    // Process user-specific commands or AI Bot
    await this.processUserCommands(user, msg);
  }

  private async routeAlertEvent(alert: AlertEvent) {
    const user = userStore.findUserByPlatformChannel(alert.platform, alert.channel);
    if (!user) return;

    alert.userId = user.id;
    userStore.incrementUserStat(user.id, 'alertsTriggeredCount', 1);

    // Auto-update Followers Goal in real time
    const goal = user.config?.overlay?.goals;
    if (goal && goal.type === 'followers') {
      const goalPlatform = goal.platform || 'all';
      if (goalPlatform === 'all' || goalPlatform === alert.platform) {
        goal.current = (goal.current || 0) + 1;
        userStore.save();
        eventBus.emit('goal:update', {
          userId: user.id,
          goals: user.config.overlay.goals,
        });
      }
    }
  }

  private async processUserCommands(user: User, msg: ChatMessage) {
    const rawText = msg.message.trim();
    if (!rawText.startsWith('!')) return;

    const parts = rawText.split(/\s+/);
    const cmdTrigger = parts[0].toLowerCase();
    const args = parts.slice(1);
    const targetUser = args[0] ? args[0].replace(/^@/, '') : msg.user.displayName;

    // 1. Check AI Assistant Trigger (Active only when streamer turned it on from panel)
    const aiConfig = user.config.overlay?.aiBot;
    const aiTrigger = (aiConfig?.triggerCommand || '!ia').toLowerCase();

    if (cmdTrigger === aiTrigger || cmdTrigger === '!ia' || cmdTrigger === '!ai') {
      if (aiConfig && aiConfig.enabled && aiConfig.isAfk) {
        if (aiConfig.platforms && !aiConfig.platforms.includes(msg.platform)) {
          return;
        }

        // Permission check
        if (!this.checkPermission(msg.user, aiConfig.permission || 'everyone')) return;

        // Cooldown check
        const now = Date.now();
        const lastUsed = this.aiLastUsedMap.get(user.id) || 0;
        const cooldownMs = (aiConfig.cooldownSeconds || 8) * 1000;
        if (now - lastUsed < cooldownMs) {
          return;
        }

        this.aiLastUsedMap.set(user.id, now);
        const question = args.join(' ').trim();
        if (!question) {
          if (aiConfig.replyInChat === true) {
            const hint = `🤖 [@${msg.user.displayName}]: Escribe ${aiTrigger} tu pregunta para hablar conmigo mientras el streamer no está.`;
            await this.sendReply(msg.platform, hint, user);
          }
          return;
        }

        try {
          const aiResponse = await aiService.generateAnswer(
            user,
            msg.user.displayName || msg.user.username,
            question,
            msg.platform
          );

          // 1. Emit event for OBS Overlay directly so the Robot speaks and moves on screen
          eventBus.emitAiSpeech({
            id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            userId: user.id,
            platform: msg.platform,
            user: msg.user.displayName || msg.user.username,
            question,
            response: aiResponse,
            timestamp: Date.now(),
          });

          // 2. Send reply in chat ONLY if explicitly enabled (default is false: only the robot in OBS responds)
          if (aiConfig.replyInChat === true) {
            const chatReply = `🤖 [@${msg.user.displayName}]: ${aiResponse}`;
            await this.sendReply(msg.platform, chatReply, user);
          }
        } catch (e) {
          console.error('[BotManager] Error handling AI trigger:', e);
        }
        return;
      }
    }

    // 2. Standard custom commands
    const commands = user.commands || [];
    const command = commands.find(
      (c) => c.enabled && c.name.toLowerCase() === cmdTrigger && c.platforms.includes(msg.platform)
    );

    if (!command) {
      if (cmdTrigger === '!comandos' || cmdTrigger === '!commands') {
        const availableCmds = commands
          .filter((c) => c.enabled && c.platforms.includes(msg.platform))
          .map((c) => c.name)
          .join(', ');
        const reply = `📜 Comandos de ${user.displayName}: ${availableCmds || 'No hay comandos activos'}`;
        await this.sendReply(msg.platform, reply, user);
      }
      return;
    }

    // Permission check
    if (!this.checkPermission(msg.user, command.permission)) return;

    // Cooldown check
    const now = Date.now();
    if (command.lastUsed && now - command.lastUsed < command.cooldown * 1000) return;

    command.lastUsed = now;
    command.useCount = (command.useCount || 0) + 1;
    userStore.save();
    userStore.incrementUserStat(user.id, 'commandsExecutedCount', 1);

    const formattedResponse = this.formatResponse(command.response, {
      user: msg.user.displayName || msg.user.username,
      target: targetUser,
      args: args.join(' '),
      count: command.useCount,
      channel: msg.channel,
      streamer: user.displayName,
    });

    await this.sendReply(msg.platform, formattedResponse, user);
  }

  private checkPermission(user: ChatMessage['user'], requiredPerm: Command['permission']): boolean {
    if (requiredPerm === 'everyone') return true;
    if (requiredPerm === 'vip') return user.isVip || user.isMod || user.isBroadcaster;
    if (requiredPerm === 'mod') return user.isMod || user.isBroadcaster;
    if (requiredPerm === 'broadcaster') return user.isBroadcaster;
    return false;
  }

  private formatResponse(
    template: string,
    context: { user: string; target: string; args: string; count: number; channel: string; streamer: string }
  ): string {
    let text = template;
    text = text.replace(/\{user\}/gi, context.user);
    text = text.replace(/\{target\}/gi, context.target);
    text = text.replace(/\{touser\}/gi, context.target);
    text = text.replace(/\{args\}/gi, context.args);
    text = text.replace(/\{count\}/gi, `${context.count}`);
    text = text.replace(/\{channel\}/gi, context.channel);
    text = text.replace(/\{streamer\}/gi, context.streamer);
    text = text.replace(/\{time\}/gi, new Date().toLocaleTimeString());

    text = text.replace(/\{random:(\d+)-(\d+)\}/gi, (match, minStr, maxStr) => {
      const min = parseInt(minStr, 10);
      const max = parseInt(maxStr, 10);
      return `${Math.floor(Math.random() * (max - min + 1)) + min}`;
    });

    text = text.replace(/\{random:([^}]+)\}/gi, (match, optionsStr) => {
      if (optionsStr.includes(',')) {
        const opts = optionsStr.split(',').map((s: string) => s.trim());
        return opts[Math.floor(Math.random() * opts.length)];
      }
      return match;
    });

    return text;
  }

  public async sendReply(platform: 'twitch' | 'kick', message: string, user?: User) {
    const globalConfig = userStore.getGlobalConfig();

    if (platform === 'twitch') {
      const channel = user?.accounts.twitch?.channel || twitchConnector.currentChannel;
      const token =
        user?.accounts.twitch?.botToken ||
        globalConfig.twitch?.botToken ||
        user?.accounts.twitch?.token;
      await twitchConnector.sendMessage(message, channel, token);
    } else if (platform === 'kick') {
      const token =
        user?.accounts.kick?.token ||
        globalConfig.kick?.botToken;
      await kickConnector.sendMessage(
        message,
        token,
        user?.accounts.kick?.channel,
        user?.accounts.kick?.chatroomId,
        user?.accounts.kick?.channelId
      );
    }
  }
}

export const botManager = new MultiTenantBotManager();
