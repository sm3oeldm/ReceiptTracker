// ── Design Tokens ──
// Central source of truth for spacing, radii, typography, shadows, and animation.
// Every screen and component should import from here instead of hardcoding values.

export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
  full: 9999,
};

export const FONT = {
  sizes: {
    caption: 11,
    label: 13,
    body: 15,
    bodyAlt: 16,
    heading: 18,
    title: 22,
    largeTitle: 28,
    hero: 34,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
};

// Shadow presets using React Native's shadow/elevation API
// Apply via spreading: style={[...SHADOW.sm]}
export const SHADOW = {
  none: {},
  sm: (c = '#000000') => ({
    shadowColor: c,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  }),
  md: (c = '#000000') => ({
    shadowColor: c,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  }),
  lg: (c = '#000000') => ({
    shadowColor: c,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  }),
};

// Animation timing presets
export const ANIM = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: { damping: 20, stiffness: 200 },
};
