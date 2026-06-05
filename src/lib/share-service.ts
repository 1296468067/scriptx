// 服务端分享模块 — 存储/读取分享记录

import fs from "fs";
import path from "path";
import type { AnalysisResult } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const SHARES_FILE = path.join(DATA_DIR, "shares.json");
const MAX_SHARES = 200;

export interface ShareItem {
  id: string;
  title: string;
  videoType: string;
  shotsCount: number;
  hooksCount: number;
  result: AnalysisResult;
  createdAt: string;
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readShares(): ShareItem[] {
  ensureDataDir();
  if (!fs.existsSync(SHARES_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(SHARES_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function writeShares(items: ShareItem[]): void {
  ensureDataDir();
  const trimmed = items.slice(0, MAX_SHARES);
  const tmp = SHARES_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(trimmed, null, 2), "utf-8");
  fs.renameSync(tmp, SHARES_FILE);
}

/** 创建分享 */
export function createShare(result: AnalysisResult): ShareItem {
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // 生成标题
  let title = result.videoType || "通用";
  if (result.shots?.length > 0) {
    const firstScript = result.shots.find((s) => s.script && s.script !== "无");
    if (firstScript?.script) {
      title = firstScript.script.slice(0, 30);
      if (title.length < firstScript.script.length) title += "...";
    }
  }

  const item: ShareItem = {
    id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title,
    videoType: result.videoType || "通用",
    shotsCount: result.shots?.length || 0,
    hooksCount: result.hooks?.length || 0,
    result,
    createdAt: dateStr,
  };

  const shares = readShares();
  shares.unshift(item);
  writeShares(shares);

  return item;
}

/** 获取分享 */
export function getShare(id: string): ShareItem | null {
  return readShares().find((s) => s.id === id) || null;
}
