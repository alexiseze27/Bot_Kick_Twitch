import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { userStore } from '../db/store';
import { botManager } from '../engine/botManager';
import { kickConnector } from '../connectors/kick';
import { OAuthService, OAUTH_CONFIG } from '../config/oauth';

const JWT_SECRET = OAUTH_CONFIG.jwtSecret;

export const authRouter = Router();

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado. Se requiere token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

// ----------------------------------------------------
// OAUTH 2.0 REDIRECTS & CALLBACKS (TWITCH & KICK)
// ----------------------------------------------------

// GET /api/auth/twitch/redirect
authRouter.get('/twitch/redirect', (req: Request, res: Response) => {
  const state = req.query.state as string;
  const authUrl = OAuthService.getTwitchAuthUrl(state);
  res.redirect(authUrl);
});

// GET /api/auth/twitch/callback
authRouter.get('/twitch/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const state = (req.query.state as string) || '';

  if (!code) {
    return res.redirect(`${OAUTH_CONFIG.appUrl}/login?error=oauth_denied`);
  }

  try {
    const exchangeResult = await OAuthService.exchangeTwitchCode(code);
    if (!exchangeResult) {
      return res.redirect(`${OAUTH_CONFIG.appUrl}/login?error=token_exchange_failed`);
    }

    const { accessToken, user: twitchUser } = exchangeResult;
    const cleanChannel = twitchUser.login.toLowerCase();

    let user: any;

    // Check if user was linking an existing session
    if (state.startsWith('link_')) {
      const targetUserId = state.replace('link_', '');
      const existingUser = userStore.getUserById(targetUserId);
      if (existingUser) {
        user = userStore.linkAccount(existingUser.id, {
          platform: 'twitch',
          channel: cleanChannel,
          username: twitchUser.displayName || cleanChannel,
          token: accessToken,
          connected: true,
          botEnabled: true,
          avatar: twitchUser.profileImageUrl,
        });
      }
    }

    if (!user) {
      // Find existing user with this twitch channel or username
      user = userStore.findUserByPlatformChannel('twitch', cleanChannel);

      if (!user) {
        user = userStore.createUser({
          username: cleanChannel,
          displayName: twitchUser.displayName || cleanChannel,
          email: twitchUser.email,
          avatar: twitchUser.profileImageUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanChannel}`,
          twitchAccount: {
            platform: 'twitch',
            channel: cleanChannel,
            username: twitchUser.displayName || cleanChannel,
            token: accessToken,
            connected: true,
            botEnabled: true,
            avatar: twitchUser.profileImageUrl,
          },
        });
      } else {
        userStore.linkAccount(user.id, {
          platform: 'twitch',
          channel: cleanChannel,
          username: twitchUser.displayName || cleanChannel,
          token: accessToken,
          connected: true,
          botEnabled: true,
          avatar: twitchUser.profileImageUrl,
        });
        user = userStore.getUserById(user.id)!;
      }
    }

    // Auto-sync bot to join the channel
    await botManager.syncUser(user.id);

    const token = generateToken(user.id);
    res.redirect(`${OAUTH_CONFIG.appUrl}/?token=${token}`);
  } catch (e: any) {
    console.error('Error in Twitch callback:', e);
    res.redirect(`${OAUTH_CONFIG.appUrl}/login?error=internal_error`);
  }
});

// GET /api/auth/kick/redirect
authRouter.get('/kick/redirect', (req: Request, res: Response) => {
  const state = req.query.state as string;
  const authUrl = OAuthService.getKickAuthUrl(state);
  res.redirect(authUrl);
});

// GET /api/auth/kick/callback
authRouter.get('/kick/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const state = (req.query.state as string) || '';

  if (!code) {
    return res.redirect(`${OAUTH_CONFIG.appUrl}/login?error=oauth_denied`);
  }

  try {
    const exchangeResult = await OAuthService.exchangeKickCode(code, state);
    if (!exchangeResult) {
      return res.redirect(`${OAUTH_CONFIG.appUrl}/login?error=token_exchange_failed`);
    }

    const { accessToken, user: kickUser } = exchangeResult;
    const cleanChannel = kickUser.username.toLowerCase();
    const kickMeta = await kickConnector.getChannelData(cleanChannel, accessToken);

    let user: any;

    // Check if user was linking an existing session
    if (state.startsWith('link_')) {
      const targetUserId = state.replace('link_', '');
      const existingUser = userStore.getUserById(targetUserId);
      if (existingUser) {
        user = userStore.linkAccount(existingUser.id, {
          platform: 'kick',
          channel: cleanChannel,
          username: kickUser.username,
          token: accessToken,
          chatroomId: kickMeta?.chatroomId,
          channelId: kickMeta?.channelId,
          connected: true,
          botEnabled: true,
          avatar: kickUser.avatar,
        });
      }
    }

    if (!user) {
      user = userStore.findUserByPlatformChannel('kick', cleanChannel);

      if (!user) {
        user = userStore.createUser({
          username: cleanChannel,
          displayName: kickUser.username,
          email: kickUser.email,
          avatar: kickUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanChannel}`,
          kickAccount: {
            platform: 'kick',
            channel: cleanChannel,
            username: kickUser.username,
            token: accessToken,
            chatroomId: kickMeta?.chatroomId,
            channelId: kickMeta?.channelId,
            connected: true,
            botEnabled: true,
            avatar: kickUser.avatar,
          },
        });
      } else {
        userStore.linkAccount(user.id, {
          platform: 'kick',
          channel: cleanChannel,
          username: kickUser.username,
          token: accessToken,
          chatroomId: kickMeta?.chatroomId || user.accounts.kick?.chatroomId,
          channelId: kickMeta?.channelId || user.accounts.kick?.channelId,
          connected: true,
          botEnabled: true,
          avatar: kickUser.avatar,
        });
        user = userStore.getUserById(user.id)!;
      }
    }

    await botManager.syncUser(user.id);

    const token = generateToken(user.id);
    res.redirect(`${OAUTH_CONFIG.appUrl}/?token=${token}`);
  } catch (e: any) {
    console.error('Error in Kick callback:', e);
    res.redirect(`${OAUTH_CONFIG.appUrl}/login?error=internal_error`);
  }
});

