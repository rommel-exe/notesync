import { useEffect, useMemo, useRef, useState, type DragEvent, type MouseEvent as ReactMouseEvent } from "react";
import { type SortMode, type VaultItem, type VaultItemType, useVaultStore, vaultHelpers } from "../../state/vaultStore";

const sortItems = (items: VaultItem[], parentId: string | null, sortMode: SortMode) => {
  const children = items.filter((item) => item.parentId === parentId);

  if (sortMode === "manual") {
    return [...children].sort((left, right) => left.order - right.order || left.name.localeCompare(right.name));
  }

  return [...children].sort((left, right) => {
    if (left.type !== right.type) {
      return left.type === "folder" ? -1 : 1;
    }

    switch (sortMode) {
      case "name-asc":
        return left.name.localeCompare(right.name);
      case "name-desc":
        return right.name.localeCompare(left.name);
      case "modified-desc":
        return right.modifiedAt - left.modifiedAt;
      case "created-desc":
        return right.createdAt - left.createdAt;
      default:
        return 0;
    }
  });
};

const findFolderByPath = (items: VaultItem[], pathText: string) => {
  const trimmed = pathText.trim();
  if (!trimmed || trimmed === "/" || trimmed.toLowerCase() === "root") {
    return null;
  }

  const segments = trimmed.split("/").map((segment) => segment.trim()).filter(Boolean);
  let parentId: string | null = null;

  for (const segment of segments) {
    const nextFolder = items.find(
      (item) => item.type === "folder" && item.parentId === parentId && item.name.toLowerCase() === segment.toLowerCase(),
    );

    if (!nextFolder) {
      return null;
    }

    parentId = nextFolder.id;
  }

  return items.find((item) => item.id === parentId && item.type === "folder") ?? null;
};

type CreateIconProps = {
  kind: "canvas" | "folder";
};

function CreateIcon({ kind }: CreateIconProps) {
  if (kind === "canvas") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="vault-create-icon-svg">
        <rect x="4" y="5" width="16" height="13" rx="2.5" ry="2.5" />
        <path d="M7 9h10M7 12h7M7 15h4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="vault-create-icon-svg">
      <path d="M4 7.5h5.2l1.4 1.8H20a1 1 0 0 1 1 1V17a1 1 0 0 1-1 1H4.5A1.5 1.5 0 0 1 3 16.5V9A1.5 1.5 0 0 1 4.5 7.5Z" />
      <path d="M4.8 7.5V6.3A1.3 1.3 0 0 1 6.1 5h3.3l1.4 1.5" />
    </svg>
  );
}

function HierarchyIcon({ kind }: CreateIconProps) {
  return (
    <span className="vault-node-icon" aria-hidden="true">
      <CreateIcon kind={kind} />
    </span>
  );
}

const normalizeSearch = (value: string) => value.trim().toLowerCase();

const collectSearchVisibility = (items: VaultItem[], query: string) => {
  const normalized = normalizeSearch(query);

  if (!normalized) {
    return {
      visibleIds: null as Set<string> | null,
      matchedIds: new Set<string>(),
    };
  }

  const visibleIds = new Set<string>();
  const matchedIds = new Set<string>();

  const markAncestors = (id: string) => {
    for (const ancestorId of vaultHelpers.getAncestorIds(items, id)) {
      visibleIds.add(ancestorId);
    }
  };

  for (const item of items) {
    if (!item.name.toLowerCase().includes(normalized)) {
      continue;
    }

    matchedIds.add(item.id);
    visibleIds.add(item.id);
    markAncestors(item.id);

    if (item.type === "folder") {
      for (const descendantId of vaultHelpers.getDescendantIds(items, item.id)) {
        visibleIds.add(descendantId);
      }
    }
  }

  return { visibleIds, matchedIds };
};

