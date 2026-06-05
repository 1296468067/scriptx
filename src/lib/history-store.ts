"use client";

import { AnalysisResult, HistoryItem } from "./types";

const STORAGE_KEY = "scriptx_history";
const MIGRATED_KEY = "scriptx_history_migrated";

export interface StoredHistoryItem extends HistoryItem {
  /** 分析结果完整数据，用于重新打开 */
  result: AnalysisResult;
  /** 原始文件名 */
  fileName: string;
  /** 文件大小 */
  fileSize: string;
  /** 视频时长 */
  fileDuration: string;
}

// ── 辅助函数（纯客户端逻辑，不依赖API） ──

/** 生成历史记录标题（优先用视频类型的描述性标题） */
function generateTitle(result: AnalysisResult, fileName: string): string {
  const videoType = result.videoType || "通用";
  const baseName = fileName.replace(/\.(mp4|mov|avi|mkv)$/i, "");
  if (result.shots && result.shots.length > 0) {
    const firstScript = result.shots.find((s) => s.script && s.script !== "无");
    if (firstScript?.script) {
      const short = firstScript.script.slice(0, 30);
      return short.length < firstScript.script.length ? short + "..." : short;
    }
  }
  return `${videoType} - ${baseName.slice(0, 20)}`;
}

/** 根据视频类型生成策略标签 */
function generateStrategy(videoType: string): string {
  const strategies: Record<string, string> = {
    美食类: "美食类策略",
    口播类: "口播类策略",
    电商类: "电商类策略",
    短剧类: "短剧类策略",
    仙侠类: "仙侠类策略",
    通用: "通用策略",
  };
  return strategies[videoType] || "通用策略";
}

/** 生成标签 */
function generateTags(result: AnalysisResult): string[] {
  const tags: string[] = [result.videoType || "通用"];
  if (result.prompts && result.prompts.length > 0) {
    const hasImagePrompts = result.prompts.some((p) => p.imagePrompt);
    const hasTextPrompts = result.prompts.some((p) => p.textPrompt);
    if (hasImagePrompts && hasTextPrompts) tags.push("文生+图生");
    else if (hasTextPrompts) tags.push("文生");
    else if (hasImagePrompts) tags.push("图生");
  }
  return tags;
}

// ── localStorage → 服务端 迁移逻辑 ──

async function migrateLocalStorageIfNeeded(): Promise<void> {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(MIGRATED_KEY)) return;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(MIGRATED_KEY, "1");
    return;
  }

  try {
    const items: StoredHistoryItem[] = JSON.parse(raw);
    let migrated = 0;
    for (const item of items) {
      try {
        const res = await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item }),
        });
        if (res.ok) migrated++;
      } catch {
        // 某条迁移失败，继续下一条
      }
    }
    console.log(`[history] 迁移完成: ${migrated}/${items.length} 条记录`);
    localStorage.setItem(MIGRATED_KEY, "1");
  } catch (e) {
    console.error("[history] 迁移失败:", e);
    // 不设标记，下次重试
  }
}

// 模块加载时触发迁移
if (typeof window !== "undefined") {
  migrateLocalStorageIfNeeded();
}

// ── 公开API（异步，调用服务端端点） ──

/** 保存分析结果到历史记录 */
export async function addHistoryItem(
  result: AnalysisResult,
  fileInfo: { name: string; size: string; duration: string }
): Promise<StoredHistoryItem> {
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const item: StoredHistoryItem = {
    id: `h_${Date.now()}`,
    title: generateTitle(result, fileInfo.name),
    date: dateStr,
    shotsCount: result.shots?.length || 0,
    hooksCount: result.hooks?.length || 0,
    strategy: generateStrategy(result.videoType),
    tags: generateTags(result),
    result,
    fileName: fileInfo.name,
    fileSize: fileInfo.size,
    fileDuration: fileInfo.duration,
  };

  const res = await fetch("/api/history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item }),
  });

  if (!res.ok) throw new Error("保存历史记录失败");
  const data = await res.json();
  return data.item;
}

/** 获取历史记录列表（不含完整result数据） */
export async function getHistoryList(
  search?: string,
  type?: string
): Promise<HistoryItem[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (type && type !== "全部类型") params.set("type", type);

  const url = `/api/history${params.toString() ? "?" + params.toString() : ""}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.items;
}

/** 根据ID获取完整历史记录（含分析结果） */
export async function getHistoryItemById(
  id: string
): Promise<StoredHistoryItem | null> {
  const res = await fetch(`/api/history/${id}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.item;
}

/** 删除指定历史记录 */
export async function deleteHistoryItem(id: string): Promise<boolean> {
  const res = await fetch(`/api/history/${id}`, { method: "DELETE" });
  return res.ok;
}

/** 清空所有历史记录 */
export async function clearAllHistory(): Promise<void> {
  const res = await fetch("/api/history");
  if (!res.ok) return;
  const data = await res.json();
  for (const item of data.items) {
    await fetch(`/api/history/${item.id}`, { method: "DELETE" });
  }
}
