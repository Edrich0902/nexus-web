/**
 * Nexus design tokens — the single source of truth for colour, type, space,
 * radius and motion. Web reads these through CSS variables (see theme.css and
 * ambient.ts); the future mobile client should consume this file directly.
 * Keep values platform-neutral: hex colours, unitless numbers, plain strings.
 */

export const brand = {
  coffeeBean: '#1a090d',
  coffeeBeanPanel: '#261318',
  lavenderBlush: '#f6e8ea',
  meadowGreen: '#5ecf8a',
  blueSlate: '#3d5a6c',
  lightGreen: '#ace894',
} as const

/** Ambient palette: the whole UI is tinted by one of these at a time. */
export interface Ambient {
  /** Page background. */
  amb: string
  /** Raised surface / artwork well, one step lighter than `amb`. */
  amb2: string
  /** Accent: primary actions, italic headline words, live dots. */
  acc: string
  /** Text colour on `amb`. */
  ink: string
}

/** Solid colour-field palette for a section (bg + legible text). */
export interface FieldColour {
  bg: string
  ink: string
}

export type SectionKey =
  | 'home'
  | 'listening'
  | 'code'
  | 'cellar'
  | 'beer'
  | 'spirits'
  | 'kitchen'
  | 'food-drink'
  | 'library'
  | 'f1'
  | 'sports'
  | 'media'
  | 'admin'
  | 'profile'
  | 'auth'

export interface Section {
  key: SectionKey
  label: string
  ambient: Ambient
  field: FieldColour
}

const brandAmbient: Ambient = {
  amb: brand.coffeeBean,
  amb2: brand.coffeeBeanPanel,
  acc: brand.meadowGreen,
  ink: brand.lavenderBlush,
}

export const sections: Record<SectionKey, Section> = {
  home: {
    key: 'home',
    label: 'Home',
    ambient: brandAmbient,
    field: { bg: brand.meadowGreen, ink: '#0b2416' },
  },
  listening: {
    key: 'listening',
    label: 'Listening',
    ambient: { amb: '#10201f', amb2: '#183230', acc: '#f0a35e', ink: '#f4ede4' },
    field: { bg: '#1ed760', ink: '#06150b' },
  },
  code: {
    key: 'code',
    label: 'Code',
    ambient: { amb: '#0f1115', amb2: '#191c23', acc: '#9cc4ff', ink: '#eef1f5' },
    field: { bg: '#f3ebe6', ink: '#1a090d' },
  },
  cellar: {
    key: 'cellar',
    label: 'Wine',
    ambient: { amb: '#1c0a10', amb2: '#2c111a', acc: '#e58a98', ink: '#fbecee' },
    field: { bg: '#6b1a2b', ink: '#ffd9de' },
  },
  beer: {
    key: 'beer',
    label: 'Beer',
    ambient: { amb: '#18120a', amb2: '#271d0e', acc: '#e5ad1f', ink: '#fbf3e0' },
    field: { bg: '#e5ad1f', ink: '#2a1a02' },
  },
  spirits: {
    key: 'spirits',
    label: 'Spirits',
    ambient: { amb: '#1a0f08', amb2: '#2b1a0e', acc: '#e09455', ink: '#fbefe4' },
    field: { bg: '#c8743a', ink: '#2a1206' },
  },
  kitchen: {
    key: 'kitchen',
    label: 'Recipes',
    ambient: { amb: '#0f1a11', amb2: '#18281a', acc: '#a8c89c', ink: '#eef6ea' },
    field: { bg: '#a8c89c', ink: '#13230f' },
  },
  'food-drink': {
    key: 'food-drink',
    label: 'Food & Drink',
    ambient: { amb: '#1a100b', amb2: '#2a1b12', acc: '#e0a274', ink: '#fbefe6' },
    field: { bg: '#d6c7a8', ink: '#2a2010' },
  },
  library: {
    key: 'library',
    label: 'Library',
    ambient: { amb: '#0e1222', amb2: '#171d33', acc: '#9cb0e0', ink: '#eef1fb' },
    field: { bg: '#9cb0e0', ink: '#0f1630' },
  },
  f1: {
    key: 'f1',
    label: 'Formula 1',
    ambient: { amb: '#170707', amb2: '#2a0c0a', acc: '#ff4a3d', ink: '#fff1ec' },
    field: { bg: '#d42218', ink: '#fff4ef' },
  },
  sports: {
    key: 'sports',
    label: 'Sports',
    ambient: { amb: '#08191a', amb2: '#0f2a2a', acc: '#4fc3b4', ink: '#e9fbf8' },
    field: { bg: '#2f6f66', ink: '#e6fff9' },
  },
  media: {
    key: 'media',
    label: 'Media',
    ambient: { amb: '#121216', amb2: '#1d1d23', acc: '#c9b6ff', ink: '#f2f0f7' },
    field: { bg: '#c9b6ff', ink: '#1b1430' },
  },
  admin: {
    key: 'admin',
    label: 'Admin',
    ambient: { amb: '#0c1420', amb2: '#142133', acc: '#7fb5e6', ink: '#ecf3fb' },
    field: { bg: '#7fb5e6', ink: '#0b1a2b' },
  },
  profile: {
    key: 'profile',
    label: 'Profile',
    ambient: brandAmbient,
    field: { bg: brand.lavenderBlush, ink: brand.coffeeBean },
  },
  auth: {
    key: 'auth',
    label: 'Sign in',
    ambient: brandAmbient,
    field: { bg: brand.meadowGreen, ink: '#0b2416' },
  },
}

/** "Moments": ambient presets chosen by what is happening, not where you are. */
export type MomentKey = 'morning' | 'afternoon' | 'evening' | 'music' | 'race' | 'cellar'

export const moments: Record<MomentKey, Ambient> = {
  morning: { amb: '#14171c', amb2: '#1f242b', acc: '#f2c46b', ink: '#f6f1e7' },
  afternoon: { amb: '#10201f', amb2: '#183230', acc: '#f0a35e', ink: '#f4ede4' },
  evening: brandAmbient,
  music: sections.listening.ambient,
  race: sections.f1.ambient,
  cellar: sections.cellar.ambient,
}

/** Team / sport colours used by fields and bars. */
export const accents = {
  spotify: '#1db954',
  github: '#f3ebe6',
  success: '#6fd39a',
  danger: '#f08a7e',
  warn: '#f2c46b',
  sport: {
    football: '#5ecf8a',
    tennis: '#d4e157',
    rugby: '#e0a45a',
    golf: '#8fd16a',
    darts: '#e85d5d',
    'field-hockey': '#4db8d0',
    f1: '#e10600',
  },
} as const

export const fonts = {
  sans: "'Inter', system-ui, -apple-system, sans-serif",
  serif: "'Instrument Serif', Georgia, serif",
  display: "'Bricolage Grotesque', 'Inter', sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
} as const

/** Type scale in px. Display sizes are clamped responsively in CSS. */
export const type = {
  micro: 11.5,
  caption: 12.5,
  body: 14,
  lede: 17,
  h4: 14.5,
  section: 13,
  summary: 32,
  nose: 46,
  stage: 88,
  stageMobile: 48,
} as const

/** 4px-based spacing scale. */
export const space = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 72, 96] as const

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 20,
  xxl: 22,
  pill: 999,
} as const

export const motion = {
  /** Ambient colour cross-fade between sections / moments. */
  ambientMs: 900,
  enterMs: 600,
  hoverMs: 200,
  ease: 'cubic-bezier(.2,.7,.2,1)',
} as const

export const breakpoints = {
  phone: 640,
  tablet: 960,
  desktop: 1280,
} as const
