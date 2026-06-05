// Anthropic Messages API content block types
interface TextBlock {
  type: "text";
  text: string;
}

interface ImageBlock {
  type: "image";
  source: {
    type: "base64";
    media_type: "image/jpeg" | "image/png";
    data: string;
  };
}

export type ContentBlock = TextBlock | ImageBlock;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | ContentBlock[];
}

interface AnthropicResponse {
  content: Array<{
    type: "text";
    text: string;
  }>;
}

export async function callAI(messages: ChatMessage[], temperature = 0.7): Promise<string> {
  const baseUrl = process.env.AI_API_BASE_URL || "https://copilot.huya.info/api/anthropic/";
  const apiKey = process.env.AI_API_KEY || "";
  const model = process.env.AI_MODEL || "claude-sonnet-4-20250514";

  if (!apiKey) {
    throw new Error("AI_API_KEY not configured. Please set it in .env.local");
  }

  // Anthropic API: system prompt is separate from messages
  const systemMessage = messages.find((m) => m.role === "system");

  // Convert messages to Anthropic format (supports text + image content blocks)
  const conversationMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  // Ensure messages start with "user" role
  if (conversationMessages.length > 0 && conversationMessages[0].role !== "user") {
    conversationMessages.unshift({ role: "user", content: "请开始分析" });
  }

  const endpoint = `${baseUrl}v1/messages`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      temperature,
      system: typeof systemMessage?.content === "string" ? systemMessage.content : "",
      messages: conversationMessages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API error: ${response.status} - ${errorText}`);
  }

  const data: AnthropicResponse = await response.json();
  const textContent = data.content
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("");

  return textContent || "";
}

// Helper: read image file as base64 ContentBlock
export function imageToContentBlock(base64Data: string, mediaType: "image/jpeg" | "image/png" = "image/jpeg"): ImageBlock {
  return {
    type: "image",
    source: {
      type: "base64",
      media_type: mediaType,
      data: base64Data,
    },
  };
}

// Helper: create text ContentBlock
export function textToContentBlock(text: string): TextBlock {
  return {
    type: "text",
    text,
  };
}