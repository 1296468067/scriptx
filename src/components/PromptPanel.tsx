"use client";

import { useState } from "react";
import { PromptResult, ValidationItem, AnalysisResult, TemplateStyleWords } from "@/lib/types";

const SCENE_TYPES = ["美食类", "口播类", "电商类", "短剧类", "仙侠类", "通用"];

export default function PromptPanel({
  data,
  onUpdate,
  template,
}: {
  data: AnalysisResult;
  onUpdate?: (updated: AnalysisResult) => void;
  template?: { formula?: string; style_words?: TemplateStyleWords } | null;
}) {
  const [editing, setEditing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [draft, setDraft] = useState<AnalysisResult>(() => structuredClone(data));

  const display = editing ? draft : data;

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

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

  const updatePrompt = (
    index: number,
    field: keyof PromptResult,
    value: string
  ) => {
    setDraft((prev) => {
      const prompts = [...(prev.prompts || [])];
      prompts[index] = { ...prompts[index], [field]: value };
      return { ...prev, prompts };
    });
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await fetch("/api/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shots: data.shots,
          hooks: data.hooks,
          structure: data.structure,
          emotionCurve: data.emotionCurve,
          videoType: data.videoType,
          template: template
            ? { formula: template.formula, style_words: template.style_words }
            : undefined,
        }),
      });

      if (res.ok) {
        const promptData = await res.json();
        const newResult = promptData.result || {};
        const updated: AnalysisResult = {
          ...data,
          prompts: newResult.prompts || data.prompts,
          validations: newResult.validations || data.validations,
        };
        onUpdate?.(updated);
        setDraft(structuredClone(updated));
      } else {
        alert("重新生成失败，请稍后重试");
      }
    } catch {
      alert("网络错误，重新生成失败");
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="bg-[var(--card-bg)] rounded-[var(--radius-panel)] p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-base font-bold text-[var(--foreground)]">即梦提示词</span>
        <span className="text-xs px-3 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] font-semibold">
          文生+图生
        </span>
        {editing && (
          <span className="text-xs text-[var(--accent-2)] ml-auto">编辑中</span>
        )}
      </div>

      {/* 提示词列表 */}
      {display.prompts.length > 0 ? (
        display.prompts.map((prompt, i) => (
          <PromptItem
            key={i}
            prompt={prompt}
            index={i}
            copied={copiedIndex === i}
            onCopy={handleCopy}
            editing={editing}
            onUpdate={(field, value) => updatePrompt(i, field, value)}
          />
        ))
      ) : (
        <div className="text-xs text-[var(--muted)] py-8 text-center">
          暂无提示词数据，请先完成脚本拆解
        </div>
      )}

      {/* 校验结果 */}
      {display.validations?.length > 0 && (
        <ValidationPanel validations={display.validations} />
      )}

      {/* 操作按钮 */}
      <div className="mt-4 flex gap-2 flex-wrap">
        {editing ? (
          <>
            <button
              className="bg-[var(--primary)] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-[var(--primary-hover)] transition-colors"
              style={{ boxShadow: "var(--shadow-btn)" }}
              onClick={saveEdit}
            >
              ✓ 保存提示词
            </button>
            <button
              className="border border-[var(--border)] px-4 py-2 rounded-full text-sm text-[var(--text-secondary)] bg-white hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
              onClick={cancelEdit}
            >
              ✕ 取消
            </button>
          </>
        ) : (
          <button
            className="border border-[var(--border)] px-4 py-2 rounded-full text-sm text-[var(--text-secondary)] bg-white hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
            onClick={enterEdit}
          >
            ✎ 编辑提示词
          </button>
        )}
        <button
          className="border border-[var(--border)] px-4 py-2 rounded-full text-sm text-[var(--text-secondary)] bg-white hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleRegenerate}
          disabled={regenerating || data.shots.length === 0}
        >
          {regenerating ? "⏳ 重新生成中..." : "↻ 重新生成"}
        </button>
      </div>
    </div>
  );
}