// POST /api/auth/oauth-authorize-consent (Handles authorization from interactive consent screen)
authRouter.post('/oauth-authorize-consent', async (req: Request, res: Response) => {
  try {
    const { platform, channel, botUsername, token, linkWithUserId } = req.body;
    if (!platform || !channel) {
      return res.status(400).json({ error: 'Plataforma y canal son requeridos.' });
    }

    const cleanChannel = channel.trim().toLowerCase().replace(/^[#@]/, '');
    let chatroomId: number | undefined;
    let channelId: number | undefined;

    if (platform === 'kick') {
      const kickMeta = await kickConnector.getChannelData(cleanChannel, token);
      chatroomId = kickMeta?.chatroomId;
      channelId = kickMeta?.channelId;
    }

    let user: any;

    if (linkWithUserId) {
      user = userStore.linkAccount(linkWithUserId, {
        platform,
        channel: cleanChannel,
        username: botUsername?.trim() || cleanChannel,
        token: token?.trim(),
        chatroomId,
        channelId,
        connected: true,
        botEnabled: true,
      });
    } else {
      user = userStore.findUserByPlatformChannel(platform, cleanChannel);

      if (!user) {
        user = userStore.createUser({
          username: cleanChannel,
          displayName: channel.trim(),
          avatar:
            platform === 'kick'
              ? `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanChannel}`
              : `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanChannel}`,
          twitchAccount:
            platform === 'twitch'
              ? {
                  platform: 'twitch',
                  channel: cleanChannel,
                  username: botUsername?.trim() || cleanChannel,
                  token: token?.trim(),
                  connected: true,
                  botEnabled: true,
                }
              : undefined,
          kickAccount:
            platform === 'kick'
              ? {
                  platform: 'kick',
                  channel: cleanChannel,
                  username: botUsername?.trim() || cleanChannel,
                  token: token?.trim(),
                  chatroomId,
                  channelId,
                  connected: true,
                  botEnabled: true,
                }
              : undefined,
        });
      } else {
        userStore.linkAccount(user.id, {
          platform,
          channel: cleanChannel,
          username: botUsername?.trim() || cleanChannel,
          token: token?.trim() || (platform === 'kick' ? user.accounts.kick?.token : user.accounts.twitch?.token),
          chatroomId: chatroomId || user.accounts.kick?.chatroomId,
          channelId: channelId || user.accounts.kick?.channelId,
          connected: true,
          botEnabled: true,
        });
        user = userStore.getUserById(user.id)!;
      }
    }

    if (!user) {
      return res.status(500).json({ error: 'Error al procesar usuario.' });
    }

    await botManager.syncUser(user.id);
    const authToken = generateToken(user.id);
    res.json({ user, token: authToken });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error al autorizar cuenta.' });
  }
});

// ----------------------------------------------------
// STANDARD AUTH (REGISTER / LOGIN / PROFILE)
// ----------------------------------------------------

// POST /api/auth/register (Email/Password)
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Nombre de usuario y contraseña son requeridos.' });
    }

    if (userStore.getUserByUsername(username)) {
      return res.status(400).json({ error: 'El nombre de usuario ya está registrado.' });
    }

    if (email && userStore.getUserByEmail(email)) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = userStore.createUser({
      username: username.trim(),
      displayName: username.trim(),
      email: email ? email.trim() : undefined,
      passwordHash,
    });

    const token = generateToken(user.id);
    res.status(201).json({ user, token });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error en el registro.' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
    }

    let user = userStore.getUserByUsername(identifier) || userStore.getUserByEmail(identifier);
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const token = generateToken(user.id);
    res.json({ user, token });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error al iniciar sesión.' });
  }
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = userStore.getUserById(req.userId!);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }
  res.json(user);
});

