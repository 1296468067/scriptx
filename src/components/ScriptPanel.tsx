"use client";

import { useState } from "react";
import { Shot, Hook, ContentStructure, EmotionPoint, AnalysisResult } from "@/lib/types";

const MOOD_OPTIONS = ["焦虑", "好奇", "惊喜", "喜悦", "悲伤", "愤怒", "恐惧", "释然", "行动欲", "平静", "紧张", "感动", "快乐", "中性"];
const HOOK_TYPES = ["提问型", "数字型", "号召型", "悬念型", "冲突型", "情感型", "反常识"];
const STRUCTURE_LABELS: Record<keyof ContentStructure, string> = {
  opening: "开头手法",
  middle: "中间结构",
  ending: "结尾设计",
};
const CAMERA_OPTIONS = ["远景", "全景", "中景", "近景", "特写", "远景→全景", "中景→近景", "近景→特写", "全景→中景", "固定", "推进", "拉远", "摇摄"];

const moodColors: Record<string, { bg: string; text: string }> = {
  焦虑: { bg: "#fecaca", text: "#991b1b" },
  好奇: { bg: "#bfdbfe", text: "#1d4ed8" },
  释然: { bg: "#99f6e4", text: "#0f766e" },
  行动欲: { bg: "#fde68a", text: "#92400e" },
  行动: { bg: "#fde68a", text: "#92400e" },
  紧张: { bg: "#fecaca", text: "#991b1b" },
  惊喜: { bg: "#bfdbfe", text: "#1d4ed8" },
  感动: { bg: "#99f6e4", text: "#0f766e" },
  喜悦: { bg: "#fde68a", text: "#92400e" },
  悲伤: { bg: "#fecaca", text: "#991b1b" },
  恐惧: { bg: "#fecaca", text: "#991b1b" },
  愤怒: { bg: "#fecaca", text: "#991b1b" },
  快乐: { bg: "#fde68a", text: "#92400e" },
  平静: { bg: "#99f6e4", text: "#0f766e" },
  中性: { bg: "#f0f2f5", text: "#666" },
};

