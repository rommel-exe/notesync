import { useMemo, useRef, useState, type MouseEvent, type WheelEvent } from "react";
import { flushSync } from "react-dom";
import type { Editor } from "@tiptap/react";
import { NoteCard } from "./NoteCard";
import { type Note, useCanvasStore } from "../../state/store";

const NOTE_CREATE_OFFSET_X = 13;
const NOTE_CREATE_OFFSET_Y = 29;

export function FreeformCanvas() {
  const {
    notes,
    selectedNoteId,
    panX,
    panY,
    zoom,
    createNoteAt,
    clearCanvas,
    selectNote,
    moveNote,
    setCanvasTransform,
    updateNoteContent,
    bringToFront,
  } = useCanvasStore();

  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);
  const [pendingFocusNoteId, setPendingFocusNoteId] = useState<string | null>(null);
  const panSessionRef = useRef<{
    startX: number;
    startY: number;
    initialPanX: number;
    initialPanY: number;
  } | null>(null);

  const sortedNotes = useMemo(() => [...notes].sort((a, b) => a.zIndex - b.zIndex), [notes]);

  const toWorld = (clientX: number, clientY: number) => {
    if (!surfaceRef.current) {
      return { x: 0, y: 0 };
    }
    const rect = surfaceRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - panX) / zoom,
      y: (clientY - rect.top - panY) / zoom,
    };
  };

  const onBackgroundMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (!surfaceRef.current) {
      return;
    }

    if (event.button === 1 || event.button === 2) {
      event.preventDefault();
      if (draggingNoteId) {
        return;
      }
      panSessionRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        initialPanX: panX,
        initialPanY: panY,
      };
      setIsPanning(true);
      return;
    }

    const target = event.target as HTMLElement | null;
    if (event.button !== 0 || target?.closest(".note-card") || draggingNoteId) {
      return;
    }

    const { x, y } = toWorld(event.clientX, event.clientY);
    flushSync(() => {
      const newNoteId = createNoteAt(x - NOTE_CREATE_OFFSET_X, y - NOTE_CREATE_OFFSET_Y);
      setPendingFocusNoteId(newNoteId);
    });

    const nextEditor = surfaceRef.current?.querySelector<HTMLElement>(".note-card.selected .floating-note-editor");
    nextEditor?.focus();
  };

  const onSurfaceMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const session = panSessionRef.current;
    if (!session) {
      return;
    }

    const nextPanX = session.initialPanX + (event.clientX - session.startX);
    const nextPanY = session.initialPanY + (event.clientY - session.startY);
    setCanvasTransform(nextPanX, nextPanY, zoom);
  };

  const stopPan = () => {
    panSessionRef.current = null;
    setIsPanning(false);
    setDraggingNoteId(null);
  };

  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!surfaceRef.current) {
      return;
    }

    // On macOS trackpads, pinch gesture is typically surfaced as a wheel event
    // with ctrl/meta modified deltas; regular two-finger scroll pans.
    if (!event.ctrlKey && !event.metaKey) {
      setCanvasTransform(panX - event.deltaX, panY - event.deltaY, zoom);
      return;
    }

    const rect = surfaceRef.current.getBoundingClientRect();
    const worldX = (event.clientX - rect.left - panX) / zoom;
    const worldY = (event.clientY - rect.top - panY) / zoom;

    const zoomDelta = event.deltaY > 0 ? -0.1 : 0.1;
    const nextZoom = Math.min(2.8, Math.max(0.35, zoom + zoomDelta));
    const nextPanX = event.clientX - rect.left - worldX * nextZoom;
    const nextPanY = event.clientY - rect.top - worldY * nextZoom;

    setCanvasTransform(nextPanX, nextPanY, nextZoom);
  };

  const withFocus = (action: () => void) => {
    if (!activeEditor) {
      return;
    }
    activeEditor.commands.focus();
    action();
  };

  const setLink = () => {
    if (!activeEditor) {
      return;
    }

    const previous = activeEditor.getAttributes("link").href as string | undefined;
    const href = window.prompt("Enter URL", previous ?? "https://");
    if (href === null) {
      return;
    }
    if (!href.trim()) {
      withFocus(() => {
        activeEditor.chain().focus().unsetLink().run();
      });
      return;
    }

    withFocus(() => {
      activeEditor.chain().focus().extendMarkRange("link").setLink({ href: href.trim() }).run();
    });
  };

  return (
    <section
      className={`canvas-surface ${isPanning ? "is-panning" : ""}`}
      ref={surfaceRef}
      onMouseDown={onBackgroundMouseDown}
      onMouseMove={onSurfaceMouseMove}
      onMouseUp={stopPan}
      onMouseLeave={stopPan}
      onWheel={onWheel}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="top-rich-toolbar" aria-label="Rich text toolbar">
        <button
          type="button"
          disabled={!activeEditor}
          className={activeEditor?.isActive("bold") ? "active" : ""}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => activeEditor && withFocus(() => activeEditor.chain().focus().toggleBold().run())}
        >
          B
        </button>
        <button
          type="button"
          disabled={!activeEditor}
          className={activeEditor?.isActive("italic") ? "active" : ""}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => activeEditor && withFocus(() => activeEditor.chain().focus().toggleItalic().run())}
        >
          I
        </button>
        <button
          type="button"
          disabled={!activeEditor}
          className={activeEditor?.isActive("underline") ? "active" : ""}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => activeEditor && withFocus(() => activeEditor.chain().focus().toggleUnderline().run())}
        >
          U
        </button>
        <button
          type="button"
          disabled={!activeEditor}
          className={activeEditor?.isActive("strike") ? "active" : ""}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => activeEditor && withFocus(() => activeEditor.chain().focus().toggleStrike().run())}
        >
          S
        </button>
        <button
          type="button"
          disabled={!activeEditor}
          className={activeEditor?.isActive("heading", { level: 1 }) ? "active" : ""}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => activeEditor && withFocus(() => activeEditor.chain().focus().toggleHeading({ level: 1 }).run())}
        >
          H1
        </button>
        <button
          type="button"
          disabled={!activeEditor}
          className={activeEditor?.isActive("heading", { level: 2 }) ? "active" : ""}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => activeEditor && withFocus(() => activeEditor.chain().focus().toggleHeading({ level: 2 }).run())}
        >
          H2
        </button>
        <button
          type="button"
          disabled={!activeEditor}
          className={activeEditor?.isActive("bulletList") ? "active" : ""}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => activeEditor && withFocus(() => activeEditor.chain().focus().toggleBulletList().run())}
        >
          UL
        </button>
        <button
          type="button"
          disabled={!activeEditor}
          className={activeEditor?.isActive("orderedList") ? "active" : ""}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => activeEditor && withFocus(() => activeEditor.chain().focus().toggleOrderedList().run())}
        >
          OL
        </button>
        <button
          type="button"
          disabled={!activeEditor}
          className={activeEditor?.isActive("highlight") ? "active" : ""}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() =>
            activeEditor &&
            withFocus(() => {
              const { from, to } = activeEditor.state.selection;
              if (from === to) {
                activeEditor.chain().focus().selectAll().toggleHighlight().run();
                return;
              }
              activeEditor.chain().focus().toggleHighlight().run();
            })
          }
        >
          Mark
        </button>
        <button
          type="button"
          disabled={!activeEditor}
          onMouseDown={(event) => event.preventDefault()}
          onClick={setLink}
        >
          Link
        </button>
        <button
          type="button"
          disabled={!activeEditor}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => activeEditor && withFocus(() => activeEditor.chain().focus().undo().run())}
        >
          Undo
        </button>
        <button
          type="button"
          disabled={!activeEditor}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => activeEditor && withFocus(() => activeEditor.chain().focus().redo().run())}
        >
          Redo
        </button>
        <button
          type="button"
          disabled={notes.length === 0}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            clearCanvas();
            setActiveEditor(null);
            setDraggingNoteId(null);
          }}
        >
          Clear Canvas
        </button>
      </div>

      <div
        className="canvas-world"
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
        }}
      >
        {sortedNotes.map((note: Note) => (
          <NoteCard
            key={note.id}
            note={note}
            isSelected={selectedNoteId === note.id}
            autoFocusEditor={pendingFocusNoteId === note.id}
            zoom={zoom}
            draggingNoteId={draggingNoteId}
            onSelect={() => {
              selectNote(note.id);
              bringToFront(note.id);
            }}
            onActiveEditorChange={setActiveEditor}
            onDragStart={(id) => {
              setDraggingNoteId(id);
              bringToFront(id);
            }}
            onDragEnd={(id) => {
              setDraggingNoteId((current) => (current === id ? null : current));
            }}
            onMove={(x, y) => moveNote(note.id, x, y)}
            onChangeContent={(content) => updateNoteContent(note.id, content)}
            onFocusHandled={(id) => {
              setPendingFocusNoteId((current) => (current === id ? null : current));
            }}
          />
        ))}
      </div>
    </section>
  );
}
