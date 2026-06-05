"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { TemplateStyleWords } from "@/lib/types";
import templatesData from "@/data/templates.json";

interface Props {
  onTemplateFound: (template: {
    id: string;
    type: string;
    name: string;
    formula?: string;
    style_words?: TemplateStyleWords;
  } | null) => void;
}

/** 从URL读取模板参数并通知父组件，必须在Suspense内使用 */
export default function TemplateInitializer({ onTemplateFound }: Props) {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");

  useEffect(() => {
    if (templateId) {
      const found = templatesData.find((t) => t.id === templateId);
      if (found) {
        onTemplateFound({
          id: found.id,
          type: found.type,
          name: found.name,
          formula: found.formula,
          style_words: found.style_words,
        });
      }
    }
  }, [templateId, onTemplateFound]);

  return null;
}
