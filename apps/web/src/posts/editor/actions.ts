"use server";

import { createPostSchema, validateRequest } from "@zephyr/auth/src";
import {
  getPostDataInclude,
  postViewsCache,
  prisma,
  tagCache
} from "@zephyr/db";

const AURA_REWARDS = {
  BASE_POST: 10,
  ATTACHMENTS: {
    IMAGE: {
      BASE: 20,
      PER_ITEM: 5,
      MAX_BONUS: 25 // Max bonus for multiple images (5 images)
    },
    VIDEO: {
      BASE: 40,
      PER_ITEM: 10,
      MAX_BONUS: 20 // Max bonus for multiple videos
    },
    AUDIO: {
      BASE: 25,
      PER_ITEM: 8,
      MAX_BONUS: 16 // Max bonus for multiple audio files
    },
    CODE: {
      BASE: 15,
      PER_ITEM: 15,
      MAX_BONUS: 45 // Max bonus for multiple code files
    }
  },
  MAX_TOTAL: 150 // Reasonable max total per post
};

type AttachmentType = "IMAGE" | "VIDEO" | "AUDIO" | "CODE";

async function calculateAuraReward(mediaIds: string[]) {
  if (!mediaIds.length) return AURA_REWARDS.BASE_POST;

  const mediaItems = await prisma.media.findMany({
    where: { id: { in: mediaIds } },
    select: { id: true, type: true }
  });

  let totalAura = AURA_REWARDS.BASE_POST;
  const typeCount: Record<AttachmentType, number> = {
    IMAGE: 0,
    VIDEO: 0,
    AUDIO: 0,
    CODE: 0
  };

  // biome-ignore lint/complexity/noForEach: This is a simple loop
  mediaItems.forEach((item) => {
    const type = item.type as AttachmentType;
    if (type in typeCount) {
      typeCount[type]++;
    }
  });

  // biome-ignore lint/complexity/noForEach: This is a simple loop
  Object.entries(typeCount).forEach(([type, count]) => {
    if (count > 0) {
      const config = AURA_REWARDS.ATTACHMENTS[type as AttachmentType];
      const baseReward = config.BASE;
      const bonusReward = Math.min(count * config.PER_ITEM, config.MAX_BONUS);
      totalAura += baseReward + bonusReward;
    }
  });

  return Math.min(totalAura, AURA_REWARDS.MAX_TOTAL);
}

export async function submitPost(input: {
  content: string;
  mediaIds: string[];
  tags: string[];
}) {
  const { user } = await validateRequest();
  if (!user) throw Error("Unauthorized");

  const { content, mediaIds, tags } = createPostSchema.parse(input);
  const auraReward = await calculateAuraReward(mediaIds);

  const newPost = await prisma.$transaction(async (tx) => {
    const post = await tx.post.create({
      data: {
        content,
        userId: user.id,
        aura: 0,
        attachments: {
          connect: mediaIds.map((id) => ({ id }))
        },
        tags: {
          connectOrCreate: tags.map((tagName) => ({
            where: { name: tagName.toLowerCase() },
            create: { name: tagName.toLowerCase() }
          }))
        }
      },
      include: {
        ...getPostDataInclude(user.id),
        tags: true
      }
    });

    if (tags.length > 0) {
      await Promise.all(
        tags.map((tagName) => tagCache.incrementTagCount(tagName.toLowerCase()))
      );
    }

    await tx.user.update({
      where: { id: user.id },
      data: { aura: { increment: auraReward } }
    });

    await tx.auraLog.create({
      data: {
        userId: user.id,
        issuerId: user.id,
        amount: AURA_REWARDS.BASE_POST,
        type: "POST_CREATION",
        postId: post.id
      }
    });

    if (auraReward > AURA_REWARDS.BASE_POST) {
      await tx.auraLog.create({
        data: {
          userId: user.id,
          issuerId: user.id,
          amount: auraReward - AURA_REWARDS.BASE_POST,
          type: "POST_ATTACHMENT_BONUS",
          postId: post.id
        }
      });
    }

    return post;
  });

  return newPost;
}

export async function incrementPostView(postId: string) {
  return await postViewsCache.incrementView(postId);
}

export async function getPostViews(postId: string) {
  return await postViewsCache.getViews(postId);
}

export async function updatePostTags(postId: string, tags: string[]) {
  const { user } = await validateRequest();
  if (!user) throw Error("Unauthorized");

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { tags: true }
  });

  if (!post) throw Error("Post not found");
  if (post.userId !== user.id) throw Error("Unauthorized");

  const oldTags = post.tags.map((t) => t.name);
  const tagsToAdd = tags.filter((t) => !oldTags.includes(t));
  const tagsToRemove = oldTags.filter((t) => !tags.includes(t));

  return await prisma.$transaction(async (tx) => {
    const updatedPost = await tx.post.update({
      where: { id: postId },
      data: {
        tags: {
          connectOrCreate: tagsToAdd.map((tagName) => ({
            where: { name: tagName },
            create: { name: tagName }
          })),
          disconnect: tagsToRemove.map((tagName) => ({ name: tagName }))
        }
      },
      include: getPostDataInclude(user.id)
    });

    await Promise.all([
      ...tagsToAdd.map((tagName) => tagCache.incrementTagCount(tagName)),
      ...tagsToRemove.map((tagName) => tagCache.decrementTagCount(tagName))
    ]);

    return updatedPost;
  });
}
