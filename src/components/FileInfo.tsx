"use client";

export default function FileInfo({
  file,
  onRemove,
}: {
  file: { name: string; size: string; duration: string };
  onRemove: () => void;
}) {
  return (
    <div className="bg-[var(--card-bg)] rounded-[var(--radius-card)] px-5 py-4 mb-4 flex items-center gap-3 shadow-sm">
      <div className="w-[50px] h-[50px] rounded-xl flex items-center justify-center text-white text-xs font-bold bg-[var(--foreground)] flex-shrink-0">
        MP4
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate">{file.name}</div>
        <div className="text-xs text-[var(--muted)] mt-0.5">{file.size} · 时长{file.duration}</div>
      </div>
      <button
        className="text-[var(--muted)] text-xl cursor-pointer hover:text-red-400 transition-colors flex-shrink-0"
        onClick={onRemove}
        aria-label="移除文件"
      >
        ✕
      </button>
    </div>
  );
}
