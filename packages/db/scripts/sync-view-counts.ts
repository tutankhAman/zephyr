import prisma from "../src/prisma";
import { POST_VIEWS_KEY_PREFIX, POST_VIEWS_SET, redis } from "../src/redis";

async function syncViewCounts() {
  try {
    console.log("Starting view count sync...");

    // Test Redis connection
    try {
      await redis.ping();
      console.log("✅ Redis connection successful");
    } catch (error) {
      console.error("❌ Redis connection failed:", error);
      return;
    }

    // Get all posts that have views
    const postsWithViews = await redis.smembers(POST_VIEWS_SET);
    console.log(`Found ${postsWithViews.length} posts with views in Redis`);

    if (postsWithViews.length === 0) {
      console.log("No posts found with views to sync");
      return;
    }

    // Get view counts for all posts
    const pipeline = redis.pipeline();
    for (const postId of postsWithViews) {
      pipeline.get(`${POST_VIEWS_KEY_PREFIX}${postId}`);
    }

    const results = await pipeline.exec();
    console.log("Pipeline results:", results);

    // Create updates array
    const updates = postsWithViews
      .map((postId, index) => ({
        postId,
        views: Number(results[index]) || 0
      }))
      .filter((update) => update.views > 0);

    console.log("Updates to perform:", updates);

    // Update database in batches
    const batchSize = 100;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);

      await prisma.$transaction(
        batch.map(({ postId, views }) =>
          prisma.post.update({
            where: { id: postId },
            data: { viewCount: views }
          })
        )
      );

      console.log(
        `Updated batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(updates.length / batchSize)}`
      );
    }

    // Verify the updates
    console.log("\nVerifying database updates:");
    for (const { postId, views } of updates) {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { id: true, viewCount: true }
      });
      console.log(
        `Post ${postId}: Expected views=${views}, Actual views=${post?.viewCount}`
      );
    }

    console.log(
      `\nSuccessfully synced view counts for ${updates.length} posts`
    );
  } catch (error) {
    console.error("Error syncing view counts:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  syncViewCounts()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}