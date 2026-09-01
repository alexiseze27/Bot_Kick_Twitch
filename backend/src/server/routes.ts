import { Router, Response } from 'express';
import { userStore } from '../db/store';
import { requireAuth, AuthenticatedRequest } from './authRoutes';
import { eventBus } from '../engine/eventBus';
import { botManager } from '../engine/botManager';
import { kickConnector } from '../connectors/kick';
import { subathonManager } from '../engine/subathonManager';
import { FollowerService } from '../services/followerService';
import { aiService, createDefaultAiBotConfig } from '../services/aiService';
import { AlertEvent } from '../types';

export const router = Router();

// GET /api/user/config - Get current user configuration
router.get('/user/config', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = userStore.getUserById(req.userId!);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(user.config);
});

// POST /api/user/config - Update current user configuration
router.post('/user/config', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const updated = userStore.updateUserConfig(req.userId!, req.body);
  if (!updated) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(updated);
});

// GET /api/user/commands
router.get('/user/commands', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = userStore.getUserById(req.userId!);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(user.commands || []);
});

// POST /api/user/commands
router.post('/user/commands', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = userStore.getUserById(req.userId!);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const { name, response, enabled, permission, cooldown, platforms } = req.body;
  if (!name || !response) {
    return res.status(400).json({ error: 'Nombre y respuesta son requeridos' });
  }

  const cleanName = name.startsWith('!') ? name.trim() : `!${name.trim()}`;
  const newCmd = {
    id: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: cleanName,
    response: response.trim(),
    enabled: enabled !== undefined ? enabled : true,
    permission: permission || 'everyone',
    cooldown: cooldown || 5,
    platforms: platforms || ['twitch', 'kick'],
    useCount: 0,
  };

  user.commands.push(newCmd);
  userStore.save();
  res.status(201).json(newCmd);
});

// PUT /api/user/commands/:id
router.put('/user/commands/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = userStore.getUserById(req.userId!);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const idx = user.commands.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Comando no encontrado' });

  user.commands[idx] = { ...user.commands[idx], ...req.body };
  userStore.save();
  res.json(user.commands[idx]);
});

// DELETE /api/user/commands/:id
router.delete('/user/commands/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = userStore.getUserById(req.userId!);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const initialLen = user.commands.length;
  user.commands = user.commands.filter((c) => c.id !== req.params.id);
  if (user.commands.length !== initialLen) {
    userStore.save();
    return res.json({ success: true });
  }
  res.status(404).json({ error: 'Comando no encontrado' });
});

// GET /api/user/timers
router.get('/user/timers', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = userStore.getUserById(req.userId!);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(user.timers || []);
});

