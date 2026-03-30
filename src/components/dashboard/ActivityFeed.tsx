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
  member_left: 'dejó el grupo',
};

const actionIcons: Record<string, string> = {
  expense_created: '💸',
  expense_updated: '✏️',
  expense_deleted: '🗑️',
  payment_created: '✅',
  member_joined: '👋',
  member_left: '👤',
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
        const icon = actionIcons[activity.action] ?? '•';
        const meta = activity.metadata as Record<string, unknown> | null;

        return (
          <div key={activity.id} className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
            <div className="shrink-0 text-lg w-8 text-center">{icon}</div>
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
