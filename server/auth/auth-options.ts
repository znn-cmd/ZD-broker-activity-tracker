import type { NextAuthOptions, User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { getUserByUsernameOrEmail } from "@/server/services/user-service";
import { UserRole } from "@/types/domain";

type AuthUser = NextAuthUser & {
  id: string;
  role: UserRole;
  teamId: string | null;
};

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        const user = await getUserByUsernameOrEmail(credentials.identifier);
        if (!user || !user.isActive) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash,
        );
        if (!isValid) {
          return null;
        }

        const authUser: AuthUser = {
          id: user.userId,
          name: user.fullName,
          email: user.email,
          role: user.role,
          teamId: user.teamId,
        };

        return authUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const typedUser = user as AuthUser;
        token.role = typedUser.role ?? UserRole.Manager;
        token.teamId = typedUser.teamId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as AuthUser).id = token.sub ?? "";
        (session.user as AuthUser).role = (token.role as UserRole) ?? UserRole.Manager;
        (session.user as AuthUser).teamId =
          (token.teamId as string | null | undefined) ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

