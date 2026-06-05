"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Template } from "@/lib/types";
import { mockTemplates } from "@/lib/mock-data";
import templatesData from "@/data/templates.json";

export default function TemplatesPage() {
  const router = useRouter();

  // 优先使用 templates.json 的丰富数据，mock-data 降级为 fallback
  const unifiedTemplates: Template[] =
    templatesData && templatesData.length > 0
      ? templatesData.map((t) => ({
          id: t.id,
          type: t.type,
          name: t.name,
          description: t.description,
          preview: t.formula, // 用公式作为预览，比mock的占位文本更有用
          saved: false,
          formula: t.formula,
          style_words: t.style_words,
        }))
      : mockTemplates;

  const [templates, setTemplates] = useState<Template[]>(unifiedTemplates);

  const toggleSave = (id: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, saved: !t.saved } : t))
    );
  };

  return (
    <div className="p-8">
      <div className="grid grid-cols-3 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-sm transition-all cursor-pointer"
          >
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] font-medium">
              {template.type}
            </span>
            <div className="text-sm font-semibold mt-2 mb-1">{template.name}</div>
            <div className="text-xs text-[var(--muted)] mb-3">{template.description}</div>
            <div className="text-xs bg-[var(--background)] px-3 py-2 rounded text-[var(--text-secondary)] leading-snug">
              {template.preview}
            </div>
            <div className="flex gap-2 mt-3">
              <button
                className="bg-[var(--primary)] text-white px-3 py-1.5 rounded text-xs hover:bg-[var(--primary-hover)] transition-colors"
                onClick={() => router.push(`/?template=${template.id}`)}
              >
                套用
              </button>
              <button
                className={`px-3 py-1.5 rounded text-xs transition-colors ${
                  template.saved
                    ? "bg-yellow-50 text-yellow-600 border border-yellow-200"
                    : "bg-[var(--card-bg)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--border)]"
                }`}
                onClick={() => toggleSave(template.id)}
              >
                {template.saved ? "★ 已收藏" : "☆ 收藏"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