// POST /api/auth/link
authRouter.post('/link', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { platform, channel, botUsername, token } = req.body;
    if (!platform || !channel) {
      return res.status(400).json({ error: 'Plataforma y canal son requeridos.' });
    }

    const cleanChannel = channel.trim().toLowerCase().replace(/^[#@]/, '');
    let chatroomId: number | undefined;
    let channelId: number | undefined;

    if (platform === 'kick') {
      const kickMeta = await kickConnector.getChannelData(cleanChannel, token);
      chatroomId = kickMeta?.chatroomId;
      channelId = kickMeta?.channelId;
    }

    const updatedUser = userStore.linkAccount(req.userId!, {
      platform,
      channel: cleanChannel,
      username: botUsername?.trim() || cleanChannel,
      token: token?.trim(),
      chatroomId,
      channelId,
      connected: true,
      botEnabled: true,
    });

    if (!updatedUser) return res.status(404).json({ error: 'Usuario no encontrado' });

    await botManager.syncUser(updatedUser.id);
    res.json(updatedUser);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error al vincular cuenta.' });
  }
});

// POST /api/auth/unlink
authRouter.post('/unlink', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { platform } = req.body;
  if (platform !== 'twitch' && platform !== 'kick') {
    return res.status(400).json({ error: 'Plataforma inválida' });
  }

  const updatedUser = userStore.unlinkAccount(req.userId!, platform);
  if (!updatedUser) return res.status(404).json({ error: 'Usuario no encontrado' });

  res.json(updatedUser);
});

// POST /api/auth/regenerate-key
authRouter.post('/regenerate-key', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const newKey = userStore.regenerateOverlayKey(req.userId!);
  if (!newKey) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ overlayKey: newKey });
});
