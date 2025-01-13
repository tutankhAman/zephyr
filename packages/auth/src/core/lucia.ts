import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { prisma } from "@zephyr/db";
import { Lucia, type Session, type User } from "lucia";
import { cookies } from "next/headers";
import { cache } from "react";

const adapter = new PrismaAdapter(prisma.session, prisma.user);

interface DatabaseUserAttributes {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  googleId: string | null;
  emailVerified: boolean;
}

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: process.env.NODE_ENV === "production",
    attributes: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      domain: process.env.COOKIE_DOMAIN || undefined
    }
  },
  getUserAttributes: (attributes) => ({
    id: attributes.id,
    username: attributes.username,
    displayName: attributes.displayName,
    avatarUrl: attributes.avatarUrl,
    googleId: attributes.googleId,
    emailVerified: attributes.emailVerified
  })
});

interface SessionAttributes {
  username: string;
  email: string;
}

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
    DatabaseSessionAttributes: SessionAttributes;
  }
}

export const validateRequest = cache(
  async (): Promise<
    { user: User; session: Session } | { user: null; session: null }
  > => {
    const sessionId =
      (await cookies()).get(lucia.sessionCookieName)?.value ?? null;

    if (!sessionId) {
      return {
        user: null,
        session: null
      };
    }

    const result = await lucia.validateSession(sessionId);

    try {
      if (result.session?.fresh) {
        const sessionCookie = lucia.createSessionCookie(result.session.id);
        (await cookies()).set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes
        );
      }
      if (!result.session) {
        const sessionCookie = lucia.createBlankSessionCookie();
        (await cookies()).set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes
        );
      }
    } catch (error) {
      console.error("Session cookie handling error:", error);
    }

    return result;
  }
);

export const createSessionCookie = async (sessionId: string) => {
  const sessionCookie = lucia.createSessionCookie(sessionId);
  (await cookies()).set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );
};

export const clearSessionCookie = async () => {
  const sessionCookie = lucia.createBlankSessionCookie();
  (await cookies()).set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );
};
