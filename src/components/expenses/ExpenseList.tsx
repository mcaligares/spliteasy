import { Receipt } from 'lucide-react';
import type { Expense } from '@/entities/expense.entity';
import type { User } from '@/entities/user.entity';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface ExpenseListProps {
  expenses: Expense[];
  usersMap: Record<string, User>;
  groupId: string;
}

export function ExpenseList({ expenses, usersMap, groupId }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Sin gastos aún"
        description="Registrá el primer gasto del grupo."
        action={
          <Link href={`/groups/${groupId}/expenses/new`}>
            <Button size="sm">Agregar gasto</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => {
        const payer = usersMap[expense.paid_by];
        return (
          <Card key={expense.id} padding={false}>
            <div className="flex items-center gap-3 px-4 py-3 min-h-[56px]">
              <div className="shrink-0 w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center">
                <Receipt className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 truncate">{expense.description}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Pagó {payer?.name ?? 'Desconocido'} · {formatDate(expense.created_at)}
                </p>
              </div>
              <div className="ml-2 shrink-0 text-right">
                <p className="font-semibold text-gray-900">{formatCurrency(expense.amount, expense.currency)}</p>
                <p className="text-xs text-gray-400 capitalize">{expense.split_type === 'equal' ? 'División igual' : expense.split_type}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
