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

type PlannerTask = {
  id: string;
  title: string;
  course: string;
  stage: "today" | "upcoming" | "done";
  complete: boolean;
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

export function StudyHubWorkspace({ section }: StudyHubWorkspaceProps) {
  const [classFilter, setClassFilter] = useState<"all" | "urgent" | "on-track">("all");
  const [plannerTasks, setPlannerTasks] = useState<PlannerTask[]>([
    { id: "t1", title: "Finalize PS5 graph proof", course: "CS 310", stage: "today", complete: false },
    { id: "t2", title: "Review CPI and inflation trends", course: "ECON 201", stage: "today", complete: false },
    { id: "t3", title: "Draft thesis statement", course: "LIT 240", stage: "upcoming", complete: false },
    { id: "t4", title: "Submit project recap", course: "CS 310", stage: "done", complete: true },
  ]);
  const [focusPreset, setFocusPreset] = useState(45);
  const [focusSessionRunning, setFocusSessionRunning] = useState(false);
  const [focusSessionCount, setFocusSessionCount] = useState(2);
  const [resourceQuery, setResourceQuery] = useState("");

  const visibleClasses = useMemo(() => {
    if (classFilter === "all") {
      return classes;
    }
    return classes.filter((item) => item.status === classFilter);
  }, [classFilter]);

  const plannerColumns = useMemo(() => {
    const order: Array<PlannerTask["stage"]> = ["today", "upcoming", "done"];
    return order.map((stage) => ({
      stage,
      items: plannerTasks.filter((task) => task.stage === stage),
    }));
  }, [plannerTasks]);

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
          <div className="study-toolbar-actions">
            <div className="study-segmented-control" role="tablist" aria-label="class filters">
              {(["all", "urgent", "on-track"] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={`study-segment-button ${classFilter === filter ? "is-selected" : ""}`}
                  onClick={() => setClassFilter(filter)}
                >
                  {filter === "all" ? "All" : filter === "urgent" ? "Needs Attention" : "On Track"}
                </button>
              ))}
            </div>
          </div>
        </header>

        <p className="study-view-subtitle">Track course progress, deadlines, and what needs attention next.</p>

        <section className="study-grid two-column">
          {visibleClasses.map((course) => (
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
        <header className="study-toolbar-frame">
          <div>
            <div className="study-toolbar-kicker">Study Hub</div>
            <h1 className="study-view-title">Planner</h1>
          </div>
          <div className="study-toolbar-actions">
            <button type="button" className="study-action-button">Today</button>
            <button type="button" className="study-action-button is-primary">Add task</button>
          </div>
        </header>

        <p className="study-view-subtitle">Organize tasks by priority and move them through your week.</p>

        <section className="study-board" aria-label="planner board">
          {plannerColumns.map((column) => (
            <article key={column.stage} className="study-board-column">
              <h2>
                {column.stage === "today" ? "Today" : column.stage === "upcoming" ? "Upcoming" : "Done"}
              </h2>
              <div className="study-board-list">
                {column.items.map((task) => (
                  <div key={task.id} className="study-task-card">
                    <label>
                      <input
                        type="checkbox"
                        checked={task.complete}
                        onChange={() => toggleTaskComplete(task.id)}
                      />
                      <span>
                        <strong>{task.title}</strong>
                        <small>{task.course}</small>
                      </span>
                    </label>
                    {task.stage !== "done" ? (
                      <button type="button" onClick={() => moveTaskForward(task.id)}>
                        Move
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
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
