import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isImpersonating: boolean;
  impersonateUser: (targetUserId: string) => Promise<{ success: boolean; error?: string }>;
  stopImpersonating: () => Promise<void>;
  loginWithEmail: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithTwitch: (channel: string, botUsername?: string, oauthToken?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithKick: (channel: string, botUsername?: string, botToken?: string) => Promise<{ success: boolean; error?: string }>;
  linkPlatform: (platform: 'twitch' | 'kick', channel: string, botUsername?: string, token?: string) => Promise<{ success: boolean; error?: string }>;
  unlinkPlatform: (platform: 'twitch' | 'kick') => Promise<{ success: boolean; error?: string }>;
  regenerateOverlayKey: () => Promise<string | null>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    // Check if token was provided in URL query string from OAuth callback
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      localStorage.setItem('streambot_token', urlToken);
      // Clean query params from URL without reload
      window.history.replaceState({}, document.title, window.location.pathname);
      return urlToken;
    }
    return localStorage.getItem('streambot_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem('streambot_token');
    if (!savedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setToken(savedToken);
      } else {
        localStorage.removeItem('streambot_token');
        setUser(null);
        setToken(null);
      }
    } catch (e) {
      console.error('Error verifying auth token:', e);
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const handleAuthSuccess = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('streambot_token', authToken);
  };

  const loginWithEmail = async (identifier: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password: pass }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        handleAuthSuccess(data.user, data.token);
        return { success: true };
      }
      return { success: false, error: data.error || 'Credenciales incorrectas' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Error de conexión' };
    }
  };

  const register = async (username: string, email: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password: pass }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        handleAuthSuccess(data.user, data.token);
        return { success: true };
      }
      return { success: false, error: data.error || 'Error al registrar usuario' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Error de conexión' };
    }
  };

  const loginWithTwitch = async (channel: string, botUsername?: string, oauthToken?: string) => {
    try {
      const res = await fetch('/api/auth/twitch-instant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, botUsername, oauthToken }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        handleAuthSuccess(data.user, data.token);
        return { success: true };
      }
      return { success: false, error: data.error || 'Error al autenticar con Twitch' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Error de conexión' };
    }
  };

  const loginWithKick = async (channel: string, botUsername?: string, botToken?: string) => {
    try {
      const res = await fetch('/api/auth/kick-instant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, botUsername, botToken }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        handleAuthSuccess(data.user, data.token);
        return { success: true };
      }
      return { success: false, error: data.error || 'Error al autenticar con Kick' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Error de conexión' };
    }
  };

  const linkPlatform = async (platform: 'twitch' | 'kick', channel: string, botUsername?: string, platformToken?: string) => {
    if (!token) return { success: false, error: 'No autenticado' };
    try {
      const res = await fetch('/api/auth/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ platform, channel, botUsername, token: platformToken }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        return { success: true };
      }
      return { success: false, error: data.error || 'Error al vincular cuenta' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Error de conexión' };
    }
  };

  const unlinkPlatform = async (platform: 'twitch' | 'kick') => {
    if (!token) return { success: false, error: 'No autenticado' };
    try {
      const res = await fetch('/api/auth/unlink', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ platform }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        return { success: true };
      }
      return { success: false, error: data.error || 'Error al desvincular cuenta' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Error de conexión' };
    }
  };

  const regenerateOverlayKey = async (): Promise<string | null> => {
    if (!token) return null;
    try {
      const res = await fetch('/api/auth/regenerate-key', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.overlayKey) {
        if (user) setUser({ ...user, overlayKey: data.overlayKey });
        return data.overlayKey;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const [isImpersonating, setIsImpersonating] = useState<boolean>(() => {
    return !!localStorage.getItem('streambot_admin_return_token');
  });

  const impersonateUser = async (targetUserId: string) => {
    try {
      const currentToken = localStorage.getItem('streambot_token');
      const res = await fetch(`/api/admin/users/${targetUserId}/impersonate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.token) {
        if (!localStorage.getItem('streambot_admin_return_token') && currentToken) {
          localStorage.setItem('streambot_admin_return_token', currentToken);
        }
        localStorage.setItem('streambot_token', data.token);
        setIsImpersonating(true);
        await refreshUser();
        return { success: true };
      }
      return { success: false, error: data.error || 'Error al ingresar como usuario' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Error de conexión' };
    }
  };

  const stopImpersonating = async () => {
    const adminToken = localStorage.getItem('streambot_admin_return_token');
    if (adminToken) {
      localStorage.setItem('streambot_token', adminToken);
      localStorage.removeItem('streambot_admin_return_token');
      setIsImpersonating(false);
      await refreshUser();
    }
  };

  const logout = () => {
    localStorage.removeItem('streambot_token');
    localStorage.removeItem('streambot_admin_return_token');
    setIsImpersonating(false);
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        isImpersonating,
        impersonateUser,
        stopImpersonating,
        loginWithEmail,
        register,
        loginWithTwitch,
        loginWithKick,
        linkPlatform,
        unlinkPlatform,
        regenerateOverlayKey,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
