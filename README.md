# LunaFlow

LunaFlow is a brand-new Lunatask-inspired productivity app built from scratch in this workspace.

This project focuses on the core mental model and workflows:

- Self-organizing tasks with multiple workflow modes
- Areas of life separation
- WIP limit guidance
- Time-blocking calendar view with task and habit blocks
- Habit tracker with many-times goals and streaks
- Mood, energy, and stress daily tracking
- Journal with customizable template flow
- Notes and notebooks with templates and pinning
- Relationship tracking with reconnect reminders and memory timeline
- Quick note scratchpad and keyboard shortcuts

## Stack

- React
- TypeScript
- Vite
- Local browser persistence (LocalStorage)

## Run

1. Open terminal at this folder
2. Install dependencies: npm install
3. Start dev server: npm run dev
4. Build production bundle: npm run build

## Main Source Structure

- src/App.tsx: application shell, navigation routing, and keyboard shortcuts
- src/state/useAppData.ts: central state and all domain actions
- src/state/seed.ts: initial demo data
- src/lib/prioritization.ts: task sorting and workflow section logic
- src/features/tasks/TasksView.tsx: workflows, detail editor, timers, and scheduling
- src/features/calendar/CalendarView.tsx: time-block timeline and habit widget
- src/features/habits/HabitsView.tsx: habits, many-times progress, and streaks
- src/features/mood/MoodView.tsx: mood, energy, stress, and history
- src/features/journal/JournalView.tsx: daily journal and template support
- src/features/notes/NotesView.tsx: notebooks, notes, templates, and editor
- src/features/relationships/RelationshipsView.tsx: hierarchy, reconnect, and memories
- src/features/settings/SettingsView.tsx: workflows, WIP limits, timer, and toggles

## Notes

- Data is persisted locally in the browser
- This prototype does not include cloud sync or E2E key management
