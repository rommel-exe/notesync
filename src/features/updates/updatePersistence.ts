export type InstalledUpdateSummary = {
  version: string;
  date?: string;
  notes: string;
  installedAt: string;
};

type StoredUpdateSummary = {
  version: unknown;
  date?: unknown;
  notes?: unknown;
  installedAt?: unknown;
};

const PENDING_UPDATE_SUMMARY_KEY = "notesync-pending-update-summary-v1";
const LAST_SEEN_UPDATE_VERSION_KEY = "notesync-last-seen-update-version-v1";
const DEFAULT_CHANGELOG_MESSAGE = "NoteSync was updated successfully. Release notes were not provided for this version.";

const canUseStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const normalizeNotes = (notes: string | undefined) => {
  const trimmed = notes?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : DEFAULT_CHANGELOG_MESSAGE;
};

const parseSummary = (value: string | null): InstalledUpdateSummary | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as StoredUpdateSummary;
    if (typeof parsed.version !== "string" || parsed.version.trim().length === 0) {
      return null;
    }

    return {
      version: parsed.version,
      date: typeof parsed.date === "string" ? parsed.date : undefined,
      notes: normalizeNotes(typeof parsed.notes === "string" ? parsed.notes : undefined),
      installedAt: typeof parsed.installedAt === "string" ? parsed.installedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
};

const readLastSeenVersion = () => {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(LAST_SEEN_UPDATE_VERSION_KEY);
};

export const storeInstalledUpdateSummary = (payload: {
  version: string;
  date?: string;
  notes?: string;
}) => {
  if (!canUseStorage()) {
    return;
  }

  const summary: InstalledUpdateSummary = {
    version: payload.version,
    date: payload.date,
    notes: normalizeNotes(payload.notes),
    installedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(PENDING_UPDATE_SUMMARY_KEY, JSON.stringify(summary));
};

export const consumeUnseenInstalledUpdateSummary = (): InstalledUpdateSummary | null => {
  if (!canUseStorage()) {
    return null;
  }

  const summary = parseSummary(window.localStorage.getItem(PENDING_UPDATE_SUMMARY_KEY));
  if (!summary) {
    return null;
  }

  const lastSeenVersion = readLastSeenVersion();
  if (lastSeenVersion && lastSeenVersion === summary.version) {
    window.localStorage.removeItem(PENDING_UPDATE_SUMMARY_KEY);
    return null;
  }

  return summary;
};

export const markInstalledUpdateSummarySeen = (version: string) => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(LAST_SEEN_UPDATE_VERSION_KEY, version);
  window.localStorage.removeItem(PENDING_UPDATE_SUMMARY_KEY);
};
