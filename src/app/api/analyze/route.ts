import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { callAI, imageToContentBlock, textToContentBlock, ContentBlock } from "@/lib/ai-client";

const SYSTEM_PROMPT_SCRIPT = `你是一位专业的短视频脚本拆解专家。你将看到一组视频关键帧截图和语音转文字内容，请结合画面和语音将视频拆解为结构化脚本。

请严格按照以下JSON格式输出，不要输出任何其他内容：

{
  "shots": [
    {"id": 1, "timeRange": "0-3s", "description": "画面具象描述（人物外观+动作+场景细节，只写你看到的画面）", "script": "该段语音/字幕内容（从语音转文字结果中对应时间段的文字，如无则写无）", "camera": "景别+运镜方式", "mood": "情绪关键词"}
  ],
  "hooks": [
    {"type": "钩子类型（悬念/冲突/情感/数字/提问/反常识/号召）", "text": "钩子原文+位置", "position": "第X秒", "score": 8.5}
  ],
  "structure": {
    "opening": "开头手法（故事型/数据型/问题型/场景型）",
    "middle": "中间结构（问题-解决/对比/步骤/案例）",
    "ending": "结尾设计（号召行动/提问互动/悬念延续/情感共鸣）"
  },
  "emotionCurve": [
    {"emotion": "情绪词", "color": "#对应色值"}
  ],
  "videoType": "视频类型（美食类/口播类/电商类/短剧类/仙侠类/通用）"
}

拆解规则：
1. 你看到的每张图片对应一个时间段的关键帧，按顺序观察
2. 语音转文字内容带有时间戳（如[0-3s]），请将对应时间段的文字填入该分镜的script字段
3. 每个分镜对应约3秒片段
4. 画面描述必须具象化：明确人物外观、场景、动作，只描述你实际看到的
5. script字段必须使用语音转文字的实际内容，不要自己编造
6. 镜头运动使用专业术语：远景/全景/中景/近景/特写
7. 钩子分析识别开头和转折点的吸引要素
8. 情绪曲线标注每个分镜的情绪`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileId, duration, frames, frameDir, transcript } = body;

    if (!frameDir || !frames || frames.length === 0) {
      return NextResponse.json(
        { error: "无法提取视频关键帧" },
        { status: 400 }
      );
    }

    // Read keyframe images as base64 and build multimodal message
    const contentBlocks: ContentBlock[] = [];

    // Add text instruction first
    contentBlocks.push(textToContentBlock(
      `这是一个${duration}秒的视频，以下${frames.length}张关键帧截图按时间顺序排列，每张对应约3秒的片段。\n` +
      (transcript
        ? `视频语音转文字结果（带时间戳）：\n${transcript}\n\n请结合关键帧画面和语音转文字内容，拆解为结构化脚本。script字段必须使用语音转文字的实际内容。`
        : "没有语音转文字结果，请根据画面内容推断并拆解。") +
      `\n请仔细观察这些关键帧，拆解为结构化脚本，输出JSON格式。`
    ));

    // Add keyframe images (limit to max 8 to avoid token limits)
    const maxFrames = Math.min(frames.length, 8);
    for (let i = 0; i < maxFrames; i++) {
      const framePath = path.join(frameDir, frames[i]);
      if (fs.existsSync(framePath)) {
        const imageBuffer = fs.readFileSync(framePath);
        const base64Data = imageBuffer.toString("base64");
        contentBlocks.push(imageToContentBlock(base64Data, "image/jpeg"));
      }
    }

    const resultText = await callAI([
      { role: "system", content: SYSTEM_PROMPT_SCRIPT },
      { role: "user", content: contentBlocks },
    ]);

    // Parse JSON from AI response
    let analysisResult;
    try {
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        analysisResult = JSON.parse(resultText);
      }
    } catch {
      analysisResult = {
        shots: [],
        hooks: [],
        structure: { opening: "未知", middle: "未知", ending: "未知" },
        emotionCurve: [],
        videoType: "通用",
        rawAnalysis: resultText,
      };
    }

    return NextResponse.json({ result: analysisResult });
  } catch (error) {
    console.error("Analyze error:", error);
    const message = error instanceof Error ? error.message : "分析失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}