import Link from 'next/link';
import { LogOut, User } from 'lucide-react';
import { signOut } from '@/actions/auth.actions';
import { appConfig } from '@/config/app.config';
import type { User as UserEntity } from '@/entities/user.entity';

interface NavbarProps {
  user: UserEntity;
}

export function Navbar({ user }: NavbarProps) {
  return (
    <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto flex items-center justify-between h-14 sm:h-16">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
            {appConfig.name}
          </Link>
          <div className="hidden sm:flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
            <Link href="/groups" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Grupos
            </Link>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>{user.name}</span>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium min-h-[44px]"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
