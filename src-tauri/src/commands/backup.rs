//! 备份信息查询命令

use serde::{Deserialize, Serialize};
use std::fs;
use tauri::State;

use crate::config::get_app_config_dir;
use crate::store::AppState;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupInfo {
    /// 最后备份时间（时间戳，毫秒）
    pub last_backup_time: Option<i64>,
    /// 最后备份文件大小（字节）
    pub last_backup_size: Option<u64>,
    /// 备份文件总数
    pub backup_count: usize,
    /// 所有备份文件的总大小（字节）
    pub total_size: u64,
}

/// 获取备份信息
#[tauri::command]
pub async fn get_backup_info(_state: State<'_, AppState>) -> Result<BackupInfo, String> {
    let backup_dir = get_app_config_dir().join("backups");

    // 如果备份目录不存在，返回空信息
    if !backup_dir.exists() {
        return Ok(BackupInfo {
            last_backup_time: None,
            last_backup_size: None,
            backup_count: 0,
            total_size: 0,
        });
    }

    // 读取所有备份文件
    let entries: Vec<_> = fs::read_dir(&backup_dir)
        .map_err(|e| format!("Failed to read backup directory: {}", e))?
        .filter_map(|entry| entry.ok())
        .filter(|entry| {
            entry
                .path()
                .extension()
                .map(|ext| ext == "db")
                .unwrap_or(false)
        })
        .collect();

    if entries.is_empty() {
        return Ok(BackupInfo {
            last_backup_time: None,
            last_backup_size: None,
            backup_count: 0,
            total_size: 0,
        });
    }

    // 找到最新的备份文件
    let mut latest_entry = None;
    let mut latest_time = None;
    let mut total_size = 0u64;

    for entry in &entries {
        if let Ok(metadata) = entry.metadata() {
            total_size += metadata.len();

            if let Ok(modified) = metadata.modified() {
                if let Ok(duration) = modified.duration_since(std::time::UNIX_EPOCH) {
                    let timestamp = duration.as_millis() as i64;
                    if latest_time.is_none() || latest_time.unwrap() < timestamp {
                        latest_time = Some(timestamp);
                        latest_entry = Some(entry);
                    }
                }
            }
        }
    }

    let last_backup_size = if let Some(entry) = latest_entry {
        entry.metadata().ok().map(|m| m.len())
    } else {
        None
    };

    Ok(BackupInfo {
        last_backup_time: latest_time,
        last_backup_size,
        backup_count: entries.len(),
        total_size,
    })
}
