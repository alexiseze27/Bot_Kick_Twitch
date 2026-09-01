import Pusher from 'pusher-js';
import axios from 'axios';
import { eventBus } from '../engine/eventBus';
import { ChatMessage, AlertEvent } from '../types';

const KICK_PUSHER_KEY = '32cbd69e4b950bf97679';
const KICK_PUSHER_CLUSTER = 'us2';

interface SubscribedChatroom {
  channelName: string;
  chatroomId: number;
  channelId?: number;
  broadcasterUserId?: number;
  chatChannelV2: any;
  chatChannelV1?: any;
  feedChannel?: any;
}

export class KickConnector {
  private pusher: Pusher | null = null;
  private subscriptions: Map<number, SubscribedChatroom> = new Map(); // chatroomId -> SubscribedChatroom
  private channelNameToChatroom: Map<string, number> = new Map(); // channelName -> chatroomId
  private channelToBroadcasterId: Map<string, number> = new Map();
  private processedMessageIds: Set<string> = new Set();
  public isConnected: boolean = false;
  public lastError: string | null = null;

  constructor() {
    this.initPusher();

    // Clean old message IDs every 5 minutes
    setInterval(() => {
      if (this.processedMessageIds.size > 2000) {
        this.processedMessageIds.clear();
      }
    }, 5 * 60 * 1000);
  }

  private initPusher() {
    if (this.pusher) return;

    this.pusher = new Pusher(KICK_PUSHER_KEY, {
      cluster: KICK_PUSHER_CLUSTER,
      forceTLS: true,
      disableStats: true,
      enabledTransports: ['ws', 'wss'],
    });

    this.pusher.connection.bind('connected', () => {
      console.log(`[Kick] Global Pusher WebSocket Connected`);
      this.isConnected = true;
      this.lastError = null;
    });

    this.pusher.connection.bind('error', (err: any) => {
      console.error('[Kick] Global Pusher error:', err);
      this.lastError = 'Error connecting to Kick Pusher';
    });

    this.pusher.connection.bind('disconnected', () => {
      this.isConnected = false;
    });
  }