type TreeNodeProps = {
  item: VaultItem;
  depth: number;
  items: VaultItem[];
  sortMode: SortMode;
  selectedId: string | null;
  visibleIds: Set<string> | null;
  matchedIds: Set<string>;
  searchActive: boolean;
  draggedItemId: string | null;
  dropTargetParentId: string | null;
  onSelect: (id: string) => void;
  onToggleFolder: (id: string) => void;
  onOpenContextMenu: (
    event: ReactMouseEvent,
    targetId: string | null,
    targetType: VaultItemType | "background",
  ) => void;
  onDragStart: (event: DragEvent<HTMLDivElement>, itemId: string) => void;
  onDragEnd: () => void;
  onDropToFolder: (folderId: string | null) => void;
  onDropTargetChange: (folderId: string | null) => void;
  setNodeRef: (id: string, element: HTMLDivElement | null) => void;
};

function TreeNode({
  item,
  depth,
  items,
  sortMode,
  selectedId,
  visibleIds,
  matchedIds,
  searchActive,
  draggedItemId,
  dropTargetParentId,
  onSelect,
  onToggleFolder,
  onOpenContextMenu,
  onDragStart,
  onDragEnd,
  onDropToFolder,
  onDropTargetChange,
  setNodeRef,
}: TreeNodeProps) {
  const isSelected = selectedId === item.id;
  const isDragging = draggedItemId === item.id;
  const isDropTarget = dropTargetParentId === item.id;
  const children = sortItems(items, item.id, sortMode).filter((child) => !visibleIds || visibleIds.has(child.id));
  const isSearchMatch = matchedIds.has(item.id);
  const showChildren = item.type === "folder" && (searchActive || !item.collapsed);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onDropToFolder(item.id);
  };

  return (
    <div className="vault-tree-node-shell" style={{ marginLeft: depth * 14 }}>
      <div
        ref={(element) => setNodeRef(item.id, element)}
        className={`vault-tree-node ${item.type === "folder" ? "is-folder" : "is-file"} ${isSelected ? "is-selected" : ""} ${isDragging ? "is-dragging" : ""} ${isDropTarget ? "is-drop-target" : ""} ${isSearchMatch ? "is-search-match" : ""}`}
        draggable
        onDragStart={(event) => onDragStart(event, item.id)}
        onDragEnd={onDragEnd}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
          if (item.type === "folder") {
            onDropTargetChange(item.id);
          }
        }}
        onDragLeave={() => {
          if (isDropTarget) {
            onDropTargetChange(null);
          }
        }}
        onDrop={item.type === "folder" ? handleDrop : undefined}
        onClick={() => onSelect(item.id)}
        onContextMenu={(event) => onOpenContextMenu(event, item.id, item.type)}
      >
        <HierarchyIcon kind={item.type === "folder" ? "folder" : "canvas"} />
        {item.type === "folder" ? (
          <button
            type="button"
            className="vault-folder-toggle"
            aria-label={item.collapsed ? "Expand folder" : "Collapse folder"}
            onClick={(event) => {
              event.stopPropagation();
              onToggleFolder(item.id);
            }}
          >
            {item.collapsed ? "▸" : "▾"}
          </button>
        ) : (
          <span className="vault-file-bullet">•</span>
        )}
        <span className="vault-node-name" title={item.name}>
          {item.name}
        </span>
      </div>

      {showChildren ? (
        <div className="vault-tree-children">
          {children.map((child) => (
            <TreeNode
              key={child.id}
              item={child}
              depth={depth + 1}
              items={items}
              sortMode={sortMode}
              selectedId={selectedId}
              visibleIds={visibleIds}
              matchedIds={matchedIds}
              searchActive={searchActive}
              draggedItemId={draggedItemId}
              dropTargetParentId={dropTargetParentId}
              onSelect={onSelect}
              onToggleFolder={onToggleFolder}
              onOpenContextMenu={onOpenContextMenu}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDropToFolder={onDropToFolder}
              onDropTargetChange={onDropTargetChange}
              setNodeRef={setNodeRef}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function VaultSidebar() {
  const {
    items,
    selectedId,
    autoRevealActiveFile,
    sidebarCollapsed,
    contextMenu,
    createNote,
    createFolder,
    renameItem,
    deleteItem,
    moveItem,
    toggleFolder,
    expandAll,
    collapseAll,
    toggleAutoRevealActiveFile,
    toggleSidebarCollapsed,
    selectItem,
    openContextMenu,
    closeContextMenu,
  } = useVaultStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dropTargetParentId, setDropTargetParentId] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<
    | { type: "rename"; itemId: string; value: string }
    | { type: "move"; itemId: string; value: string }
    | { type: "delete"; itemId: string }
    | null
  >(null);
  const nodeRefs = useRef(new Map<string, HTMLDivElement | null>());

  const searchState = useMemo(() => collectSearchVisibility(items, searchQuery), [items, searchQuery]);
  const rootChildren = useMemo(
    () => sortItems(items, null, "manual").filter((item) => !searchState.visibleIds || searchState.visibleIds.has(item.id)),
    [items, searchState.visibleIds],
  );
  const searchActive = searchQuery.trim().length > 0;

  useEffect(() => {
    if (!selectedId || !autoRevealActiveFile) {
      return;
    }

    nodeRefs.current.get(selectedId)?.scrollIntoView({ block: "nearest" });
  }, [autoRevealActiveFile, selectedId, items]);

  const setNodeRef = (id: string, element: HTMLDivElement | null) => {
    if (element) {
      nodeRefs.current.set(id, element);
      return;
    }

    nodeRefs.current.delete(id);
  };

  const handleCreateNote = () => {
    const id = createNote(null);
    selectItem(id);
  };

  const handleCreateFolder = () => {
    const id = createFolder(null);
    selectItem(id);
  };

  const openRenameDialog = (id: string) => {
    const item = items.find((entry) => entry.id === id);
    if (!item) {
      return;
    }

    setDialogState({ type: "rename", itemId: id, value: item.name });
  };

  const openDeleteDialog = (id: string) => {
    const item = items.find((entry) => entry.id === id);
    if (!item) {
      return;
    }

    setDialogState({ type: "delete", itemId: id });
  };

  const openMoveDialog = (id: string) => {
    const item = items.find((entry) => entry.id === id);
    if (!item) {
      return;
    }

    setDialogState({ type: "move", itemId: id, value: "" });
  };

  const handleDropToFolder = (folderId: string | null) => {
    if (!draggedItemId) {
      return;
    }

    moveItem(draggedItemId, folderId);
    setDraggedItemId(null);
    setDropTargetParentId(null);
  };

  const handleBackgroundDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!draggedItemId) {
      return;
    }

    moveItem(draggedItemId, null);
    setDraggedItemId(null);
    setDropTargetParentId(null);
  };

  const renderContextMenu = () => {
    if (!contextMenu.open) {
      return null;
    }

    const targetItem = contextMenu.targetId ? items.find((entry) => entry.id === contextMenu.targetId) ?? null : null;

    const createHere = () => {
      const parentId = targetItem
        ? targetItem.type === "folder"
          ? targetItem.id
          : targetItem.parentId
        : null;
      const id = createNote(parentId);
      selectItem(id);
      closeContextMenu();
    };

    const createFolderHere = () => {
      const parentId = targetItem
        ? targetItem.type === "folder"
          ? targetItem.id
          : targetItem.parentId
        : null;
      const id = createFolder(parentId);
      selectItem(id);
      closeContextMenu();
    };

    const renameTarget = () => {
      if (targetItem) {
        openRenameDialog(targetItem.id);
      }
      closeContextMenu();
    };

    const deleteTarget = () => {
      if (targetItem) {
        openDeleteDialog(targetItem.id);
      }
      closeContextMenu();
    };

    const moveTarget = () => {
      if (targetItem) {
        openMoveDialog(targetItem.id);
      }
      closeContextMenu();
    };

    const toggleTargetFolder = () => {
      if (targetItem?.type === "folder") {
        toggleFolder(targetItem.id);
      }
      closeContextMenu();
    };

    return (
      <div className="vault-context-menu-backdrop" onMouseDown={closeContextMenu}>
        <div
          className="vault-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button type="button" onClick={createHere}>
            New note
          </button>
          <button type="button" onClick={createFolderHere}>
            New folder
          </button>
          {targetItem ? (
            <>
              <button type="button" onClick={renameTarget}>
                Rename
              </button>
              <button type="button" onClick={moveTarget}>
                Move to...
              </button>
              <button type="button" onClick={deleteTarget}>
                Delete
              </button>
              {targetItem.type === "folder" ? (
                <button type="button" onClick={toggleTargetFolder}>
                  {targetItem.collapsed ? "Expand folder" : "Collapse folder"}
                </button>
              ) : null}
            </>
          ) : (
            <>
              <button type="button" onClick={() => {
                expandAll();
                closeContextMenu();
              }}>
                Expand all
              </button>
              <button type="button" onClick={() => {
                collapseAll();
                closeContextMenu();
              }}>
                Collapse all
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <aside className={`vault-sidebar ${sidebarCollapsed ? "is-collapsed" : "is-expanded"}`} onContextMenu={(event) => event.preventDefault()}>
      {sidebarCollapsed ? (
        <div className="vault-sidebar-shell">
          <div className="vault-sidebar-rail">
            <button
              type="button"
              className="vault-rail-toggle"
              onClick={toggleSidebarCollapsed}
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              ›
            </button>
          </div>
        </div>
      ) : (
        <div className="vault-sidebar-expanded">
          <div className="vault-sidebar-header">
            <div>
              <div className="vault-sidebar-title">Vault</div>
              <div className="vault-sidebar-subtitle">Compact file browser</div>
            </div>
            <button
              type="button"
              className="vault-icon-button"
              onClick={toggleSidebarCollapsed}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <span aria-hidden="true">‹</span>
            </button>
          </div>

          <div className="vault-create-panel" aria-label="Create new items">
            <button type="button" className="vault-create-button is-canvas" onClick={handleCreateNote}>
              <span className="vault-create-button-icon" aria-hidden="true">
                <CreateIcon kind="canvas" />
              </span>
              <span className="vault-create-button-text">
                <strong>New Canvas</strong>
                <small>Start a fresh canvas note</small>
              </span>
            </button>
            <button type="button" className="vault-create-button is-folder" onClick={handleCreateFolder}>
              <span className="vault-create-button-icon" aria-hidden="true">
                <CreateIcon kind="folder" />
              </span>
              <span className="vault-create-button-text">
                <strong>New Folder</strong>
                <small>Organize canvases and files</small>
              </span>
            </button>
          </div>

          <div className="vault-toolbar">
            <div className="vault-search-shell">
              <span className="vault-search-icon" aria-hidden="true">
                ⌕
              </span>
              <input
                className="vault-search-input"
                value={searchQuery}
                placeholder="Search vault"
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label="Search files and folders"
              />
              {searchQuery ? (
                <button type="button" className="vault-search-clear" onClick={() => setSearchQuery("")} title="Clear search" aria-label="Clear search">
                  ×
                </button>
              ) : null}
            </div>
            <button type="button" className={`vault-icon-button ${autoRevealActiveFile ? "active" : ""}`} onClick={toggleAutoRevealActiveFile} title="Auto-reveal active file" aria-label="Auto-reveal active file">
              <span aria-hidden="true">◉</span>
            </button>
          </div>

          <div
            className={`vault-tree ${dropTargetParentId === null && draggedItemId ? "is-drop-target" : ""}`}
            onContextMenu={(event) => {
              if (event.target !== event.currentTarget) {
                return;
              }
              event.preventDefault();
              openContextMenu({ open: true, x: event.clientX, y: event.clientY, targetId: null, targetType: "background" });
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setDropTargetParentId(null);
            }}
            onDrop={handleBackgroundDrop}
          >
            <div className="vault-tree-heading">
              <div className="vault-tree-heading-title">Hierarchy</div>
              <div className="vault-tree-heading-subtitle">Drop canvases and folders at the root, then nest them with drag and drop.</div>
            </div>
            {rootChildren.length === 0 ? (
              <div className="vault-empty-state">
                {searchActive ? "No matching files or folders." : "No files yet. Use + Note or + Folder to get started."}
              </div>
            ) : (
              rootChildren.map((item) => (
                <TreeNode
                  key={item.id}
                  item={item}
                  depth={0}
                  items={items}
                  sortMode="manual"
                  selectedId={selectedId}
                  visibleIds={searchState.visibleIds}
                  matchedIds={searchState.matchedIds}
                  searchActive={searchActive}
                  draggedItemId={draggedItemId}
                  dropTargetParentId={dropTargetParentId}
                  onSelect={(id) => selectItem(id)}
                  onToggleFolder={toggleFolder}
                  onOpenContextMenu={(event, targetId, targetType) => {
                    event.preventDefault();
                    selectItem(targetId);
                    openContextMenu({ open: true, x: event.clientX, y: event.clientY, targetId, targetType });
                  }}
                  onDragStart={(event, itemId) => {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", itemId);
                    setDraggedItemId(itemId);
                  }}
                  onDragEnd={() => {
                    setDraggedItemId(null);
                    setDropTargetParentId(null);
                  }}
                  onDropToFolder={(folderId) => handleDropToFolder(folderId)}
                  onDropTargetChange={(folderId) => setDropTargetParentId(folderId)}
                  setNodeRef={setNodeRef}
                />
              ))
            )}
          </div>

        </div>
      )}

      {renderContextMenu()}

      {dialogState ? (
        <div className="vault-dialog-backdrop" onMouseDown={() => setDialogState(null)}>
          <div className="vault-dialog" onMouseDown={(event) => event.stopPropagation()}>
            {dialogState.type === "rename" ? (
              <>
                <div className="vault-dialog-title">Rename item</div>
                <input
                  autoFocus
                  className="vault-dialog-input"
                  value={dialogState.value}
                  onChange={(event) => setDialogState({ ...dialogState, value: event.target.value })}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      const nextName = dialogState.value.trim();
                      renameItem(dialogState.itemId, nextName);
                      setDialogState(null);
                    }
                    if (event.key === "Escape") {
                      setDialogState(null);
                    }
                  }}
                />
                <div className="vault-dialog-actions">
                  <button type="button" onClick={() => setDialogState(null)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      renameItem(dialogState.itemId, dialogState.value);
                      setDialogState(null);
                    }}
                  >
                    Rename
                  </button>
                </div>
              </>
            ) : null}

            {dialogState.type === "move" ? (
              <>
                <div className="vault-dialog-title">Move item</div>
                <div className="vault-dialog-helper">Enter a folder path like <span>Inbox/Subfolder</span> or leave blank for root.</div>
                <input
                  autoFocus
                  className="vault-dialog-input"
                  value={dialogState.value}
                  onChange={(event) => setDialogState({ ...dialogState, value: event.target.value })}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      const destination = findFolderByPath(items, dialogState.value);
                      moveItem(dialogState.itemId, destination?.id ?? null);
                      selectItem(dialogState.itemId);
                      setDialogState(null);
                    }
                    if (event.key === "Escape") {
                      setDialogState(null);
                    }
                  }}
                />
                <div className="vault-dialog-actions">
                  <button type="button" onClick={() => setDialogState(null)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const destination = findFolderByPath(items, dialogState.value);
                      moveItem(dialogState.itemId, destination?.id ?? null);
                      selectItem(dialogState.itemId);
                      setDialogState(null);
                    }}
                  >
                    Move
                  </button>
                </div>
              </>
            ) : null}

            {dialogState.type === "delete" ? (
              <>
                <div className="vault-dialog-title">Delete item</div>
                <div className="vault-dialog-helper">This will remove the item and any nested children.</div>
                <div className="vault-dialog-actions">
                  <button type="button" onClick={() => setDialogState(null)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      deleteItem(dialogState.itemId);
                      setDialogState(null);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </aside>
  );
}