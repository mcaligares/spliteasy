import type { DbClient } from '@/repositories/types';
import { createActivityLogRepository } from '@/repositories/activity-log.repository';
import { createUserRepository } from '@/repositories/user.repository';
import type { ActivityLog } from '@/entities/activity-log.entity';
import type { User } from '@/entities/user.entity';
import { logger } from '@/lib/logger';
import { appConfig } from '@/config/app.config';

export interface ActivityLogWithUser extends ActivityLog {
  user: User;
}

const log = logger.service('activityLog');

export function createActivityLogService(db: DbClient) {
  const activityRepo = createActivityLogRepository(db);
  const userRepo = createUserRepository(db);

  return {
    async getByGroup(groupId: string, page = 1, limit = appConfig.pagination.defaultPageSize): Promise<ActivityLogWithUser[]> {
      log('getByGroup', 'Fetching activity', { groupId, page, limit });
      const logs = await activityRepo.findByGroupId(groupId, page, limit);
      const userIds = [...new Set(logs.map((l) => l.user_id))];
      const users = await userRepo.findManyByIds(userIds);
      const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

      return logs.map((entry) => ({
        ...entry,
        user: userMap[entry.user_id],
      }));
    },
  };
}
