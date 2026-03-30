import type { GroupBalanceWithUsers } from '@/services/types';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/currency';

interface BalanceListProps {
  balances: GroupBalanceWithUsers[];
}

export function BalanceList({ balances }: BalanceListProps) {
  const nonZero = balances.filter((b) => b.balance.amount > 0);

  if (nonZero.length === 0) {
    return (
      <Card>
        <p className="text-sm text-gray-500 text-center py-4">
          Todos están al día. No hay deudas pendientes.
        </p>
      </Card>
    );
  }

  return (
    <Card padding={false}>
      <div className="divide-y divide-gray-100">
        {nonZero.map(({ balance, fromUser, toUser }) => (
          <div key={balance.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-gray-900">{fromUser?.name}</span>
              <span className="text-gray-400">le debe a</span>
              <span className="font-medium text-gray-900">{toUser?.name}</span>
            </div>
            <span className="text-sm font-semibold text-red-600 ml-4">
              {formatCurrency(balance.amount)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
