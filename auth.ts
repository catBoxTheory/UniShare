import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { z } from "zod"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import authConfig from "./auth.config"

async function getUser(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })
    return user
  } catch (error) {
    console.error("Failed to fetch user:", error)
    throw new Error("Failed to fetch user.")
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    }
  },
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials)

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data
          const user = await getUser(email)
          if (!user || !user.password) return null
          
          const passwordsMatch = await bcrypt.compare(password, user.password)

          if (passwordsMatch) return user
        }

        console.log("Invalid credentials")
        return null
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Allow all sign-ins, the redirect will handle onboarding
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to home after sign-in, which will check onboarding
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.name = token.name;
        session.user.image = token.picture as string | null;
        (session.user as any).isOnboardingCompleted = token.isOnboardingCompleted;
      }
      return session;
    },
    async jwt({ token, trigger }) {
      // Always refresh user info from database
      if (token.sub) {
        const user = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { 
              isOnboardingCompleted: true,
              name: true,
              image: true
            }
        });
        if (user) {
            token.isOnboardingCompleted = user.isOnboardingCompleted;
            token.name = user.name;
            token.picture = user.image;
        } else {
            // New user, not yet in DB or just created
            token.isOnboardingCompleted = false;
        }
      }
      return token;
    }
  }
})

