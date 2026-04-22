import { create } from "zustand";
import { persist } from "zustand/middleware";

export type VaultItemType = "file" | "folder";

export type SortMode = "manual" | "name-asc" | "name-desc" | "modified-desc" | "created-desc";

export type VaultItem = {
  id: string;
  type: VaultItemType;
  name: string;
  parentId: string | null;
  order: number;
  createdAt: number;
  modifiedAt: number;
  content: string;
  collapsed?: boolean;
};

type VaultContextMenu = {
  open: boolean;
  x: number;
  y: number;
  targetId: string | null;
  targetType: VaultItemType | "background" | null;
};

type VaultState = {
  items: VaultItem[];
  selectedId: string | null;
  sortMode: SortMode;
  autoRevealActiveFile: boolean;
  sidebarCollapsed: boolean;
  contextMenu: VaultContextMenu;
  createNote: (parentId?: string | null) => string;
  createFolder: (parentId?: string | null) => string;
  renameItem: (id: string, name: string) => void;
  deleteItem: (id: string) => void;
  moveItem: (id: string, parentId: string | null) => void;
  toggleFolder: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  setSortMode: (sortMode: SortMode) => void;
  toggleAutoRevealActiveFile: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  selectItem: (id: string | null) => void;
  updateFileContent: (id: string, content: string) => void;
  openContextMenu: (payload: VaultContextMenu) => void;
  closeContextMenu: () => void;
};

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const getDescendantIds = (items: VaultItem[], id: string): string[] => {
  const descendants: string[] = [];
  const queue = [id];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    for (const item of items) {
      if (item.parentId === current) {
        descendants.push(item.id);
        if (item.type === "folder") {
          queue.push(item.id);
        }
      }
    }
  }

  return descendants;
};

const getAncestorIds = (items: VaultItem[], id: string): string[] => {
  const ancestors: string[] = [];
  let current = items.find((item) => item.id === id)?.parentId ?? null;

  while (current) {
    ancestors.push(current);
    current = items.find((item) => item.id === current)?.parentId ?? null;
  }

  return ancestors;
};

const isDescendant = (items: VaultItem[], candidateId: string, targetFolderId: string) =>
  getDescendantIds(items, candidateId).includes(targetFolderId);

const siblingNames = (items: VaultItem[], parentId: string | null, excludeId?: string) =>
  items
    .filter((item) => item.parentId === parentId && item.id !== excludeId)
    .map((item) => item.name.toLowerCase());

const uniqueName = (
  items: VaultItem[],
  parentId: string | null,
  baseName: string,
  excludeId?: string,
) => {
  const siblings = siblingNames(items, parentId, excludeId);
  if (!siblings.includes(baseName.toLowerCase())) {
    return baseName;
  }

  let index = 1;
  while (siblings.includes(`${baseName} ${index}`.toLowerCase())) {
    index += 1;
  }

  return `${baseName} ${index}`;
};

const initialItems: VaultItem[] = [
  {
    id: "folder-inbox",
    type: "folder",
    name: "Inbox",
    parentId: null,
    order: 0,
    createdAt: Date.now() - 100000,
    modifiedAt: Date.now() - 100000,
    content: "",
    collapsed: false,
  },
  {
    id: "file-welcome",
    type: "file",
    name: "Welcome",
    parentId: "folder-inbox",
    order: 0,
    createdAt: Date.now() - 90000,
    modifiedAt: Date.now() - 90000,
    content: "Start managing files here.",
  },
  {
    id: "file-scratch",
    type: "file",
    name: "Scratch",
    parentId: null,
    order: 1,
    createdAt: Date.now() - 80000,
    modifiedAt: Date.now() - 80000,
    content: "",
  },
];

const isSortMode = (value: unknown): value is SortMode =>
  value === "manual" || value === "name-asc" || value === "name-desc" || value === "modified-desc" || value === "created-desc";

