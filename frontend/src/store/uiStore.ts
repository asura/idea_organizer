import { create } from 'zustand';

interface UIState {
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  quickInputOpen: boolean;

  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  toggleQuickInput: () => void;
  setQuickInputOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedNodeId: null,
  selectedEdgeId: null,
  quickInputOpen: false,

  selectNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
  toggleQuickInput: () => set((state) => ({ quickInputOpen: !state.quickInputOpen })),
  setQuickInputOpen: (open) => set({ quickInputOpen: open }),
}));
