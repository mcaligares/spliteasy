import type { DbClient } from '@/repositories/types';
import { createGroupRepository } from '@/repositories/group.repository';
import { createGroupMemberRepository } from '@/repositories/group-member.repository';
import { createUserRepository } from '@/repositories/user.repository';
import { createActivityLogRepository } from '@/repositories/activity-log.repository';
import type { Group } from '@/entities/group.entity';
import type { GroupMember } from '@/entities/group-member.entity';
import type { User } from '@/entities/user.entity';
import type { CreateGroupInput } from '@/lib/validators/group.schema';
import { logger } from '@/lib/logger';

export function createGroupService(db: DbClient) {
  const groupRepo = createGroupRepository(db);
  const memberRepo = createGroupMemberRepository(db);
  const userRepo = createUserRepository(db);
  const activityRepo = createActivityLogRepository(db);

  return {
    async create(data: CreateGroupInput, creatorId: string): Promise<Group> {
      logger.service('GroupService.create', 'Creating group', { name: data.name, creatorId });

      const group = await groupRepo.insert({
        name: data.name,
        description: data.description,
        created_by: creatorId,
      });
      logger.service('GroupService.create', 'Group created, adding creator as admin');

      await memberRepo.insert({ group_id: group.id, user_id: creatorId, role: 'admin' });
      logger.service('GroupService.create', 'Creator added as admin');

      await activityRepo.insert({
        group_id: group.id,
        user_id: creatorId,
        action: 'member_joined',
        entity_type: 'group_member',
        entity_id: group.id,
        metadata: { role: 'admin' },
      });

      return group;
    },

    async getGroupsForUser(userId: string): Promise<Group[]> {
      logger.service('GroupService.getGroupsForUser', 'Fetching groups', { userId });
      return groupRepo.findAllForUser(userId);
    },

    async getGroupById(groupId: string): Promise<Group | null> {
      logger.service('GroupService.getGroupById', 'Fetching group', { groupId });
      return groupRepo.findById(groupId);
    },

    async getMembers(groupId: string): Promise<(GroupMember & { user: User })[]> {
      logger.service('GroupService.getMembers', 'Fetching members', { groupId });
      const members = await memberRepo.findByGroupId(groupId);
      const userIds = members.map((m) => m.user_id);
      const users = await userRepo.findManyByIds(userIds);
      const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
      return members.map((m) => ({ ...m, user: userMap[m.user_id] }));
    },

    async addMember(groupId: string, email: string, addedById: string): Promise<GroupMember> {
      logger.service('GroupService.addMember', 'Adding member by email', { groupId });

      const user = await userRepo.findByEmail(email);
      if (!user) throw new Error('Usuario no encontrado con ese email');

      const existing = await memberRepo.findByGroupAndUser(groupId, user.id);
      if (existing) throw new Error('El usuario ya es miembro de este grupo');

      const member = await memberRepo.insert({ group_id: groupId, user_id: user.id, role: 'member' });
      logger.service('GroupService.addMember', 'Member added');

      await activityRepo.insert({
        group_id: groupId,
        user_id: addedById,
        action: 'member_joined',
        entity_type: 'group_member',
        entity_id: member.id,
        metadata: { added_user_id: user.id, added_user_name: user.name },
      });

      return member;
    },

    async isMember(groupId: string, userId: string): Promise<boolean> {
      const member = await memberRepo.findByGroupAndUser(groupId, userId);
      return member !== null;
    },
  };
}
