export const authConfig = {
  redirects: {
    afterLogin: '/dashboard',
    afterLogout: '/login',
    unauthenticated: '/login',
  },
  session: {
    cookieName: 'sb-session',
  },
} as const;
