export type SplitType = 'equal';

export interface Expense {
  id: string;
  group_id: string;
  description: string;
  amount: number;
  currency: string;
  paid_by: string;
  split_type: SplitType;
  created_by: string;
  created_at: string;
  updated_at: string;
}
