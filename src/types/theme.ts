export type ThemeId = 'default' | 'japan' | 'apple' | 'retro' | 'cyberpunk';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  tagline: string;
  emoji: string;
  tone: 'dark' | 'light';
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  swatches: string[];
  description: string;
}

export const THEME_REGISTRY: Record<ThemeId, ThemeDefinition> = {
  default: {
    id: 'default',
    name: 'Default OLED',
    tagline: 'Pure Black • AMOLED Care',
    emoji: '⬛',
    tone: 'dark',
    accentColor: '#10B981', // Clean Emerald
    badgeBg: '#27272A',
    badgeText: '#FFFFFF',
    swatches: ['#000000', '#09090B', '#27272A', '#10B981'],
    description: 'Pure #000000 pitch-black canvas with dynamic Spotify album art backlighting and zero battery waste on OLED.',
  },
  japan: {
    id: 'japan',
    name: 'Anime Japan Zen',
    tagline: 'Light Tone • Mount Fuji & Ramen',
    emoji: '🍜',
    tone: 'light',
    accentColor: '#7BA23F', // Matcha Green
    badgeBg: '#FFB7C5',
    badgeText: '#2D3142',
    swatches: ['#BAE0F5', '#FFB7C5', '#7BA23F', '#E84855'],
    description: 'Daylight Ghibli sky, snow-capped Mount Fuji, steaming ramen with chopsticks, Torii gate, and authentic cherry blossom pink (#FFB7C5).',
  },
  apple: {
    id: 'apple',
    name: 'Apple Liquid Glass',
    tagline: 'macOS Sonoma Acrylic',
    emoji: '🍏',
    tone: 'dark',
    accentColor: '#38BDF8', // Glacier Blue
    badgeBg: '#38BDF8',
    badgeText: '#000000',
    swatches: ['#1E1035', '#0B2545', '#38BDF8', '#FFFFFF'],
    description: 'Ultra-frosted acrylic glass floating over a dynamic macOS abstract gradient wallpaper with rounded pill controls.',
  },
  retro: {
    id: 'retro',
    name: 'Simple Retro Radio',
    tagline: '1960s Braun • Muted & Simple',
    emoji: '📻',
    tone: 'dark',
    accentColor: '#D99B43', // Warm Amber
    badgeBg: '#D99B43',
    badgeText: '#000000',
    swatches: ['#141210', '#1E1B18', '#38322B', '#D99B43'],
    description: 'Understated 1960s Dieter Rams tabletop radio aesthetic. Muted charcoal bakelite, horizontal tuning scale, and warm amber accents.',
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk HUD',
    tagline: 'Night City Netrunner',
    emoji: '⚡',
    tone: 'dark',
    accentColor: '#FCEE0A', // Cyberpunk Yellow
    badgeBg: '#FCEE0A',
    badgeText: '#000000',
    swatches: ['#08080C', '#0E0E14', '#00F0FF', '#FCEE0A'],
    description: 'Sharp 45° chamfered cards, yellow hazard caution stripes, glowing CRT scanlines, and tactical neon cyan & hot pink reticles.',
  },
};

export const THEME_IDS: ThemeId[] = ['default', 'japan', 'apple', 'retro', 'cyberpunk'];
