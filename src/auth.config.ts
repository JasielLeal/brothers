import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const pathname = nextUrl.pathname

      const isLoginPage = pathname === '/admin/login'
      const isAdminRoute = pathname.startsWith('/admin')

      if (isLoginPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL('/admin/dashboard', nextUrl))
        }
        return true
      }

      if (isAdminRoute) {
        return isLoggedIn
      }

      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? ''
        token.role = (user as { id?: string; role?: string }).role ?? 'VIEWER'
      }
      return token
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  providers: [],
}
