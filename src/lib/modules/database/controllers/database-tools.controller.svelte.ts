import {
  backupApi,
  formatErrorMessage,
  type BackupExportResult,
  type ImportPickSummary,
  type IntegrityCheckReport,
} from "@/core/ipc";
import { useProfileStore } from "#lib/modules/profile/stores/profile.store.svelte.js";
import { translate } from "#lib/shared/stores/i18n.svelte.js";

export function useDatabaseToolsController() {
  const profileStore = useProfileStore();

  let isExporting = $state(false);
  let exportResult = $state<BackupExportResult | null>(null);
  let exportError = $state<string | null>(null);

  let isImporting = $state(false);
  let stagedSummary = $state<ImportPickSummary | null>(null);
  let importError = $state<string | null>(null);
  let importSuccess = $state<string | null>(null);
  let importDisplayName = $state("");

  let isCheckingIntegrity = $state(false);
  let integrityReport = $state<IntegrityCheckReport | null>(null);
  let integrityError = $state<string | null>(null);

  async function handleExport() {
    isExporting = true;
    exportError = null;

    try {
      let chosenPath: string | undefined = undefined;
      const slug = profileStore.activeProfile?.slug || "profile";
      const defaultName = `typing_freex_backup_${slug}_${Date.now()}.db`;

      if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
        let defaultPath = defaultName;

        try {
          const { documentDir, downloadDir, join } =
            await import("@tauri-apps/api/path");
          const baseDir = (await documentDir()) || (await downloadDir());
          if (baseDir) {
            defaultPath = await join(baseDir, defaultName);
          }
        } catch (pathErr) {
          console.warn(
            "Failed to resolve standard directory for file dialog:",
            pathErr,
          );
        }

        try {
          const { save } = await import("@tauri-apps/plugin-dialog");
          const selected = await save({
            title: translate("dataTools.saveBackupTitle"),
            defaultPath,
            filters: [
              {
                name: translate("dataTools.filterSqliteDb"),
                extensions: ["db"],
              },
              {
                name: translate("customText.filterAllFiles"),
                extensions: ["*"],
              },
            ],
          });

          if (!selected) {
            isExporting = false;
            return;
          }

          chosenPath = selected;
        } catch (dialogErr) {
          console.error("Native file save dialog failed:", dialogErr);
          exportError = formatErrorMessage(dialogErr);
          isExporting = false;
          return;
        }
      }

      const res = await backupApi.export(chosenPath);
      exportResult = res;
    } catch (err: unknown) {
      console.error("Backup export failed:", err);
      exportError = formatErrorMessage(err);
    } finally {
      isExporting = false;
    }
  }

  async function handleFileSelected(filePath: string) {
    isImporting = true;
    importError = null;
    stagedSummary = null;
    importSuccess = null;

    try {
      const summary = await backupApi.importPick(filePath);
      stagedSummary = summary;
      importDisplayName = summary.profile_name || translate("dataTools.defaultImportName");
    } catch (err: unknown) {
      console.error("Import validation failed:", err);
      importError = formatErrorMessage(err);
    } finally {
      isImporting = false;
    }
  }

  async function commitImport() {
    if (!stagedSummary) return;

    isImporting = true;
    importError = null;

    try {
      const newProfile = await backupApi.importCommit(
        stagedSummary.staging_token,
        importDisplayName.trim() || undefined,
      );

      importSuccess = translate("dataTools.importSuccess", {
        name: newProfile.name,
      });
      stagedSummary = null;
      await profileStore.fetchProfiles();
    } catch (err: unknown) {
      console.error("Import commit failed:", err);
      importError = formatErrorMessage(err);
    } finally {
      isImporting = false;
    }
  }

  function cancelImport() {
    stagedSummary = null;
    importError = null;
  }

  async function runIntegrityCheck() {
    isCheckingIntegrity = true;
    integrityError = null;
    integrityReport = null;

    try {
      const report = await backupApi.integrityCheck();
      integrityReport = report;
    } catch (err: unknown) {
      console.error("Integrity check failed:", err);
      integrityError = formatErrorMessage(err);
    } finally {
      isCheckingIntegrity = false;
    }
  }

  return {
    get isExporting() {
      return isExporting;
    },
    get exportResult() {
      return exportResult;
    },
    get exportError() {
      return exportError;
    },
    handleExport,
    get isImporting() {
      return isImporting;
    },
    get stagedSummary() {
      return stagedSummary;
    },
    get importError() {
      return importError;
    },
    get importSuccess() {
      return importSuccess;
    },
    get importDisplayName() {
      return importDisplayName;
    },
    set importDisplayName(v: string) {
      importDisplayName = v;
    },
    handleFileSelected,
    commitImport,
    cancelImport,
    get isCheckingIntegrity() {
      return isCheckingIntegrity;
    },
    get integrityReport() {
      return integrityReport;
    },
    get integrityError() {
      return integrityError;
    },
    runIntegrityCheck,
  };
}
