export type ActivityAction =
  | 'expense_created'
  | 'expense_updated'
  | 'expense_deleted'
  | 'payment_created'
  | 'member_joined'
  | 'member_invited'
  | 'member_left';

export interface ActivityLog {
  id: string;
  group_id: string;
  user_id: string;
  action: ActivityAction;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}
