import { getStreamClient } from "@/lib/stream";
import { validateRequest } from "@zephyr/auth/auth";
import type { MessageCountInfo } from "@zephyr/db";

export async function GET() {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const streamClient = getStreamClient();
    const { total_unread_count } = await streamClient.getUnreadCount(user.id);

    const data: MessageCountInfo = {
      unreadCount: total_unread_count
    };
    return Response.json(data);
  } catch (error) {
    console.error("Stream error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
