"use client";

import { useState } from "react";
import { AnalysisResult } from "@/lib/types";

export default function ShareButton({ data }: { data: AnalysisResult }) {
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    setSharing(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: data }),
      });

      if (res.ok) {
        const { share } = await res.json();
        const url = `${window.location.origin}/share/${share.id}`;
        setShareUrl(url);
      } else {
        alert("创建分享失败，请稍后重试");
      }
    } catch {
      alert("网络错误，创建分享失败");
    } finally {
      setSharing(false);
    }
  };

  const handleCopyUrl = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (shareUrl) {
    return (
      <div className="flex items-center gap-2 p-3 bg-[var(--primary-light)] rounded-[var(--radius-card)] border border-[var(--primary-light)]">
        <span className="text-xs text-[var(--primary)] font-medium flex-shrink-0">🔗 分享链接：</span>
        <input
          className="flex-1 text-xs bg-white border border-[var(--border)] rounded-md px-2 py-1.5 text-[var(--foreground)] min-w-0"
          value={shareUrl}
          readOnly
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <button
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
            copied
              ? "bg-green-500 text-white"
              : "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
          }`}
          onClick={handleCopyUrl}
        >
          {copied ? "已复制" : "复制"}
        </button>
      </div>
    );
  }

  return (
    <button
      className="px-4 py-2.5 rounded-full text-sm border border-[var(--border)] text-[var(--text-secondary)] bg-white hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all disabled:opacity-50"
      onClick={handleShare}
      disabled={sharing}
    >
      {sharing ? "⏳ 创建中..." : "🔗 分享"}
    </button>
  );
}
