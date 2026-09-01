import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { authRouter } from './server/authRoutes';
import { adminRouter } from './server/adminRoutes';
import { router } from './server/routes';
import { uploadRouter } from './server/uploadRoutes';
import { setupSocketServer } from './server/socket';
import { botManager } from './engine/botManager';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Ensure uploads folder exists
const uploadsDir = path.resolve(process.cwd(), 'backend/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middlewares
app.use(cors());
app.use(express.json());

// Serve static uploaded media files
app.use('/uploads', express.static(uploadsDir));

// Auth & API Routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/media', uploadRouter);
app.use('/api', router);

// Setup WebSockets
setupSocketServer(server);

// Serve frontend build in production
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io') || req.path.startsWith('/uploads')) {
    return next();
  }
  const indexPath = path.join(frontendDist, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send('Frontend not built yet.');
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, async () => {
  console.log(`=========================================`);
  console.log(`🚀 StreamBot Multi-User Server running on http://localhost:${PORT}`);
  console.log(`🔐 Auth API available at http://localhost:${PORT}/api/auth`);
  console.log(`📁 Media Uploads served at http://localhost:${PORT}/uploads`);
  console.log(`=========================================`);

  // Auto-sync bots for all registered users
  await botManager.syncAllUsers();
});
