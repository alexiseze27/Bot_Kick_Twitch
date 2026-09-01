import { Router, Response, NextFunction } from 'express';
import { userStore } from '../db/store';
import { requireAuth, AuthenticatedRequest, generateToken } from './authRoutes';
import { botManager } from '../engine/botManager';
import { twitchConnector } from '../connectors/twitch';
import { kickConnector } from '../connectors/kick';

export const adminRouter = Router();

// Middleware: Require Admin Role
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    const user = userStore.getUserById(req.userId!);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado: Se requieren permisos de Administrador.' });
    }
    next();
  });
}

// GET /api/admin/stats - System and Platform Metrics
adminRouter.get('/stats', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const users = userStore.getAllUsers();
  
  let twitchChannels = 0;
  let kickChannels = 0;
  let totalTwitchMessages = 0;
  let totalKickMessages = 0;
  let totalCommandsExecuted = 0;
  let totalAlertsTriggered = 0;

  users.forEach((u) => {
    if (u.accounts.twitch?.connected) twitchChannels++;
    if (u.accounts.kick?.connected) kickChannels++;
    totalTwitchMessages += u.stats?.twitchMessagesCount || 0;
    totalKickMessages += u.stats?.kickMessagesCount || 0;
    totalCommandsExecuted += u.stats?.commandsExecutedCount || 0;
    totalAlertsTriggered += u.stats?.alertsTriggeredCount || 0;
  });

  const globalConfig = userStore.getGlobalConfig();

  res.json({
    totalUsers: users.length,
    adminsCount: users.filter((u) => u.role === 'admin').length,
    twitch: {
      connectedChannels: twitchChannels,
      messages: totalTwitchMessages,
      botConnected: twitchConnector.isConnected,
      botIsAuth: twitchConnector.isAuth,
      globalBotUser: globalConfig.twitch.botUsername || '(No configurado)',
    },
    kick: {
      connectedChannels: kickChannels,
      messages: totalKickMessages,
      pusherConnected: kickConnector.isConnected,
      globalBotUser: globalConfig.kick.botUsername || '(No configurado)',
    },
    activity: {
      totalCommandsExecuted,
      totalAlertsTriggered,
      totalMessages: totalTwitchMessages + totalKickMessages,
    },
  });
});

// GET /api/admin/global-config - Get Global Master Bot Settings
adminRouter.get('/global-config', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const config = userStore.getGlobalConfig();
  res.json(config);
});

// POST /api/admin/global-config - Save Global Master Bot Settings and Re-Sync
adminRouter.post('/global-config', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = userStore.updateGlobalConfig(req.body);
    
    // Re-sync all bots with updated global credentials
    await botManager.syncAllUsers();

    res.json({
      success: true,
      message: 'Configuración global de bots guardada y sincronizada.',
      config: updated,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error al actualizar configuración global' });
  }
});

// GET /api/admin/users - List All Users for Admin Table
adminRouter.get('/users', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const users = userStore.getAllUsers();
  
  const userList = users.map((u) => ({
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    email: u.email,
    avatar: u.avatar,
    role: u.role || 'user',
    createdAt: u.createdAt,
    overlayKey: u.overlayKey,
    accounts: {
      twitch: u.accounts.twitch
        ? {
            channel: u.accounts.twitch.channel,
            username: u.accounts.twitch.username,
            botUsername: u.accounts.twitch.botUsername,
            connected: u.accounts.twitch.connected,
          }
        : null,
      kick: u.accounts.kick
        ? {
            channel: u.accounts.kick.channel,
            username: u.accounts.kick.username,
            botUsername: u.accounts.kick.botUsername,
            connected: u.accounts.kick.connected,
          }
        : null,
    },
    stats: u.stats,
    commandsCount: u.commands?.length || 0,
    timersCount: u.timers?.length || 0,
    mediaGalleryCount: u.mediaGallery?.length || 0,
  }));

  res.json(userList);
});

// POST /api/admin/users/:id/impersonate - Generate Session to Configure User Account
adminRouter.post('/users/:id/impersonate', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const targetUser = userStore.getUserById(req.params.id);
  if (!targetUser) {
    return res.status(404).json({ error: 'Usuario objetivo no encontrado' });
  }

  // Generate target user token
  const impersonationToken = generateToken(targetUser.id);

  res.json({
    success: true,
    token: impersonationToken,
    user: targetUser,
    message: `Iniciando sesión como ${targetUser.displayName || targetUser.username}`,
  });
});

// POST /api/admin/users/:id/role - Update User Role
adminRouter.post('/users/:id/role', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { role } = req.body;
  if (role !== 'admin' && role !== 'user') {
    return res.status(400).json({ error: 'Rol inválido. Debe ser admin o user.' });
  }

  const updated = userStore.setUserRole(req.params.id, role);
  if (!updated) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  res.json({
    success: true,
    message: `Rol actualizado a ${role} para ${updated.username}`,
    user: updated,
  });
});

// DELETE /api/admin/users/:id - Delete User Account
adminRouter.delete('/users/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  if (req.params.id === req.userId) {
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta de administrador mientras la estás usando.' });
  }

  const deleted = userStore.deleteUser(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  res.json({
    success: true,
    message: 'Cuenta de usuario eliminada correctamente.',
  });
});