export default function ScriptPanel({
  data,
  onUpdate,
}: {
  data: AnalysisResult;
  onUpdate?: (updated: AnalysisResult) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<AnalysisResult>(() => structuredClone(data));

  const enterEdit = () => {
    setDraft(structuredClone(data));
    setEditing(true);
  };

  const saveEdit = () => {
    onUpdate?.(draft);
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const updateShot = (index: number, field: keyof Shot, value: string) => {
    setDraft((prev) => {
      const shots = [...prev.shots];
      shots[index] = { ...shots[index], [field]: value };
      return { ...prev, shots };
    });
  };

  const deleteShot = (index: number) => {
    setDraft((prev) => {
      const shots = prev.shots.filter((_, i) => i !== index).map((s, i) => ({ ...s, id: i + 1 }));
      return { ...prev, shots };
    });
  };

  const addShot = () => {
    setDraft((prev) => {
      const newId = prev.shots.length + 1;
      const lastShot = prev.shots[prev.shots.length - 1];
      const newShot: Shot = {
        id: newId,
        timeRange: lastShot
          ? `${parseInt(lastShot.timeRange.split("-")[1] || "0")}-${parseInt(lastShot.timeRange.split("-")[1] || "0") + 3}s`
          : `${(newId - 1) * 3}-${newId * 3}s`,
        description: "",
        script: "",
        camera: "中景",
        mood: "中性",
      };
      return { ...prev, shots: [...prev.shots, newShot] };
    });
  };

  const updateHook = (index: number, field: keyof Hook, value: string | number) => {
    setDraft((prev) => {
      const hooks = [...(prev.hooks || [])];
      hooks[index] = { ...hooks[index], [field]: value };
      return { ...prev, hooks };
    });
  };

  const deleteHook = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      hooks: (prev.hooks || []).filter((_, i) => i !== index),
    }));
  };

  const addHook = () => {
    setDraft((prev) => ({
      ...prev,
      hooks: [...(prev.hooks || []), { type: "悬念型", text: "", position: "0s", score: 5 }],
    }));
  };

  const updateStructure = (field: keyof ContentStructure, value: string) => {
    setDraft((prev) => ({
      ...prev,
      structure: { ...prev.structure, [field]: value },
    }));
  };

  const updateEmotion = (index: number, value: string) => {
    setDraft((prev) => {
      const curve = [...prev.emotionCurve];
      curve[index] = { emotion: value, color: moodColors[value]?.bg || "#f0f2f5" };
      return { ...prev, emotionCurve: curve };
    });
  };

  const deleteEmotion = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      emotionCurve: prev.emotionCurve.filter((_, i) => i !== index),
    }));
  };

  const addEmotion = () => {
    setDraft((prev) => ({
      ...prev,
      emotionCurve: [...prev.emotionCurve, { emotion: "中性", color: "#f0f2f5" }],
    }));
  };

  const display = editing ? draft : data;

  return (
    <div className="flex-1 bg-[var(--card-bg)] rounded-[var(--radius-panel)] p-8 overflow-auto shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-6">
        <span className="text-[17px] font-bold text-[var(--foreground)]">脚本拆解结果</span>
        <span className="text-xs px-3 py-1 rounded-full bg-[var(--primary-light)] text-[var(--primary)] font-semibold">
          {display.shots.length}个分镜
        </span>
        {editing && (
          <span className="text-xs text-[var(--accent-2)] ml-auto">编辑中</span>
        )}
      </div>

      {/* 分镜列表 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-[var(--muted)]">分镜列表</span>
          {editing && (
            <button
              className="text-xs text-[var(--primary)] hover:underline font-medium"
              onClick={addShot}
            >
              + 添加分镜
            </button>
          )}
        </div>
        {display.shots.map((shot, i) => (
          <ShotItem
            key={shot.id}
            shot={shot}
            editing={editing}
            onUpdate={(field, value) => updateShot(i, field, value)}
            onDelete={() => deleteShot(i)}
          />
        ))}
        {display.shots.length === 0 && (
          <div className="text-xs text-[var(--muted)] py-4 text-center">暂无分镜数据</div>
        )}
      </div>

      {/* 钩子分析 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">钩子分析</div>
          {editing && (
            <button
              className="text-xs text-[var(--primary)] hover:underline font-medium"
              onClick={addHook}
            >
              + 添加钩子
            </button>
          )}
        </div>
        {display.hooks?.length > 0 ? (
          display.hooks.map((hook, i) => (
            <HookItem
              key={i}
              hook={hook}
              editing={editing}
              onUpdate={(field, value) => updateHook(i, field, value)}
              onDelete={() => deleteHook(i)}
            />
          ))
        ) : (
          <div className="text-xs text-[var(--muted)] py-2">暂无钩子数据</div>
        )}
      </div>

      {/* 内容结构 */}
      <div className="mb-6">
        <div className="text-sm font-semibold mb-2">内容结构</div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(Object.keys(STRUCTURE_LABELS) as (keyof ContentStructure)[]).map((key) => (
            <span key={key} className="inline-flex items-center gap-1 text-xs">
              <span className="text-[var(--muted)]">{STRUCTURE_LABELS[key]}：</span>
              {editing ? (
                <input
                  className="border border-[var(--border)] rounded-md px-2 py-0.5 text-xs w-24 bg-white"
                  value={display.structure?.[key] || ""}
                  onChange={(e) => updateStructure(key, e.target.value)}
                />
              ) : (
                <StructureTag label={display.structure?.[key] || "未知"} />
              )}
            </span>
          ))}
        </div>
      </div>

      {/* 情绪曲线 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">情绪曲线</div>
          {editing && (
            <button
              className="text-xs text-[var(--primary)] hover:underline font-medium"
              onClick={addEmotion}
            >
              + 添加情绪
            </button>
          )}
        </div>
        {display.emotionCurve?.length > 0 ? (
          <div className="flex items-center gap-1.5 py-2 flex-wrap">
            {display.emotionCurve.map((point, i) => (
              <EmotionPill
                key={i}
                point={point}
                isLast={i === display.emotionCurve.length - 1}
                editing={editing}
                onUpdate={(value) => updateEmotion(i, value)}
                onDelete={() => deleteEmotion(i)}
              />
            ))}
          </div>
        ) : (
          <div className="text-xs text-[var(--muted)] py-2">暂无情绪数据</div>
        )}
      </div>

      {/* 按钮 */}
      <div className="flex gap-2">
        {editing ? (
          <>
            <button
              className="bg-[var(--primary)] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[var(--primary-hover)] transition-colors"
              style={{ boxShadow: "var(--shadow-btn)" }}
              onClick={saveEdit}
            >
              ✓ 保存修改
            </button>
            <button
              className="border border-[var(--border)] px-5 py-2.5 rounded-full text-sm text-[var(--text-secondary)] bg-white hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
              onClick={cancelEdit}
            >
              ✕ 取消
            </button>
          </>
        ) : (
          <button
            className="border border-[var(--border)] px-5 py-2.5 rounded-full text-sm text-[var(--text-secondary)] bg-white hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
            onClick={enterEdit}
          >
            ✎ 编辑拆解
          </button>
        )}
      </div>
    </div>
  );
}

