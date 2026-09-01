import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

export const OAUTH_CONFIG = {
  appUrl: process.env.APP_URL || 'http://localhost:3001',
  jwtSecret: process.env.JWT_SECRET || 'streambot_jwt_super_secret_key_2026',
  twitch: {
    clientId: process.env.TWITCH_CLIENT_ID || '',
    clientSecret: process.env.TWITCH_CLIENT_SECRET || '',
    redirectUri: process.env.TWITCH_REDIRECT_URI || 'http://localhost:3001/api/auth/twitch/callback',
    scopes: [
      'user:read:email',
      'chat:read',
      'chat:edit',
      'user:write:chat',
      'channel:bot',
      'user:bot',
      'channel:read:subscriptions',
      'channel:read:redemptions',
      'bits:read',
      'moderator:read:followers',
    ],
  },
  kick: {
    clientId: process.env.KICK_CLIENT_ID || '',
    clientSecret: process.env.KICK_CLIENT_SECRET || '',
    redirectUri: process.env.KICK_REDIRECT_URI || 'http://localhost:3001/api/auth/kick/callback',
    scopes: [
      'user:read',
      'channel:read',
      'chat:write',
      'events:subscribe',
      'channel:write',
      'moderation:read',
    ],
  },
};

// Store PKCE verifiers in memory keyed by state
const pkceStore = new Map<string, { verifier: string; createdAt: number }>();

// Cleanup stale PKCE entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  pkceStore.forEach((val, key) => {
    if (now - val.createdAt > 30 * 60 * 1000) {
      pkceStore.delete(key);
    }
  });
}, 10 * 60 * 1000);

function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

export class OAuthService {
  // ----------------------------------------------------
  // TWITCH OAUTH 2.0
  // ----------------------------------------------------
  public static getTwitchAuthUrl(state?: string): string {
    const authState = state || `tw_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const clientId = OAUTH_CONFIG.twitch.clientId.trim();

    if (clientId) {
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: OAUTH_CONFIG.twitch.redirectUri,
        response_type: 'code',
        scope: OAUTH_CONFIG.twitch.scopes.join(' '),
        state: authState,
        force_verify: 'true',
      });
      return `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
    }

