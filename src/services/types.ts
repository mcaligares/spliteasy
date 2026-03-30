import type { User } from '@/entities/user.entity';
import type { Balance } from '@/entities/balance.entity';

export interface GroupBalanceWithUsers {
  balance: Balance;
  fromUser: User;
  toUser: User;
}

export interface UserBalanceSummary {
  owes: { user: User; amount: number }[];
  isOwed: { user: User; amount: number }[];
  netAmount: number;
}
