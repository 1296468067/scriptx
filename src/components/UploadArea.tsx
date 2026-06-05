"use client";

import { useState, useRef } from "react";

export default function UploadArea({ onUpload }: { onUpload: (file: File) => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "video/mp4") {
      onUpload(file);
    } else {
      alert("请上传MP4格式视频文件");
    }
  };

  const handleClick = () => inputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "video/mp4") {
        alert("请上传MP4格式视频文件");
        return;
      }
      if (file.size > 200 * 1024 * 1024) {
        alert("文件大小超过200MB限制");
        return;
      }
      onUpload(file);
    }
  };

  return (
    <div
      className={`relative overflow-hidden bg-[var(--card-bg)] rounded-[var(--radius-panel)] py-20 px-16 text-center border-2 border-dashed transition-all cursor-pointer ${
        dragging
          ? "border-[var(--primary)] bg-[#fafcff]"
          : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-[#fafcff]"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      {/* 装饰性渐变圆圈 */}
      <div className="absolute -top-14 -right-14 w-44 h-44 rounded-full opacity-30 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,102,255,0.06) 0%, transparent 70%)" }}
      />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-30 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,92,57,0.05) 0%, transparent 70%)" }}
      />

      {/* 上传图标 */}
      <div className="relative z-[1] mx-auto mb-4 w-16 h-16 rounded-2xl flex items-center justify-center text-white text-[28px]"
        style={{ background: "linear-gradient(135deg, var(--primary), #3399FF)" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </svg>
      </div>

      <div className="relative z-[1] text-lg font-bold text-[var(--foreground)] mb-2">
        上传MP4视频文件
      </div>
      <div className="relative z-[1] text-[13px] text-[var(--muted)]">
        拖拽文件到这里，或点击选择文件 · 单个MP4格式 · 上限200MB
      </div>
      <button
        className="relative z-[1] mt-5 px-8 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
        style={{
          background: "var(--primary)",
          boxShadow: "var(--shadow-btn)",
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.boxShadow = "var(--shadow-btn-hover)";
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.boxShadow = "var(--shadow-btn)";
        }}
      >
        开始拆解
      </button>

      {/* 特性说明 */}
      <div className="relative z-[1] flex gap-6 justify-center mt-6">
        <FeatureDot color="#0066FF" label="自动分镜拆解" />
        <FeatureDot color="#FF5C39" label="即梦文生+图生提示词" />
        <FeatureDot color="#FFB800" label="一键导出Markdown/JSON" />
      </div>

      <input ref={inputRef} type="file" accept=".mp4,video/mp4" className="hidden" onChange={handleChange} />
    </div>
  );
}

function FeatureDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
      {label}
    </span>
  );
}
