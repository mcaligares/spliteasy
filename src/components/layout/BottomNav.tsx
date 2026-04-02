'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, LogOut } from 'lucide-react';
import { signOut } from '@/actions/auth.actions';

const tabs = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/groups', label: 'Grupos', icon: Users },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 sm:hidden z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center min-h-[48px] flex-1 py-2 text-xs font-medium transition-colors ${
                isActive ? 'text-indigo-600' : 'text-gray-500'
              }`}
            >
              <Icon className="h-5 w-5 mb-0.5" />
              {label}
            </Link>
          );
        })}
        <form action={signOut} className="flex-1">
          <button
            type="submit"
            className="flex flex-col items-center justify-center min-h-[48px] w-full py-2 text-xs font-medium text-gray-500 transition-colors"
          >
            <LogOut className="h-5 w-5 mb-0.5" />
            Salir
          </button>
        </form>
      </div>
    </nav>
  );
}
