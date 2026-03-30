export interface Payment {
  id: string;
  group_id: string;
  paid_by: string;
  paid_to: string;
  amount: number;
  note: string | null;
  created_at: string;
}
