import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { eventBus } from '../engine/eventBus';
import { userStore } from '../db/store';
import { botManager } from '../engine/botManager';
import { subathonManager } from '../engine/subathonManager';
import { ChatMessage, AlertEvent } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'streambot_jwt_super_secret_key_2026';

export function setupSocketServer(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  subathonManager.setSocketServer(io);

  io.on('connection', (socket) => {
    let authenticatedUserId: string | null = null;

    // Client sends auth credentials or OBS overlay key
    socket.on('auth:join', ({ token, overlayKey }: { token?: string; overlayKey?: string }) => {
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
          authenticatedUserId = decoded.userId;
          socket.join(`user:${decoded.userId}`);
          const user = userStore.getUserById(decoded.userId);
          if (user) {
            socket.emit('user:sync', {
              user,
              stats: user.stats,
              config: user.config,
            });
            if (user.config?.overlay?.subathon) {
              socket.emit('subathon:sync', user.config.overlay.subathon);
            }
          }
        } catch (e) {}
      }

      if (overlayKey) {
        const user = userStore.getUserByOverlayKey(overlayKey);
        if (user) {
          authenticatedUserId = user.id;
          socket.join(`user:${user.id}`);
          socket.emit('overlay:init', {
            config: user.config,
            user: {
              id: user.id,
              username: user.username,
              displayName: user.displayName,
            },
          });
          if (user.config?.overlay?.subathon) {
            socket.emit('subathon:sync', user.config.overlay.subathon);
          }
        }
      }
    });

    // Send chat message from dashboard
    socket.on('chat:send', async ({ platform, message }: { platform: 'twitch' | 'kick'; message: string }) => {
      if (!authenticatedUserId) return;
      const user = userStore.getUserById(authenticatedUserId);
      if (!user) return;
      await botManager.sendReply(platform, message, user);
    });

    // Test alert from dashboard or preview
    socket.on('alert:test', (testAlert: AlertEvent) => {
      if (!authenticatedUserId) return;
      const user = userStore.getUserById(authenticatedUserId);
      if (!user) return;

      testAlert.userId = user.id;
      userStore.incrementUserStat(user.id, 'alertsTriggeredCount', 1);
      eventBus.emitAlert(testAlert);
    });

    socket.on('disconnect', () => {});
  });

  // Forward EventBus events to the streamer's private room
  eventBus.on('chat:message', (msg: ChatMessage) => {
    let user = msg.userId ? userStore.getUserById(msg.userId) : undefined;
    if (!user) {
      if (msg.platform === 'twitch') {
        user = userStore.getUserByTwitchChannel(msg.channel);
      } else if (msg.platform === 'kick') {
        user = userStore.getUserByKickChannel(msg.channel);
      }
    }

    if (user) {
      msg.userId = user.id;
      io.to(`user:${user.id}`).emit('chat:message', msg);
    } else {
      io.emit('chat:message', msg);
    }
  });

  eventBus.on('alert:event', (alert: AlertEvent) => {
    let user = alert.userId ? userStore.getUserById(alert.userId) : undefined;
    if (!user) {
      if (alert.platform === 'twitch') {
        user = userStore.getUserByTwitchChannel(alert.channel);
      } else if (alert.platform === 'kick') {
        user = userStore.getUserByKickChannel(alert.channel);
      }
    }

    if (user) {
      alert.userId = user.id;
      io.to(`user:${user.id}`).emit('alert:show', alert);
    } else {
      io.emit('alert:show', alert);
    }
  });

  eventBus.on('goal:update', (data: { userId: string; goals: any }) => {
    if (data.userId) {
      io.to(`user:${data.userId}`).emit('goal:sync', data.goals);
    }
  });

  eventBus.on('ai:speech', (speech) => {
    if (speech.userId) {
      io.to(`user:${speech.userId}`).emit('ai:speech', speech);
    } else {
      io.emit('ai:speech', speech);
    }
  });

  eventBus.on('ai:status', (status) => {
    if (status.userId) {
      io.to(`user:${status.userId}`).emit('ai:status', status);
    } else {
      io.emit('ai:status', status);
    }
  });

  return io;
}
