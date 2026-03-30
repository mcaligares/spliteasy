import type { DbClient } from '@/repositories/types';
import { createExpenseRepository } from '@/repositories/expense.repository';
import { createExpenseParticipantRepository } from '@/repositories/expense-participant.repository';
import { createActivityLogRepository } from '@/repositories/activity-log.repository';
import { createBalanceService } from './balance.service';
import type { Expense } from '@/entities/expense.entity';
import type { CreateExpenseInput } from '@/lib/validators/expense.schema';
import { roundToTwoDecimals } from '@/lib/utils/currency';
import { logger } from '@/lib/logger';

export function createExpenseService(db: DbClient) {
  const expenseRepo = createExpenseRepository(db);
  const participantRepo = createExpenseParticipantRepository(db);
  const activityRepo = createActivityLogRepository(db);
  const balanceService = createBalanceService(db);

  return {
    async create(data: CreateExpenseInput, createdBy: string): Promise<Expense> {
      logger.service('ExpenseService.create', 'Calculating equal split', {
        amount: data.amount,
        participants: data.participants.length,
      });

      const amountPerPerson = roundToTwoDecimals(data.amount / data.participants.length);
      logger.service('ExpenseService.create', 'Split calculated', { amountPerPerson });

      const expense = await expenseRepo.insert({
        group_id: data.group_id,
        description: data.description,
        amount: data.amount,
        currency: data.currency,
        paid_by: data.paid_by,
        split_type: 'equal',
        created_by: createdBy,
      });
      logger.service('ExpenseService.create', 'Expense inserted, adding participants');

      await participantRepo.insertMany(
        data.participants.map((userId) => ({
          expense_id: expense.id,
          user_id: userId,
          amount_owed: amountPerPerson,
        }))
      );
      logger.service('ExpenseService.create', 'Participants added, updating balances');

      await balanceService.recalculate(data.group_id);
      logger.service('ExpenseService.create', 'Balances recalculated');

      await activityRepo.insert({
        group_id: data.group_id,
        user_id: createdBy,
        action: 'expense_created',
        entity_type: 'expense',
        entity_id: expense.id,
        metadata: { description: data.description, amount: data.amount },
      });

      return expense;
    },

    async getByGroupId(groupId: string): Promise<Expense[]> {
      logger.service('ExpenseService.getByGroupId', 'Fetching expenses', { groupId });
      return expenseRepo.findByGroupId(groupId);
    },

    async delete(expenseId: string, groupId: string, userId: string): Promise<void> {
      logger.service('ExpenseService.delete', 'Deleting expense', { expenseId });

      await expenseRepo.delete(expenseId);
      await balanceService.recalculate(groupId);

      await activityRepo.insert({
        group_id: groupId,
        user_id: userId,
        action: 'expense_deleted',
        entity_type: 'expense',
        entity_id: expenseId,
        metadata: {},
      });
    },
  };
}