/* ====== PromptItem ====== */
function PromptItem({
  prompt,
  index,
  copied,
  onCopy,
  editing,
  onUpdate,
}: {
  prompt: PromptResult;
  index: number;
  copied: boolean;
  onCopy: (text: string, index: number) => void;
  editing: boolean;
  onUpdate: (field: keyof PromptResult, value: string) => void;
}) {
  if (editing) {
    return (
      <div className="border border-[var(--primary)] rounded-[var(--radius-card)] px-4 py-4 mb-3 bg-[var(--primary-light)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold">分镜 #{prompt.shotId}</span>
          <input
            className="border border-[var(--border)] rounded-md px-1.5 py-0.5 text-xs w-20 bg-white"
            value={prompt.timeRange}
            onChange={(e) => onUpdate("timeRange", e.target.value)}
          />
          <input
            className="border border-[var(--border)] rounded-md px-1.5 py-0.5 text-xs w-16 bg-white"
            value={prompt.mood}
            onChange={(e) => onUpdate("mood", e.target.value)}
            placeholder="情绪"
          />
          <select
            className="border border-[var(--border)] rounded-md px-1.5 py-0.5 text-xs bg-white"
            value={prompt.sceneType}
            onChange={(e) => onUpdate("sceneType", e.target.value)}
          >
            {SCENE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-[var(--muted)] mb-1">文生视频提示词：</div>
        <textarea
          className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm mb-3 bg-white resize-none leading-relaxed"
          rows={3}
          value={prompt.textPrompt}
          onChange={(e) => onUpdate("textPrompt", e.target.value)}
          placeholder="输入文生视频提示词..."
        />

        <div className="text-xs text-[var(--muted)] mb-1">图生视频提示词：</div>
        <textarea
          className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm mb-3 bg-yellow-50 resize-none leading-relaxed text-amber-800"
          rows={2}
          value={prompt.imagePrompt}
          onChange={(e) => onUpdate("imagePrompt", e.target.value)}
          placeholder="输入图生视频提示词..."
        />
      </div>
    );
  }

  return (
    <div className="border border-[var(--border)] rounded-[var(--radius-card)] px-4 py-5 mb-3">
      {/* Top row */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm font-semibold text-[var(--foreground)]">
          分镜 #{prompt.shotId} — {prompt.timeRange} | {prompt.mood}
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--accent-3-light)] text-[#b87a00] font-medium">
          {prompt.sceneType}
        </span>
      </div>

      {prompt.keyframe && (
        <div className="text-xs text-[var(--primary)] mb-2 font-medium">
          📷 图生推荐 | 关键帧: {prompt.keyframe}
        </div>
      )}

      {/* 文生视频提示词 */}
      <div className="text-sm bg-[var(--background)] px-3.5 py-3 rounded-lg mb-2.5 leading-relaxed text-[var(--foreground)]">
        {prompt.textPrompt}
      </div>

      {/* 图生视频提示词 */}
      <div className="text-sm border-l-[3px] border-l-[var(--accent-3)] bg-[#FFFDF5] px-3.5 py-3 rounded-r-lg mb-3 leading-relaxed text-[#8b6914]">
        图生：{prompt.imagePrompt}
      </div>

      <button
        className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
          copied
            ? "bg-[var(--primary)] text-white"
            : "border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white"
        }`}
        onClick={() => onCopy(prompt.textPrompt, index)}
      >
        📋 {copied ? "已复制" : "复制"}
      </button>
    </div>
  );
}

/* ====== ValidationPanel ====== */
const VALIDATION_META: Record<string, { icon: string; color: string; bg: string; border: string; label: string }> = {
  pass: { icon: "✓", color: "#52c41a", bg: "#f6ffed", border: "#b7eb8f", label: "通过" },
  warn: { icon: "⚠", color: "#faad14", bg: "#fffbe6", border: "#ffe58f", label: "警告" },
  fail: { icon: "✕", color: "#ff4d4f", bg: "#fff2f0", border: "#ffccc7", label: "不通过" },
};

function ValidationPanel({ validations }: { validations: ValidationItem[] }) {
  const passCount = validations.filter((v) => v.status === "pass").length;
  const warnCount = validations.filter((v) => v.status === "warn").length;
  const failCount = validations.filter((v) => v.status === "fail").length;

  const [expanded, setExpanded] = useState(failCount > 0 || warnCount > 0);
  const displayItems = expanded ? validations : validations.filter((v) => v.status !== "pass");

  return (
    <div className="mt-4 pt-4 border-t border-[var(--border)]">
      {/* 标题 + 统计 */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm font-semibold">提示词校验</span>
        <div className="flex gap-1.5 ml-auto">
          {passCount > 0 && <SummaryBadge status="pass" count={passCount} />}
          {warnCount > 0 && <SummaryBadge status="warn" count={warnCount} />}
          {failCount > 0 && <SummaryBadge status="fail" count={failCount} />}
        </div>
      </div>

      {/* 校验条目 */}
      <div className="space-y-1.5">
        {displayItems.map((v, i) => (
          <ValidationRow key={i} item={v} />
        ))}
      </div>

      {/* 展开/收起 */}
      {validations.length > 3 && passCount > 0 && (
        <button
          className="mt-2 text-xs text-[var(--primary)] hover:underline font-medium"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? `收起 ${passCount} 条通过项` : `展开全部 ${validations.length} 条`}
        </button>
      )}
    </div>
  );
}

function SummaryBadge({ status, count }: { status: string; count: number }) {
  const meta = VALIDATION_META[status];
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
    >
      {meta.icon} {count}{meta.label}
    </span>
  );
}

function ValidationRow({ item }: { item: ValidationItem }) {
  const meta = VALIDATION_META[item.status];
  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors"
      style={{ background: meta.bg, border: `1px solid ${meta.border}` }}
    >
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
        style={{ background: meta.color, color: "#fff" }}
      >
        {meta.icon}
      </span>
      <span style={{ color: item.status === "pass" ? "var(--text-secondary)" : "var(--foreground)" }}>
        {item.text}
      </span>
    </div>
  );
}
