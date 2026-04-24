import { useMemo, useState } from "react";
import type { StudySection } from "../../components/layout/StudentSidebar";

type StudyHubWorkspaceProps = {
  section: Exclude<StudySection, "notes">;
};

type ClassItem = {
  id: string;
  title: string;
  code: string;
  instructor: string;
  nextSession: string;
  status: "urgent" | "on-track";
  completion: number;
  upcoming: string;
};

type PlannerCategory = "study" | "assignment" | "exam" | "project" | "meeting" | "reading" | "personal" | "deadline";

type PlannerTask = {
  id: string;
  title: string;
  course: string;
  category: PlannerCategory;
  stage: "today" | "upcoming" | "done";
  complete: boolean;
  dueDate: string;
  time: string;
  duration: number;
  tone: "blue" | "violet" | "amber" | "green";
  customFilters: string[];
};

type PlannerDraft = {
  title: string;
  course: string;
  category: PlannerCategory;
  dueDate: string;
  time: string;
  duration: string;
  tone: PlannerTask["tone"];
  customFilters: string;
};

type ResourceItem = {
  id: string;
  title: string;
  type: string;
  source: string;
  tags: string[];
};

const classes: ClassItem[] = [
  {
    id: "cs310",
    title: "Algorithms",
    code: "CS 310",
    instructor: "Prof. Nguyen",
    nextSession: "Today, 11:00",
    status: "urgent",
    completion: 64,
    upcoming: "Problem Set 5 due tomorrow",
  },
  {
    id: "econ201",
    title: "Macroeconomics",
    code: "ECON 201",
    instructor: "Dr. Patel",
    nextSession: "Tomorrow, 09:00",
    status: "on-track",
    completion: 82,
    upcoming: "Quiz review this week",
  },
  {
    id: "lit240",
    title: "Modern Literature",
    code: "LIT 240",
    instructor: "Prof. Alvarez",
    nextSession: "Thu, 14:00",
    status: "on-track",
    completion: 73,
    upcoming: "Essay outline due Friday",
  },
];

const resources: ResourceItem[] = [
  {
    id: "res1",
    title: "Algorithm Design Manual",
    type: "Book",
    source: "University Library",
    tags: ["algorithms", "reference"],
  },
  {
    id: "res2",
    title: "Macro Indicators Dashboard",
    type: "Dataset",
    source: "FRED",
    tags: ["economics", "data"],
  },
  {
    id: "res3",
    title: "Literary Analysis Notes",
    type: "PDF",
    source: "Course Portal",
    tags: ["writing", "literature"],
  },
  {
    id: "res4",
    title: "Focus Study Playlist",
    type: "Audio",
    source: "Personal",
    tags: ["focus", "productivity"],
  },
];

const todayTimeline = [
  { time: "09:00", label: "Macroeconomics lecture" },
  { time: "11:00", label: "Algorithms discussion" },
  { time: "13:00", label: "Group project check-in" },
  { time: "16:30", label: "Gym + recovery" },
];

const plannerWeekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const plannerViewModes = ["day", "week", "month", "year"] as const;
type PlannerViewMode = (typeof plannerViewModes)[number];
const dayViewHours = Array.from({ length: 24 }, (_, hour) => hour);
const plannerCategoryOptions: { value: PlannerCategory; label: string }[] = [
  { value: "study", label: "Study session" },
  { value: "assignment", label: "Assignment" },
  { value: "exam", label: "Exam" },
  { value: "project", label: "Project" },
  { value: "meeting", label: "Meeting" },
  { value: "reading", label: "Reading" },
  { value: "personal", label: "Personal" },
  { value: "deadline", label: "Deadline" },
];

const plannerCategoryLabels: Record<PlannerCategory, string> = {
  study: "Study session",
  assignment: "Assignment",
  exam: "Exam",
  project: "Project",
  meeting: "Meeting",
  reading: "Reading",
  personal: "Personal",
  deadline: "Deadline",
};

const formatCalendarDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const buildMonthGrid = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });
};

const monthNameFormatter = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });
const shortMonthFormatter = new Intl.DateTimeFormat(undefined, { month: "short" });
const weekdayDateFormatter = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" });

const dateLabelFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});

const getCurrentMonthStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

const getTodayDateKey = () => formatCalendarDateKey(new Date());

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getStartOfWeek = (date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
};

const weekRangeFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});

const weekRangeFormatterWithYear = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const formatWeekRangeLabel = (start: Date, end: Date) => {
  if (start.getFullYear() !== end.getFullYear()) {
    return `${weekRangeFormatterWithYear.format(start)} – ${weekRangeFormatterWithYear.format(end)}`;
  }

  if (start.getMonth() === end.getMonth()) {
    return `${weekRangeFormatter.format(start)} – ${end.getDate()}, ${start.getFullYear()}`;
  }

  return `${weekRangeFormatter.format(start)} – ${weekRangeFormatter.format(end)}, ${start.getFullYear()}`;
};