    return `${OAUTH_CONFIG.appUrl}/oauth/setup?platform=twitch`;
  }

  public static async exchangeTwitchCode(code: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    user: { id: string; login: string; displayName: string; email?: string; profileImageUrl?: string };
  } | null> {
    try {
      const clientId = OAUTH_CONFIG.twitch.clientId.trim();
      const clientSecret = OAUTH_CONFIG.twitch.clientSecret.trim();

      const tokenRes = await axios.post(
        'https://id.twitch.tv/oauth2/token',
        new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: OAUTH_CONFIG.twitch.redirectUri,
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );

      const accessToken = tokenRes.data.access_token;
      const refreshToken = tokenRes.data.refresh_token;

      // Fetch Twitch User Info from Helix API
      const userRes = await axios.get('https://api.twitch.tv/helix/users', {
        headers: {
          'Client-Id': clientId,
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const userData = userRes.data.data?.[0];
      if (userData) {
        return {
          accessToken,
          refreshToken,
          user: {
            id: userData.id,
            login: userData.login,
            displayName: userData.display_name,
            email: userData.email,
            profileImageUrl: userData.profile_image_url,
          },
        };
      }
    } catch (e: any) {
      console.error('[OAuthService] Error exchanging Twitch code:', e?.response?.data || e?.message);
    }
    return null;
  }

  // ----------------------------------------------------
  // KICK OAUTH 2.0
  // ----------------------------------------------------
  public static getKickAuthUrl(state?: string): string {
    const authState = state || `kick_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const clientId = OAUTH_CONFIG.kick.clientId.trim();

    if (clientId) {
      const verifier = generateCodeVerifier();
      const challenge = generateCodeChallenge(verifier);

      // Save PKCE verifier for callback
      pkceStore.set(authState, { verifier, createdAt: Date.now() });

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: OAUTH_CONFIG.kick.redirectUri,
        response_type: 'code',
        scope: OAUTH_CONFIG.kick.scopes.join(' '),
        state: authState,
        code_challenge: challenge,
        code_challenge_method: 'S256',
      });
      return `https://id.kick.com/oauth/authorize?${params.toString()}`;
    }

    return `${OAUTH_CONFIG.appUrl}/oauth/setup?platform=kick`;
  }

  public static async exchangeKickCode(code: string, state?: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    user: { id: string; username: string; email?: string; avatar?: string };
  } | null> {
    try {
      const clientId = OAUTH_CONFIG.kick.clientId.trim();
      const clientSecret = OAUTH_CONFIG.kick.clientSecret.trim();
      const pkce = state ? pkceStore.get(state) : undefined;

      const formParams: Record<string, string> = {
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: OAUTH_CONFIG.kick.redirectUri,
        code,
      };

      if (pkce?.verifier) {
        formParams.code_verifier = pkce.verifier;
      }

      console.log('[OAuthService] Requesting Kick token from https://id.kick.com/oauth/token...');

      let tokenRes: any;
      try {
        // Try standard url-encoded post
        tokenRes = await axios.post(
          'https://id.kick.com/oauth/token',
          new URLSearchParams(formParams).toString(),
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          }
        );
      } catch (err: any) {
        console.warn('[OAuthService] urlencoded token request failed, trying json payload...', err?.response?.data || err?.message);
        // Fallback to JSON payload
        tokenRes = await axios.post('https://id.kick.com/oauth/token', formParams, {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const accessToken = tokenRes.data.access_token;
      const refreshToken = tokenRes.data.refresh_token;

      console.log('[OAuthService] Kick access token received successfully. Fetching user info...');

      // 1. Try fetching user profile from Kick Public API /public/v1/users
      let username = '';
      let email: string | undefined;
      let avatar: string | undefined;
      let userId = `kick_${Date.now()}`;

      try {
        const userRes = await axios.get('https://api.kick.com/public/v1/users', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        console.log('[OAuthService] Kick user API response:', JSON.stringify(userRes.data));

        const raw = userRes.data;
        const u = Array.isArray(raw?.data) ? raw.data[0] : (raw?.data || raw);

        if (u) {
          username = u.name || u.username || u.slug || '';
          email = u.email;
          avatar = u.profile_picture || u.profile_pic || u.avatar;
          userId = `${u.user_id || u.id || userId}`;
        }
      } catch (userErr: any) {
        console.warn('[OAuthService] /public/v1/users request error:', userErr?.response?.data || userErr?.message);
      }

      // 2. If username not found yet, try /public/v1/channels
      if (!username) {
        try {
          const channelRes = await axios.get('https://api.kick.com/public/v1/channels', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          console.log('[OAuthService] Kick channel API response:', JSON.stringify(channelRes.data));
          const rawCh = channelRes.data;
          const ch = Array.isArray(rawCh?.data) ? rawCh.data[0] : (rawCh?.data || rawCh);
          if (ch) {
            username = ch.slug || ch.name || ch.username || '';
            avatar = ch.avatar || avatar;
            if (ch.broadcaster_user_id || ch.id) {
              userId = `${ch.broadcaster_user_id || ch.id}`;
            }
          }
        } catch (chErr: any) {
          console.warn('[OAuthService] /public/v1/channels request error:', chErr?.response?.data || chErr?.message);
        }
      }

      // 3. Fallback to extracting from token or default
      if (!username) {
        username = `kick_streamer_${userId.substring(0, 6)}`;
      }

      return {
        accessToken,
        refreshToken,
        user: {
          id: userId,
          username,
          email,
          avatar,
        },
      };
    } catch (e: any) {
      console.error('[OAuthService] Error exchanging Kick code:', e?.response?.data || e?.message);
    }
    return null;
  }
}
