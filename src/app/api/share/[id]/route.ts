import { NextRequest, NextResponse } from "next/server";
import { getShare } from "@/lib/share-service";

/**
 * GET /api/share/[id]
 * 获取分享内容
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const share = getShare(id);

    if (!share) {
      return NextResponse.json({ error: "分享不存在或已过期" }, { status: 404 });
    }

    return NextResponse.json({ share });
  } catch (error) {
    console.error("Share GET error:", error);
    return NextResponse.json({ error: "获取分享失败" }, { status: 500 });
  }
}
