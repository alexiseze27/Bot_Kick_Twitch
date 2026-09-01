import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth, AuthenticatedRequest } from './authRoutes';
import { userStore } from '../db/store';
import { MediaAsset } from '../types';

export const uploadRouter = Router();

const UPLOADS_DIR = path.resolve(process.cwd(), 'backend/uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req: AuthenticatedRequest, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    cb(null, `${cleanName}_${uniqueSuffix}${ext}`);
  },
});

// File filter (Images, GIFs, Videos, Audio)
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.webm', '.mp4', '.mp3', '.wav', '.ogg', '.aac'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${ext}. Formatos permitidos: imágenes, GIFs, videos (webm, mp4) y audios (mp3, wav).`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB max
  },
});

function detectMediaType(filename: string): 'image' | 'video' | 'audio' {
  const ext = path.extname(filename).toLowerCase();
  if (['.webm', '.mp4'].includes(ext)) return 'video';
  if (['.mp3', '.wav', '.ogg', '.aac'].includes(ext)) return 'audio';
  return 'image';
}

// POST /api/media/upload
uploadRouter.post('/upload', requireAuth, upload.single('file'), (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo.' });
    }

    const userId = req.userId!;
    const mediaType = detectMediaType(req.file.filename);
    const fileUrl = `/uploads/${req.file.filename}`;

    const asset: MediaAsset = {
      id: `med_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: req.file.originalname,
      type: mediaType,
      url: fileUrl,
      size: req.file.size,
      createdAt: Date.now(),
    };

    userStore.addMediaAsset(userId, asset);

    res.status(201).json({
      message: 'Archivo subido correctamente',
      asset,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error al procesar el archivo.' });
  }
});

// GET /api/media
uploadRouter.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = userStore.getUserById(req.userId!);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ mediaGallery: user.mediaGallery || [] });
});

// DELETE /api/media/:id
uploadRouter.delete('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const assetId = req.params.id;
  const user = userStore.getUserById(userId);

  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const asset = (user.mediaGallery || []).find((a) => a.id === assetId);
  if (asset) {
    try {
      const filename = path.basename(asset.url);
      const filePath = path.join(UPLOADS_DIR, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.warn('Could not delete file from disk:', e);
    }
  }

  const updatedUser = userStore.deleteMediaAsset(userId, assetId);
  res.json({ message: 'Medio eliminado', mediaGallery: updatedUser?.mediaGallery || [] });
});
