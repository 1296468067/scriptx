export interface Shot {
  id: number;
  timeRange: string;
  description: string;
  script: string;
  camera: string;
  mood: string;
  keyframe?: string;
}

export interface Hook {
  type: string;
  text: string;
  position: string;
  score: number;
}

export interface ContentStructure {
  opening: string;
  middle: string;
  ending: string;
}

export interface EmotionPoint {
  emotion: string;
  color: string;
}

export interface ValidationItem {
  status: "pass" | "warn" | "fail";
  text: string;
}

export interface PromptResult {
  shotId: number;
  timeRange: string;
  mood: string;
  sceneType: string;
  textPrompt: string;
  imagePrompt: string;
  keyframe?: string;
}

export interface AnalysisResult {
  shots: Shot[];
  hooks: Hook[];
  structure: ContentStructure;
  emotionCurve: EmotionPoint[];
  prompts: PromptResult[];
  validations: ValidationItem[];
  videoType: string;
}

export interface TemplateStyleWords {
  lighting: string[];
  tone: string[];
  texture: string[];
  style: string[];
}

export interface Template {
  id: string;
  type: string;
  name: string;
  description: string;
  preview: string;
  saved: boolean;
  formula?: string;
  style_words?: TemplateStyleWords;
}

export interface HistoryItem {
  id: string;
  title: string;
  date: string;
  shotsCount: number;
  hooksCount: number;
  strategy: string;
  tags: string[];
}