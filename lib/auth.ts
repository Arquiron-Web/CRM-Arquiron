import { getServerSession } from "next-auth";
import type { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getRole } from "@/lib/roles";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive.readonly",
            "https://www.googleapis.com/auth/gmail.send",
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/calendar.events",
          ].join(" "),
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const allowedDomain = process.env.ALLOWED_DOMAIN!;
      const email = (profile as { email?: string })?.email || "";
      if (!email.endsWith("@" + allowedDomain)) {
        return false;
      }
      return true;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.accessToken = token.accessToken as string;
        session.user.role = token.role;
      }
      return session;
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.role = getRole(token.email);
        return token;
      }

      const expiresAt = token.expiresAt as number;
      const nowSec = Math.floor(Date.now() / 1000);
      if (expiresAt && nowSec < expiresAt) {
        return token;
      }

      const refreshToken = token.refreshToken as string;
      if (!refreshToken) return token;

      try {
        const res = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            grant_type: "refresh_token",
            refresh_token: refreshToken,
          }),
        });

        const data = (await res.json()) as {
          access_token?: string;
          expires_in?: number;
        };
        if (data.access_token) {
          token.accessToken = data.access_token;
          token.expiresAt = Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600);
        }
      } catch {
        /* si falla el refresh, devolver token existente; el API fallará con 401 */
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
};

export async function getSession() {
  return await getServerSession(authOptions);
}
