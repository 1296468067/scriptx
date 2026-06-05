import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execFileAsync = promisify(execFile);
const mkdirAsync = promisify(fs.mkdir);
const writeFileAsync = promisify(fs.writeFile);

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const DATA_DIR = path.join(process.cwd(), "data");

const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";
const FFPROBE = process.env.FFPROBE_PATH || "ffprobe";

async function ensureDirs() {
  for (const dir of [UPLOAD_DIR, DATA_DIR]) {
    if (!fs.existsSync(dir)) await mkdirAsync(dir, { recursive: true });
  }
}

export async function POST(request: NextRequest) {
  await ensureDirs();

  try {
    const formData = await request.formData();
    const videoFile = formData.get("video") as File | null;

    if (!videoFile) {
      return NextResponse.json({ error: "请上传视频文件" }, { status: 400 });
    }

    // Save uploaded file
    const fileId = `video_${Date.now()}`;
    const videoPath = path.join(UPLOAD_DIR, `${fileId}.mp4`);
    const buffer = Buffer.from(await videoFile.arrayBuffer());
    await writeFileAsync(videoPath, buffer);

    // Get video duration using ffprobe
    let duration = 0;
    try {
      const { stdout } = await execFileAsync(FFPROBE, [
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        videoPath,
      ]);
      duration = Math.round(parseFloat(stdout.trim()) || 30);
    } catch {
      duration = 30;
    }

    // Extract keyframes (1 per 3 seconds)
    const framesDir = path.join(DATA_DIR, fileId, "frames");
    await mkdirAsync(framesDir, { recursive: true });

    const timestamps = Array.from({ length: Math.min(Math.ceil(duration / 3), 30) }, (_, i) => i * 3);
    for (let i = 0; i < timestamps.length; i++) {
      const framePath = path.join(framesDir, `frame_${i + 1}.jpg`);
      try {
        await execFileAsync(FFMPEG, [
          "-i", videoPath,
          "-ss", String(timestamps[i]),
          "-vframes", "1",
          "-q:v", "2",
          "-y",
          framePath,
        ], { timeout: 10000 });
      } catch {
        // tolerate individual frame extraction failures
      }
    }

    // Extract audio for speech-to-text
    const audioPath = path.join(DATA_DIR, fileId, "audio.mp3");
    try {
      await execFileAsync(FFMPEG, [
        "-i", videoPath,
        "-vn",
        "-acodec", "libmp3lame",
        "-ab", "128k",
        "-y",
        audioPath,
      ], { timeout: 30000 });
    } catch {
      // tolerate audio extraction failures (video may have no audio)
    }

    // Get list of extracted frames
    let frameFiles: string[] = [];
    try {
      frameFiles = fs.readdirSync(framesDir)
        .filter((f) => f.endsWith(".jpg"))
        .sort();
    } catch {}

    // Check audio file exists
    const hasAudio = fs.existsSync(audioPath);

    return NextResponse.json({
      fileId,
      duration,
      frames: frameFiles,
      frameDir: framesDir,
      hasAudio,
      audioPath: hasAudio ? audioPath : null,
      videoPath,
    });
  } catch (error) {
    console.error("Process error:", error);
    return NextResponse.json(
      { error: "视频处理失败" },
      { status: 500 }
    );
  }
}