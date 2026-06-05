import { NextRequest, NextResponse } from "next/server";
import { createShare } from "@/lib/share-service";

/**
 * POST /api/share
 * 创建分享链接
 * Body: { result: AnalysisResult }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { result } = body;

    if (!result || !result.shots) {
      return NextResponse.json({ error: "缺少分析结果数据" }, { status: 400 });
    }

    const share = createShare(result);
    return NextResponse.json({ share }, { status: 201 });
  } catch (error) {
    console.error("Share POST error:", error);
    return NextResponse.json({ error: "创建分享失败" }, { status: 500 });
  }
}
