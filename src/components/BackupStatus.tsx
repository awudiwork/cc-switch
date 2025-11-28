import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck } from "lucide-react";
import { backupApi, type BackupInfo } from "@/lib/api";

export function BackupStatus() {
  const { t } = useTranslation();
  const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null);

  const loadBackupInfo = async () => {
    try {
      const info = await backupApi.getInfo();
      setBackupInfo(info);
    } catch (error) {
      console.error("Failed to load backup info:", error);
    }
  };

  useEffect(() => {
    loadBackupInfo();

    // Refresh every 30 seconds
    const interval = setInterval(loadBackupInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!backupInfo || backupInfo.backupCount === 0) {
    return null;
  }

  const formatTime = (timestamp: number | null): string => {
    if (!timestamp) return t("backup.never", { defaultValue: "从未备份" });

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return t("backup.justNow", { defaultValue: "刚刚" });
    } else if (diffMins < 60) {
      return t("backup.minutesAgo", {
        defaultValue: "{{count}}分钟前",
        count: diffMins
      });
    } else if (diffHours < 24) {
      const hours = date.getHours();
      const mins = date.getMinutes().toString().padStart(2, '0');
      return t("backup.today", {
        defaultValue: "今天{{time}}",
        time: `${hours}:${mins}`
      });
    } else if (diffDays === 1) {
      const hours = date.getHours();
      const mins = date.getMinutes().toString().padStart(2, '0');
      return t("backup.yesterday", {
        defaultValue: "昨天{{time}}",
        time: `${hours}:${mins}`
      });
    } else if (diffDays < 7) {
      const hours = date.getHours();
      const mins = date.getMinutes().toString().padStart(2, '0');
      return t("backup.daysAgo", {
        defaultValue: "{{count}}天前{{time}}",
        count: diffDays,
        time: `${hours}:${mins}`
      });
    } else {
      return date.toLocaleString();
    }
  };

  const formatSize = (bytes: number | null): string => {
    if (!bytes) return "0B";

    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)}${units[unitIndex]}`;
  };

  const tooltipContent = [
    t("backup.lastBackup", {
      defaultValue: "上次备份：{{time}}",
      time: formatTime(backupInfo.lastBackupTime)
    }),
    t("backup.size", {
      defaultValue: "大小：{{size}}",
      size: formatSize(backupInfo.lastBackupSize)
    }),
    t("backup.count", {
      defaultValue: "共{{count}}个备份",
      count: backupInfo.backupCount
    })
  ].join("\n");

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-help text-xs font-medium"
      title={tooltipContent}
    >
      <ShieldCheck className="h-3.5 w-3.5" />
      <span>{t("backup.backed", { defaultValue: "已备份" })}</span>
    </div>
  );
}
