import { NextRequest, NextResponse } from "next/server";

interface ValidationRequest {
  prompts: string[];
}

interface ValidationResult {
  status: "pass" | "warn" | "fail";
  text: string;
}

// Jimeng prompt validation rules
const JIMENG_RULES = {
  hasSubject: (text: string) => {
    // Check if prompt has a clear subject (person/object description)
    const subjectPatterns = [/一位/, /一个/, /一只/, /一名/, /女性/, /男性/, /狗/, /猫/, /人/, /小孩/, /老人/];
    return subjectPatterns.some((p) => p.test(text));
  },
  notAbstract: (text: string) => {
    // Check no abstract descriptions
    const abstractPatterns = [/逐渐/, /成长为/, /自由发挥/, /高数/];
    return !abstractPatterns.some((p) => p.test(text));
  },
  notTooLong: (text: string) => text.length <= 150,
  noSound: (text: string) => {
    const soundPatterns = [/音效/, /声音/, /配乐/, /音乐/, /响声/, /咔嚓/, /咚/];
    return !soundPatterns.some((p) => p.test(text));
  },
  noContradictoryEmotion: (text: string) => {
    const contradictions = [
      [/哭泣/, /大笑/],
      [/悲伤/, /快乐/],
    ];
    return !contradictions.some(([a, b]) => a.test(text) && b.test(text));
  },
  actionCount: (text: string) => {
    const actionPatterns = [/走/, /跑/, /跳/, /转/, /推/, /拉/, /拿/, /放/, /翻/, /拍/, /踢/, /坐/, /站/];
    const count = actionPatterns.filter((p) => p.test(text)).length;
    return count;
  },
};

export async function POST(request: NextRequest) {
  try {
    const body: ValidationRequest = await request.json();
    const { prompts } = body;

    const results: ValidationResult[] = [];

    // Global validations
    const allHaveSubject = prompts.every(JIMENG_RULES.hasSubject);
    results.push({
      status: allHaveSubject ? "pass" : "fail",
      text: allHaveSubject ? "所有提示词包含明确主体描述" : "部分提示词缺少明确主体",
    });

    const allNotAbstract = prompts.every(JIMENG_RULES.notAbstract);
    results.push({
      status: allNotAbstract ? "pass" : "fail",
      text: allNotAbstract ? "无抽象描述、无古诗词" : "存在抽象描述或古诗词",
    });

    const allNotTooLong = prompts.every(JIMENG_RULES.notTooLong);
    results.push({
      status: allNotTooLong ? "pass" : "warn",
      text: allNotTooLong ? "每段对应3秒片段，动作精简" : "部分提示词过长，建议精简",
    });

    const allNoSound = prompts.every(JIMENG_RULES.noSound);
    results.push({
      status: allNoSound ? "pass" : "warn",
      text: allNoSound ? "无音效描述（即梦不支持音效）" : "包含音效描述，即梦不支持音效",
    });

    // Per-prompt action complexity check
    for (let i = 0; i < prompts.length; i++) {
      const actionCount = JIMENG_RULES.actionCount(prompts[i]);
      if (actionCount > 3) {
        results.push({
          status: "warn",
          text: `分镜#${i + 1}含${actionCount}个动作（建议不超过3个，考虑拆分）`,
        });
      }
    }

    return NextResponse.json({ validations: results });
  } catch (error) {
    console.error("Validation error:", error);
    return NextResponse.json(
      { error: "Validation failed" },
      { status: 500 }
    );
  }
}