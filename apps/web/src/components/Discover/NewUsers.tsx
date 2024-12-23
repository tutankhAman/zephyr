"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import FollowButton from "@zephyr-ui/Layouts/FollowButton";
import UserAvatar from "@zephyr-ui/Layouts/UserAvatar";
import type { UserData } from "@zephyr/db";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { BadgeCheckIcon, Users } from "lucide-react";
import Link from "next/link";

interface NewUsersProps {
  userId?: string;
}

// biome-ignore lint/correctness/noUnusedVariables: template variable
const NewUsers: React.FC<NewUsersProps> = ({ userId }) => {
  const { data: users, isLoading } = useQuery<UserData[]>({
    queryKey: ["new-users"],
    queryFn: async () => {
      const response = await fetch("/api/users/new");
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[100px] w-full rounded-lg bg-muted" />
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
      className="mr-0 space-y-6 md:mr-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-2xl">New Users</h2>
        <p className="text-muted-foreground text-sm">
          Welcome our newest members
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {users?.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="flex items-center gap-4 p-4 hover:bg-muted/50">
              <UserAvatar
                avatarUrl={user.avatarUrl}
                size={56}
                className="flex-shrink-0"
              />
              <div className="min-w-0 flex-grow">
                <div className="flex items-center gap-1">
                  <Link
                    href={`/users/${user.username}`}
                    className="truncate font-semibold hover:underline"
                  >
                    {user.displayName}
                  </Link>
                  <BadgeCheckIcon className="h-4 w-4 flex-shrink-0" />
                </div>
                <div className="truncate text-muted-foreground text-sm">
                  @{user.username}
                </div>
                <div className="mt-1 flex items-center gap-2 text-muted-foreground text-xs">
                  <Users className="h-3 w-3" />
                  <span>{formatNumber(user._count.followers)} followers</span>
                  <span>•</span>
                  <span>
                    Joined {formatDistanceToNow(new Date(user.createdAt))} ago
                  </span>
                </div>
              </div>
              <FollowButton
                userId={user.id}
                initialState={{
                  followers: user._count.followers,
                  isFollowedByUser: false
                }}
                // @ts-expect-error
                size="sm"
              />
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default NewUsers;
