import { useEffect, useLayoutEffect, useMemo, useRef, type PointerEvent } from "react";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";
import { type Editor, EditorContent, useEditor } from "@tiptap/react";
import type { Note } from "../../state/store";

type NoteCardProps = {
  note: Note;
  isSelected: boolean;
  autoFocusEditor: boolean;
  zoom: number;
  draggingNoteId: string | null;
  onSelect: () => void;
  onDragStart: (id: string) => void;
  onDragEnd: (id: string) => void;
  onActiveEditorChange: (editor: Editor | null) => void;
  onFocusHandled: (id: string) => void;
  onMove: (x: number, y: number) => void;
  onChangeContent: (content: string) => void;
};

export function NoteCard({
  note,
  isSelected,
  autoFocusEditor,
  zoom,
  draggingNoteId,
  onSelect,
  onDragStart,
  onDragEnd,
  onActiveEditorChange,
  onFocusHandled,
  onMove,
  onChangeContent,
}: NoteCardProps) {
  const cardRef = useRef<HTMLElement | null>(null);

  const dragSessionRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    noteX: number;
    noteY: number;
    dragArmed: boolean;
    isDragging: boolean;
  } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextStyle,
      Color,
      Highlight,
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
    ],
    content: note.content,
    autofocus: autoFocusEditor ? "end" : false,
    onFocus: ({ editor: focusedEditor }) => {
      onSelect();
      onActiveEditorChange(focusedEditor);
    },
    onBlur: () => {
      onActiveEditorChange(null);
    },
    onUpdate: ({ editor: nextEditor }) => {
      onChangeContent(nextEditor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "floating-note-editor",
      },
    },
  });

  useLayoutEffect(() => {
    if (!editor || !isSelected || !autoFocusEditor) {
      return;
    }

    editor.commands.focus("end");
    onFocusHandled(note.id);
  }, [editor, autoFocusEditor, isSelected, note.id, onFocusHandled]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    if (editor.getHTML() !== note.content) {
      editor.commands.setContent(note.content, { emitUpdate: false });
    }
  }, [editor, note.content]);

  const cardStyle = useMemo(
    () => ({
      left: `${note.x}px`,
      top: `${note.y}px`,
      width: `${note.width}px`,
      zIndex: note.zIndex,
    }),
    [note.width, note.x, note.y, note.zIndex],
  );

  const hasText = useMemo(() => {
    const plainText = note.content
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
    return plainText.length > 0;
  }, [note.content]);

  const onDragPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();

    if (draggingNoteId && draggingNoteId !== note.id) {
      event.preventDefault();
      return;
    }

    onSelect();

    onDragStart(note.id);
    if (editor?.isFocused) {
      editor.commands.blur();
    }
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      selection.removeAllRanges();
    }

    dragSessionRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      noteX: note.x,
      noteY: note.y,
      dragArmed: true,
      isDragging: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    cardRef.current?.setPointerCapture(event.pointerId);
  };

  const onCardPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target?.closest(".note-chrome-grip")) {
      return;
    }

    onSelect();

    if (!editor) {
      return;
    }

    const position = editor.view.posAtCoords({ left: event.clientX, top: event.clientY });
    if (!position) {
      return;
    }

    editor.commands.focus();
    editor.commands.setTextSelection(position.pos);
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const session = dragSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) {
      return;
    }

    if (!session.dragArmed) {
      return;
    }

    const deltaX = event.clientX - session.startX;
    const deltaY = event.clientY - session.startY;

    session.isDragging = true;
    onMove(session.noteX + deltaX / zoom, session.noteY + deltaY / zoom);
  };

  const endDrag = (event: PointerEvent<HTMLElement>) => {
    const session = dragSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) {
      return;
    }

    if (session.dragArmed) {
      onDragEnd(note.id);
    }

    if (!session.isDragging && editor) {
      editor.commands.focus("end");
    }

    dragSessionRef.current = null;
    cardRef.current?.releasePointerCapture(event.pointerId);
  };

  const onLostPointerCapture = (event: PointerEvent<HTMLElement>) => {
    const session = dragSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) {
      return;
    }

    if (session.dragArmed) {
      onDragEnd(note.id);
    }

    dragSessionRef.current = null;
  };

  return (
    <article
      ref={cardRef}
      className={`note-card ${hasText ? "has-text" : "empty-text"} ${isSelected ? "selected" : ""} ${draggingNoteId && draggingNoteId !== note.id ? "drag-blocked" : ""}`}
      style={cardStyle}
      onPointerDown={onCardPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={onLostPointerCapture}
    >
      <div className="note-chrome" aria-hidden="true">
        <span
          className="note-chrome-grip"
          onPointerDown={onDragPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onLostPointerCapture={onLostPointerCapture}
        >
          ....
        </span>
        <span className="note-chrome-controls">
          <span className="note-chrome-arrow">◀</span>
          <span className="note-chrome-arrow">▶</span>
        </span>
      </div>
      <div className="note-content">
        <EditorContent editor={editor} />
      </div>
    </article>
  );
}
