export type StudySection = "dashboard" | "classes" | "planner" | "focus" | "library" | "notes";

type StudentSidebarSection = {
  id: StudySection;
  title: string;
};

type StudentSidebarProps = {
  activeSection: StudySection;
  onSelectSection: (section: StudySection) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

const sections: StudentSidebarSection[] = [
  { id: "dashboard", title: "Dashboard" },
  { id: "classes", title: "Classes" },
  { id: "planner", title: "Planner" },
  { id: "focus", title: "Focus" },
  { id: "library", title: "Library" },
  { id: "notes", title: "Notes" },
];

function SectionIcon({ section }: { section: StudySection }) {
  switch (section) {
    case "dashboard":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="student-sidebar-nav-icon-svg">
          <rect x="4" y="4" width="6" height="6" rx="1.6" />
          <rect x="14" y="4" width="6" height="6" rx="1.6" />
          <rect x="4" y="14" width="6" height="6" rx="1.6" />
          <rect x="14" y="14" width="6" height="6" rx="1.6" />
        </svg>
      );
    case "classes":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="student-sidebar-nav-icon-svg">
          <path d="M5 6.5A1.5 1.5 0 0 1 6.5 5h11A1.5 1.5 0 0 1 19 6.5v10A1.5 1.5 0 0 1 17.5 18h-11A1.5 1.5 0 0 1 5 16.5z" />
          <path d="M8 8h8M8 11.5h8M8 15h5" />
        </svg>
      );
    case "planner":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="student-sidebar-nav-icon-svg">
          <rect x="4.5" y="5.5" width="15" height="14" rx="2.4" />
          <path d="M4.5 9h15" />
          <path d="M8 4.5v3M16 4.5v3M8 12h4M8 15h6" />
        </svg>
      );
    case "focus":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="student-sidebar-nav-icon-svg">
          <circle cx="12" cy="12" r="7.5" />
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 4.5v2.1M19.5 12h-2.1M12 19.5v-2.1M4.5 12h2.1" />
        </svg>
      );
    case "library":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="student-sidebar-nav-icon-svg">
          <path d="M6 5.5h12A1.5 1.5 0 0 1 19.5 7v10A1.5 1.5 0 0 1 18 18.5H6A1.5 1.5 0 0 1 4.5 17V7A1.5 1.5 0 0 1 6 5.5Z" />
          <path d="M10.5 5.5v13M13.5 7.5h4" />
        </svg>
      );
    case "notes":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="student-sidebar-nav-icon-svg">
          <path d="M6.5 4.5h8.4L19.5 9v10.5A1.5 1.5 0 0 1 18 21H6.5A1.5 1.5 0 0 1 5 19.5v-15A1.5 1.5 0 0 1 6.5 4.5Z" />
          <path d="M14.5 4.5V9H19.5" />
          <path d="M8 12h8M8 15.5h8M8 9.5h3" />
        </svg>
      );
  }
}

export function StudentSidebar({ activeSection, onSelectSection, collapsed, onToggleCollapsed }: StudentSidebarProps) {
  return (
    <aside className={`student-sidebar ${collapsed ? "is-collapsed" : ""}`} aria-label="Student productivity navigation">
      <div className="student-sidebar-header">
        <div className="student-sidebar-brand">
          <div className="student-sidebar-mark">SP</div>
          {!collapsed ? (
            <div>
              <div className="student-sidebar-title">Study Hub</div>
              <div className="student-sidebar-subtitle">Productivity suite for students</div>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className="student-sidebar-collapse"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand Study Hub sidebar" : "Collapse Study Hub sidebar"}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? "›" : "‹"}
        </button>
      </div>

      <div className="student-sidebar-section">
        {!collapsed ? <div className="student-sidebar-section-title">Workspace</div> : null}
        <nav className="student-sidebar-nav">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`student-sidebar-nav-item ${activeSection === section.id ? "is-active" : ""}`}
              title={section.title}
              onClick={() => onSelectSection(section.id)}
            >
              <span className="student-sidebar-nav-icon" aria-hidden="true">
                <SectionIcon section={section.id} />
              </span>
              {!collapsed ? (
                <span className="student-sidebar-nav-text">
                  <strong>{section.title}</strong>
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      </div>

      {!collapsed ? (
        <div className="student-sidebar-section student-sidebar-card">
          <div className="student-sidebar-section-title">Today</div>
          <div className="student-sidebar-stat">
            <span>Tasks due</span>
            <strong>4</strong>
          </div>
          <div className="student-sidebar-stat">
            <span>Classes</span>
            <strong>3</strong>
          </div>
          <div className="student-sidebar-stat">
            <span>Focus goal</span>
            <strong>2h</strong>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
