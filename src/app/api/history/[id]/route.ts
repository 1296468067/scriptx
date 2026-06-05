import { NextRequest, NextResponse } from "next/server";
import { getHistoryById, deleteHistoryItem } from "@/lib/history-service";

/**
 * GET /api/history/[id]
 * 获取单条历史记录的完整数据（含result）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = getHistoryById(id);

    if (!item) {
      return NextResponse.json({ error: "历史记录不存在" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("History detail GET error:", error);
    return NextResponse.json({ error: "获取历史记录详情失败" }, { status: 500 });
  }
}

/**
 * DELETE /api/history/[id]
 * 删除指定历史记录
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = deleteHistoryItem(id);

    if (!deleted) {
      return NextResponse.json({ error: "历史记录不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("History DELETE error:", error);
    return NextResponse.json({ error: "删除历史记录失败" }, { status: 500 });
  }
}
