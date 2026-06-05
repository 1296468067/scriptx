"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter } from "next/navigation";
import UploadArea from "@/components/UploadArea";
import FileInfo from "@/components/FileInfo";
import ProgressSteps from "@/components/ProgressSteps";
import ScriptPanel from "@/components/ScriptPanel";
import PromptPanel from "@/components/PromptPanel";
import ExportBar from "@/components/ExportBar";
import ShareButton from "@/components/ShareButton";
import TemplateInitializer from "@/components/TemplateInitializer";
import { AnalysisResult, TemplateStyleWords } from "@/lib/types";
import { addHistoryItem } from "@/lib/history-store";

type ProcessStep = "idle" | "extracting_frames" | "transcribing" | "analyzing" | "generating" | "done" | "error";

export default function WorkspacePage() {
  const [step, setStep] = useState<ProcessStep>("idle");
  const [file, setFile] = useState<{ name: string; size: string; duration: string } | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const router = useRouter();

  const [activeTemplate, setActiveTemplate] = useState<{
    id: string;
    type: string;
    name: string;
    formula?: string;
    style_words?: TemplateStyleWords;
  } | null>(null);

  // 稳定化回调避免Suspense重渲染循环
  const handleTemplateFound = useCallback(
    (template: typeof activeTemplate) => setActiveTemplate(template),
    []
  );

  const handleUpload = async (uploadedFile: File) => {
    setFile({
      name: uploadedFile.name,
      size: `${(uploadedFile.size / 1024 / 1024).toFixed(1)}MB`,
      duration: "检测中...",
    });
    setStep("extracting_frames");
    setProgress(5);
    setErrorMsg(null);
    setResult(null);

    try {
      // Step 1: Upload + ffmpeg process (extract frames + audio)
      setProgress(10);
      const formData = new FormData();
      formData.append("video", uploadedFile);

      const processRes = await fetch("/api/process", { method: "POST", body: formData });
      if (!processRes.ok) {
        const errData = await processRes.json().catch(() => ({ error: "视频处理失败" }));
        throw new Error(errData.error || "视频处理失败");
      }

      const processData = await processRes.json();
      setFile((prev) => prev ? { ...prev, duration: `${processData.duration}秒` } : prev);
      setProgress(30);

      // Step 2: Speech-to-text (local whisper)
      let transcript = "";
      if (processData.hasAudio) {
        setStep("transcribing");
        setProgress(35);

        try {
          const transcribeRes = await fetch("/api/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileId: processData.fileId }),
          });

          const transcribeData = await transcribeRes.json();
          transcript = transcribeData.transcript || "";
        } catch {
          // STT failed, continue without transcript
        }
      }
      setProgress(50);

      // Step 3: AI script analysis (with keyframe images + transcript)
      setStep("analyzing");
      setProgress(55);

      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: processData.fileId,
          duration: processData.duration,
          frames: processData.frames,
          frameDir: processData.frameDir,
          transcript,
        }),
      });

      if (!analyzeRes.ok) {
        const errData = await analyzeRes.json().catch(() => ({ error: "脚本拆解失败" }));
        throw new Error(errData.error || "脚本拆解失败");
      }

      const analyzeData = await analyzeRes.json();
      const analysisResult = analyzeData.result || {};
      setProgress(80);

      // Step 4: Generate Jimeng prompts
      setStep("generating");
      setProgress(85);

      let promptResult = { prompts: [], validations: [] };
      try {
        const promptRes = await fetch("/api/prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shots: analysisResult.shots,
            hooks: analysisResult.hooks,
            structure: analysisResult.structure,
            emotionCurve: analysisResult.emotionCurve,
            videoType: activeTemplate?.type || analysisResult.videoType,
            transcript,
            template: activeTemplate
              ? { formula: activeTemplate.formula, style_words: activeTemplate.style_words }
              : undefined,
          }),
        });

        if (promptRes.ok) {
          const promptData = await promptRes.json();
          promptResult = promptData.result || {};
        }
      } catch {
        // Prompt generation failed, still show analysis results
      }

      const finalResult: AnalysisResult = {
        shots: analysisResult.shots || [],
        hooks: analysisResult.hooks || [],
        structure: analysisResult.structure || { opening: "未知", middle: "未知", ending: "未知" },
        emotionCurve: analysisResult.emotionCurve || [],
        prompts: promptResult.prompts || [],
        validations: promptResult.validations || [],
        videoType: analysisResult.videoType || "通用",
      };

      setStep("done");
      setProgress(100);
      setResult(finalResult);

      // 保存到历史记录（异步，使用已捕获的变量避免React state闭包延迟）
      addHistoryItem(finalResult, {
        name: uploadedFile.name,
        size: `${(uploadedFile.size / 1024 / 1024).toFixed(1)}MB`,
        duration: `${processData.duration}秒`,
      }).catch((err) => console.error("保存历史记录失败:", err));
    } catch (err) {
      const message = err instanceof Error ? err.message : "处理失败";
      setStep("error");
      setErrorMsg(message);
    }
  };

  const handleReset = () => {
    setStep("idle");
    setFile(null);
    setProgress(0);
    setResult(null);
    setErrorMsg(null);
  };

  const isProcessing = ["extracting_frames", "transcribing", "analyzing", "generating"].includes(step);
  const isDone = step === "done";

  return (
    <div className="p-8">
      {/* URL模板参数读取（Suspense包裹以满足Next.js 16 prerendering要求） */}
      <Suspense fallback={null}>
        <TemplateInitializer onTemplateFound={handleTemplateFound} />
      </Suspense>

      {/* 空闲状态：上传区域 */}
      {step === "idle" && <UploadArea onUpload={handleUpload} />}

      {/* 处理中：文件信息 + 进度条 */}
      {isProcessing && file && (
        <>
          <FileInfo file={file} onRemove={handleReset} />
          <ProgressSteps step={step} progress={progress} />
        </>
      )}

      {/* 处理失败 */}
      {step === "error" && (
        <div className="bg-[var(--card-bg)] rounded-[var(--radius-panel)] p-8 text-center shadow-sm">
          <div className="text-5xl mb-3">❌</div>
          <div className="text-base font-semibold mb-1">处理失败</div>
          <div className="text-sm text-[var(--muted)] mb-4">{errorMsg}</div>
          <button
            className="bg-[var(--primary)] text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-[var(--primary-hover)] transition-colors"
            style={{ boxShadow: "var(--shadow-btn)" }}
            onClick={handleReset}
          >
            重新上传
          </button>
        </div>
      )}

      {/* 处理完成：展示结果 */}
      {isDone && (
        <>
          {/* 文件信息栏（紧凑模式） */}
          {file && (
            <div className="flex items-center gap-3 mb-4">
              <div className="text-sm font-semibold">{file.name}</div>
              <div className="text-xs text-[var(--muted)]">{file.size} | {file.duration}</div>
              <button
                className="ml-auto text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium transition-colors"
                onClick={handleReset}
              >
                重新上传
              </button>
            </div>
          )}

          {result ? (
            <>
              {/* 已套用模板提示 */}
              {activeTemplate && (
                <div className="flex items-center gap-2 mb-5 bg-[var(--primary-light)] border border-[var(--primary-light)] rounded-[var(--radius-card)] px-4 py-2.5">
                  <span className="text-xs text-[var(--primary)] font-medium">📋 已套用模板：</span>
                  <span className="text-sm font-semibold text-[var(--primary)]">{activeTemplate.name}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-white text-[var(--primary)] font-medium">
                    {activeTemplate.type}
                  </span>
                  <button
                    className="ml-auto text-xs text-[var(--muted)] hover:text-[var(--accent-2)] transition-colors"
                    onClick={() => {
                      setActiveTemplate(null);
                      router.replace("/");
                    }}
                  >
                    ✕ 清除模板
                  </button>
                </div>
              )}

              <div className="flex gap-5 min-h-[650px]">
                <ScriptPanel
                  data={result}
                  onUpdate={(updated) => setResult(updated)}
                />
                <div className="flex-1 flex flex-col gap-5 min-w-0">
                  <PromptPanel
                    data={result}
                    onUpdate={(updated) => setResult(updated)}
                    template={activeTemplate}
                  />
                  <ExportBar data={result} />
                  <ShareButton data={result} />
                </div>
              </div>
            </>
          ) : (
            <div className="bg-[var(--card-bg)] rounded-[var(--radius-panel)] p-8 text-center shadow-sm">
              <div className="text-base font-semibold mb-1">拆解结果为空</div>
              <div className="text-sm text-[var(--muted)] mb-4">AI未能成功解析视频内容，请重新上传尝试</div>
              <button
                className="bg-[var(--primary)] text-white px-6 py-2.5 rounded-lg text-sm hover:bg-[var(--primary-hover)]"
                onClick={handleReset}
              >
                重新上传
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}