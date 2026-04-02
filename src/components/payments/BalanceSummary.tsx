import { ArrowDownCircle, ArrowUpCircle, Banknote } from 'lucide-react';
import type { UserBalanceSummary } from '@/services/types';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/currency';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface BalanceSummaryProps {
  summary: UserBalanceSummary;
  groupId: string;
}

export function BalanceSummary({ summary, groupId }: BalanceSummaryProps) {
  const { owes, isOwed, netAmount } = summary;

  return (
    <Card>
      <h3 className="font-semibold text-gray-900 mb-4">Tu balance</h3>
      {owes.length === 0 && isOwed.length === 0 ? (
        <p className="text-sm text-gray-500">Estás al día. No tenés deudas.</p>
      ) : (
        <div className="space-y-4">
          {owes.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <ArrowDownCircle className="h-4 w-4 text-red-500" />
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Debés</p>
              </div>
              <div className="space-y-2">
                {owes.map(({ user, amount }) => (
                  <div key={user.id} className="flex items-center justify-between min-h-[40px]">
                    <span className="text-sm text-gray-700">{user.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-red-600">{formatCurrency(amount)}</span>
                      <Link href={`/groups/${groupId}/payments/new?to=${user.id}&amount=${amount}`}>
                        <Button variant="ghost" size="sm">
                          <Banknote className="h-4 w-4 mr-1" />
                          Pagar
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {isOwed.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <ArrowUpCircle className="h-4 w-4 text-green-500" />
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Te deben</p>
              </div>
              <div className="space-y-2">
                {isOwed.map(({ user, amount }) => (
                  <div key={user.id} className="flex items-center justify-between min-h-[40px]">
                    <span className="text-sm text-gray-700">{user.name}</span>
                    <span className="text-sm font-medium text-green-600">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="border-t pt-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">Balance neto</span>
              <span className={`text-sm font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netAmount >= 0 ? '+' : ''}{formatCurrency(netAmount)}
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
