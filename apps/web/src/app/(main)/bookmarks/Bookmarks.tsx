"use client";

import kyInstance from "@/lib/ky";
import { useInfiniteQuery } from "@tanstack/react-query";
import Post from "@zephyr-ui/Home/feedview/postCard";
import InfiniteScrollContainer from "@zephyr-ui/Layouts/InfiniteScrollContainer";
import LoadMoreSkeleton from "@zephyr-ui/Layouts/skeletons/LoadMoreSkeleton";
import PostsOnlyLoadingSkeleton from "@zephyr-ui/Layouts/skeletons/PostOnlyLoadingSkeleton";
import type { PostsPage } from "@zephyr/db";

export default function Bookmarks() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status
  } = useInfiniteQuery({
    queryKey: ["post-feed", "bookmarks"],
    queryFn: ({ pageParam }) =>
      kyInstance
        .get(
          "/api/posts/bookmarked",
          pageParam ? { searchParams: { cursor: pageParam } } : {}
        )
        .json<PostsPage>(),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor
  });

  const posts = data?.pages.flatMap((page) => page.posts) || [];

  if (status === "pending") {
    return <PostsOnlyLoadingSkeleton />;
  }

  if (status === "success" && !posts.length && !hasNextPage) {
    return (
      <p className="text-center text-muted-foreground">
        You don&apos;t have any bookmarks yet.
      </p>
    );
  }

  if (status === "error") {
    return (
      <p className="text-center text-destructive">
        An error occurred while loading bookmarks.
      </p>
    );
  }

  return (
    <InfiniteScrollContainer
      className="space-y-5"
      onBottomReached={() => hasNextPage && !isFetching && fetchNextPage()}
    >
      {posts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
      {isFetchingNextPage && <LoadMoreSkeleton />}
    </InfiniteScrollContainer>
  );
}
