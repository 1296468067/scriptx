"use client";

type Step = "extracting_audio" | "extracting_frames" | "transcribing" | "analyzing" | "generating" | "done";

const stepLabels: Record<Step, string> = {
  extracting_audio: "音频提取",
  extracting_frames: "关键帧提取",
  transcribing: "语音转文字",
  analyzing: "AI脚本拆解",
  generating: "提示词生成",
  done: "完成",
};

const stepOrder: Step[] = ["extracting_audio", "extracting_frames", "transcribing", "analyzing", "generating", "done"];

const progressMessages: Record<Step, string> = {
  extracting_audio: "正在提取音频...",
  extracting_frames: "正在提取视频关键帧...",
  transcribing: "正在语音转文字（本地Whisper）...",
  analyzing: "正在AI拆解脚本...",
  generating: "正在生成即梦提示词...",
  done: "处理完成！",
};

export default function ProgressSteps({
  step,
  progress,
}: {
  step: string;
  progress: number;
}) {
  const currentIndex = stepOrder.indexOf(step as Step);
  const displaySteps = [
    { key: "extracting_frames", label: "视频处理" },
    { key: "transcribing", label: "语音转文字" },
    { key: "analyzing", label: "AI脚本拆解" },
    { key: "generating", label: "提示词生成" },
  ];

  let displayIndex = -1;
  if (step === "extracting_audio" || step === "extracting_frames") {
    displayIndex = 0;
  } else if (step === "transcribing") {
    displayIndex = 1;
  } else if (step === "analyzing") {
    displayIndex = 2;
  } else if (step === "generating") {
    displayIndex = 3;
  } else if (step === "done") {
    displayIndex = 4;
  }

  return (
    <div className="bg-[var(--card-bg)] rounded-[var(--radius-card)] px-5 py-5 mb-4 shadow-sm">
      {/* 步骤指示器 */}
      <div className="flex gap-2.5 mb-4">
        {displaySteps.map((s, i) => (
          <div
            key={s.key}
            className={`flex-1 py-2.5 px-2 rounded-lg text-xs text-center font-medium transition-all ${
              i < displayIndex
                ? "bg-[var(--primary-light)] text-[var(--primary)]"
                : i === displayIndex
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--background)] text-[var(--muted)]"
            }`}
          >
            {i < displayIndex ? "✓ " : i === displayIndex ? "● " : ""}
            {s.label}
          </div>
        ))}
      </div>

      {/* 进度条 */}
      <div className="h-1.5 rounded-full bg-[var(--background)] overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, var(--primary), #3399FF)",
          }}
        />
      </div>

      <div className="text-xs text-[var(--text-secondary)] text-center">
        {progressMessages[step as Step] || "处理中..."} {progress}%
      </div>
    </div>
  );
}