// POST /api/user/timers
router.post('/user/timers', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = userStore.getUserById(req.userId!);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const { name, messages, intervalMinutes, chatLinesThreshold, enabled, platforms } = req.body;
  if (!name || !messages || !messages.length) {
    return res.status(400).json({ error: 'Nombre y mensajes son requeridos' });
  }

  const newTimer = {
    id: `timer-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: name.trim(),
    messages: messages.map((m: string) => m.trim()).filter((m: string) => m.length > 0),
    intervalMinutes: intervalMinutes || 15,
    chatLinesThreshold: chatLinesThreshold || 5,
    enabled: enabled !== undefined ? enabled : true,
    platforms: platforms || ['twitch', 'kick'],
  };

  user.timers.push(newTimer);
  userStore.save();
  res.status(201).json(newTimer);
});

// PUT /api/user/timers/:id
router.put('/user/timers/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = userStore.getUserById(req.userId!);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const idx = user.timers.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Temporizador no encontrado' });

  user.timers[idx] = { ...user.timers[idx], ...req.body };
  userStore.save();
  res.json(user.timers[idx]);
});

// DELETE /api/user/timers/:id
router.delete('/user/timers/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = userStore.getUserById(req.userId!);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const initialLen = user.timers.length;
  user.timers = user.timers.filter((t) => t.id !== req.params.id);
  if (user.timers.length !== initialLen) {
    userStore.save();
    return res.json({ success: true });
  }
  res.status(404).json({ error: 'Temporizador no encontrado' });
});

// GET /api/user/stats
router.get('/user/stats', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = userStore.getUserById(req.userId!);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(user.stats);
});

// POST /api/user/test-alert - Trigger simulated test alert for current user
router.post('/user/test-alert', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = userStore.getUserById(req.userId!);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const { type, platform, userName, amount, message } = req.body;
  const testAlert: AlertEvent = {
    id: `test-${Date.now()}`,
    userId: user.id,
    platform: platform || 'twitch',
    channel: platform === 'kick' ? (user.accounts.kick?.channel || 'kick_channel') : (user.accounts.twitch?.channel || 'twitch_channel'),
    type: type || 'follow',
    user: userName || 'SuperFanático',
    amount: amount || (type === 'raid' ? 45 : type === 'gift' ? 5 : type === 'tip' ? 10 : 1),
    message: message || (type === 'tip' ? '¡Excelente directo!' : undefined),
    timestamp: Date.now(),
  };

  userStore.incrementUserStat(user.id, 'alertsTriggeredCount', 1);
  eventBus.emitAlert(testAlert);
  res.json({ success: true, alert: testAlert });
});

// GET /api/user/followers-count - Get real follower count from Kick & Twitch
router.get('/user/followers-count', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = userStore.getUserById(req.userId!);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  let kickFollowers = 0;
  let twitchFollowers = 0;

  if (user.accounts.kick?.channel) {
    const kCount = await FollowerService.getKickFollowers(user.accounts.kick.channel);
    if (kCount !== null) kickFollowers = kCount;
  }

  if (user.accounts.twitch?.channel) {
    const tCount = await FollowerService.getTwitchFollowers(user.accounts.twitch.channel);
    if (tCount !== null) twitchFollowers = tCount;
  }

  res.json({
    kick: kickFollowers,
    twitch: twitchFollowers,
    total: kickFollowers + twitchFollowers,
  });
});

// POST /api/user/sync-goal-followers - Sync live follower count to user's goal
router.post('/user/sync-goal-followers', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = userStore.getUserById(req.userId!);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const goal = user.config.overlay.goals;
  const platform = goal.platform || 'all';

  let currentFollowers = 0;

  if (platform === 'kick' && user.accounts.kick?.channel) {
    const kCount = await FollowerService.getKickFollowers(user.accounts.kick.channel);
    currentFollowers = kCount || 0;
  } else if (platform === 'twitch' && user.accounts.twitch?.channel) {
    const tCount = await FollowerService.getTwitchFollowers(user.accounts.twitch.channel);
    currentFollowers = tCount || 0;
  } else {
    // Both
    let total = 0;
    if (user.accounts.kick?.channel) {
      const kCount = await FollowerService.getKickFollowers(user.accounts.kick.channel);
      if (kCount) total += kCount;
    }
    if (user.accounts.twitch?.channel) {
      const tCount = await FollowerService.getTwitchFollowers(user.accounts.twitch.channel);
      if (tCount) total += tCount;
    }
    currentFollowers = total;
  }

  goal.current = currentFollowers;
  userStore.save();

  eventBus.emit('goal:update', {
    userId: user.id,
    goals: user.config.overlay.goals,
  });

  res.json({
    success: true,
    current: currentFollowers,
    goals: user.config.overlay.goals,
  });
});

// POST /api/user/kick/token - Update Kick token and re-sync channel data
router.post('/user/kick/token', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = userStore.getUserById(req.userId!);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const { token, channel, botUsername } = req.body;
  const cleanChannel = (channel || user.accounts.kick?.channel || user.username)
    .trim()
    .toLowerCase()
    .replace(/^@/, '');

  let kickMeta: any = null;
  if (cleanChannel) {
    kickMeta = await kickConnector.getChannelData(cleanChannel, token?.trim());
  }

  userStore.linkAccount(user.id, {
    platform: 'kick',
    channel: cleanChannel,
    username: botUsername?.trim() || user.accounts.kick?.username || cleanChannel,
    token: token !== undefined ? token.trim() : user.accounts.kick?.token,
    chatroomId: kickMeta?.chatroomId || user.accounts.kick?.chatroomId,
    channelId: kickMeta?.channelId || user.accounts.kick?.channelId,
    connected: true,
    botEnabled: true,
    avatar: user.accounts.kick?.avatar,
  });

  await botManager.syncUser(user.id);

  const updatedUser = userStore.getUserById(user.id)!;
  res.json({
    success: true,
    message: 'Canal y Token de Kick actualizados correctamente',
    account: updatedUser.accounts.kick,
  });
});

// POST /api/user/twitch/bot - Configure dedicated Twitch bot account
router.post('/user/twitch/bot', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = userStore.getUserById(req.userId!);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const { botUsername, botToken, channel } = req.body;
  const cleanChannel = (channel || user.accounts.twitch?.channel || user.username)
    .trim()
    .toLowerCase()
    .replace(/^#/, '');

  if (!user.accounts.twitch) {
    user.accounts.twitch = {
      platform: 'twitch',
      channel: cleanChannel,
      username: cleanChannel,
      connected: true,
      botEnabled: true,
    };
  }

  user.accounts.twitch.channel = cleanChannel;
  if (botUsername !== undefined) {
    user.accounts.twitch.botUsername = botUsername ? botUsername.trim().replace(/^[#@]/, '') : undefined;
  }
  if (botToken !== undefined) {
    user.accounts.twitch.botToken = botToken ? botToken.trim().replace(/^oauth:/i, '') : undefined;
  }

  userStore.save();
  await botManager.syncUser(user.id);

  const updatedUser = userStore.getUserById(user.id)!;
  res.json({
    success: true,
    message: 'Bot de Twitch configurado correctamente',
    account: updatedUser.accounts.twitch,
  });
});

// GET /api/user/subathon - Get subathon data
router.get('/user/subathon', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = userStore.getUserById(req.userId!);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  if (!user.config.overlay.subathon) {
    user.config.overlay.subathon = {
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
        remainingSeconds: 7200,
        initialSeconds: 7200,
        maxSeconds: 86400,
        lastUpdatedAt: Date.now(),
        totalTimeAdded: 0,
      },
      logs: [],
    };
    userStore.save();
  }

  res.json(user.config.overlay.subathon);
});

// POST /api/user/subathon/config - Update subathon settings
router.post('/user/subathon/config', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = userStore.getUserById(req.userId!);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

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

  const { enabled, weights, style, state } = req.body;
  if (enabled !== undefined) user.config.overlay.subathon.enabled = enabled;
  if (weights) user.config.overlay.subathon.weights = { ...user.config.overlay.subathon.weights, ...weights };
  if (style) user.config.overlay.subathon.style = { ...user.config.overlay.subathon.style, ...style };
  if (state) {
    user.config.overlay.subathon.state = {
      ...user.config.overlay.subathon.state,
      ...state,
    };
  }

  userStore.save();
  res.json(user.config.overlay.subathon);
});

// POST /api/user/subathon/action - Execute action (start, pause, resume, reset, add, subtract)
router.post('/user/subathon/action', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { action, seconds } = req.body;
  if (!action) return res.status(400).json({ error: 'Acción requerida' });

  const result = subathonManager.handleUserAction(req.userId!, action, { seconds });
  if (!result) return res.status(404).json({ error: 'Usuario no encontrado' });

  res.json(result);
});

// GET /api/overlay/data - Public endpoint for OBS overlays verified by overlayKey
router.get('/overlay/data', (req, res) => {
  const key = req.query.key as string;
  if (!key) {
    return res.status(400).json({ error: 'Falta parámetro key' });
  }

  const user = userStore.getUserByOverlayKey(key);
  if (!user) {
    return res.status(404).json({ error: 'Clave de overlay no válida' });
  }

  res.json({
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    config: user.config,
    accounts: {
      twitch: !!user.accounts.twitch?.connected,
      kick: !!user.accounts.kick?.connected,
    },
  });
});

// GET /api/user/ai-config - Get AI assistant config
router.get('/user/ai-config', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = userStore.getUserById(req.userId!);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  if (!user.config.overlay.aiBot) {
    user.config.overlay.aiBot = createDefaultAiBotConfig(user.displayName);
    userStore.save();
  }

  res.json({
    config: user.config.overlay.aiBot,
    overlayKey: user.overlayKey,
  });
});

// POST /api/user/ai-config - Update AI assistant config
router.post('/user/ai-config', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = userStore.getUserById(req.userId!);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const aiBotConfig = user.config.overlay.aiBot || createDefaultAiBotConfig(user.displayName);
  const updated = {
    ...aiBotConfig,
    ...req.body,
  };
  user.config.overlay.aiBot = updated;
  userStore.save();

  eventBus.emitAiStatus({
    userId: user.id,
    isAfk: updated.isAfk,
    enabled: updated.enabled,
    config: updated,
  });

  res.json({
    success: true,
    config: updated,
  });
});

// POST /api/user/ai-toggle-afk and /api/user/ai-status - Toggle AFK / Robot mode on/off
router.post('/user/ai-status', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = userStore.getUserById(req.userId!);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const aiBotConfig = user.config.overlay.aiBot || createDefaultAiBotConfig(user.displayName);
  const { isAfk } = req.body;
  aiBotConfig.isAfk = typeof isAfk === 'boolean' ? isAfk : !aiBotConfig.isAfk;
  user.config.overlay.aiBot = aiBotConfig;
  userStore.save();

  eventBus.emitAiStatus({
    userId: user.id,
    isAfk: aiBotConfig.isAfk,
    enabled: aiBotConfig.enabled,
    config: aiBotConfig,
  });

  res.json({
    success: true,
    isAfk: aiBotConfig.isAfk,
    config: aiBotConfig,
  });
});

router.post('/user/ai-toggle-afk', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = userStore.getUserById(req.userId!);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const aiBotConfig = user.config.overlay.aiBot || createDefaultAiBotConfig(user.displayName);
  const { isAfk } = req.body;
  aiBotConfig.isAfk = typeof isAfk === 'boolean' ? isAfk : !aiBotConfig.isAfk;
  user.config.overlay.aiBot = aiBotConfig;
  userStore.save();

  eventBus.emitAiStatus({
    userId: user.id,
    isAfk: aiBotConfig.isAfk,
    enabled: aiBotConfig.enabled,
    config: aiBotConfig,
  });

  res.json({
    success: true,
    isAfk: aiBotConfig.isAfk,
    config: aiBotConfig,
  });
});

// POST /api/user/ai-test - Simulate a test question for AI Robot
router.post('/user/ai-test', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = userStore.getUserById(req.userId!);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const { question, user: viewerName } = req.body;
  const testQuestion = question || '¿Dónde está el streamer y cuándo vuelve?';
  const testViewer = viewerName || 'EspectadorTest';

  try {
    const answer = await aiService.generateAnswer(user, testViewer, testQuestion, 'test');

    const speechEvent = {
      id: `ai-test-${Date.now()}`,
      userId: user.id,
      platform: 'test' as const,
      user: testViewer,
      question: testQuestion,
      response: answer,
      timestamp: Date.now(),
    };

    eventBus.emitAiSpeech(speechEvent);

    res.json({
      success: true,
      response: answer,
      event: speechEvent,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al generar respuesta de IA' });
  }
});
