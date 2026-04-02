import { Receipt, Pencil, Trash2, CircleCheck, UserPlus, UserMinus, MailPlus, type LucideIcon } from 'lucide-react';
import type { ActivityLogWithUser } from '@/services/activity-log.service';
import { formatRelativeDate } from '@/lib/utils/date';

interface ActivityFeedProps {
  activities: ActivityLogWithUser[];
}

const actionLabels: Record<string, string> = {
  expense_created: 'registró un gasto',
  expense_updated: 'actualizó un gasto',
  expense_deleted: 'eliminó un gasto',
  payment_created: 'registró un pago',
  member_joined: 'se unió al grupo',
  member_invited: 'invitó a un nuevo usuario',
  member_left: 'dejó el grupo',
};

const actionIcons: Record<string, LucideIcon> = {
  expense_created: Receipt,
  expense_updated: Pencil,
  expense_deleted: Trash2,
  payment_created: CircleCheck,
  member_joined: UserPlus,
  member_invited: MailPlus,
  member_left: UserMinus,
};

const actionColors: Record<string, string> = {
  expense_created: 'text-indigo-600 bg-indigo-50',
  expense_updated: 'text-amber-600 bg-amber-50',
  expense_deleted: 'text-red-600 bg-red-50',
  payment_created: 'text-green-600 bg-green-50',
  member_joined: 'text-blue-600 bg-blue-50',
  member_invited: 'text-purple-600 bg-purple-50',
  member_left: 'text-gray-600 bg-gray-100',
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No hay actividad reciente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((activity) => {
        const label = actionLabels[activity.action] ?? activity.action;
        const Icon = actionIcons[activity.action];
        const colorClass = actionColors[activity.action] ?? 'text-gray-600 bg-gray-100';
        const meta = activity.metadata as Record<string, unknown> | null;

        return (
          <div key={activity.id} className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
              {Icon ? <Icon className="h-4 w-4" /> : <span className="text-xs">•</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">
                <span className="font-medium">{activity.user?.name ?? 'Alguien'}</span>
                {' '}{label}
                {meta?.description != null && (
                  <span className="text-gray-600"> — &ldquo;{String(meta.description)}&rdquo;</span>
                )}
                {meta?.amount != null && (
                  <span className="text-gray-600"> por ${Number(meta.amount).toFixed(2)}</span>
                )}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{formatRelativeDate(activity.created_at)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
