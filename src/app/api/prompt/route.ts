import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/ai-client";

const SYSTEM_PROMPT_PROMPT = `你是一位即梦AI视频生成提示词专家。根据脚本拆解结果，生成符合即梦规范的提示词。

模板优先规则：如果提供了套用模板公式，请优先按照模板公式的结构生成提示词，模板风格词优先于默认场景策略。

即梦提示词核心规范（必须严格遵守）：
1. 公式：【主体】+【外观描述】+【运动】，【风格词】
2. 必须具象化：禁止抽象描述、古诗词、超长脚本
3. 3秒一个画面：每段提示词对应3秒视频内容，动作不超过3个
4. 突出主体：明确人物/物体外观和行为
5. 自然语言：简洁、具体、可视觉化的描述
6. 可加入情感元素：快乐、忧郁等，但不能要求矛盾情绪
7. 不支持音效描述：只描述画面，不描述声音

场景策略规范：
- 电商类：主体+产品外观+使用动作+光影质感
- 短剧类：人物外观+表情动作+对话场景+情绪转折+景别变化
- 仙侠类：服饰细节+法术动作+环境特效+冷色调风格
- 美食类：食材外观+烹饪动作+翻拌翻炒细节+烟火光影
- 口播类：人物外观+手势动作+表情变化+背景场景

风格词库（可选加入）：
- 光影：暖色调侧光 / 冷色调逆光 / 自然柔光 / 电影级光影
- 色调：橙暖色调 / 蓝冷色调 / 日系清新色调 / 中国风色调
- 质感：丝绸质感 / 粗糙质感 / 水彩质感 / 油画质感
- 画风：写实风格 / 动漫风格 / 3D渲染风格 / 水墨画风格

运镜规范：
- 景别序列：远景→全景→中景→近景→特写，合理过渡避免跳跃
- 轴线原则：保持180度轴线一致性
- 焦点转移：同一镜头不超过2次焦点转移

请严格按照以下JSON格式输出，不要输出任何其他内容：

{
  "prompts": [
    {
      "shotId": 1,
      "timeRange": "0-3s",
      "mood": "情绪",
      "sceneType": "场景类型",
      "textPrompt": "文生视频提示词（纯文字描述，遵循即梦公式）",
      "imagePrompt": "图生视频提示词（配合关键帧图片，描述运动方式，更简洁）"
    }
  ],
  "validations": [
    {"status": "pass/warn/fail", "text": "校验结果描述"}
  ]
}

生成规则：
- 每个分镜生成一条文生视频提示词 + 一条图生视频提示词
- 图生视频提示词更简洁，侧重描述运动和变化
- 跨分镜保持风格一致性（人种、画风、色调、光影统一）
- 自动匹配场景策略模板
- 自动从风格词库选取匹配的词汇`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { shots, hooks, structure, emotionCurve, videoType, transcript, template } = body;

    if (!shots || shots.length === 0) {
      // No shot data from analysis, generate prompts based on transcript only
      if (!transcript) {
        return NextResponse.json({ error: "没有分镜数据也没有语音内容" }, { status: 400 });
      }
      // Create minimal shots from transcript
      const lines = transcript.split("\n").filter((l: string) => l.trim());
      shots = lines.map((line: string, i: number) => {
        const match = line.match(/\[(\d+)-(\d+)s\]/);
        const timeRange = match ? `${match[1]}-${match[2]}s` : `${i * 3}-${i * 3 + 3}s`;
        const text = line.replace(/\[\d+-\d+s\]\s*/, "").trim();
        return { id: i + 1, timeRange, description: text, script: text, camera: "中景", mood: "中性" };
      });

      if (shots.length === 0) {
        return NextResponse.json({ error: "无法生成提示词" }, { status: 400 });
      }
      videoType = videoType || "通用";
      structure = structure || { opening: "未知", middle: "未知", ending: "未知" };
      emotionCurve = emotionCurve || [{ emotion: "中性", color: "#f0f2f5" }];
    }

    const scriptSummary = shots.map((s: any) =>
      `分镜#${s.id} (${s.timeRange} | ${s.mood}): ${s.description} | 文案:"${s.script}" | 镜头:${s.camera}`
    ).join("\n");

    const userPrompt = `请根据以下脚本拆解结果，生成即梦AI提示词：

视频类型：${videoType || "通用"}
内容结构：开头=${structure?.opening} | 中间=${structure?.middle} | 结尾=${structure?.ending}
情绪曲线：${emotionCurve?.map((e: any) => e.emotion).join(" → ") || "未知"}
${transcript ? `原始语音转文字：${transcript}` : ""}${
      template?.formula
        ? `\n套用模板公式：${template.formula}\n模板风格词：${
            template.style_words
              ? [
                  ...(template.style_words.lighting || []),
                  ...(template.style_words.tone || []),
                  ...(template.style_words.texture || []),
                  ...(template.style_words.style || []),
                ].join("、")
              : "无"
          }`
        : ""
    }

分镜详情：
${scriptSummary}

请为每个分镜生成文生视频和图生视频两套提示词，并做规范校验。`;

    const resultText = await callAI([
      { role: "system", content: SYSTEM_PROMPT_PROMPT },
      { role: "user", content: userPrompt },
    ]);

    // Parse JSON from AI response
    let promptResult;
    try {
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        promptResult = JSON.parse(jsonMatch[0]);
      } else {
        promptResult = JSON.parse(resultText);
      }
    } catch {
      promptResult = {
        prompts: shots.map((s: any) => ({
          shotId: s.id,
          timeRange: s.timeRange,
          mood: s.mood,
          sceneType: videoType || "通用",
          textPrompt: resultText,
          imagePrompt: resultText,
        })),
        validations: [],
      };
    }

    // Ensure each prompt has keyframe reference if available
    if (promptResult.prompts) {
      promptResult.prompts = promptResult.prompts.map((p: any, i: number) => ({
        ...p,
        keyframe: shots[i]?.keyframe || `frame_${i + 1}.jpg`,
      }));
    }

    return NextResponse.json({ result: promptResult });
  } catch (error) {
    console.error("Prompt generation error:", error);
    const message = error instanceof Error ? error.message : "提示词生成失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}