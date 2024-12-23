import prisma from "../src/prisma";
import {
  POST_VIEWS_KEY_PREFIX,
  POST_VIEWS_SET,
  postViewsCache,
  redis
} from "../src/redis";

async function testViewCount() {
  try {
    console.log("Starting view count test...");

    try {
      await redis.ping();
      console.log("✅ Redis connection successful");
    } catch (error) {
      console.error("❌ Redis connection failed:", error);
      return;
    }

    const post = await prisma.post.findFirst({
      orderBy: { createdAt: "desc" }
    });

    if (!post) {
      console.log("❌ No posts found in database");
      return;
    }

    console.log("\nTest post:", {
      id: post.id,
      currentDBViews: post.viewCount
    });

    await redis.del(`${POST_VIEWS_KEY_PREFIX}${post.id}`);
    await redis.srem(POST_VIEWS_SET, post.id);
    console.log("\nTesting view increments:");

    for (let i = 0; i < 5; i++) {
      const newCount = await postViewsCache.incrementView(post.id);
      console.log(`Increment ${i + 1}: Redis count =`, newCount);
    }

    console.log("\nVerifying Redis data:");

    const viewCount = await postViewsCache.getViews(post.id);
    console.log("Final view count in Redis:", viewCount);

    const inSet = await redis.sismember(POST_VIEWS_SET, post.id);
    console.log("Post exists in view set:", inSet === 1);

    const allMembers = await redis.smembers(POST_VIEWS_SET);
    console.log("\nAll posts in view set:", allMembers);

    const allViewCounts = await postViewsCache.getMultipleViews(allMembers);
    console.log("All view counts:", allViewCounts);
  } catch (error) {
    console.error("Error during test:", error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testViewCount()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
