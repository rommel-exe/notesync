import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Note = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  content: string;
};

type CanvasState = {
  notes: Note[];
  selectedNoteId: string | null;
  panX: number;
  panY: number;
  zoom: number;
  noteCounter: number;
  topZIndex: number;
  createNoteAt: (x: number, y: number) => string;
  updateNoteContent: (id: string, content: string) => void;
  moveNote: (id: string, x: number, y: number) => void;
  resizeNote: (id: string, width: number, height: number) => void;
  clearCanvas: () => void;
  selectNote: (id: string | null) => void;
  bringToFront: (id: string) => void;
  setCanvasTransform: (panX: number, panY: number, zoom: number) => void;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set) => ({
      notes: [],
      selectedNoteId: null,
      panX: 0,
      panY: 0,
      zoom: 1,
      noteCounter: 0,
      topZIndex: 1,
      createNoteAt: (x, y) => {
        const id = `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        set((state) => {
          const zIndex = state.topZIndex + 1;
          const note = {
            id,
            x,
            y,
            width: 520,
            height: 40,
            zIndex,
            content: "<p></p>",
          };
          return {
            notes: [...state.notes, note],
            selectedNoteId: id,
            noteCounter: state.noteCounter + 1,
            topZIndex: zIndex,
          };
        });
        return id;
      },
      updateNoteContent: (id, content) => {
        set((state) => ({
          notes: state.notes.map((note) => (note.id === id ? { ...note, content } : note)),
        }));
      },
      moveNote: (id, x, y) => {
        set((state) => ({
          notes: state.notes.map((note) => (note.id === id ? { ...note, x, y } : note)),
        }));
      },
      resizeNote: (id, width, height) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? {
                  ...note,
                  width: clamp(width, 220, 980),
                  height: clamp(height, 140, 900),
                }
              : note,
          ),
        }));
      },
      clearCanvas: () => {
        set({
          notes: [],
          selectedNoteId: null,
          noteCounter: 0,
          topZIndex: 1,
        });
      },
      selectNote: (id) => set({ selectedNoteId: id }),
      bringToFront: (id) => {
        set((state) => {
          const zIndex = state.topZIndex + 1;
          return {
            notes: state.notes.map((note) => (note.id === id ? { ...note, zIndex } : note)),
            topZIndex: zIndex,
          };
        });
      },
      setCanvasTransform: (panX, panY, zoom) => {
        set({ panX, panY, zoom: clamp(zoom, 0.45, 2.4) });
      },
    }),
    {
      name: "notesync-canvas-v1",
      partialize: (state) => ({
        notes: state.notes,
        panX: state.panX,
        panY: state.panY,
        zoom: state.zoom,
        noteCounter: state.noteCounter,
        topZIndex: state.topZIndex,
      }),
    },
  ),
);
