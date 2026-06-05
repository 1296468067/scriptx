declare module "fluent-ffmpeg" {
  interface FfprobeData {
    format: {
      duration: string;
      size: string;
      bit_rate: string;
    };
    streams: Array<{
      codec_type: string;
      codec_name: string;
      width?: number;
      height?: number;
      duration?: string;
    }>;
  }

  interface ScreenshotsOptions {
    timestamps: number[];
    filename: string;
    folder: string;
    size?: string;
  }

  interface FfmpegCommand {
    screenshots(options: ScreenshotsOptions): FfmpegCommand;
    output(path: string): FfmpegCommand;
    audioCodec(codec: string): FfmpegCommand;
    audioBitrate(bitrate: string): FfmpegCommand;
    noVideo(): FfmpegCommand;
    on(event: "end", callback: () => void): FfmpegCommand;
    on(event: "error", callback: (err: Error) => void): FfmpegCommand;
    on(event: "start", callback: (commandLine: string) => void): FfmpegCommand;
    on(event: "progress", callback: (progress: any) => void): FfmpegCommand;
    run(): void;
  }

  const ffmpeg: {
    (input?: string | string[]): FfmpegCommand;
    setFfmpegPath(path: string): void;
    setFfprobePath(path: string): void;
    ffprobe: (path: string, callback: (err: Error | null, data: FfprobeData) => void) => void;
  };

  export = ffmpeg;
}