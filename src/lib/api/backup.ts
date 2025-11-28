import { invoke } from "@tauri-apps/api/core";

export interface BackupInfo {
  lastBackupTime: number | null;
  lastBackupSize: number | null;
  backupCount: number;
  totalSize: number;
}

export const backupApi = {
  async getInfo(): Promise<BackupInfo> {
    return await invoke("get_backup_info");
  },
};
