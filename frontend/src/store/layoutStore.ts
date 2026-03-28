import { create } from 'zustand';

export interface ForceConfig {
  centerStrength: number;
  chargeStrength: number;
  linkDistance: number;
  linkStrength: number;
  collideRadius: number;
  velocityDecay: number;
  boundingBox: { width: number; height: number };
}

const DEFAULT_FORCE_CONFIG: ForceConfig = {
  centerStrength: 0.05,
  chargeStrength: -300,
  linkDistance: 200,
  linkStrength: 0.3,
  collideRadius: 120,
  velocityDecay: 0.5,
  boundingBox: { width: 3000, height: 2000 },
};

interface LayoutState {
  // Dagre layout direction
  dagreDirection: 'TB' | 'LR';
  setDagreDirection: (dir: 'TB' | 'LR') => void;

  // Animation flag (dagre transition or force simulation active)
  isAnimating: boolean;
  setAnimating: (v: boolean) => void;

  // Force simulation
  forceEnabled: boolean;
  forceConfig: ForceConfig;
  toggleForce: () => void;
  setForceConfig: (partial: Partial<ForceConfig>) => void;
}

export const useLayoutStore = create<LayoutState>()((set) => ({
  dagreDirection: 'TB',
  setDagreDirection: (dir) => set({ dagreDirection: dir }),

  isAnimating: false,
  setAnimating: (v) => set({ isAnimating: v }),

  forceEnabled: false,
  forceConfig: DEFAULT_FORCE_CONFIG,
  toggleForce: () => set((s) => ({ forceEnabled: !s.forceEnabled })),
  setForceConfig: (partial) =>
    set((s) => ({ forceConfig: { ...s.forceConfig, ...partial } })),
}));
