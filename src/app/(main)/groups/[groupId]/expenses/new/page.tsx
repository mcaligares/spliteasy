import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAuthService } from '@/services/auth.service';
import { createGroupService } from '@/services/group.service';
import { Card } from '@/components/ui/Card';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';

interface PageProps {
  params: Promise<{ groupId: string }>;
}

export default async function NewExpensePage({ params }: PageProps) {
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

  const members = await groupService.getMembers(groupId);
  const memberUsers = members.map((m) => m.user);

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <a href={`/groups/${groupId}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" />
          Volver al grupo
        </a>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Nuevo gasto</h1>
        <p className="text-gray-500">{group.name}</p>
      </div>
      <Card>
        <ExpenseForm groupId={groupId} members={memberUsers} currentUserId={user.id} />
      </Card>
    </div>
  );
}
