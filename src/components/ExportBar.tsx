"use client";

import { useState } from "react";
import { AnalysisResult } from "@/lib/types";

export default function ExportBar({ data }: { data: AnalysisResult }) {
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyAll = async () => {
    const lines: string[] = [];
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    lines.push("═══ ScriptX 脚本拆解报告 ═══");
    lines.push(`视频类型：${data.videoType || "通用"}`);
    lines.push("");

    // 脚本拆解
    if (data.shots?.length > 0) {
      lines.push(`【脚本拆解】${data.shots.length}个分镜`);
      lines.push("");
      data.shots.forEach((s) => {
        lines.push(`分镜 #${s.id} — ${s.timeRange} | ${s.mood}`);
        lines.push(`  画面：${s.description}`);
        if (s.script) lines.push(`  文案："${s.script}"`);
        lines.push(`  镜头：${s.camera}`);
        lines.push("");
      });
    }

    // 情绪曲线
    if (data.emotionCurve?.length > 0) {
      lines.push(`【情绪曲线】${data.emotionCurve.map((e) => e.emotion).join(" → ")}`);
      lines.push("");
    }

    // 钩子分析
    if (data.hooks?.length > 0) {
      lines.push(`【钩子分析】${data.hooks.length}个`);
      data.hooks.forEach((h) => {
        lines.push(`  ${h.type}: "${h.text}"（位置: ${h.position}，评分: ${h.score}）`);
      });
      lines.push("");
    }

    // 内容结构
    if (data.structure) {
      lines.push(`【内容结构】开头: ${data.structure.opening} | 中间: ${data.structure.middle} | 结尾: ${data.structure.ending}`);
      lines.push("");
    }

    // 提示词
    if (data.prompts?.length > 0) {
      lines.push(`【提示词】文生+图生`);
      lines.push("");
      data.prompts.forEach((p) => {
        lines.push(`分镜 #${p.shotId} — ${p.timeRange} | ${p.mood} | ${p.sceneType}`);
        lines.push(`  文生：${p.textPrompt}`);
        lines.push(`  图生：${p.imagePrompt}`);
        lines.push("");
      });
    }

    // 校验
    if (data.validations?.length > 0) {
      lines.push("【校验结果】");
      data.validations.forEach((v) => {
        const icon = v.status === "pass" ? "✓" : v.status === "warn" ? "⚠" : "✕";
        lines.push(`  ${icon} ${v.text}`);
      });
      lines.push("");
    }

    lines.push(`═══ 生成时间：${dateStr} ═══`);

    await navigator.clipboard.writeText(lines.join("\n"));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleExportMD = () => {
    const lines: string[] = [];
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    lines.push("# ScriptX 脚本拆解报告");
    lines.push("");
    lines.push(`**视频类型：** ${data.videoType || "通用"}`);
    lines.push(`**生成时间：** ${dateStr}`);
    lines.push("");

    // 脚本拆解
    if (data.shots?.length > 0) {
      lines.push(`## 脚本拆解（${data.shots.length}个分镜）`);
      lines.push("");
      data.shots.forEach((s) => {
        lines.push(`### 分镜 #${s.id} — ${s.timeRange} | ${s.mood}`);
        lines.push("");
        lines.push(`**画面：** ${s.description}`);
        if (s.script) lines.push(`**文案：** "${s.script}"`);
        lines.push(`**镜头：** ${s.camera}`);
        lines.push("");
      });
    }

    // 情绪曲线
    if (data.emotionCurve?.length > 0) {
      lines.push("## 情绪曲线");
      lines.push("");
      lines.push(data.emotionCurve.map((e) => e.emotion).join(" → "));
      lines.push("");
    }

    // 钩子分析
    if (data.hooks?.length > 0) {
      lines.push(`## 钩子分析（${data.hooks.length}个）`);
      lines.push("");
      data.hooks.forEach((h) => {
        lines.push(`- **${h.type}:** "${h.text}"（位置: ${h.position}，评分: ${h.score}）`);
      });
      lines.push("");
    }

    // 内容结构
    if (data.structure) {
      lines.push("## 内容结构");
      lines.push("");
      lines.push(`- **开头：** ${data.structure.opening}`);
      lines.push(`- **中间：** ${data.structure.middle}`);
      lines.push(`- **结尾：** ${data.structure.ending}`);
      lines.push("");
    }

    // 提示词
    if (data.prompts?.length > 0) {
      lines.push("## 即梦提示词");
      lines.push("");
      data.prompts.forEach((p) => {
        lines.push(`### 分镜 #${p.shotId} — ${p.timeRange} | ${p.mood}`);
        lines.push("");
        lines.push(`**场景策略：** ${p.sceneType}`);
        lines.push("");
        lines.push(`**文生视频：** ${p.textPrompt}`);
        lines.push("");
        lines.push(`**图生视频（推荐）：** ${p.imagePrompt}`);
        lines.push("");
      });
    }

    // 校验结果
    if (data.validations?.length > 0) {
      lines.push("## 校验结果");
      lines.push("");
      data.validations.forEach((v) => {
        const icon = v.status === "pass" ? "✅" : v.status === "warn" ? "⚠️" : "❌";
        lines.push(`- ${icon} ${v.text}`);
      });
      lines.push("");
    }

    const md = lines.join("\n");
    downloadFile(md, "scriptx-analysis.md", "text/markdown");
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, "scriptx-analysis.json", "application/json");
  };

  if (!data.prompts || data.prompts.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2.5 mt-0">
      <button
        onClick={handleCopyAll}
        className={`flex-1 px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${
          copiedAll
            ? "bg-green-500 text-white"
            : "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
        }`}
        style={copiedAll ? {} : { boxShadow: "var(--shadow-btn)" }}
      >
        📋 {copiedAll ? "已复制全部" : "一键复制全部"}
      </button>
      <button
        onClick={handleExportMD}
        className="px-4 py-2.5 rounded-full text-sm border border-[var(--border)] text-[var(--text-secondary)] bg-white hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
      >
        💾 MD
      </button>
      <button
        onClick={handleExportJSON}
        className="px-4 py-2.5 rounded-full text-sm border border-[var(--border)] text-[var(--text-secondary)] bg-white hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
      >
        💾 JSON
      </button>
    </div>
  );
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
