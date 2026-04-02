import Link from 'next/link';
import { Plus, TrendingUp, TrendingDown, CheckCircle, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createGroupService } from '@/services/group.service';
import { createAuthService } from '@/services/auth.service';
import { createBalanceService } from '@/services/balance.service';
import { createGroupMemberRepository } from '@/repositories/group-member.repository';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/utils/currency';

export default async function GroupsPage() {
  const db = await createClient();
  const authService = createAuthService(db);
  const user = await authService.getCurrentUser();
  if (!user) return null;

  const groupService = createGroupService(db);
  const balanceService = createBalanceService(db);
  const memberRepo = createGroupMemberRepository(db);
  const groups = await groupService.getGroupsForUser(user.id);

  const groupsData = await Promise.all(
    groups.map(async (group) => {
      const [members, balance] = await Promise.all([
        memberRepo.findByGroupId(group.id),
        balanceService.getUserBalance(group.id, user.id),
      ]);
      return { group, memberCount: members.length, balance };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mis Grupos</h1>
        <Link href="/groups/new">
          <Button>
            <Plus className="h-4 w-4 mr-1.5" />
            Nuevo grupo
          </Button>
        </Link>
      </div>

      {groupsData.length === 0 ? (
        <EmptyState
          title="No tenés grupos"
          description="Creá un grupo para empezar a dividir gastos."
          action={
            <Link href="/groups/new">
              <Button>Crear grupo</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groupsData.map(({ group, memberCount, balance }) => (
            <Link key={group.id} href={`/groups/${group.id}`}>
              <Card className="hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{group.name}</h3>
                    {group.description && (
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{group.description}</p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                      <Users className="h-3.5 w-3.5" />
                      {memberCount} miembro{memberCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ml-4 shrink-0 ${
                    balance.netAmount > 0 ? 'text-green-600' :
                    balance.netAmount < 0 ? 'text-red-600' : 'text-gray-400'
                  }`}>
                    {balance.netAmount > 0 ? (
                      <><TrendingUp className="h-4 w-4" />+{formatCurrency(balance.netAmount)}</>
                    ) : balance.netAmount < 0 ? (
                      <><TrendingDown className="h-4 w-4" />-{formatCurrency(Math.abs(balance.netAmount))}</>
                    ) : (
                      <><CheckCircle className="h-4 w-4" />Al día</>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
