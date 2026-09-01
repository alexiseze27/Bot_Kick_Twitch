import React, { useState, useEffect, useRef } from 'react';
import { Upload, Image as ImageIcon, Music, Film, Check, Trash2, Play, Pause, X } from 'lucide-react';
import { PRESET_VISUALS, PRESET_SOUNDS, PresetMedia, PresetSound } from '../constants/defaultMedia';
import { MediaAsset } from '../types';
import { useAuth } from '../context/AuthContext';

interface MediaSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, mediaType: 'image' | 'video' | 'gif' | 'none', isAudio?: boolean) => void;
  mode: 'visual' | 'audio';
  currentUrl?: string;
}

export const MediaSelectorModal: React.FC<MediaSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  mode,
  currentUrl,
}) => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'presets' | 'uploads' | 'upload_new'>('presets');
  const [myMedia, setMyMedia] = useState<MediaAsset[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Audio preview state
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'uploads') {
      fetchMyMedia();
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  if (!isOpen) return null;

  const fetchMyMedia = async () => {
    if (!token) return;
    setLoadingMedia(true);
    try {
      const res = await fetch('/api/media', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMyMedia(data.mediaGallery || []);
      }
    } catch (e) {
      console.error('Error fetching media:', e);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!token) return;
    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al subir archivo');
      }

      const data = await res.json();
      const asset: MediaAsset = data.asset;
      setMyMedia((prev) => [asset, ...prev]);
      setActiveTab('uploads');

      // Auto-select uploaded file with accurate media type
      const isVideo = asset.type === 'video' || asset.url.endsWith('.webm') || asset.url.endsWith('.mp4');
      const isAudio = asset.type === 'audio' || asset.url.endsWith('.mp3') || asset.url.endsWith('.wav') || asset.url.endsWith('.ogg');
      const isGif = asset.url.endsWith('.gif');
      const finalType = isVideo ? 'video' : isAudio ? 'none' : isGif ? 'gif' : 'image';

      onSelect(asset.url, finalType, isAudio);
      onClose();
    } catch (e: any) {
      setUploadError(e.message || 'Error al subir archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMedia = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar este archivo de tu galería?')) return;
    try {
      const res = await fetch(`/api/media/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMyMedia((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (e) {}
  };

  const togglePlayAudio = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingAudioUrl === url) {
      audioRef.current?.pause();
      setPlayingAudioUrl(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play().catch(() => {});
      setPlayingAudioUrl(url);
      audio.onended = () => setPlayingAudioUrl(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              {mode === 'visual' ? (
                <>
                  <Film className="w-5 h-5 text-indigo-400" /> Galería de Imagen, Video o GIF
                </>
              ) : (
                <>
                  <Music className="w-5 h-5 text-emerald-400" /> Galería de Efectos de Sonido
                </>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Elige una opción predeterminada o sube tus propios archivos multimedia.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 gap-3">
          <button
            onClick={() => setActiveTab('presets')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'presets'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🌟 Predeterminados / Default
          </button>
          <button
            onClick={() => setActiveTab('uploads')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'uploads'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📁 Mi Galería Subida ({myMedia.length})
          </button>
          <button
            onClick={() => setActiveTab('upload_new')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'upload_new'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Subir Archivo Nuevo
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* TAB 1: PRESETS */}
          {activeTab === 'presets' && (
            <div>
              {mode === 'visual' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {PRESET_VISUALS.map((item: PresetMedia) => {
                    const isSelected = currentUrl === item.url;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          onSelect(item.url, item.type, false);
                          onClose();
                        }}
                        className={`group relative rounded-2xl overflow-hidden border cursor-pointer transition-all hover:scale-[1.02] bg-slate-950 flex flex-col justify-between ${
                          isSelected
                            ? 'border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/20'
                            : 'border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div className="h-32 w-full flex items-center justify-center overflow-hidden bg-slate-900/60 p-2">
                          <img
                            src={item.thumbnail}
                            alt={item.name}
                            className="max-h-full max-w-full object-contain rounded-lg"
                          />
                        </div>
                        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-200 truncate">{item.name}</span>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRESET_SOUNDS.map((snd: PresetSound) => {
                    const isSelected = currentUrl === snd.url;
                    const isPlaying = playingAudioUrl === snd.url;
                    return (
                      <div
                        key={snd.id}
                        onClick={() => {
                          onSelect(snd.url, 'none', true);
                          onClose();
                        }}
                        className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between bg-slate-950 ${
                          isSelected
                            ? 'border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-950/20'
                            : 'border-slate-800 hover:border-slate-600 hover:bg-slate-900/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => togglePlayAudio(snd.url, e)}
                            className="w-9 h-9 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 flex items-center justify-center transition"
                          >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                          </button>
                          <div>
                            <div className="text-xs font-bold text-slate-200">{snd.name}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">{snd.category}</div>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MY UPLOADS */}
          {activeTab === 'uploads' && (
            <div>
              {loadingMedia ? (
                <div className="text-center py-12 text-slate-400 text-xs animate-pulse">
                  Cargando tus archivos multimedia...
                </div>
              ) : myMedia.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-300">Aún no has subido ningún archivo</p>
                  <p className="text-xs text-slate-500">
                    Haz clic en "Subir Archivo Nuevo" para añadir tus propios videos WebM, GIFs, imágenes o sonidos.
                  </p>
                  <button
                    onClick={() => setActiveTab('upload_new')}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                  >
                    Subir ahora
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {myMedia
                    .filter((item) => (mode === 'visual' ? item.type !== 'audio' : item.type === 'audio'))
                    .map((item) => {
                      const isSelected = currentUrl === item.url;
                      const isPlaying = playingAudioUrl === item.url;
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            const isVid = item.type === 'video' || item.url.endsWith('.webm') || item.url.endsWith('.mp4');
                            const isAud = item.type === 'audio' || item.url.endsWith('.mp3') || item.url.endsWith('.wav') || item.url.endsWith('.ogg');
                            const isG = item.url.endsWith('.gif');
                            const finalT = isVid ? 'video' : isAud ? 'none' : isG ? 'gif' : 'image';
                            onSelect(item.url, finalT, isAud);
                            onClose();
                          }}
                          className={`group relative rounded-2xl overflow-hidden border cursor-pointer transition bg-slate-950 flex flex-col justify-between ${
                            isSelected
                              ? 'border-indigo-500 ring-2 ring-indigo-500/40'
                              : 'border-slate-800 hover:border-slate-600'
                          }`}
                        >
                          <div className="h-32 w-full flex items-center justify-center overflow-hidden bg-slate-900/60 p-2 relative">
                            {item.type === 'video' ? (
                              <video
                                src={item.url}
                                className="max-h-full max-w-full object-contain rounded-lg"
                                muted
                                loop
                                autoPlay
                              />
                            ) : item.type === 'audio' ? (
                              <div className="flex flex-col items-center gap-2">
                                <button
                                  onClick={(e) => togglePlayAudio(item.url, e)}
                                  className="w-12 h-12 rounded-2xl bg-emerald-600/30 text-emerald-400 flex items-center justify-center hover:scale-105 transition"
                                >
                                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                                </button>
                                <span className="text-[10px] text-slate-400 font-mono">Audio MP3/WAV</span>
                              </div>
                            ) : (
                              <img
                                src={item.url}
                                alt={item.name}
                                className="max-h-full max-w-full object-contain rounded-lg"
                              />
                            )}

                            <button
                              onClick={(e) => handleDeleteMedia(item.id, e)}
                              className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-500/80 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition shadow-lg"
                              title="Eliminar archivo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-200 truncate">{item.name}</span>
                            {isSelected && (
                              <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                                <Check className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: UPLOAD NEW */}
          {activeTab === 'upload_new' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-3xl p-10 flex flex-col items-center justify-center text-center transition bg-slate-950/40 cursor-pointer"
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  className="hidden"
                  accept={
                    mode === 'visual'
                      ? 'image/png,image/jpeg,image/gif,image/webp,video/webm,video/mp4'
                      : 'audio/mp3,audio/wav,audio/ogg,audio/mpeg'
                  }
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-4">
                  <Upload className={`w-7 h-7 ${uploading ? 'animate-bounce' : ''}`} />
                </div>

                <h4 className="text-sm font-bold text-white mb-1">
                  {uploading ? 'Subiendo archivo...' : 'Arrastra y suelta tu archivo aquí o haz clic para explorar'}
                </h4>
                <p className="text-xs text-slate-400 max-w-md">
                  {mode === 'visual'
                    ? 'Soporta GIFs animados, Videos WebM con fondo transparente, videos MP4, imágenes PNG y JPG (Máximo 50MB).'
                    : 'Soporta archivos de audio en formato MP3, WAV y OGG para tus alertas (Máximo 50MB).'}
                </p>
              </div>

              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                  {uploadError}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
