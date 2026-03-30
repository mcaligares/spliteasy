import Link from 'next/link';
import { signOut } from '@/actions/auth.actions';
import { appConfig } from '@/config/app.config';
import type { User } from '@/entities/user.entity';

interface NavbarProps {
  user: User;
}

export function Navbar({ user }: NavbarProps) {
  return (
    <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto flex items-center justify-between h-16">
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
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-gray-600">{user.name}</span>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              Salir
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
