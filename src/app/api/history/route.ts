import { NextRequest, NextResponse } from "next/server";
import { listHistory, addHistoryItem } from "@/lib/history-service";
import type { StoredHistoryItem } from "@/lib/history-service";

/**
 * GET /api/history
 * 查询历史记录列表（不含完整result字段，减少响应体积）
 * 可选查询参数：?search=关键词&type=视频类型
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || undefined;
    const type = searchParams.get("type") || undefined;

    const items = listHistory(search, type);

    // 返回时剥离result字段，减小列表响应体积
    const listItems = items.map(
      ({ result: _, fileName: _fn, fileSize: _fs, fileDuration: _fd, ...rest }) => rest
    );

    return NextResponse.json({ items: listItems, total: items.length });
  } catch (error) {
    console.error("History GET error:", error);
    return NextResponse.json({ error: "获取历史记录失败" }, { status: 500 });
  }
}

/**
 * POST /api/history
 * 新增一条历史记录
 * Body: { item: StoredHistoryItem }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { item } = body as { item: StoredHistoryItem };

    if (!item || !item.id) {
      return NextResponse.json({ error: "缺少历史记录数据" }, { status: 400 });
    }

    const saved = addHistoryItem(item);
    return NextResponse.json({ item: saved }, { status: 201 });
  } catch (error) {
    console.error("History POST error:", error);
    return NextResponse.json({ error: "添加历史记录失败" }, { status: 500 });
  }
}
