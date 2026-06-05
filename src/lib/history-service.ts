// 服务端历史记录持久化模块（仅用于API Route，不需要"use client"）
// 使用 data/history.json 文件存储

import fs from "fs";
import path from "path";

// 复用客户端定义的接口（不含"use client"的纯类型导入是安全的）
import type { AnalysisResult, HistoryItem } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const HISTORY_FILE = path.join(DATA_DIR, "history.json");
const MAX_ITEMS = 50;

export interface StoredHistoryItem extends HistoryItem {
  result: AnalysisResult;
  fileName: string;
  fileSize: string;
  fileDuration: string;
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readHistory(): StoredHistoryItem[] {
  ensureDataDir();
  if (!fs.existsSync(HISTORY_FILE)) return [];
  try {
    const raw = fs.readFileSync(HISTORY_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeHistory(items: StoredHistoryItem[]): void {
  ensureDataDir();
  const trimmed = items.slice(0, MAX_ITEMS);
  // 原子写入：先写临时文件再重命名，避免并发写入导致数据损坏
  const tmpFile = HISTORY_FILE + ".tmp";
  fs.writeFileSync(tmpFile, JSON.stringify(trimmed, null, 2), "utf-8");
  fs.renameSync(tmpFile, HISTORY_FILE);
}

/** 列表查询，支持搜索和类型过滤 */
export function listHistory(
  search?: string,
  type?: string
): StoredHistoryItem[] {
  let items = readHistory();
  if (search) {
    const lower = search.toLowerCase();
    items = items.filter(
      (h) =>
        h.title.toLowerCase().includes(lower) ||
        h.fileName.toLowerCase().includes(lower) ||
        h.tags.some((t) => t.toLowerCase().includes(lower))
    );
  }
  if (type && type !== "全部类型") {
    items = items.filter((h) => h.tags.includes(type));
  }
  return items;
}

/** 根据ID获取完整记录 */
export function getHistoryById(id: string): StoredHistoryItem | null {
  return readHistory().find((h) => h.id === id) || null;
}

/** 新增记录 */
export function addHistoryItem(item: StoredHistoryItem): StoredHistoryItem {
  const history = readHistory();
  history.unshift(item);
  writeHistory(history);
  return item;
}

/** 删除记录 */
export function deleteHistoryItem(id: string): boolean {
  const history = readHistory();
  const index = history.findIndex((h) => h.id === id);
  if (index === -1) return false;
  history.splice(index, 1);
  writeHistory(history);
  return true;
}
