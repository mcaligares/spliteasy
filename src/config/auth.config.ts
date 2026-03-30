export const authConfig = {
  redirects: {
    afterLogin: '/dashboard',
    afterLogout: '/login',
    afterSignup: '/dashboard',
    unauthenticated: '/login',
  },
  session: {
    cookieName: 'sb-session',
  },
} as const;
