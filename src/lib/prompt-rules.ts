// 即梦提示词规范库 + 场景策略自动匹配

import scenes from "@/data/scenes.json";

export const PROMPT_RULES = [
  { id: 1, rule: "公式：【主体】+【外观描述】+【运动】，【主体B】+【外观描述】+【运动】" },
  { id: 2, rule: "必须具象化，禁止抽象描述、古诗词、超长脚本" },
  { id: 3, rule: "每个提示词对应约3秒视频内容，动作精简（不超过3个）" },
  { id: 4, rule: "突出主体，明确人物/物体外观和具体行为" },
  { id: 5, rule: "自然语言描述，简洁、具体、可直接视觉化" },
  { id: 6, rule: "可加入情感元素，但不能要求矛盾情绪" },
  { id: 7, rule: "只描述画面，不描述音效/声音" },
  { id: 8, rule: "Seedance 2.0：图生视频优先，提供关键帧+运动描述" },
];

// 根据视频内容自动匹配场景类型
export function matchSceneType(content: string): string {
  const keywords: Record<string, string[]> = {
    美食类: ["炒", "煮", "烤", "食材", "菜", "厨房", "锅", "烹饪", "美食", "吃", "饭", "烘焙", "甜品"],
    口播类: ["大家好", "我是", "今天", "分享", "干货", "知识", "你们", "我们", "为什么", "怎么办"],
    电商类: ["产品", "推荐", "买", "链接", "优惠", "测评", "同款", "好物", "种草", "开箱"],
    短剧类: ["对话", "剧情", "反转", "冲突", "虐", "甜", "前任", "老板"],
    仙侠类: ["仙", "法术", "幻", "灵", "修", "剑", "妖", "师", "穿越"],
  };

  for (const [scene, words] of Object.entries(keywords)) {
    for (const w of words) {
      if (content.includes(w)) return scene;
    }
  }
  return "通用";
}

export function getStyleWords(sceneType: string): string[] {
  const wordPool = scenes.风格词库;
  const sceneStrategy: Record<string, string[]> = {
    美食类: [
      ...wordPool.光影.filter((w) => w.includes("暖色调") || w.includes("侧光") || w === "电影级光影"),
      wordPool.色调[0],
      wordPool.质感.filter((w) => w === "粗糙质感" || w === "丝绸质感").join("、"),
      "写实风格",
    ],
    口播类: [
      wordPool.光影[2] || "自然柔光",
      wordPool.色调[2] || "日系清新色调",
      "写实风格",
    ],
    电商类: [
      "暖色调侧光", "电影级光影",
      wordPool.质感.filter((w) => ["丝绸质感", "金属质感", "玻璃质感"].includes(w)).join("、"),
      "写实风格",
    ],
    短剧类: [
      "电影级光影",
      "蓝冷色调",
      "写实风格",
    ],
    仙侠类: [
      "冷色调逆光", "电影级光影",
      "中国风色调",
      "丝绸质感",
      "写实风格",
    ],
    通用: [
      "自然柔光",
      "写实风格",
    ],
  };

  return sceneStrategy[sceneType] || sceneStrategy["通用"];
}
