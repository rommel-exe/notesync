import type { InstalledUpdateSummary } from "./updatePersistence";

type UpdateChangelogDialogProps = {
  summary: InstalledUpdateSummary;
  onDismiss: () => void;
};

const formatReleaseDate = (value: string | undefined) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
};

export function UpdateChangelogDialog({ summary, onDismiss }: UpdateChangelogDialogProps) {
  const releaseDate = formatReleaseDate(summary.date);

  return (
    <div className="update-changelog-backdrop" role="presentation" onClick={onDismiss}>
      <section
        className="update-changelog-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`Changelog for NoteSync ${summary.version}`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="update-changelog-header">
          <p className="update-changelog-kicker">Updated automatically</p>
          <h2>{`What changed in ${summary.version}`}</h2>
          {releaseDate ? <p className="update-changelog-date">{`Published ${releaseDate}`}</p> : null}
        </header>

        <div className="update-changelog-notes">{summary.notes}</div>

        <div className="update-changelog-actions">
          <button type="button" onClick={onDismiss}>
            Continue
          </button>
        </div>
      </section>
    </div>
  );
}
