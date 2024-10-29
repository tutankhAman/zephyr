import streamServerClient from "@/lib/stream";
import { slugify } from "@/lib/utils";
import { discord, lucia } from "@zephyr/auth/auth";
import { prisma } from "@zephyr/db";
import { OAuth2RequestError } from "arctic";
import { generateIdFromEntropySize } from "lucia";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");
    const storedState = (await cookies()).get("state")?.value;

    if (!code || !state || !storedState || state !== storedState) {
      return new Response(null, { status: 400 });
    }

    try {
      const tokens = await discord.validateAuthorizationCode(code);
      // @ts-ignore
      const accessToken = tokens.data?.access_token;

      if (!accessToken) {
        console.error("No access token found in response:", tokens);
        throw new Error("No access token received from Discord");
      }

      console.log("Discord access token:", accessToken);

      const discordUserResponse = await fetch(
        "https://discord.com/api/v10/users/@me",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      const responseText = await discordUserResponse.text();
      if (!discordUserResponse.ok) {
        throw new Error(`Failed to fetch Discord user: ${responseText}`);
      }

      const discordUser = JSON.parse(responseText);
      if (!discordUser.email) {
        throw new Error("No email provided by Discord");
      }

      const existingUserWithEmail = await prisma.user.findUnique({
        where: {
          email: discordUser.email
        }
      });

      if (existingUserWithEmail && !existingUserWithEmail.discordId) {
        const searchParams = new URLSearchParams({
          error: "email_exists",
          email: discordUser.email
        });

        return new Response(null, {
          status: 302,
          headers: {
            Location: `/login?${searchParams.toString()}`
          }
        });
      }

      // Check for existing Discord user
      const existingDiscordUser = await prisma.user.findUnique({
        where: {
          discordId: discordUser.id
        }
      });

      if (existingDiscordUser) {
        const session = await lucia.createSession(existingDiscordUser.id, {});
        const sessionCookie = lucia.createSessionCookie(session.id);
        (await cookies()).set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes
        );
        return new Response(null, {
          status: 302,
          headers: {
            Location: "/"
          }
        });
      }

      // Create new user
      const userId = generateIdFromEntropySize(10);
      const username = `${slugify(discordUser.username)}-${userId.slice(0, 4)}`;

      try {
        await prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              id: userId,
              username,
              displayName: discordUser.global_name || discordUser.username,
              discordId: discordUser.id,
              email: discordUser.email,
              avatarUrl: discordUser.avatar
                ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
                : null,
              emailVerified: true
            }
          });

          await streamServerClient.upsertUser({
            id: newUser.id,
            username: newUser.username,
            name: newUser.displayName
          });
        });

        const session = await lucia.createSession(userId, {});
        const sessionCookie = lucia.createSessionCookie(session.id);
        (await cookies()).set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes
        );

        return new Response(null, {
          status: 302,
          headers: {
            Location: "/"
          }
        });
      } catch (error) {
        console.error("Transaction error:", error);
        throw error;
      }
    } catch (error) {
      console.error("Discord API error:", error);
      throw error;
    }
  } catch (error) {
    console.error("Final error catch:", error);
    if (error instanceof OAuth2RequestError) {
      return new Response(null, { status: 400 });
    }
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
}