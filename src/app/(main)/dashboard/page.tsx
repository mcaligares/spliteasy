import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createGroupService } from '@/services/group.service';
import { createAuthService } from '@/services/auth.service';
import { createBalanceService } from '@/services/balance.service';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/utils/currency';

export default async function DashboardPage() {
  const db = await createClient();
  const authService = createAuthService(db);
  const user = await authService.getCurrentUser();
  if (!user) return null;

  const groupService = createGroupService(db);
  const balanceService = createBalanceService(db);
  const groups = await groupService.getGroupsForUser(user.id);

  const groupsWithBalance = await Promise.all(
    groups.map(async (group) => {
      const balance = await balanceService.getUserBalance(group.id, user.id);
      return { group, balance };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hola, {user.name}</h1>
          <p className="text-gray-500 mt-1">Acá están tus grupos activos</p>
        </div>
        <Link href="/groups/new">
          <Button>Nuevo grupo</Button>
        </Link>
      </div>

      {groupsWithBalance.length === 0 ? (
        <EmptyState
          title="No tenés grupos aún"
          description="Creá un grupo para empezar a dividir gastos con tus amigos."
          action={
            <Link href="/groups/new">
              <Button>Crear primer grupo</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groupsWithBalance.map(({ group, balance }) => (
            <Link key={group.id} href={`/groups/${group.id}`}>
              <Card className="hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer h-full">
                <h3 className="font-semibold text-gray-900 mb-1">{group.name}</h3>
                {group.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{group.description}</p>
                )}
                <div className={`text-sm font-medium mt-auto ${
                  balance.netAmount > 0 ? 'text-green-600' :
                  balance.netAmount < 0 ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {balance.netAmount > 0
                    ? `Te deben ${formatCurrency(balance.netAmount)}`
                    : balance.netAmount < 0
                    ? `Debés ${formatCurrency(Math.abs(balance.netAmount))}`
                    : 'Estás al día'}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
