export interface PresetMedia {
  id: string;
  name: string;
  category: 'gamer' | 'cute' | 'retro' | 'neon' | 'meme';
  type: 'gif' | 'video' | 'image';
  url: string;
  thumbnail: string;
}

export interface PresetSound {
  id: string;
  name: string;
  category: 'arcade' | 'chime' | 'fanfare' | 'retro' | 'coins';
  url: string;
}

export const PRESET_VISUALS: PresetMedia[] = [
  {
    id: 'vis-1',
    name: 'Celebración Gamer Neón',
    category: 'neon',
    type: 'gif',
    url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    thumbnail: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
  },
  {
    id: 'vis-2',
    name: 'Sub Trophy Champion',
    category: 'gamer',
    type: 'gif',
    url: 'https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif',
    thumbnail: 'https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif',
  },
  {
    id: 'vis-3',
    name: 'Caja Sorpresa Gift',
    category: 'cute',
    type: 'gif',
    url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',
    thumbnail: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',
  },
  {
    id: 'vis-4',
    name: 'Raid Nave Espacial',
    category: 'gamer',
    type: 'gif',
    url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
    thumbnail: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
  },
  {
    id: 'vis-5',
    name: 'Lluvia de Dinero (Tip)',
    category: 'meme',
    type: 'gif',
    url: 'https://media.giphy.com/media/67ThDxtWS4Y92/giphy.gif',
    thumbnail: 'https://media.giphy.com/media/67ThDxtWS4Y92/giphy.gif',
  },
  {
    id: 'vis-6',
    name: 'Bits Diamante Brillante',
    category: 'neon',
    type: 'gif',
    url: 'https://media.giphy.com/media/l41lT4n6ylgW2hh04/giphy.gif',
    thumbnail: 'https://media.giphy.com/media/l41lT4n6ylgW2hh04/giphy.gif',
  },
  {
    id: 'vis-7',
    name: 'Gatito Fiesta Pop',
    category: 'cute',
    type: 'gif',
    url: 'https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif',
    thumbnail: 'https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif',
  },
  {
    id: 'vis-8',
    name: 'Pixel Art Level Up',
    category: 'retro',
    type: 'gif',
    url: 'https://media.giphy.com/media/eNAsjO550VCza/giphy.gif',
    thumbnail: 'https://media.giphy.com/media/eNAsjO550VCza/giphy.gif',
  },
  {
    id: 'vis-9',
    name: 'Fuego Épico Victory',
    category: 'gamer',
    type: 'gif',
    url: 'https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif',
    thumbnail: 'https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif',
  },
  {
    id: 'vis-10',
    name: 'Anime Wow Sparkles',
    category: 'cute',
    type: 'gif',
    url: 'https://media.giphy.com/media/13hxeOYjoTWtK8/giphy.gif',
    thumbnail: 'https://media.giphy.com/media/13hxeOYjoTWtK8/giphy.gif',
  },
];

export const PRESET_SOUNDS: PresetSound[] = [
  {
    id: 'snd-1',
    name: '🔔 Campana Mágica (Chime)',
    category: 'chime',
    url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
  },
  {
    id: 'snd-2',
    name: '🌟 Victoria Gamer (Level Up)',
    category: 'arcade',
    url: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  },
  {
    id: 'snd-3',
    name: '🎁 Fanfarria Especial (Gift)',
    category: 'fanfare',
    url: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
  },
  {
    id: 'snd-4',
    name: '🚀 Alerta Sirena Épica (Raid)',
    category: 'arcade',
    url: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  },
  {
    id: 'snd-5',
    name: '💰 Caja Registradora (Cash Tip)',
    category: 'coins',
    url: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3',
  },
  {
    id: 'snd-6',
    name: '💎 Monedas Retro 8-Bit (Bits)',
    category: 'retro',
    url: 'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3',
  },
  {
    id: 'snd-7',
    name: '✨ Destello Celestial (Sub)',
    category: 'chime',
    url: 'https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3',
  },
  {
    id: 'snd-8',
    name: '🕹️ 1-UP Retro Arcade',
    category: 'retro',
    url: 'https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3',
  },
];
