import { create } from 'zustand'

const PRESET_COLORS = [
  '#000000','#ffffff','#ef4444','#f97316','#eab308','#22c55e',
  '#06b6d4','#3b82f6','#8b5cf6','#ec4899','#f43f5e','#84cc16',
  '#14b8a6','#0ea5e9','#6366f1','#a855f7','#f59e0b','#10b981',
  '#64748b','#78716c'
]

export const PRESET_COLORS_LIST = PRESET_COLORS

export const useCanvasStore = create((set, get) => ({
  activeTool: 'select',
  penSize: 'M',
  eraserSize: 'M',
  activeColor: '#000000',
  recentColors: [],
  aspectLock: false,

  zoom: 1,
  panX: 0,
  panY: 0,

  selectedIds: [],
  editingTextId: null,

  setTool: (tool) => set({ activeTool: tool, selectedIds: [], editingTextId: null }),
  setPenSize: (penSize) => set({ penSize }),
  setEraserSize: (eraserSize) => set({ eraserSize }),
  toggleAspectLock: () => set(s => ({ aspectLock: !s.aspectLock })),

  setActiveColor(color) {
    const { recentColors } = get()
    const filtered = recentColors.filter(c => c !== color)
    set({ activeColor: color, recentColors: [color, ...filtered].slice(0, 5) })
  },

  setZoom: (zoom) => set({ zoom: Math.min(5, Math.max(0.1, zoom)) }),
  setPan: (panX, panY) => set({ panX, panY }),
  fitToScreen: () => set({ zoom: 1, panX: 0, panY: 0 }),

  setSelected: (ids) => set({ selectedIds: Array.isArray(ids) ? ids : [ids] }),
  clearSelection: () => set({ selectedIds: [] }),
  addToSelection: (id) => set(s => ({ selectedIds: [...new Set([...s.selectedIds, id])] })),
  setEditingText: (id) => set({ editingTextId: id })
}))
