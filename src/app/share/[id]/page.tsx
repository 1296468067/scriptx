"use client";

import { useState, useEffect, use } from "react";
import { AnalysisResult } from "@/lib/types";

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

const hookTypeColors: Record<string, string> = {
  提问型: "#fecaca",
  数字型: "#bfdbfe",
  号召型: "#99f6e4",
  悬念型: "#fde68a",
  冲突型: "#fecaca",
  情感型: "#fde68a",
  反常识: "#e6f7ff",
};

interface ShareData {
  id: string;
  title: string;
  videoType: string;
  shotsCount: number;
  hooksCount: number;
  result: AnalysisResult;
  createdAt: string;
}

export default function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [share, setShare] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/share/${id}`);
        if (!res.ok) {
          setError("分享不存在或已过期");
          return;
        }
        const data = await res.json();
        setShare(data.share);
      } catch {
        setError("加载失败");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="text-5xl mb-3 animate-pulse">⏳</div>
        <div className="text-base font-semibold text-[var(--foreground)]">加载中...</div>
      </div>
    );
  }

  if (error || !share) {
    return (
      <div className="p-8 text-center">
        <div className="text-5xl mb-3">😕</div>
        <div className="text-base font-semibold text-[var(--foreground)] mb-1">分享不存在</div>
        <div className="text-sm text-[var(--muted)]">{error}</div>
      </div>
    );
  }

  const { result } = share;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* 标题栏 */}
      <div className="mb-8">
        <div className="text-2xl font-bold text-[var(--foreground)] mb-2">{share.title}</div>
        <div className="text-sm text-[var(--muted)]">
          {share.videoType} · {share.shotsCount}个分镜 · {share.hooksCount}个钩子 · {share.createdAt}
        </div>
      </div>

      {/* 脚本拆解 */}
      {result.shots?.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">
            脚本拆解
            <span className="ml-2 text-xs px-2.5 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] font-semibold">
              {result.shots.length}个分镜
            </span>
          </h2>

          {/* 情绪曲线 */}
          {result.emotionCurve?.length > 0 && (
            <div className="flex items-center gap-1.5 mb-5 flex-wrap">
              <span className="text-xs text-[var(--muted)] mr-2">情绪曲线</span>
              {result.emotionCurve.map((point, i) => {
                const style = moodColors[point.emotion] || { bg: "#f0f2f5", text: "#666" };
                return (
                  <span key={i} className="flex items-center gap-1">
                    <span
                      className="w-8 h-8 rounded-full text-[11px] font-semibold flex items-center justify-center"
                      style={{ background: style.bg, color: style.text }}
                    >
                      {point.emotion}
                    </span>
                    {i < result.emotionCurve.length - 1 && (
                      <span className="text-[var(--muted)] text-xs">→</span>
                    )}
                  </span>
                );
              })}
            </div>
          )}

          {/* 分镜卡片 */}
          {result.shots.map((shot) => {
            const moodStyle = moodColors[shot.mood] || { bg: "#f0f2f5", text: "#666" };
            return (
              <div key={shot.id} className="border border-[var(--border)] rounded-[var(--radius-card)] p-5 mb-3">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-[var(--primary)] text-white w-7 h-7 rounded-full text-[13px] font-bold text-center leading-7">
                    {shot.id}
                  </span>
                  <span className="text-[13px] text-[var(--muted)]">{shot.timeRange}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: moodStyle.bg, color: moodStyle.text }}>
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
          })}

          {/* 结构标签 */}
          {result.structure && (
            <div className="flex items-center gap-1.5 mt-4">
              <span className="text-xs text-[var(--muted)]">结构：</span>
              {(["opening", "middle", "ending"] as const).map((key) => (
                <span key={key} className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] font-medium">
                  {result.structure[key]}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 钩子分析 */}
      {result.hooks?.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">钩子分析</h2>
          {result.hooks.map((hook, i) => (
            <div key={i} className="flex gap-3 py-2.5 border-b border-[var(--background)]">
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium flex-shrink-0" style={{ background: hookTypeColors[hook.type] || "#f0f2f5" }}>
                {hook.type}
              </span>
              <div className="text-sm flex-1">{hook.text}</div>
              <div className="text-sm font-bold text-[var(--primary)]">{hook.score}</div>
            </div>
          ))}
        </section>
      )}

      {/* 提示词 */}
      {result.prompts?.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">
            即梦提示词
            <span className="ml-2 text-xs px-2.5 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] font-semibold">
              文生+图生
            </span>
          </h2>
          {result.prompts.map((prompt, i) => (
            <div key={i} className="border border-[var(--border)] rounded-[var(--radius-card)] p-5 mb-3">
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm font-semibold text-[var(--foreground)]">
                  分镜 #{prompt.shotId} — {prompt.timeRange} | {prompt.mood}
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--accent-3-light)] text-[#b87a00] font-medium">
                  {prompt.sceneType}
                </span>
              </div>
              <div className="text-sm bg-[var(--background)] px-3.5 py-3 rounded-lg mb-2.5 leading-relaxed text-[var(--foreground)]">
                {prompt.textPrompt}
              </div>
              <div className="text-sm border-l-[3px] border-l-[var(--accent-3)] bg-[#FFFDF5] px-3.5 py-3 rounded-r-lg mb-3 leading-relaxed text-[#8b6914]">
                图生：{prompt.imagePrompt}
              </div>
              <button
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  copiedIndex === i
                    ? "bg-[var(--primary)] text-white"
                    : "border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white"
                }`}
                onClick={() => handleCopy(prompt.textPrompt, i)}
              >
                📋 {copiedIndex === i ? "已复制" : "复制"}
              </button>
            </div>
          ))}
        </section>
      )}

      {/* 校验结果 */}
      {result.validations?.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">校验结果</h2>
          {result.validations.map((v, i) => {
            const meta = { pass: { bg: "#f6ffed", border: "#b7eb8f", color: "#52c41a" }, warn: { bg: "#fffbe6", border: "#ffe58f", color: "#faad14" }, fail: { bg: "#fff2f0", border: "#ffccc7", color: "#ff4d4f" } }[v.status];
            return (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs mb-1.5" style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ background: meta.color, color: "#fff" }}>
                  {v.status === "pass" ? "✓" : v.status === "warn" ? "⚠" : "✕"}
                </span>
                <span>{v.text}</span>
              </div>
            );
          })}
        </section>
      )}

      {/* 底部 */}
      <div className="text-center text-xs text-[var(--muted)] pt-4 border-t border-[var(--border)]">
        由 ScriptX 生成 · scriptx.app
      </div>
    </div>
  );
}
