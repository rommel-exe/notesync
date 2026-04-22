import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { FreeformCanvas } from "./features/freeform/FreeformCanvas";
import { VaultSidebar } from "./components/layout/VaultSidebar";
import { StudentSidebar, type StudySection } from "./components/layout/StudentSidebar";
import { StudyHubWorkspace } from "./features/organization/StudyHubWorkspace";
import { runLaunchAutoUpdate } from "./features/updates/autoUpdate";
import { UpdateChangelogDialog } from "./features/updates/UpdateChangelogDialog";
import {
  consumeUnseenInstalledUpdateSummary,
  markInstalledUpdateSummarySeen,
  type InstalledUpdateSummary,
} from "./features/updates/updatePersistence";
import { useVaultStore } from "./state/vaultStore";

function App() {
  const [activeSection, setActiveSection] = useState<StudySection>("dashboard");
  const [studySidebarCollapsed, setStudySidebarCollapsed] = useState(false);
  const [pendingInstalledUpdate, setPendingInstalledUpdate] = useState<InstalledUpdateSummary | null>(() =>
    consumeUnseenInstalledUpdateSummary(),
  );
  const sidebarCollapsed = useVaultStore((state) => state.sidebarCollapsed);
  const notesMode = activeSection === "notes";
  const shellStyle = {
    "--student-sidebar-width": studySidebarCollapsed ? "74px" : "292px",
    "--vault-sidebar-width": notesMode ? (sidebarCollapsed ? "42px" : "322px") : "0px",
  } as CSSProperties;

  useEffect(() => {
    void runLaunchAutoUpdate();
  }, []);

  const dismissInstalledUpdateChangelog = () => {
    setPendingInstalledUpdate((current) => {
      if (current) {
        markInstalledUpdateSummarySeen(current.version);
      }
      return null;
    });
  };

  return (
    <>
      <div className={`workspace-shell ${notesMode ? "is-notes-mode" : "is-study-mode"}`} style={shellStyle}>
        <StudentSidebar
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          collapsed={studySidebarCollapsed}
          onToggleCollapsed={() => setStudySidebarCollapsed((collapsed) => !collapsed)}
        />
        {notesMode ? (
          <>
            <VaultSidebar />
            <main className="canvas-panel">
              <FreeformCanvas />
            </main>
          </>
        ) : (
          <main className="study-main-panel">
            <StudyHubWorkspace section={activeSection} />
          </main>
        )}
      </div>

      {pendingInstalledUpdate ? (
        <UpdateChangelogDialog summary={pendingInstalledUpdate} onDismiss={dismissInstalledUpdateChangelog} />
      ) : null}
    </>
  );
}

export default App;
