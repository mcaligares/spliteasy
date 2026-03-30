import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAuthService } from '@/services/auth.service';
import { createGroupService } from '@/services/group.service';
import { createExpenseService } from '@/services/expense.service';
import { createBalanceService } from '@/services/balance.service';
import { Button } from '@/components/ui/Button';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import { BalanceSummary } from '@/components/payments/BalanceSummary';
import { BalanceList } from '@/components/payments/BalanceList';
import { AddMemberForm } from '@/components/groups/AddMemberForm';
import { Card } from '@/components/ui/Card';

interface GroupPageProps {
  params: Promise<{ groupId: string }>;
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { groupId } = await params;

  const db = await createClient();
  const authService = createAuthService(db);
  const user = await authService.getCurrentUser();
  if (!user) return null;

  const groupService = createGroupService(db);
  const group = await groupService.getGroupById(groupId);
  if (!group) notFound();

  const isMember = await groupService.isMember(groupId, user.id);
  if (!isMember) notFound();

  const [members, expenses, groupBalances, userBalance] = await Promise.all([
    groupService.getMembers(groupId),
    createExpenseService(db).getByGroupId(groupId),
    createBalanceService(db).getGroupBalances(groupId),
    createBalanceService(db).getUserBalance(groupId, user.id),
  ]);

  const usersMap = Object.fromEntries(members.map((m) => [m.user_id, m.user]));
  const isAdmin = members.find((m) => m.user_id === user.id)?.role === 'admin';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/groups" className="text-sm text-gray-500 hover:text-gray-700">
            ← Mis grupos
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{group.name}</h1>
          {group.description && (
            <p className="text-gray-500 mt-1">{group.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/groups/${groupId}/activity`}>
            <Button variant="secondary" size="sm">Actividad</Button>
          </Link>
          <Link href={`/groups/${groupId}/expenses/new`}>
            <Button size="sm">+ Gasto</Button>
          </Link>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: expenses */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Gastos</h2>
            <span className="text-sm text-gray-500">{expenses.length} gasto{expenses.length !== 1 ? 's' : ''}</span>
          </div>
          <ExpenseList expenses={expenses} usersMap={usersMap} groupId={groupId} />
        </div>

        {/* Right: balances + members */}
        <div className="space-y-4">
          <BalanceSummary summary={userBalance} groupId={groupId} />

          {groupBalances.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-3">Resumen del grupo</h2>
              <BalanceList balances={groupBalances} />
            </div>
          )}

          <Card>
            <h3 className="font-semibold text-gray-900 mb-3">
              Miembros <span className="text-gray-400 font-normal">({members.length})</span>
            </h3>
            <div className="space-y-2 mb-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{member.user.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    member.role === 'admin'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {member.role === 'admin' ? 'Admin' : 'Miembro'}
                  </span>
                </div>
              ))}
            </div>
            {isAdmin && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Agregar miembro</p>
                <AddMemberForm groupId={groupId} />
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