export const useVaultStore = create<VaultState>()(
  persist(
    (set, get) => ({
      items: initialItems,
      selectedId: null,
      sortMode: "manual",
      autoRevealActiveFile: true,
      sidebarCollapsed: false,
      contextMenu: { open: false, x: 0, y: 0, targetId: null, targetType: null },
      createNote: (parentId = null) => {
        const id = makeId("file");
        const now = Date.now();
        const state = get();
        const nextName = uniqueName(state.items, parentId, "Canvas");
        const nextOrder = Math.max(-1, ...state.items.filter((item) => item.parentId === parentId).map((item) => item.order)) + 1;

        set((current) => ({
          items: [
            ...current.items,
            {
              id,
              type: "file",
              name: nextName,
              parentId,
              order: nextOrder,
              createdAt: now,
              modifiedAt: now,
              content: "",
            },
          ],
          selectedId: id,
          contextMenu: { open: false, x: 0, y: 0, targetId: null, targetType: null },
        }));

        return id;
      },
      createFolder: (parentId = null) => {
        const id = makeId("folder");
        const now = Date.now();
        const state = get();
        const nextName = uniqueName(state.items, parentId, "Folder");
        const nextOrder = Math.max(-1, ...state.items.filter((item) => item.parentId === parentId).map((item) => item.order)) + 1;

        set((current) => ({
          items: [
            ...current.items,
            {
              id,
              type: "folder",
              name: nextName,
              parentId,
              order: nextOrder,
              createdAt: now,
              modifiedAt: now,
              content: "",
              collapsed: false,
            },
          ],
          selectedId: id,
          contextMenu: { open: false, x: 0, y: 0, targetId: null, targetType: null },
        }));

        return id;
      },
      renameItem: (id, name) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  name: uniqueName(state.items, item.parentId, name.trim() || item.name, id),
                  modifiedAt: Date.now(),
                }
              : item,
          ),
        }));
      },
      deleteItem: (id) => {
        set((state) => {
          const removeIds = new Set([id, ...getDescendantIds(state.items, id)]);
          const nextSelected = removeIds.has(state.selectedId ?? "") ? null : state.selectedId;

          return {
            items: state.items.filter((item) => !removeIds.has(item.id)),
            selectedId: nextSelected,
            contextMenu: { open: false, x: 0, y: 0, targetId: null, targetType: null },
          };
        });
      },
      moveItem: (id, parentId) => {
        set((state) => {
          const item = state.items.find((entry) => entry.id === id);
          if (!item) {
            return state;
          }

          if (item.type === "folder" && parentId && (parentId === id || isDescendant(state.items, id, parentId))) {
            return state;
          }

          const nextName = uniqueName(state.items, parentId, item.name, id);
          const nextOrder = Math.max(-1, ...state.items.filter((entry) => entry.parentId === parentId && entry.id !== id).map((entry) => entry.order)) + 1;

          return {
            items: state.items.map((entry) =>
              entry.id === id
                ? {
                    ...entry,
                    parentId,
                    name: nextName,
                    order: nextOrder,
                    modifiedAt: Date.now(),
                  }
                : entry,
            ),
            contextMenu: { open: false, x: 0, y: 0, targetId: null, targetType: null },
          };
        });
      },
      toggleFolder: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id && item.type === "folder"
              ? { ...item, collapsed: !item.collapsed, modifiedAt: Date.now() }
              : item,
          ),
        }));
      },
      expandAll: () => {
        set((state) => ({
          items: state.items.map((item) => (item.type === "folder" ? { ...item, collapsed: false } : item)),
        }));
      },
      collapseAll: () => {
        set((state) => ({
          items: state.items.map((item) => (item.type === "folder" ? { ...item, collapsed: true } : item)),
        }));
      },
      setSortMode: (sortMode) => set({ sortMode }),
      toggleAutoRevealActiveFile: () => set((state) => ({ autoRevealActiveFile: !state.autoRevealActiveFile })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      selectItem: (id) => {
        set((state) => {
          if (!id) {
            return { selectedId: null };
          }

          const nextItems = state.autoRevealActiveFile
            ? state.items.map((item) =>
                getAncestorIds(state.items, id).includes(item.id) && item.type === "folder"
                  ? { ...item, collapsed: false }
                  : item,
              )
            : state.items;

          return { selectedId: id, items: nextItems };
        });
      },
      updateFileContent: (id, content) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id && item.type === "file"
              ? { ...item, content, modifiedAt: Date.now() }
              : item,
          ),
        }));
      },
      openContextMenu: (payload) => set({ contextMenu: payload }),
      closeContextMenu: () => set({ contextMenu: { open: false, x: 0, y: 0, targetId: null, targetType: null } }),
    }),
    {
      name: "notesync-vault-v1",
      version: 2,
      migrate: (persistedState) => {
        const nextState = persistedState as Partial<VaultState> | undefined;

        return {
          items: Array.isArray(nextState?.items) ? nextState.items : initialItems,
          selectedId: typeof nextState?.selectedId === "string" ? nextState.selectedId : null,
          sortMode: isSortMode(nextState?.sortMode) ? nextState.sortMode : "manual",
          autoRevealActiveFile:
            typeof nextState?.autoRevealActiveFile === "boolean" ? nextState.autoRevealActiveFile : true,
          sidebarCollapsed:
            typeof nextState?.sidebarCollapsed === "boolean" ? nextState.sidebarCollapsed : false,
        };
      },
      partialize: (state) => ({
        items: state.items,
        selectedId: state.selectedId,
        sortMode: state.sortMode,
        autoRevealActiveFile: state.autoRevealActiveFile,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    },
  ),
);

export const vaultHelpers = {
  getDescendantIds,
  getAncestorIds,
  uniqueName,
};