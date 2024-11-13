import { getUserDataSelect, prisma } from "@zephyr/db";

export async function GET() {
  try {
    const trendingUsers = await prisma.user.findMany({
      take: 6,
      orderBy: [
        {
          followers: {
            _count: "desc"
          }
        },
        {
          posts: {
            _count: "desc"
          }
        }
      ],
      select: getUserDataSelect("")
    });

    return Response.json(trendingUsers);
  } catch (_error) {
    return Response.json(
      { error: "Failed to fetch trending users" },
      { status: 500 }
    );
  }
}