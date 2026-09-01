import tmi from 'tmi.js';
import axios from 'axios';
import { eventBus } from '../engine/eventBus';
import { ChatMessage, AlertEvent } from '../types';
import { OAUTH_CONFIG } from '../config/oauth';

export class TwitchConnector {
  private client: tmi.Client | null = null;
  public isConnected: boolean = false;
  public joinedChannels: Set<string> = new Set();
  public currentChannel: string = '';
  public lastError: string | null = null;
  public isAuth: boolean = false;

  constructor() {}

  public async connect(channelName: string, botUsername?: string, oauthToken?: string): Promise<boolean> {
    if (!channelName || channelName.trim() === '') {
      this.lastError = 'No channel specified';
      return false;
    }

    const cleanChannel = channelName.trim().toLowerCase().replace(/^#/, '');
    this.currentChannel = cleanChannel;

    const hasAuth = !!(botUsername && oauthToken && oauthToken.trim().length > 0);
    const cleanToken = oauthToken ? oauthToken.trim().replace(/^oauth:/i, '') : '';

    // If client is already connected and authenticated (or both are unauthenticated), just join channel
    if (this.client && this.isConnected) {
      if (this.isAuth || !hasAuth) {
        if (!this.joinedChannels.has(cleanChannel)) {
          try {
            await this.client.join(cleanChannel);
            this.joinedChannels.add(cleanChannel);
            console.log(`[Twitch] Joined channel #${cleanChannel}`);
            return true;
          } catch (err) {
            console.error(`[Twitch] Error joining channel #${cleanChannel}:`, err);
          }
        } else {
          return true;
        }
      }
    }

    // Disconnect previous instance if re-initializing or upgrading to authenticated connection
    await this.disconnect();

    const allChannelsToJoin = Array.from(new Set([...Array.from(this.joinedChannels), cleanChannel]));

    const options: tmi.Options = {
      options: { debug: false },
      connection: {
        secure: true,
        reconnect: true,
        reconnectInterval: 3000,
        maxReconnectAttempts: Infinity,
      },
      channels: allChannelsToJoin,
    };

    if (hasAuth && cleanToken) {
      options.identity = {
        username: (botUsername || cleanChannel).trim().toLowerCase(),
        password: `oauth:${cleanToken}`,
      };
      this.isAuth = true;
    } else {
      this.isAuth = false;
    }

    try {
      this.client = new tmi.Client(options);
      this.setupClientEvents();

      await this.client.connect();
      this.isConnected = true;
      this.joinedChannels.add(cleanChannel);
      this.lastError = null;
      console.log(`[Twitch] Connected successfully to #${cleanChannel} (Auth: ${this.isAuth})`);
      return true;
    } catch (err: any) {
      console.warn(`[Twitch] Auth connection failed (${err?.message || err}), falling back to anonymous connection...`);

      // Fallback: connect anonymously so that we can STILL read all chat messages and trigger AI bot & overlays!
      if (hasAuth) {
        try {
          this.isAuth = false;
          delete options.identity;
          this.client = new tmi.Client(options);
          this.setupClientEvents();

          await this.client.connect();
          this.isConnected = true;
          this.joinedChannels.add(cleanChannel);
          this.lastError = null;
          console.log(`[Twitch] Connected anonymously to #${cleanChannel} (Read & Alert active)`);
          return true;
        } catch (anonErr: any) {
          console.error('[Twitch] Anonymous connection error:', anonErr);
          this.lastError = anonErr?.message || 'Error connecting to Twitch anonymously';
          this.isConnected = false;
          return false;
        }
      }

      this.lastError = err?.message || 'Error connecting to Twitch';
      this.isConnected = false;
      return false;
    }
  }

  private setupClientEvents() {
    if (!this.client) return;

    this.client.on('connected', (address, port) => {
      console.log(`[Twitch] IRC Connected to ${address}:${port}`);
      this.isConnected = true;
      this.lastError = null;
    });

    this.client.on('disconnected', (reason) => {
      console.log(`[Twitch] Disconnected: ${reason}`);
      this.isConnected = false;
    });

    this.client.on('message', (channel, tags, message, self) => {
      if (self) return;

      const chanClean = channel.toLowerCase().replace(/^#/, '');
      const isBroadcaster = tags.badges?.broadcaster === '1' || tags.username?.toLowerCase() === chanClean;
      const isMod = tags.mod || isBroadcaster;
      const isVip = !!tags.badges?.vip;
      const isSub = !!tags.subscriber || isBroadcaster;

      const chatMsg: ChatMessage = {
        id: tags.id || `tw-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        platform: 'twitch',
        channel: chanClean,
        user: {
          id: tags['user-id'],
          username: tags.username || 'anon',
          displayName: tags['display-name'] || tags.username || 'anon',
          color: tags.color || '#9146FF',
          isBroadcaster,
          isMod,
          isVip,
          isSub,
          badges: Object.keys(tags.badges || {}),
        },
        message: message,
        timestamp: parseInt(tags['tmi-sent-ts'] || `${Date.now()}`, 10),
        emotes: tags.emotes as any,
      };

      eventBus.emitMessage(chatMsg);
    });

    // Subscription Events
    this.client.on('subscription', (channel, username, method, message, userstate) => {
      const chanClean = channel.toLowerCase().replace(/^#/, '');
      this.triggerAlert({
        id: `tw-sub-${Date.now()}`,
        platform: 'twitch',
        channel: chanClean,
        type: 'sub',
        user: userstate['display-name'] || username,
        message: message || '',
        tier: method.prime ? 'Prime' : method.plan ? `Tier ${method.plan[0]}` : 'Tier 1',
        timestamp: Date.now(),
      });
    });

    this.client.on('resub', (channel, username, months, message, userstate, methods) => {
      const chanClean = channel.toLowerCase().replace(/^#/, '');
      this.triggerAlert({
        id: `tw-resub-${Date.now()}`,
        platform: 'twitch',
        channel: chanClean,
        type: 'sub',
        user: userstate['display-name'] || username,
        amount: months,
        message: message || '',
        timestamp: Date.now(),
      });
    });

    this.client.on('subgift', (channel, username, streakMonths, recipient, methods, userstate) => {
      const chanClean = channel.toLowerCase().replace(/^#/, '');
      this.triggerAlert({
        id: `tw-gift-${Date.now()}`,
        platform: 'twitch',
        channel: chanClean,
        type: 'gift',
        user: userstate['display-name'] || username,
        amount: 1,
        message: `Regaló una sub a ${recipient}`,
        timestamp: Date.now(),
      });
    });

    this.client.on('cheer', (channel, userstate, message) => {
      const chanClean = channel.toLowerCase().replace(/^#/, '');
      const bits = parseInt(userstate.bits || '0', 10);
      this.triggerAlert({
        id: `tw-cheer-${Date.now()}`,
        platform: 'twitch',
        channel: chanClean,
        type: 'cheer',
        user: userstate['display-name'] || userstate.username || 'Anon',
        amount: bits,
        message: message,
        timestamp: Date.now(),
      });
    });

    this.client.on('raided', (channel, username, viewers) => {
      const chanClean = channel.toLowerCase().replace(/^#/, '');
      this.triggerAlert({
        id: `tw-raid-${Date.now()}`,
        platform: 'twitch',
        channel: chanClean,
        type: 'raid',
        user: username,
        amount: viewers,
        timestamp: Date.now(),
      });
    });
  }

  public async disconnect() {
    if (this.client) {
      try {
        await this.client.disconnect();
      } catch (e) {}
      this.client = null;
    }
    this.joinedChannels.clear();
    this.isConnected = false;
  }

  public async sendMessage(message: string, targetChannel?: string, token?: string): Promise<boolean> {
    const chan = (targetChannel || this.currentChannel || '').toLowerCase().replace(/^#/, '');
    if (!chan) {
      console.warn('[Twitch] Cannot send message: No channel specified');
      return false;
    }

    console.log(`[Twitch] Attempting to send message to #${chan}: "${message}"`);

    // 1. Try IRC say if client is connected and authenticated
    if (this.isAuth && this.client && this.isConnected) {
      try {
        await this.client.say(`#${chan}`, message);
        console.log(`[Twitch] Message sent via IRC to #${chan}`);
        return true;
      } catch (err: any) {
        console.warn(`[Twitch] IRC say error on #${chan}:`, err?.message || err);
      }
    }

    // 2. Try Helix Chat API with OAuth token
    if (token) {
      try {
        const cleanToken = token.replace(/^oauth:/i, '').trim();
        const clientId = OAUTH_CONFIG.twitch.clientId.trim();

        if (clientId && cleanToken) {
          const userRes = await axios.get(`https://api.twitch.tv/helix/users?login=${chan}`, {
            headers: {
              'Client-Id': clientId,
              Authorization: `Bearer ${cleanToken}`,
            },
            timeout: 4000,
          });

          const broadcasterId = userRes.data?.data?.[0]?.id;
          if (broadcasterId) {
            await axios.post(
              'https://api.twitch.tv/helix/chat/messages',
              {
                broadcaster_id: broadcasterId,
                sender_id: broadcasterId,
                message: message,
              },
              {
                headers: {
                  'Client-Id': clientId,
                  Authorization: `Bearer ${cleanToken}`,
                  'Content-Type': 'application/json',
                },
                timeout: 5000,
              }
            );
            console.log(`[Twitch] Message sent via Helix API to #${chan}`);
            return true;
          }
        }
      } catch (helixErr: any) {
        console.warn(`[Twitch] Helix chat API send failed:`, helixErr?.response?.data || helixErr?.message);
      }
    }

    // 3. Fallback attempt via client.say anyway
    if (this.client && this.isConnected) {
      try {
        await this.client.say(`#${chan}`, message);
        return true;
      } catch (e) {}
    }

    return false;
  }

  private triggerAlert(alert: AlertEvent) {
    eventBus.emitAlert(alert);
  }
}

export const twitchConnector = new TwitchConnector();
