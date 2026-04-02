import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAuthService } from '@/services/auth.service';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { authConfig } from '@/config/auth.config';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const db = await createClient();
  const authService = createAuthService(db);
  const user = await authService.getCurrentUser();

  if (!user) {
    redirect(authConfig.redirects.unauthenticated);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 sm:pb-8">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
