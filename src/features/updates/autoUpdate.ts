import { storeInstalledUpdateSummary } from "./updatePersistence";

const UPDATE_CHECK_TIMEOUT_MS = 12_000;
const UPDATE_DOWNLOAD_TIMEOUT_MS = 300_000;

let launchUpdatePromise: Promise<void> | null = null;

const shouldRunLaunchUpdate = () => {
  if (typeof window === "undefined") {
    return false;
  }

  if (!("__TAURI_INTERNALS__" in window)) {
    return false;
  }

  if (import.meta.env.DEV && import.meta.env.VITE_NOTESYNC_ENABLE_DEV_UPDATER !== "true") {
    return false;
  }

  return true;
};

const performLaunchAutoUpdate = async () => {
  try {
    const [{ check }, { relaunch }] = await Promise.all([
      import("@tauri-apps/plugin-updater"),
      import("@tauri-apps/plugin-process"),
    ]);

    const update = await check({ timeout: UPDATE_CHECK_TIMEOUT_MS });
    if (!update) {
      return;
    }

    await update.downloadAndInstall(undefined, { timeout: UPDATE_DOWNLOAD_TIMEOUT_MS });

    storeInstalledUpdateSummary({
      version: update.version,
      date: update.date,
      notes: update.body,
    });

    await relaunch();
  } catch (error) {
    console.error("[updates] automatic launch update failed", error);
  }
};

export const runLaunchAutoUpdate = async () => {
  if (!shouldRunLaunchUpdate()) {
    return;
  }

  if (!launchUpdatePromise) {
    launchUpdatePromise = performLaunchAutoUpdate().finally(() => {
      launchUpdatePromise = null;
    });
  }

  await launchUpdatePromise;
};