  public async getChannelData(username: string, token?: string): Promise<{ channelId: number; chatroomId: number; slug: string; broadcasterUserId?: number } | null> {
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    const candidateSlugs = [
      clean,
      clean.replace(/_/g, '-'),
      clean.replace(/-/g, '_'),
    ];

    // 1. Try official API with token if present
    if (token) {
      try {
        const res = await axios.get('https://api.kick.com/public/v1/channels', {
          headers: { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` },
          timeout: 5000,
        });
        const raw = res.data;
        const ch = Array.isArray(raw?.data) ? raw.data[0] : (raw?.data || raw);
        if (ch && (ch.chatroom?.id || ch.chatroom_id)) {
          return {
            channelId: ch.broadcaster_user_id || ch.id,
            chatroomId: ch.chatroom?.id || ch.chatroom_id,
            broadcasterUserId: ch.broadcaster_user_id || ch.id,
            slug: ch.slug || clean,
          };
        }
      } catch (e) {}
    }

    // 2. Try candidate slugs on v2/v1 public APIs
    for (const slug of candidateSlugs) {
      try {
        const res = await axios.get(`https://kick.com/api/v2/channels/${slug}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
          },
          timeout: 6000,
        });

        if (res.data && res.data.chatroom) {
          return {
            channelId: res.data.id || res.data.user_id,
            chatroomId: res.data.chatroom.id,
            broadcasterUserId: res.data.user_id || res.data.id,
            slug: res.data.slug || slug,
          };
        }
      } catch (e) {}

      try {
        const res = await axios.get(`https://kick.com/api/v1/channels/${slug}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
          },
          timeout: 6000,
        });

        if (res.data && res.data.chatroom) {
          return {
            channelId: res.data.id || res.data.user_id,
            chatroomId: res.data.chatroom.id,
            broadcasterUserId: res.data.user_id || res.data.id,
            slug: res.data.slug || slug,
          };
        }
      } catch (e) {}
    }

    return null;
  }

  public async connect(
    channelName: string,
    botUsername?: string,
    botToken?: string,
    manualChatroomId?: number,
    manualChannelId?: number
  ): Promise<boolean> {
    if (!channelName || channelName.trim() === '') {
      this.lastError = 'No channel specified';
      return false;
    }

    const cleanChannel = channelName.trim().toLowerCase().replace(/^@/, '');
    this.initPusher();

    try {
      let chatroomId = manualChatroomId;
      let channelId = manualChannelId;
      let broadcasterUserId = manualChannelId;
      let slug = cleanChannel;

      if (!chatroomId) {
        const channelData = await this.getChannelData(cleanChannel, botToken);
        if (channelData) {
          chatroomId = channelData.chatroomId;
          channelId = channelData.channelId;
          broadcasterUserId = channelData.broadcasterUserId || channelData.channelId;
          slug = channelData.slug;
        }
      }

      if (!chatroomId) {
        console.warn(`[Kick] Warning: Could not resolve chatroomId for channel @${cleanChannel}`);
        return false;
      }

      if (broadcasterUserId) {
        this.channelToBroadcasterId.set(cleanChannel, broadcasterUserId);
        this.channelToBroadcasterId.set(slug, broadcasterUserId);
      }

      // Check if already subscribed to this chatroom
      if (this.subscriptions.has(chatroomId)) {
        console.log(`[Kick] Already subscribed to chatroom ${chatroomId} (@${cleanChannel})`);
        return true;
      }

      console.log(`[Kick] Subscribing to chatrooms.${chatroomId}.v2 and channel.${channelId} for channel @${cleanChannel} (slug: ${slug})`);

      // Subscribe to both v2 and v1 chatroom channels for total reliability
      const chatChannelV2 = this.pusher!.subscribe(`chatrooms.${chatroomId}.v2`);
      const chatChannelV1 = this.pusher!.subscribe(`chatrooms.${chatroomId}`);

      const bindChatEvents = (channelObj: any) => {
        channelObj.bind('App\\Events\\ChatMessageEvent', (data: any) => {
          this.handleChatMessage(cleanChannel, data);
        });

        channelObj.bind('ChatMessageEvent', (data: any) => {
          this.handleChatMessage(cleanChannel, data);
        });

        channelObj.bind_global((eventName: string, data: any) => {
          if (eventName.includes('ChatMessage') || eventName === 'message') {
            this.handleChatMessage(cleanChannel, data);
          }
        });

        channelObj.bind('App\\Events\\SubscriptionEvent', (data: any) => {
          this.triggerAlert({
            id: `kick-sub-${Date.now()}`,
            platform: 'kick',
            channel: cleanChannel,
            type: 'sub',
            user: data.username || data.display_name || 'Kick User',
            amount: data.months || 1,
            timestamp: Date.now(),
          });
        });

        channelObj.bind('App\\Events\\GiftedSubscriptionsEvent', (data: any) => {
          this.triggerAlert({
            id: `kick-gift-${Date.now()}`,
            platform: 'kick',
            channel: cleanChannel,
            type: 'gift',
            user: data.gifted_by?.username || data.gifter_username || 'Kick User',
            amount: data.gifted_usernames?.length || data.amount || 1,
            timestamp: Date.now(),
          });
        });
      };

      bindChatEvents(chatChannelV2);
      bindChatEvents(chatChannelV1);

      // Channel Feed for Follows & Hosts
      let feedChannel: any = null;
      if (channelId) {
        feedChannel = this.pusher!.subscribe(`channel.${channelId}`);

        feedChannel.bind('App\\Events\\FollowersUpdated', (data: any) => {
          if (data.followed) {
            this.triggerAlert({
              id: `kick-follow-${Date.now()}`,
              platform: 'kick',
              channel: cleanChannel,
              type: 'follow',
              user: data.username || 'Nuevo Seguidor',
              timestamp: Date.now(),
            });
          }
        });

        feedChannel.bind('App\\Events\\HostEvent', (data: any) => {
          this.triggerAlert({
            id: `kick-host-${Date.now()}`,
            platform: 'kick',
            channel: cleanChannel,
            type: 'raid',
            user: data.host_username || 'Host',
            amount: data.number_viewers || 0,
            timestamp: Date.now(),
          });
        });
      }

      this.subscriptions.set(chatroomId, {
        channelName: cleanChannel,
        chatroomId,
        channelId,
        broadcasterUserId,
        chatChannelV2,
        chatChannelV1,
        feedChannel,
      });

      this.channelNameToChatroom.set(cleanChannel, chatroomId);
      if (slug !== cleanChannel) {
        this.channelNameToChatroom.set(slug, chatroomId);
      }

      return true;
    } catch (err: any) {
      console.error(`[Kick] Error subscribing to channel @${cleanChannel}:`, err);
      this.lastError = err?.message || 'Error connecting to Kick channel';
      return false;
    }
  }

  private handleChatMessage(channelName: string, data: any) {
    try {
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {}
      }

      if (!data) return;

      const rawMsgId = data.id || `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      if (this.processedMessageIds.has(rawMsgId)) {
        return; // Deduplicate
      }
      this.processedMessageIds.add(rawMsgId);

      const sender = data.sender || {};
      const identity = sender.identity || {};
      const badgesList = (identity.badges || []).map((b: any) => b.type || b.badge_type || '');

      const senderName = sender.username || sender.slug || 'kick_user';
      const isBroadcaster = badgesList.includes('broadcaster') || senderName.toLowerCase() === channelName.toLowerCase();
      const isMod = badgesList.includes('moderator') || isBroadcaster;
      const isVip = badgesList.includes('vip');
      const isSub = badgesList.includes('subscriber') || isBroadcaster;

      const chatMsg: ChatMessage = {
        id: `kick-${rawMsgId}`,
        platform: 'kick',
        channel: channelName,
        user: {
          id: `${sender.id || ''}`,
          username: senderName,
          displayName: senderName,
          color: identity.color || '#53FC18',
          isBroadcaster,
          isMod,
          isVip,
          isSub,
          badges: badgesList,
        },
        message: data.content || data.message || '',
        timestamp: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
      };

      console.log(`[Kick] Chat message received on @${channelName} from ${chatMsg.user.displayName}: "${chatMsg.message}"`);
      eventBus.emitMessage(chatMsg);
    } catch (e) {
      console.error('[Kick] Error parsing chat message:', e);
    }
  }

  public async sendMessage(
    message: string,
    token?: string,
    channelName?: string,
    manualChatroomId?: number,
    manualChannelId?: number
  ): Promise<boolean> {
    if (!token) {
      console.warn('[Kick] Cannot send message: Missing token');
      return false;
    }

    const clean = (channelName || '').toLowerCase().replace(/^@/, '');
    const cleanHyphen = clean.replace(/_/g, '-');
    const cleanUnderscore = clean.replace(/-/g, '_');

    let broadcasterId =
      manualChannelId ||
      this.channelToBroadcasterId.get(clean) ||
      this.channelToBroadcasterId.get(cleanHyphen) ||
      this.channelToBroadcasterId.get(cleanUnderscore) ||
      (this.subscriptions.size > 0 ? Array.from(this.subscriptions.values())[0]?.broadcasterUserId : undefined);

    let chatroomId =
      manualChatroomId ||
      this.channelNameToChatroom.get(clean) ||
      this.channelNameToChatroom.get(cleanHyphen) ||
      this.channelNameToChatroom.get(cleanUnderscore) ||
      (this.subscriptions.size > 0 ? Array.from(this.subscriptions.keys())[0] : undefined);

    // If IDs are missing, attempt dynamic resolution from Kick API
    if (!broadcasterId || !chatroomId) {
      const meta = await this.getChannelData(clean, token);
      if (meta) {
        if (!broadcasterId) broadcasterId = meta.broadcasterUserId || meta.channelId;
        if (!chatroomId) chatroomId = meta.chatroomId;
        if (broadcasterId) this.channelToBroadcasterId.set(clean, broadcasterId);
        if (chatroomId) this.channelNameToChatroom.set(clean, chatroomId);
      }
    }

    console.log(`[Kick] Sending message to @${clean} (broadcasterId: ${broadcasterId}, chatroomId: ${chatroomId}): "${message}"`);

    const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

    // 1. Try official Kick Public Chat API (type: user)
    if (broadcasterId) {
      try {
        const res = await axios.post(
          'https://api.kick.com/public/v1/chat',
          {
            broadcaster_user_id: Number(broadcasterId),
            content: message,
            type: 'user',
          },
          {
            headers: {
              Authorization: authHeader,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            timeout: 5000,
          }
        );
        if (res.data?.data?.is_sent || res.status === 200 || res.status === 201) {
          console.log(`[Kick] Message successfully sent via Public Chat API (user) to @${clean}`);
          return true;
        }
      } catch (err: any) {
        console.warn('[Kick] Public chat API (user type) failed, trying bot type...', err?.response?.data || err?.message);
        try {
          const resBot = await axios.post(
            'https://api.kick.com/public/v1/chat',
            {
              broadcaster_user_id: Number(broadcasterId),
              content: message,
              type: 'bot',
            },
            {
              headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
              timeout: 5000,
            }
          );
          if (resBot.data?.data?.is_sent || resBot.status === 200 || resBot.status === 201) {
            console.log(`[Kick] Message successfully sent via Public Chat API (bot) to @${clean}`);
            return true;
          }
        } catch (e: any) {
          console.warn('[Kick] Public chat API (bot type) failed:', e?.response?.data || e?.message);
        }
      }
    }

    // 2. Fallback to v2 web endpoint
    if (chatroomId) {
      try {
        await axios.post(
          `https://kick.com/api/v2/messages/send/${chatroomId}`,
          { content: message, type: 'message' },
          {
            headers: {
              Authorization: authHeader,
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Accept: 'application/json',
            },
            timeout: 5000,
          }
        );
        console.log(`[Kick] Message successfully sent via v2 endpoint to @${clean}`);
        return true;
      } catch (e: any) {
        console.warn('[Kick] v2 web endpoint send failed:', e?.response?.data || e?.message);
      }
    }

    // 3. Fallback to v1 chatrooms endpoint
    if (chatroomId) {
      try {
        await axios.post(
          `https://kick.com/api/v1/chatrooms/${chatroomId}/messages`,
          { content: message, type: 'message' },
          {
            headers: {
              Authorization: authHeader,
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Accept: 'application/json',
            },
            timeout: 5000,
          }
        );
        console.log(`[Kick] Message successfully sent via v1 chatrooms endpoint to @${clean}`);
        return true;
      } catch (e: any) {
        console.warn('[Kick] v1 chatrooms endpoint send failed:', e?.response?.data || e?.message);
      }
    }

    console.error(`[Kick] Failed to send message to @${clean}. El token de Kick puede haber expirado o carecer de permisos chat:write.`);
    return false;
  }

  private triggerAlert(alert: AlertEvent) {
    eventBus.emitAlert(alert);
  }
}

export const kickConnector = new KickConnector();
