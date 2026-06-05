import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execFileAsync = promisify(execFile);

const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";
const DATA_DIR = path.join(process.cwd(), "data");

// Use whisper-small for fast download and transcription; switch to large-v3-turbo when cached
const WHISPER_MODEL = "mlx-community/whisper-small-mlx";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileId } = body;

    if (!fileId) {
      return NextResponse.json({ transcript: "", warning: "缺少fileId" });
    }

    // Check if audio file exists
    const audioPath = path.join(DATA_DIR, fileId, "audio.mp3");
    if (!fs.existsSync(audioPath)) {
      return NextResponse.json({ transcript: "", warning: "视频无音频轨道" });
    }

    // Convert to wav for whisper (16kHz mono)
    const wavPath = path.join(DATA_DIR, fileId, "audio.wav");
    try {
      await execFileAsync(FFMPEG, [
        "-i", audioPath,
        "-ar", "16000",
        "-ac", "1",
        "-c:a", "pcm_s16le",
        "-y",
        wavPath,
      ], { timeout: 30000 });
    } catch {
      return NextResponse.json({ transcript: "", warning: "音频转换失败" });
    }

    // Use whisper for speech-to-text (mlx-whisper on macOS, openai-whisper on Linux)
    const wavPathEsc = wavPath.replace(/"/g, '\\"');
    const pythonScript = `
import json, sys
try:
    import mlx_whisper
    result = mlx_whisper.transcribe("${wavPathEsc}", path_or_hf_repo="${WHISPER_MODEL}", language="zh", word_timestamps=True)
except ImportError:
    import whisper
    model = whisper.load_model("small")
    result = model.transcribe("${wavPathEsc}", language="zh", word_timestamps=True)
segments = []
for seg in result.get("segments", []):
    start = int(seg["start"])
    end = int(seg["end"])
    text = seg["text"].strip()
    if text:
        segments.append({"start": start, "end": end, "text": text})
print(json.dumps(segments))
`;

    // 10 minute timeout for model download + transcription
    const { stdout } = await execFileAsync("python3", ["-c", pythonScript], {
      timeout: 600000,
      maxBuffer: 10 * 1024 * 1024,
    });

    const output = stdout.trim();

    // Parse JSON output
    try {
      const parsed = JSON.parse(output);

      if (parsed.error) {
        console.error("Whisper error:", parsed.error);
        return NextResponse.json({ transcript: "", warning: "语音转文字失败: " + parsed.error });
      }

      // Format transcript with timestamps
      if (Array.isArray(parsed)) {
        const transcript = parsed.map((seg: { start: number; end: number; text: string }) =>
          `[${seg.start}-${seg.end}s] ${seg.text}`
        ).join("\n");
        return NextResponse.json({ transcript });
      }
    } catch {}

    // If not valid JSON, try to use raw output
    return NextResponse.json({ transcript: output || "" });
  } catch (error) {
    console.error("Transcribe error:", error);
    // Return empty transcript instead of crashing - analysis can continue with just keyframes
    return NextResponse.json({ transcript: "", warning: "语音转文字超时，仅使用画面分析" });
  }
}