const getMinutesFromTime = (time: string) => {
  const [hoursRaw, minutesRaw] = time.split(":");
  const hours = Number.parseInt(hoursRaw ?? "0", 10);
  const minutes = Number.parseInt(minutesRaw ?? "0", 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return 0;
  }
  return hours * 60 + minutes;
};

const parsePlannerFilters = (value: string) =>
  Array.from(
    new Set(
      value
        .split(",")
        .map((filter) => filter.trim())
        .filter(Boolean),
    ),
  );

const formatPlannerFilters = (filters: string[]) => filters.join(", ");

const createPlannerDraft = (dateKey = getTodayDateKey()): PlannerDraft => ({
  title: "",
  course: "",
  category: "study",
  dueDate: dateKey,
  time: "09:00",
  duration: "60",
  tone: "blue",
  customFilters: "",
});

const createPlannerDraftFromTask = (task: PlannerTask): PlannerDraft => ({
  title: task.title,
  course: task.course,
  category: task.category,
  dueDate: task.dueDate,
  time: task.time,
  duration: String(task.duration),
  tone: task.tone,
  customFilters: formatPlannerFilters(task.customFilters),
});

export function StudyHubWorkspace({ section }: StudyHubWorkspaceProps) {
  const [plannerTasks, setPlannerTasks] = useState<PlannerTask[]>([
    {
      id: "t1",
      title: "Finalize PS5 graph proof",
      course: "CS 310",
      category: "assignment",
      stage: "today",
      complete: false,
      dueDate: "2026-04-22",
      time: "09:30",
      duration: 90,
      tone: "blue",
      customFilters: [],
    },
    {
      id: "t2",
      title: "Review CPI and inflation trends",
      course: "ECON 201",
      category: "study",
      stage: "today",
      complete: false,
      dueDate: "2026-04-22",
      time: "11:00",
      duration: 60,
      tone: "violet",
      customFilters: [],
    },
  ]);
  const [plannerDraft, setPlannerDraft] = useState<PlannerDraft>(() => createPlannerDraft());
  const [plannerEditingTaskId, setPlannerEditingTaskId] = useState<string | null>(null);
  const [plannerModalOpen, setPlannerModalOpen] = useState(false);
  const [plannerView, setPlannerView] = useState<PlannerViewMode>("month");
  const [plannerSelectedDate, setPlannerSelectedDate] = useState(getTodayDateKey);
  const [focusPreset, setFocusPreset] = useState(45);
  const [focusSessionRunning, setFocusSessionRunning] = useState(false);
  const [focusSessionCount, setFocusSessionCount] = useState(2);
  const [resourceQuery, setResourceQuery] = useState("");
  const [plannerMonthCursor, setPlannerMonthCursor] = useState(getCurrentMonthStart);

  const plannerMonthGrid = useMemo(
    () => buildMonthGrid(plannerMonthCursor.getFullYear(), plannerMonthCursor.getMonth()),
    [plannerMonthCursor],
  );

  const plannerYearMonths = useMemo(
    () => Array.from({ length: 12 }, (_, month) => new Date(plannerMonthCursor.getFullYear(), month, 1)),
    [plannerMonthCursor],
  );

  const plannerTasksByDate = useMemo(() => {
    const groups = new Map<string, PlannerTask[]>();
    for (const task of plannerTasks) {
      const bucket = groups.get(task.dueDate) ?? [];
      bucket.push(task);
      groups.set(task.dueDate, bucket);
    }

    for (const bucket of groups.values()) {
      bucket.sort((left, right) => left.time.localeCompare(right.time));
    }

    return groups;
  }, [plannerTasks]);

  const plannerUpcomingTasks = useMemo(
    () =>
      [...plannerTasks]
        .sort((left, right) => left.dueDate.localeCompare(right.dueDate) || left.time.localeCompare(right.time))
        .filter((task) => !task.complete),
    [plannerTasks],
  );

  const plannerTodayKey = getTodayDateKey();
  const plannerEditingTask = useMemo(
    () => (plannerEditingTaskId ? plannerTasks.find((task) => task.id === plannerEditingTaskId) ?? null : null),
    [plannerEditingTaskId, plannerTasks],
  );
  const selectedDate = useMemo(() => new Date(`${plannerSelectedDate}T00:00:00`), [plannerSelectedDate]);
  const plannerWeekStart = useMemo(() => getStartOfWeek(selectedDate), [selectedDate]);
  const plannerWeekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(plannerWeekStart, index)),
    [plannerWeekStart],
  );
  const plannerWeekRangeLabel = useMemo(
    () => formatWeekRangeLabel(plannerWeekDays[0], plannerWeekDays[6]),
    [plannerWeekDays],
  );
  const selectedDayTasks = useMemo(
    () => plannerTasksByDate.get(plannerSelectedDate) ?? [],
    [plannerTasksByDate, plannerSelectedDate],
  );
  const selectedDayTaskBlocks = useMemo(
    () =>
      selectedDayTasks
        .map((task) => {
          const startMinutes = getMinutesFromTime(task.time);
          const top = (startMinutes / (24 * 60)) * 100;
          const height = (task.duration / (24 * 60)) * 100;
          return { task, top, height };
        })
        .sort((left, right) => left.top - right.top),
    [selectedDayTasks],
  );

  const plannerCurrentMonthKey = `${plannerMonthCursor.getFullYear()}-${String(plannerMonthCursor.getMonth() + 1).padStart(2, "0")}`;
  const plannerCurrentMonthLabel = monthNameFormatter.format(plannerMonthCursor);
  const plannerCurrentMonthCount = plannerTasks.filter((task) => task.dueDate.startsWith(plannerCurrentMonthKey)).length;
  const plannerTodayCount = plannerTasks.filter((task) => task.dueDate === plannerTodayKey && !task.complete).length;
  const plannerCompletedCount = plannerTasks.filter((task) => task.complete).length;

  const goToPlannerDay = (dateKey: string) => {
    const nextDay = new Date(`${dateKey}T00:00:00`);
    setPlannerSelectedDate(dateKey);
    setPlannerMonthCursor(new Date(nextDay.getFullYear(), nextDay.getMonth(), 1));
  };

  const shiftPlannerDay = (days: number) => {
    const nextDay = new Date(`${plannerSelectedDate}T00:00:00`);
    nextDay.setDate(nextDay.getDate() + days);
    goToPlannerDay(formatCalendarDateKey(nextDay));
  };

  const shiftPlannerWeek = (weeks: number) => {
    shiftPlannerDay(weeks * 7);
  };

  const filteredResources = useMemo(() => {
    const query = resourceQuery.trim().toLowerCase();
    if (!query) {
      return resources;
    }
    return resources.filter((resource) => {
      const haystack = `${resource.title} ${resource.source} ${resource.tags.join(" ")}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [resourceQuery]);

  const moveTaskForward = (id: string) => {
    const nextStage = (stage: PlannerTask["stage"]): PlannerTask["stage"] => {
      if (stage === "today") {
        return "upcoming";
      }
      if (stage === "upcoming") {
        return "done";
      }
      return "done";
    };

    setPlannerTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, stage: nextStage(task.stage), complete: nextStage(task.stage) === "done" } : task,
      ),
    );
  };

  const toggleTaskComplete = (id: string) => {
    setPlannerTasks((current) =>
      current.map((task) =>
        task.id === id
          ? {
              ...task,
              complete: !task.complete,
              stage: !task.complete ? "done" : task.stage,
            }
          : task,
      ),
    );
  };

  const openPlannerModal = (dateKey = plannerTodayKey, time = "09:00") => {
    setPlannerEditingTaskId(null);
    setPlannerDraft((current) => ({
      ...createPlannerDraft(dateKey),
      dueDate: dateKey,
      time,
      duration: current.duration || "60",
      tone: current.tone || "blue",
      category: current.category || "study",
      customFilters: current.customFilters || "",
    }));
    setPlannerSelectedDate(dateKey);
    setPlannerMonthCursor(new Date(`${dateKey}T00:00:00`));
    setPlannerModalOpen(true);
  };

  const openPlannerTaskEditor = (task: PlannerTask) => {
    setPlannerEditingTaskId(task.id);
    setPlannerDraft(createPlannerDraftFromTask(task));
    setPlannerSelectedDate(task.dueDate);
    setPlannerMonthCursor(new Date(`${task.dueDate}T00:00:00`));
    setPlannerModalOpen(true);
  };

  const closePlannerModal = () => {
    setPlannerModalOpen(false);
    setPlannerEditingTaskId(null);
  };

  const updatePlannerDraft = <K extends keyof PlannerDraft>(key: K, value: PlannerDraft[K]) => {
    setPlannerDraft((current) => ({ ...current, [key]: value }));
  };

  const savePlannerTask = () => {
    const title = plannerDraft.title.trim();
    const course = plannerDraft.course.trim();
    if (!title || !course || !plannerDraft.dueDate || !plannerDraft.time) {
      return;
    }

    const dueDate = plannerDraft.dueDate;
    const duration = Number.parseInt(plannerDraft.duration, 10) || 60;
    const customFilters = parsePlannerFilters(plannerDraft.customFilters);

    if (plannerEditingTaskId) {
      setPlannerTasks((current) =>
        current.map((task) =>
          task.id === plannerEditingTaskId
            ? {
                ...task,
                title,
                course,
                category: plannerDraft.category,
                dueDate,
                time: plannerDraft.time,
                duration,
                tone: plannerDraft.tone,
                customFilters,
                stage: task.complete ? "done" : task.stage,
              }
            : task,
        ),
      );
    } else {
      const newTask: PlannerTask = {
        id: `t-${Date.now()}`,
        title,
        course,
        category: plannerDraft.category,
        stage: dueDate === plannerTodayKey ? "today" : "upcoming",
        complete: false,
        dueDate,
        time: plannerDraft.time,
        duration,
        tone: plannerDraft.tone,
        customFilters,
      };

      setPlannerTasks((current) => [...current, newTask]);
    }

    setPlannerMonthCursor(new Date(`${dueDate}T00:00:00`));
    setPlannerSelectedDate(dueDate);
    setPlannerModalOpen(false);
    setPlannerEditingTaskId(null);
    setPlannerDraft(createPlannerDraft(dueDate));
  };

  const deletePlannerTask = () => {
    if (!plannerEditingTaskId) {
      return;
    }

    setPlannerTasks((current) => current.filter((task) => task.id !== plannerEditingTaskId));
    setPlannerModalOpen(false);
    setPlannerEditingTaskId(null);
    setPlannerDraft(createPlannerDraft());
  };

  const toggleFocusSession = () => {
    setFocusSessionRunning((running) => {
      if (running) {
        setFocusSessionCount((value) => value + 1);
      }
      return !running;
    });
  };

  if (section === "dashboard") {
    return (
      <div className="study-hub-view">
        <header className="study-toolbar-frame">
          <div>
            <div className="study-toolbar-kicker">Study Hub</div>
            <h1 className="study-view-title">Dashboard</h1>
          </div>
          <div className="study-toolbar-actions">
            <div className="study-search-shell">
              <span aria-hidden="true">⌕</span>
              <input placeholder="Search study hub" aria-label="Search study hub" />
            </div>
            <button type="button" className="study-action-button">Review</button>
            <button type="button" className="study-action-button is-primary">New Task</button>
          </div>
        </header>

        <p className="study-view-subtitle">Your classes, priorities, and focus status in one place.</p>

        <section className="study-stat-strip" aria-label="dashboard stats">
          <article className="study-stat-card">
            <span>Assignments due</span>
            <strong>4</strong>
          </article>
          <article className="study-stat-card">
            <span>Classes today</span>
            <strong>3</strong>
          </article>
          <article className="study-stat-card">
            <span>Focus sessions</span>
            <strong>{focusSessionCount}</strong>
          </article>
          <article className="study-stat-card">
            <span>Inbox notes</span>
            <strong>12</strong>
          </article>
        </section>

        <section className="study-grid two-column">
          <article className="study-card">
            <h2>Today&apos;s timeline</h2>
            <ul className="study-list timeline">
              {todayTimeline.map((item) => (
                <li key={item.time}>
                  <strong>{item.time}</strong>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </article>
          <article className="study-card">
            <h2>Urgent deadlines</h2>
            <ul className="study-list">
              <li>
                <strong>Algorithms problem set</strong>
                <span>Tomorrow, 23:59</span>
              </li>
              <li>
                <strong>Literature outline</strong>
                <span>Friday, 17:00</span>
              </li>
              <li>
                <strong>Economics quiz prep</strong>
                <span>Saturday, 12:00</span>
              </li>
            </ul>
          </article>
        </section>
      </div>
    );
  }

  if (section === "classes") {
    return (
      <div className="study-hub-view">
        <header className="study-toolbar-frame">
          <div>
            <div className="study-toolbar-kicker">Study Hub</div>
            <h1 className="study-view-title">Classes</h1>
          </div>
        </header>

        <p className="study-view-subtitle">Track course progress, deadlines, and what needs attention next.</p>

        <section className="study-grid two-column">
          {classes.map((course) => (
            <article key={course.id} className="study-card class-card">
              <div className="class-card-header">
                <div>
                  <h2>{course.title}</h2>
                  <p>{course.code} · {course.instructor}</p>
                </div>
                <span className={`study-pill ${course.status === "urgent" ? "is-warning" : "is-success"}`}>
                  {course.status === "urgent" ? "Needs attention" : "On track"}
                </span>
              </div>
              <div className="class-card-progress">
                <div className="class-card-progress-bar">
                  <span style={{ width: `${course.completion}%` }} />
                </div>
                <small>{course.completion}% complete</small>
              </div>
              <div className="class-card-meta">
                <div>
                  <strong>Next session</strong>
                  <span>{course.nextSession}</span>
                </div>
                <div>
                  <strong>Upcoming</strong>
                  <span>{course.upcoming}</span>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    );
  }

  if (section === "planner") {
    return (
      <div className="study-hub-view">
        <header className="study-toolbar-frame planner-toolbar-frame">
          <div>
            <div className="study-toolbar-kicker">Study Hub</div>
            <h1 className="study-view-title">Planner</h1>
          </div>
          <div className="study-toolbar-actions">
            <button
              type="button"
              className="study-action-button"
              onClick={() => {
                const today = getTodayDateKey();
                setPlannerSelectedDate(today);
                setPlannerMonthCursor(getCurrentMonthStart());
              }}
            >
              Today
            </button>
            <div className="planner-view-switch" role="tablist" aria-label="calendar view mode">
              {plannerViewModes.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`planner-view-button ${plannerView === mode ? "is-selected" : ""}`}
                  onClick={() => setPlannerView(mode)}
                >
                  {mode === "day" ? "Day" : mode === "week" ? "Week" : mode === "month" ? "Month" : "Year"}
                </button>
              ))}
            </div>
            <div className="planner-month-switcher" aria-label="planner month navigation">
              <button
                type="button"
                className="study-action-button planner-icon-button"
                onClick={() => {
                  if (plannerView === "year") {
                    setPlannerMonthCursor((current) => new Date(current.getFullYear() - 1, current.getMonth(), 1));
                    return;
                  }
                  if (plannerView === "week") {
                    shiftPlannerWeek(-1);
                    return;
                  }
                  if (plannerView === "day") {
                    shiftPlannerDay(-1);
                    return;
                  }
                  setPlannerMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
                }}
              >
                ‹
              </button>
              <span className="planner-month-label">
                {plannerView === "year"
                  ? String(plannerMonthCursor.getFullYear())
                  : plannerView === "week"
                    ? plannerWeekRangeLabel
                    : plannerView === "day"
                      ? weekdayDateFormatter.format(selectedDate)
                      : plannerCurrentMonthLabel}
              </span>
              <button
                type="button"
                className="study-action-button planner-icon-button"
                onClick={() => {
                  if (plannerView === "year") {
                    setPlannerMonthCursor((current) => new Date(current.getFullYear() + 1, current.getMonth(), 1));
                    return;
                  }
                  if (plannerView === "week") {
                    shiftPlannerWeek(1);
                    return;
                  }
                  if (plannerView === "day") {
                    shiftPlannerDay(1);
                    return;
                  }
                  setPlannerMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
                }}
              >
                ›
              </button>
            </div>
            <button type="button" className="study-action-button is-primary" onClick={() => openPlannerModal(plannerTodayKey)}>
              Add task
            </button>
          </div>
        </header>

        <p className="study-view-subtitle">Organize tasks by priority and block out time directly on the calendar.</p>

        <div className="planner-summary-strip" aria-label="planner summary">
          <span><strong>{plannerCurrentMonthCount}</strong> due this month</span>
          <span><strong>{plannerTodayCount}</strong> due today</span>
          <span><strong>{plannerCompletedCount}</strong> completed</span>
        </div>

        <section className="planner-layout" aria-label="planner calendar and agenda">
          <article className="study-card planner-calendar-card">
            <div className="planner-calendar-header">
              <div>
                <h2>Calendar view</h2>
                <p>Tasks, classes, and deadlines laid out by day.</p>
              </div>
              <div className="planner-calendar-legend" aria-label="calendar legend">
                <span><i className="tone-blue" /> Task</span>
                <span><i className="tone-amber" /> Deadline</span>
                <span><i className="tone-green" /> Done</span>
              </div>
            </div>

            {plannerView === "day" ? (
              <div className="planner-day-view" role="grid" aria-label={`Day view ${weekdayDateFormatter.format(selectedDate)}`}>
                <div className="planner-day-lines">
                  {dayViewHours.map((hour) => (
                    <button
                      key={hour}
                      type="button"
                      className="planner-day-hour-line"
                      onClick={() => openPlannerModal(plannerSelectedDate, `${String(hour).padStart(2, "0")}:00`)}
                      aria-label={`Add event at ${String(hour).padStart(2, "0")}:00`}
                    >
                      <span className="planner-day-hour-label">{String(hour).padStart(2, "0")}:00</span>
                    </button>
                  ))}
                  <div className="planner-day-events" aria-hidden="true">
                    {selectedDayTaskBlocks.map(({ task, top, height }) => (
                      <button
                        key={task.id}
                        type="button"
                        className={`planner-day-event-block tone-${task.tone}`}
                        style={{ top: `${top}%`, height: `${Math.max(height, 1.5)}%` }}
                        onClick={() => toggleTaskComplete(task.id)}
                        title={`${task.title} • ${task.time}${task.customFilters.length ? ` • Filters: ${formatPlannerFilters(task.customFilters)}` : ""}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {plannerView === "week" ? (
              <div className="planner-week-view" role="grid" aria-label={`Week view ${plannerWeekRangeLabel}`}>
                <div className="planner-week-header">
                  <div className="planner-week-time-rail" aria-hidden="true" />
                  {plannerWeekDays.map((day) => {
                    const dayKey = formatCalendarDateKey(day);
                    const isCurrentDay = dayKey === plannerTodayKey;
                    const isSelectedDay = dayKey === plannerSelectedDate;

                    return (
                      <button
                        key={dayKey}
                        type="button"
                        className={`planner-week-day-label ${isCurrentDay ? "is-current-day" : ""} ${isSelectedDay ? "is-selected" : ""}`}
                        onClick={() => goToPlannerDay(dayKey)}
                        aria-label={`${weekdayDateFormatter.format(day)}${isCurrentDay ? ", today" : ""}`}
                      >
                        <span>{plannerWeekdayLabels[day.getDay()]}</span>
                        <strong className="planner-week-day-number">{day.getDate()}</strong>
                      </button>
                    );
                  })}
                </div>

                <div className="planner-week-grid" aria-label={`Week schedule ${plannerWeekRangeLabel}`}>
                  <div className="planner-week-time-rail">
                    {dayViewHours.map((hour) => (
                      <div key={hour} className="planner-week-hour-line">
                        <span>{String(hour).padStart(2, "0")}:00</span>
                      </div>
                    ))}
                  </div>

                  {plannerWeekDays.map((day) => {
                    const dayKey = formatCalendarDateKey(day);
                    const dayTasks = plannerTasksByDate.get(dayKey) ?? [];
                    const isCurrentDay = dayKey === plannerTodayKey;
                    const isSelectedDay = dayKey === plannerSelectedDate;
                    const nowMinutes = isCurrentDay ? new Date().getHours() * 60 + new Date().getMinutes() : null;

                    return (
                      <div
                        key={dayKey}
                        className={`planner-week-day-column ${isCurrentDay ? "is-current-day" : ""} ${isSelectedDay ? "is-selected" : ""}`}
                        role="gridcell"
                        aria-label={`${weekdayDateFormatter.format(day)}${dayTasks.length ? `, ${dayTasks.length} item${dayTasks.length === 1 ? "" : "s"}` : ""}`}
                      >
                        {dayViewHours.map((hour) => (
                          <button
                            key={hour}
                            type="button"
                            className="planner-week-hour-slot"
                            onClick={() => openPlannerModal(dayKey, `${String(hour).padStart(2, "0")}:00`)}
                            aria-label={`Add event on ${weekdayDateFormatter.format(day)} at ${String(hour).padStart(2, "0")}:00`}
                          />
                        ))}

                        <div className="planner-week-event-layer" aria-hidden="true">
                          {dayTasks.map((task) => {
                            const startMinutes = getMinutesFromTime(task.time);
                            const top = (startMinutes / (24 * 60)) * 100;
                            const height = (task.duration / (24 * 60)) * 100;

                            return (
                              <button
                                key={task.id}
                                type="button"
                                className={`planner-week-event tone-${task.tone}`}
                                style={{ top: `${top}%`, height: `${Math.max(height, 1.5)}%` }}
                                onClick={() => toggleTaskComplete(task.id)}
                                title={`${plannerCategoryLabels[task.category]} • ${task.title} • ${task.time}${task.customFilters.length ? ` • Filters: ${formatPlannerFilters(task.customFilters)}` : ""}`}
                              >
                                <strong>{task.time}</strong>
                                <span>{task.title}</span>
                                <small>
                                  {plannerCategoryLabels[task.category]}
                                  {task.customFilters.length ? ` • ${formatPlannerFilters(task.customFilters)}` : ""}
                                </small>
                              </button>
                            );
                          })}
                          {nowMinutes !== null ? (
                            <div className="planner-week-now-line" style={{ top: `${(nowMinutes / (24 * 60)) * 100}%` }} />
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {plannerView === "month" ? (
              <>
                <div className="planner-weekdays" role="row">
                  {plannerWeekdayLabels.map((weekday) => (
                    <span key={weekday}>{weekday}</span>
                  ))}
                </div>

                <div className="planner-calendar-grid" role="grid" aria-label={plannerCurrentMonthLabel}>
                  {plannerMonthGrid.map((day) => {
                    const dayKey = formatCalendarDateKey(day);
                    const isCurrentMonth = day.getMonth() === plannerMonthCursor.getMonth();
                    const isToday = dayKey === plannerTodayKey;
                    const dayTasks = plannerTasksByDate.get(dayKey) ?? [];

                    return (
                      <div
                        key={dayKey}
                        className={`planner-day-cell ${isCurrentMonth ? "" : "is-outside"} ${isToday ? "is-today is-current-day" : ""}`}
                        role="gridcell"
                        aria-label={`${dateLabelFormatter.format(day)}${dayTasks.length ? `, ${dayTasks.length} item${dayTasks.length === 1 ? "" : "s"}` : ""}`}
                      >
                        <div className="planner-day-top">
                          <button
                            type="button"
                            className="planner-day-number-button"
                            onClick={() => {
                              setPlannerSelectedDate(dayKey);
                              setPlannerView("day");
                            }}
                          >
                            {day.getDate()}
                          </button>
                          {isToday ? <span className="planner-day-badge">Today</span> : null}
                        </div>
                        <div className="planner-month-task-list">
                          {dayTasks.slice(0, 3).map((task) => (
                            <button
                              key={task.id}
                              type="button"
                              className={`planner-month-task-chip tone-${task.tone}`}
                              onClick={() => {
                                setPlannerSelectedDate(dayKey);
                                setPlannerView("day");
                              }}
                              title={`${task.title}${task.customFilters.length ? ` • Filters: ${formatPlannerFilters(task.customFilters)}` : ""}`}
                            >
                              {task.time}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}

            {plannerView === "year" ? (
              <div className="planner-year-grid" role="grid" aria-label={`Year view ${plannerMonthCursor.getFullYear()}`}>
                {plannerYearMonths.map((monthDate) => {
                  const month = monthDate.getMonth();
                  const monthYear = monthDate.getFullYear();
                  const count = plannerTasks.filter(
                    (task) =>
                      new Date(`${task.dueDate}T00:00:00`).getMonth() === month &&
                      new Date(`${task.dueDate}T00:00:00`).getFullYear() === monthYear,
                  ).length;

                  return (
                    <button
                      key={monthDate.toISOString()}
                      type="button"
                      className="planner-year-month-card"
                      onClick={() => {
                        setPlannerMonthCursor(new Date(monthYear, month, 1));
                        setPlannerView("month");
                      }}
                    >
                      <strong>{shortMonthFormatter.format(monthDate)}</strong>
                      <span>{count} blocks</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </article>

          <article className="study-card planner-agenda-card">
            <div className="planner-calendar-header">
              <div>
                <h2>Upcoming agenda</h2>
                <p>Open tasks sorted by date and time.</p>
              </div>
              <span className="study-pill">{plannerUpcomingTasks.length} open</span>
            </div>

            <div className="planner-agenda-list">
              {plannerUpcomingTasks.map((task) => (
                <div key={task.id} className="planner-agenda-item">
                  <div className={`planner-agenda-dot tone-${task.tone}`} />
                  <button type="button" className="planner-agenda-content planner-agenda-content-button" onClick={() => openPlannerTaskEditor(task)}>
                    <div className="planner-agenda-row">
                      <strong>{task.title}</strong>
                      <span>{task.time}</span>
                    </div>
                    <div className="planner-agenda-meta">
                      <span>{task.course}</span>
                      <span>{plannerCategoryLabels[task.category]}</span>
                      <span>{dateLabelFormatter.format(new Date(task.dueDate))}</span>
                    </div>
                    {task.customFilters.length ? (
                      <div className="planner-agenda-filters" aria-label={`Custom filters: ${formatPlannerFilters(task.customFilters)}`}>
                        {task.customFilters.map((filter) => (
                          <span key={filter}>{filter}</span>
                        ))}
                      </div>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    className="planner-agenda-action"
                    onClick={() => moveTaskForward(task.id)}
                  >
                    Move
                  </button>
                </div>
              ))}
            </div>
          </article>
        </section>

        {plannerModalOpen ? (
          <div className="planner-modal-backdrop" role="presentation" onClick={closePlannerModal}>
            <section
              className="planner-modal"
              role="dialog"
              aria-modal="true"
              aria-label={plannerEditingTask ? "Edit task" : "Add task"}
              onClick={(event) => event.stopPropagation()}
            >
              <header className="planner-modal-header">
                <div>
                  <p className="study-toolbar-kicker">Planner</p>
                  <h2>{plannerEditingTask ? "Edit time block" : "Add time block"}</h2>
                </div>
                <button type="button" className="planner-modal-close" onClick={closePlannerModal} aria-label="Close">
                  ×
                </button>
              </header>

              <div className="planner-modal-grid">
                <label>
                  <span>Title</span>
                  <input
                    value={plannerDraft.title}
                    onChange={(event) => updatePlannerDraft("title", event.target.value)}
                    placeholder="Study session, assignment, meeting..."
                  />
                </label>

                <label>
                  <span>Course</span>
                  <input
                    value={plannerDraft.course}
                    onChange={(event) => updatePlannerDraft("course", event.target.value)}
                    placeholder="CS 310"
                  />
                </label>

                <label>
                  <span>Category</span>
                  <select
                    value={plannerDraft.category}
                    onChange={(event) => updatePlannerDraft("category", event.target.value as PlannerCategory)}
                  >
                    {plannerCategoryOptions.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Date</span>
                  <input
                    type="date"
                    value={plannerDraft.dueDate}
                    onChange={(event) => updatePlannerDraft("dueDate", event.target.value)}
                  />
                </label>

                <label>
                  <span>Start time</span>
                  <input
                    type="time"
                    value={plannerDraft.time}
                    onChange={(event) => updatePlannerDraft("time", event.target.value)}
                  />
                </label>

                <label>
                  <span>Duration</span>
                  <select
                    value={plannerDraft.duration}
                    onChange={(event) => updatePlannerDraft("duration", event.target.value)}
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                    <option value="120">2 hours</option>
                  </select>
                </label>

                <label>
                  <span>Color</span>
                  <select
                    value={plannerDraft.tone}
                    onChange={(event) => updatePlannerDraft("tone", event.target.value as PlannerTask["tone"])}
                  >
                    <option value="blue">Blue</option>
                    <option value="violet">Violet</option>
                    <option value="amber">Amber</option>
                    <option value="green">Green</option>
                  </select>
                </label>

                <label className="planner-modal-field-full">
                  <span>Custom filters</span>
                  <input
                    value={plannerDraft.customFilters}
                    onChange={(event) => updatePlannerDraft("customFilters", event.target.value)}
                    placeholder="Focus, quiet, library"
                  />
                </label>
              </div>

              <div className="planner-modal-actions">
                {plannerEditingTask ? (
                  <button type="button" className="study-action-button is-danger" onClick={deletePlannerTask}>
                    Delete
                  </button>
                ) : null}
                <button type="button" className="study-action-button" onClick={closePlannerModal}>
                  Cancel
                </button>
                <button type="button" className="study-action-button is-primary" onClick={savePlannerTask}>
                  {plannerEditingTask ? "Save changes" : "Add block"}
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    );
  }

  if (section === "focus") {
    return (
      <div className="study-hub-view">
        <header className="study-toolbar-frame">
          <div>
            <div className="study-toolbar-kicker">Study Hub</div>
            <h1 className="study-view-title">Focus</h1>
          </div>
          <div className="study-toolbar-actions">
            <span className="study-pill">Sessions today: {focusSessionCount}</span>
          </div>
        </header>

        <p className="study-view-subtitle">Run deep-work sessions and keep your attention anchored.</p>

        <section className="study-grid two-column">
          <article className="study-card focus-card">
            <h2>Session length</h2>
            <div className="study-segmented-control" role="tablist" aria-label="focus presets">
              {[25, 45, 60].map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  className={`study-segment-button ${focusPreset === minutes ? "is-selected" : ""}`}
                  onClick={() => setFocusPreset(minutes)}
                >
                  {minutes} min
                </button>
              ))}
            </div>
            <div className="focus-duration-display">{focusPreset}:00</div>
            <button type="button" className="study-action-button is-primary" onClick={toggleFocusSession}>
              {focusSessionRunning ? "End Focus Session" : "Start Focus Session"}
            </button>
          </article>

          <article className="study-card">
            <h2>Distraction log</h2>
            <ul className="study-list">
              <li>
                <strong>Mute notifications</strong>
                <span>Completed</span>
              </li>
              <li>
                <strong>Close non-essential tabs</strong>
                <span>Completed</span>
              </li>
              <li>
                <strong>Set next milestone</strong>
                <span>Pending</span>
              </li>
            </ul>
          </article>
        </section>
      </div>
    );
  }

  const isEmptySearch = filteredResources.length === 0;

  return (
    <div className="study-hub-view">
      <header className="study-toolbar-frame">
        <div>
          <div className="study-toolbar-kicker">Study Hub</div>
          <h1 className="study-view-title">Library</h1>
        </div>
        <div className="study-toolbar-actions">
          <div className="study-search-shell">
            <span aria-hidden="true">⌕</span>
            <input
              value={resourceQuery}
              onChange={(event) => setResourceQuery(event.target.value)}
              placeholder="Search resources"
              aria-label="Search resources"
            />
          </div>
        </div>
      </header>

      <p className="study-view-subtitle">Search resources, references, and saved material for each course.</p>

      <section className="study-grid two-column">
        {isEmptySearch ? (
          <article className="study-card">
            <h2>No matches</h2>
            <p>Try a different keyword or clear the current search.</p>
          </article>
        ) : (
          filteredResources.map((resource) => (
            <article key={resource.id} className="study-card resource-card">
              <div className="resource-card-header">
                <h2>{resource.title}</h2>
                <span className="study-pill">{resource.type}</span>
              </div>
              <p>{resource.source}</p>
              <div className="resource-tags">
                {resource.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
