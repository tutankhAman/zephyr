"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import Linkify from "@/helpers/global/Linkify";
import { formatNumber } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import FollowButton from "@zephyr-ui/Layouts/FollowButton";
import UserAvatar from "@zephyr-ui/Layouts/UserAvatar";
import type { UserData } from "@zephyr/db";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheckIcon, MessageSquare, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface SuggestedUsersProps {
  userId?: string;
}

interface EnhancedUserData extends UserData {
  mutualFollowers?: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  }[];
}

const MutualFollowers = ({
  followers
}: {
  followers: NonNullable<EnhancedUserData["mutualFollowers"]>;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  if (followers.length === 0) return null;

  const displayCount = 3;
  const remainingCount = Math.max(0, followers.length - displayCount);
  const displayedFollowers = followers.slice(0, displayCount);

  return (
    <div
      className="mt-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-2">
        <div className="-space-x-2 flex">
          {displayedFollowers.map((follower) => (
            <TooltipProvider key={follower.username}>
              <Tooltip>
                <TooltipTrigger>
                  <Link href={`/users/${follower.username}`}>
                    <UserAvatar
                      avatarUrl={follower.avatarUrl}
                      size={24}
                      className="ring-2 ring-background transition-all duration-300 hover:ring-primary"
                    />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{follower.displayName}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
        <motion.p
          initial={false}
          animate={{ opacity: isHovered ? 1 : 0.7 }}
          // @ts-expect-error
          className="text-muted-foreground text-xs"
        >
          Followed by{" "}
          {displayedFollowers.map((follower, index) => (
            <span key={follower.username}>
              <Link
                href={`/users/${follower.username}`}
                className="font-medium text-foreground hover:underline"
              >
                {follower.displayName}
              </Link>
              {index < displayedFollowers.length - 1 && ", "}
            </span>
          ))}
          {remainingCount > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <span className="ml-1 font-medium text-foreground">
                    and {remainingCount} more
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {followers
                      .slice(displayCount)
                      .map((f) => f.displayName)
                      .join(", ")}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </motion.p>
      </div>
    </div>
  );
};

const UserCard = ({
  user,
  index
}: { user: EnhancedUserData; index: number }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: index * 0.1,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      whileHover={{ y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card className="group relative h-full overflow-hidden bg-gradient-to-br from-background to-muted/50">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#000,transparent_70%)]" />
        </div>

        <div className="relative p-6">
          {/* User Info Section */}
          <div className="flex items-center justify-between">
            <motion.div
              initial={false}
              animate={{ scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <Link href={`/users/${user.username}`}>
                <UserAvatar
                  avatarUrl={user.avatarUrl}
                  size={80}
                  className="ring-4 ring-background transition-all duration-300 hover:ring-primary"
                />
              </Link>
            </motion.div>
            <div className="flex flex-col items-end space-y-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex cursor-help items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span className="font-medium text-sm">
                        {formatNumber(user._count.followers)}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{formatNumber(user._count.followers)} followers</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex cursor-help items-center gap-2 text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                      <span className="font-medium text-sm">
                        {formatNumber(user._count.posts)}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{formatNumber(user._count.posts)} posts</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* User Details */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Link
                    href={`/users/${user.username}`}
                    className="font-bold text-lg hover:underline"
                  >
                    {user.displayName}
                  </Link>
                  <BadgeCheckIcon className="h-4 w-4 text-primary" />
                </div>
                <div className="text-muted-foreground text-sm">
                  @{user.username}
                </div>
              </div>
            </div>

            <AnimatePresence>
              {user.bio && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  // @ts-expect-error
                  className="overflow-hidden"
                >
                  <Linkify>
                    <p className="line-clamp-2 text-muted-foreground text-sm">
                      {user.bio}
                    </p>
                  </Linkify>
                </motion.div>
              )}
            </AnimatePresence>

            {user.mutualFollowers && (
              <MutualFollowers followers={user.mutualFollowers} />
            )}
          </div>

          {/* Action Buttons */}
          <motion.div
            // @ts-expect-error
            className="mt-4"
            initial={false}
            animate={{
              y: isHovered ? 0 : 5,
              opacity: isHovered ? 1 : 0.9
            }}
            transition={{ duration: 0.2 }}
          >
            <FollowButton
              userId={user.id}
              initialState={{
                followers: user._count.followers,
                isFollowedByUser: false
              }}
              className="w-full bg-primary/90 hover:bg-primary"
            />
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <div className="-right-4 -top-4 absolute h-20 w-20 rotate-45 bg-gradient-to-br from-primary/20 to-transparent blur-2xl" />
        <div className="-bottom-8 -left-8 absolute h-32 w-32 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-3xl" />
      </Card>
    </motion.div>
  );
};

const SuggestedUsers: React.FC<SuggestedUsersProps> = ({ userId }) => {
  const { data: users, isLoading } = useQuery<EnhancedUserData[]>({
    queryKey: ["suggested-users", userId],
    queryFn: async () => {
      const response = await fetch("/api/users/suggested");
      return response.json();
    },
    enabled: !!userId
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex justify-between">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-20 w-full" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      // @ts-expect-error
      className="space-y-6"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-yellow-500" />
        <h2 className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text font-bold text-2xl text-transparent">
          Suggested for you
        </h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {users?.map((user, index) => (
          <UserCard key={user.id} user={user} index={index} />
        ))}
      </div>
    </motion.div>
  );
};

export default SuggestedUsers;
