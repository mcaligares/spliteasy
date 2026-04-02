import type { DbClient } from '@/repositories/types';
import { createBalanceRepository } from '@/repositories/balance.repository';
import { createExpenseRepository } from '@/repositories/expense.repository';
import { createExpenseParticipantRepository } from '@/repositories/expense-participant.repository';
import { createPaymentRepository } from '@/repositories/payment.repository';
import { createGroupMemberRepository } from '@/repositories/group-member.repository';
import { createUserRepository } from '@/repositories/user.repository';
import { roundToTwoDecimals } from '@/lib/utils/currency';
import { logger } from '@/lib/logger';
import type { GroupBalanceWithUsers, UserBalanceSummary } from './types';
import type { User } from '@/entities/user.entity';

const log = logger.service('balance');

export function createBalanceService(db: DbClient) {
  const balanceRepo = createBalanceRepository(db);
  const expenseRepo = createExpenseRepository(db);
  const participantRepo = createExpenseParticipantRepository(db);
  const paymentRepo = createPaymentRepository(db);
  const memberRepo = createGroupMemberRepository(db);
  const userRepo = createUserRepository(db);

  return {
    async recalculate(groupId: string): Promise<void> {
      log('recalculate', 'Starting balance recalculation', { groupId });

      const [members, expenses, payments] = await Promise.all([
        memberRepo.findByGroupId(groupId),
        expenseRepo.findByGroupId(groupId),
        paymentRepo.findByGroupId(groupId),
      ]);

      log('recalculate', 'Fetched data', {
        members: members.length,
        expenses: expenses.length,
        payments: payments.length,
      });

      // net[from][to] = amount that `from` owes `to`
      const net: Record<string, Record<string, number>> = {};

      const ensurePair = (a: string, b: string) => {
        if (!net[a]) net[a] = {};
        if (!net[a][b]) net[a][b] = 0;
        if (!net[b]) net[b] = {};
        if (!net[b][a]) net[b][a] = 0;
      };

      for (const expense of expenses) {
        const participants = await participantRepo.findByExpenseId(expense.id);
        for (const p of participants) {
          if (p.user_id === expense.paid_by) continue;
          ensurePair(p.user_id, expense.paid_by);
          net[p.user_id][expense.paid_by] += p.amount_owed;
        }
      }

      for (const payment of payments) {
        ensurePair(payment.paid_by, payment.paid_to);
        net[payment.paid_by][payment.paid_to] -= payment.amount;
      }

      log('recalculate', 'Computed net balances, upserting');

      // Clear existing and upsert new balances
      await balanceRepo.deleteByGroupId(groupId);

      const upsertPromises: Promise<unknown>[] = [];
      for (const fromUser of Object.keys(net)) {
        for (const toUser of Object.keys(net[fromUser])) {
          const amount = roundToTwoDecimals(net[fromUser][toUser]);
          if (fromUser === toUser) continue;
          upsertPromises.push(
            balanceRepo.upsert({ group_id: groupId, from_user: fromUser, to_user: toUser, amount })
          );
        }
      }
      await Promise.all(upsertPromises);

      log('recalculate', 'Balance recalculation complete');
    },

    async getGroupBalances(groupId: string): Promise<GroupBalanceWithUsers[]> {
      log('getGroupBalances', 'Fetching group balances', { groupId });
      const balances = await balanceRepo.findByGroupId(groupId);
      const userIds = [...new Set(balances.flatMap((b) => [b.from_user, b.to_user]))];
      const users = await userRepo.findManyByIds(userIds);
      const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

      return balances
        .filter((b) => b.amount > 0)
        .map((balance) => ({
          balance,
          fromUser: userMap[balance.from_user],
          toUser: userMap[balance.to_user],
        }));
    },

    async getUserBalance(groupId: string, userId: string): Promise<UserBalanceSummary> {
      log('getUserBalance', 'Fetching user balance', { groupId, userId });
      const balances = await balanceRepo.findByGroupId(groupId);
      const userIds = [...new Set(balances.flatMap((b) => [b.from_user, b.to_user]))];
      const users = await userRepo.findManyByIds(userIds);
      const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

      const owes: { user: User; amount: number }[] = [];
      const isOwed: { user: User; amount: number }[] = [];

      for (const balance of balances) {
        if (balance.amount <= 0) continue;
        if (balance.from_user === userId && userMap[balance.to_user]) {
          owes.push({ user: userMap[balance.to_user], amount: balance.amount });
        }
        if (balance.to_user === userId && userMap[balance.from_user]) {
          isOwed.push({ user: userMap[balance.from_user], amount: balance.amount });
        }
      }

      const totalOwed = isOwed.reduce((sum, x) => sum + x.amount, 0);
      const totalOwes = owes.reduce((sum, x) => sum + x.amount, 0);

      return { owes, isOwed, netAmount: roundToTwoDecimals(totalOwed - totalOwes) };
    },
  };
}
