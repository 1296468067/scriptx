"use client";

import { useState, useEffect, useRef } from "react";
import { HistoryItem } from "@/lib/types";
import { getHistoryList, deleteHistoryItem, getHistoryItemById, StoredHistoryItem } from "@/lib/history-store";
import { mockHistory } from "@/lib/mock-data";

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("全部类型");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<StoredHistoryItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 初次加载：从API获取历史列表
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const list = await getHistoryList();
        if (!cancelled) {
          if (list.length > 0) {
            setItems(list);
          } else {
            // 首次使用：展示mock数据作为示例
            setItems(mockHistory);
          }
        }
      } catch {
        if (!cancelled) {
          setError("加载历史记录失败");
          setItems(mockHistory);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // 搜索/筛选：debounce 300ms后调用服务端API
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    // 首次加载时不触发搜索
    if (loading) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const list = await getHistoryList(
          search || undefined,
          typeFilter !== "全部类型" ? typeFilter : undefined
        );
        setItems(list.length > 0 ? list : []);
      } catch {
        // 搜索失败不影响已有展示
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, typeFilter, loading]);

  // 删除记录
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const ok = await deleteHistoryItem(id);
      if (ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
        if (detailItem?.id === id) setDetailItem(null);
      } else {
        alert("删除失败，请稍后重试");
      }
    } catch {
      alert("删除失败，网络错误");
    }
  };

  // 查看详情
  const handleOpenDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const item = await getHistoryItemById(id);
      if (item) {
        setDetailItem(item);
      } else {
        alert("该记录详情不存在，可能已被删除");
      }
    } catch {
      alert("加载详情失败");
    } finally {
      setDetailLoading(false);
    }
  };

  // 视频类型筛选列表
  const videoTypes = ["全部类型", "美食类", "口播类", "电商类", "短剧类", "仙侠类", "通用"];

  // 加载中
  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-16 text-[var(--muted)]">
          <div className="text-5xl mb-3 animate-pulse">⏳</div>
          <div className="text-base font-semibold mb-1">加载历史记录...</div>
        </div>
      </div>
    );
  }

  // 加载失败
  if (error && items.every((i) => !i.id.startsWith("h_"))) {
    return (
      <div className="p-8">
        <div className="bg-[var(--card-bg)] rounded-xl p-6 text-center">
          <div className="text-5xl mb-3">⚠️</div>
          <div className="text-base font-semibold mb-1">加载失败</div>
          <div className="text-sm text-[var(--muted)] mb-4">{error}</div>
          <button
            className="bg-[var(--primary)] text-white px-6 py-2.5 rounded-lg text-sm hover:bg-[var(--primary-hover)]"
            onClick={() => window.location.reload()}
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* 搜索栏 */}
      <div className="bg-[var(--card-bg)] rounded-[var(--radius-card)] px-5 py-4 mb-5 flex gap-3 shadow-sm">
        <div className="flex-1 relative">
          <input
            className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-[var(--radius-card)] text-sm focus:border-[var(--primary)] focus:outline-none bg-[var(--background)] transition-colors"
            placeholder="搜索拆解记录（标题/文件名/标签）..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {searchLoading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)] animate-pulse">
              搜索中...
            </span>
          )}
        </div>
        <select
          className="px-3.5 py-2.5 border border-[var(--border)] rounded-[var(--radius-card)] text-sm text-[var(--text-secondary)] bg-[var(--background)] focus:border-[var(--primary)] focus:outline-none transition-colors"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          {videoTypes.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* 详情面板（加载中） */}
      {detailLoading && (
        <div className="mb-4 bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border)] text-center py-8">
          <div className="text-sm text-[var(--muted)] animate-pulse">加载详情中...</div>
        </div>
      )}

      {/* 详情面板（已加载） */}
      {detailItem && !detailLoading ? (
        <div className="mb-4">
          <div className="bg-[var(--card-bg)] rounded-[var(--radius-panel)] p-5 border border-[var(--border)] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-base font-semibold">{detailItem.title}</div>
                <div className="text-xs text-[var(--muted)] mt-1">
                  {detailItem.fileName} | {detailItem.fileSize} | {detailItem.fileDuration} | {detailItem.date}
                </div>
              </div>
              <button
                className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors px-3 py-1.5 border border-[var(--border)] rounded"
                onClick={() => setDetailItem(null)}
              >
                收起 ▲
              </button>
            </div>

            {/* 分镜列表 */}
            <div className="mb-4">
              <div className="text-sm font-semibold mb-2">
                脚本拆解 ({detailItem.shotsCount}个分镜)
              </div>
              <div className="max-h-64 overflow-auto space-y-2">
                {detailItem.result.shots?.map((shot) => (
                  <div key={shot.id} className="border border-[var(--border)] rounded px-3 py-2 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-[var(--primary)] text-white w-5 h-5 rounded text-xs text-center leading-5">
                        {shot.id}
                      </span>
                      <span className="text-xs text-[var(--muted)]">{shot.timeRange}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--background)]">{shot.mood}</span>
                    </div>
                    <div className="text-xs">{shot.description}</div>
                    {shot.script && (
                      <div className="text-xs text-[var(--text-secondary)] mt-0.5 italic">
                        &ldquo;{shot.script.slice(0, 60)}{shot.script.length > 60 ? "..." : ""}&rdquo;
                      </div>
                    )}
                  </div>
                )) || <div className="text-xs text-[var(--muted)]">暂无分镜数据</div>}
              </div>
            </div>

            {/* 钩子 */}
            {detailItem.result.hooks?.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-semibold mb-1 text-[var(--text-secondary)]">
                  钩子 ({detailItem.hooksCount}个)
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {detailItem.result.hooks.map((hook, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded bg-[var(--background)]">
                      {hook.type}: {hook.text.slice(0, 20)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 提示词 */}
            {detailItem.result.prompts?.length > 0 && (
              <div>
                <div className="text-xs font-semibold mb-1 text-[var(--text-secondary)]">
                  即梦提示词 ({detailItem.result.prompts.length}条)
                </div>
                <div className="max-h-48 overflow-auto space-y-2">
                  {detailItem.result.prompts.map((p, i) => (
                    <div key={i} className="text-xs bg-[var(--background)] rounded px-3 py-2">
                      <div className="font-semibold mb-1">分镜#{p.shotId} | {p.sceneType}</div>
                      <div className="text-[var(--text-secondary)]">{p.textPrompt.slice(0, 80)}{p.textPrompt.length > 80 ? "..." : ""}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* 历史列表 */}
      {items.length === 0 && !searchLoading ? (
        <div className="text-center py-16 text-[var(--muted)]">
          <div className="text-5xl mb-3">📂</div>
          <div className="text-base font-semibold mb-1">
            {search || typeFilter !== "全部类型" ? "无匹配记录" : "暂无拆解记录"}
          </div>
          <div className="text-sm">
            {search || typeFilter !== "全部类型"
              ? "试试调整搜索条件"
              : "上传视频开始第一次拆解"}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <HistoryCard
              key={item.id}
              item={item}
              onClick={() => handleOpenDetail(item.id)}
              onDelete={(e) => handleDelete(item.id, e)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryCard({
  item,
  onClick,
  onDelete,
}: {
  item: HistoryItem;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className="bg-[var(--card-bg)] rounded-[var(--radius-card)] px-5 py-4 border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-[0_2px_8px_rgba(0,102,255,0.06)] transition-all cursor-pointer group shadow-sm"
      onClick={onClick}
    >
      <div className="flex justify-between items-center">
        <div className="text-sm font-semibold">{item.title}</div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-[var(--muted)]">{item.date}</div>
          <button
            className="text-xs text-[var(--muted)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all px-1.5 py-0.5"
            onClick={onDelete}
            title="删除记录"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="text-xs text-[var(--text-secondary)] mt-1">
        {item.shotsCount}个分镜 | {item.hooksCount}个钩子 | {item.strategy}
      </div>
      <div className="flex gap-1 mt-2">
        {item.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] font-medium"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