/* ====== ShotItem ====== */
function ShotItem({
  shot,
  editing,
  onUpdate,
  onDelete,
}: {
  shot: Shot;
  editing: boolean;
  onUpdate: (field: keyof Shot, value: string) => void;
  onDelete: () => void;
}) {
  const moodStyle = moodColors[shot.mood] || { bg: "#f0f2f5", text: "#666" };

  if (editing) {
    return (
      <div className="border border-[var(--primary)] rounded-[var(--radius-card)] px-5 py-4 mb-3 bg-[var(--primary-light)]">
        <div className="flex items-center gap-2.5 mb-3">
          <span className="bg-[var(--primary)] text-white w-7 h-7 rounded-full text-xs font-bold text-center leading-7 flex-shrink-0">
            {shot.id}
          </span>
          <input
            className="border border-[var(--border)] rounded-md px-1.5 py-0.5 text-xs w-20 bg-white"
            value={shot.timeRange}
            onChange={(e) => onUpdate("timeRange", e.target.value)}
            placeholder="0-3s"
          />
          <select
            className="border border-[var(--border)] rounded-md px-1.5 py-0.5 text-xs bg-white"
            value={shot.mood}
            onChange={(e) => onUpdate("mood", e.target.value)}
          >
            {MOOD_OPTIONS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <button
            className="ml-auto text-xs text-red-400 hover:text-red-600 px-1"
            onClick={onDelete}
            title="删除分镜"
          >
            ✕
          </button>
        </div>
        <textarea
          className="w-full border border-[var(--border)] rounded-md px-2.5 py-1.5 text-xs mb-1.5 bg-white resize-none"
          rows={2}
          value={shot.description}
          onChange={(e) => onUpdate("description", e.target.value)}
          placeholder="画面描述..."
        />
        <textarea
          className="w-full border border-[var(--border)] rounded-md px-2.5 py-1.5 text-xs mb-1.5 bg-white resize-none"
          rows={1}
          value={shot.script || ""}
          onChange={(e) => onUpdate("script", e.target.value)}
          placeholder="文案/对白..."
        />
        <select
          className="border border-[var(--border)] rounded-md px-1.5 py-0.5 text-xs w-full bg-white"
          value={shot.camera}
          onChange={(e) => onUpdate("camera", e.target.value)}
        >
          {CAMERA_OPTIONS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="border border-[var(--border)] rounded-[var(--radius-card)] px-5 py-5 mb-3 transition-all hover:border-[var(--primary)] hover:shadow-[0_2px_8px_rgba(0,102,255,0.06)]">
      <div className="flex items-center gap-3 mb-2.5">
        <span className="bg-[var(--primary)] text-white w-7 h-7 rounded-full text-[13px] font-bold text-center leading-7 flex-shrink-0">
          {shot.id}
        </span>
        <span className="text-[13px] text-[var(--muted)]">{shot.timeRange}</span>
        <span
          className="text-xs px-2.5 py-0.5 rounded-full font-medium"
          style={{ background: moodStyle.bg, color: moodStyle.text }}
        >
          {shot.mood}
        </span>
      </div>
      <div className="text-sm text-[var(--foreground)] leading-relaxed mb-2">{shot.description}</div>
      {shot.script && (
        <div className="text-[13px] text-[var(--text-secondary)] bg-[var(--background)] px-3.5 py-2.5 rounded-lg mb-2">
          &ldquo;{shot.script}&rdquo;
        </div>
      )}
      <div className="text-xs text-[var(--muted)]">🎥 {shot.camera}</div>
    </div>
  );
}

/* ====== HookItem ====== */
function HookItem({
  hook,
  editing,
  onUpdate,
  onDelete,
}: {
  hook: Hook;
  editing: boolean;
  onUpdate: (field: keyof Hook, value: string | number) => void;
  onDelete: () => void;
}) {
  const typeColors: Record<string, string> = {
    提问型: "#fecaca",
    数字型: "#bfdbfe",
    号召型: "#99f6e4",
    悬念型: "#fde68a",
    冲突型: "#fecaca",
    情感型: "#fde68a",
    反常识: "#e6f7ff",
  };

  if (editing) {
    return (
      <div className="flex gap-2 py-2.5 border-b border-[var(--background)] items-center">
        <select
          className="border border-[var(--border)] rounded-md px-1.5 py-0.5 text-xs bg-white"
          value={hook.type}
          onChange={(e) => onUpdate("type", e.target.value)}
        >
          {HOOK_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input
          className="flex-1 border border-[var(--border)] rounded-md px-1.5 py-0.5 text-xs bg-white"
          value={hook.text}
          onChange={(e) => onUpdate("text", e.target.value)}
          placeholder="钩子文案..."
        />
        <input
          className="border border-[var(--border)] rounded-md px-1 py-0.5 text-xs w-16 bg-white"
          value={hook.position}
          onChange={(e) => onUpdate("position", e.target.value)}
          placeholder="位置"
        />
        <input
          className="border border-[var(--border)] rounded-md px-1 py-0.5 text-xs w-14 bg-white"
          type="number"
          min="0"
          max="10"
          step="0.1"
          value={hook.score}
          onChange={(e) => onUpdate("score", parseFloat(e.target.value) || 0)}
        />
        <button
          className="text-xs text-red-400 hover:text-red-600 px-1"
          onClick={onDelete}
          title="删除钩子"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-3 py-2.5 border-b border-[var(--background)]">
      <span
        className="text-xs px-2.5 py-0.5 rounded-full font-medium flex-shrink-0"
        style={{ background: typeColors[hook.type] || "#f0f2f5" }}
      >
        {hook.type}
      </span>
      <div className="text-sm flex-1">{hook.text}</div>
      <div className="text-sm font-bold text-[var(--primary)]">{hook.score}</div>
    </div>
  );
}

/* ====== StructureTag ====== */
function StructureTag({ label }: { label: string }) {
  return (
    <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] font-medium mr-0.5">
      {label}
    </span>
  );
}

/* ====== EmotionPill ====== */
function EmotionPill({
  point,
  isLast,
  editing,
  onUpdate,
  onDelete,
}: {
  point: EmotionPoint;
  isLast: boolean;
  editing: boolean;
  onUpdate: (value: string) => void;
  onDelete: () => void;
}) {
  const bgColor = moodColors[point.emotion]?.bg || point.color || "#f0f2f5";

  if (editing) {
    return (
      <>
        <div className="flex flex-col items-center gap-0.5 group">
          <select
            className="w-14 text-[10px] border border-[var(--border)] rounded px-0.5 py-0 bg-white"
            value={point.emotion}
            onChange={(e) => onUpdate(e.target.value)}
          >
            {MOOD_OPTIONS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <button
            className="text-[10px] text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100"
            onClick={onDelete}
          >
            ✕
          </button>
        </div>
        {!isLast && <span className="text-[var(--muted)] text-xs mx-0.5">→</span>}
      </>
    );
  }

  return (
    <>
      <div
        className="w-9 h-9 rounded-full text-center text-[11px] font-semibold leading-9 flex-shrink-0"
        style={{ background: bgColor, color: moodColors[point.emotion]?.text || "#333" }}
      >
        {point.emotion}
      </div>
      {!isLast && <span className="text-[var(--muted)] text-xs mx-0.5">→</span>}
    </>
  );
}
