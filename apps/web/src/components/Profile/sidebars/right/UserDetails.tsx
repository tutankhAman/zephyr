"use client";

import EditProfileButton from "@/components/Layouts/EditProfileButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import Linkify from "@/helpers/global/Linkify";
import { useToast } from "@/hooks/use-toast";
import { formatNumber } from "@/lib/utils";
import { getSecureImageUrl } from "@/utils/imageUrl";
import { useQuery } from "@tanstack/react-query";
import FollowButton from "@zephyr-ui/Layouts/FollowButton";
import FollowerCount from "@zephyr-ui/Layouts/FollowerCount";
import UserAvatar from "@zephyr-ui/Layouts/UserAvatar";
import type { UserData } from "@zephyr/db";
import { formatDate, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { BadgeCheckIcon, Flame, MoreVertical } from "lucide-react";
import type React from "react";
import { useMemo } from "react";

interface UserDetailsProps {
  userData: UserData;
  loggedInUserId: string;
}

const UserDetails: React.FC<UserDetailsProps> = ({
  userData: initialUserData,
  loggedInUserId
}) => {
  const { toast } = useToast();

  const {
    data: userData,
    error,
    isLoading
  } = useQuery({
    queryKey: ["user", initialUserData.id],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/users/${initialUserData.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }
        return await response.json();
      } catch (_err) {
        toast({
          title: "Error",
          description: "Failed to load user data. Using cached data.",
          variant: "destructive"
        });
        return initialUserData;
      }
    },
    initialData: initialUserData,
    staleTime: 1000 * 60,
    retry: 1
  });

  const avatarUrl = useMemo(() => {
    return userData?.avatarUrl ? getSecureImageUrl(userData.avatarUrl) : null;
  }, [userData?.avatarUrl]);

  if (isLoading) {
    return <UserDetailsSkeleton />;
  }

  if (error && !userData) {
    return <div>Error loading user details</div>;
  }

  const isFollowedByUser = Boolean(userData?.followers?.length);

  const followerInfo = {
    followers: userData?._count?.followers ?? 0,
    isFollowedByUser
  };

  const formatCreatedAt = (date: Date | string | undefined | null) => {
    try {
      if (!date) return "Unknown date";
      const parsedDate = typeof date === "string" ? parseISO(date) : date;
      return formatDate(parsedDate, "MMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Unknown date";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="sticky top-0 overflow-hidden bg-card text-card-foreground">
        <motion.div
          className="relative h-32"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div
            className="absolute inset-0 bg-center bg-cover"
            style={{
              backgroundImage: avatarUrl ? `url(${avatarUrl})` : "none",
              filter: "blur(8px) brightness(0.9)",
              transform: "scale(1.1)"
            }}
          />
        </motion.div>
        <CardContent className="relative p-6">
          <div className="flex flex-col">
            <motion.div
              className="-mt-20 relative mb-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <UserAvatar
                avatarUrl={avatarUrl}
                size={120}
                className="rounded-full ring-4 ring-background"
              />
            </motion.div>
            <motion.div
              className="w-full space-y-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div className="flex items-center justify-between">
                <h1 className="font-bold text-3xl">{userData.displayName}</h1>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center font-semibold text-foreground text-lg">
                        <Flame className="mr-1 h-6 w-6 text-orange-500" />0
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Aura</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center text-muted-foreground">
                @{userData.username}
                <BadgeCheckIcon className="ml-1 h-4 w-4" />
              </div>
              <div className="text-muted-foreground">
                Member since{" "}
                {userData?.createdAt
                  ? formatCreatedAt(userData.createdAt)
                  : "Unknown date"}
              </div>
              <div className="flex items-center gap-3">
                <span>
                  Posts:{" "}
                  <span className="font-semibold">
                    {formatNumber(userData?._count?.posts ?? 0)}
                  </span>
                </span>
                <FollowerCount
                  userId={userData?.id ?? ""}
                  initialState={followerInfo}
                />
              </div>
              <div className="flex items-center gap-2">
                {userData.id === loggedInUserId ? (
                  <EditProfileButton user={userData} />
                ) : (
                  <FollowButton
                    userId={userData.id}
                    initialState={followerInfo}
                  />
                )}
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </div>
          {userData.bio && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <hr className="my-4" />
              <Linkify>
                <div className="overflow-hidden whitespace-pre-line break-words">
                  {userData.bio}
                </div>
              </Linkify>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default UserDetails;

const UserDetailsSkeleton = () => (
  <Card className="sticky top-0 overflow-hidden bg-card text-card-foreground">
    <div className="relative h-32">
      <Skeleton className="h-full w-full" />
    </div>
    <CardContent className="relative p-6">
      <div className="flex flex-col">
        <div className="-mt-20 relative mb-4">
          <Skeleton className="size-[120px] rounded-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);
