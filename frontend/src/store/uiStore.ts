import { create } from 'zustand';

interface ContextMenu {
  x: number;
  y: number;
  nodeId?: string;
  edgeId?: string;
}

interface UIState {
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  quickInputOpen: boolean;
  contextMenu: ContextMenu | null;
  detailPanelOpen: boolean;

  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  clearSelection: () => void;
  toggleQuickInput: () => void;
  setQuickInputOpen: (open: boolean) => void;
  openContextMenu: (menu: ContextMenu) => void;
  closeContextMenu: () => void;
  setDetailPanelOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedNodeId: null,
  selectedEdgeId: null,
  quickInputOpen: false,
  contextMenu: null,
  detailPanelOpen: false,

  selectNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null, detailPanelOpen: id !== null }),
  selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null, detailPanelOpen: id !== null }),
  clearSelection: () => set({ selectedNodeId: null, selectedEdgeId: null, detailPanelOpen: false }),
  toggleQuickInput: () => set((state) => ({ quickInputOpen: !state.quickInputOpen })),
  setQuickInputOpen: (open) => set({ quickInputOpen: open }),
  openContextMenu: (menu) => set({ contextMenu: menu }),
  closeContextMenu: () => set({ contextMenu: null }),
  setDetailPanelOpen: (open) => set({ detailPanelOpen: open }),
}));
