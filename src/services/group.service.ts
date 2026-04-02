import type { DbClient } from '@/repositories/types';
import { createGroupRepository } from '@/repositories/group.repository';
import { createGroupMemberRepository } from '@/repositories/group-member.repository';
import { createUserRepository } from '@/repositories/user.repository';
import { createActivityLogRepository } from '@/repositories/activity-log.repository';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Group } from '@/entities/group.entity';
import type { GroupMember } from '@/entities/group-member.entity';
import type { User } from '@/entities/user.entity';
import type { CreateGroupInput } from '@/lib/validators/group.schema';
import { logger } from '@/lib/logger';

export type AddMemberResult = {
  member: GroupMember;
  invited: boolean;
};

const log = logger.service('group');

export function createGroupService(db: DbClient) {
  const groupRepo = createGroupRepository(db);
  const memberRepo = createGroupMemberRepository(db);
  const userRepo = createUserRepository(db);
  const activityRepo = createActivityLogRepository(db);

  return {
    async create(data: CreateGroupInput, creatorId: string): Promise<Group> {
      log('create', 'Creating group', { name: data.name, creatorId });

      const group = await groupRepo.insert({
        name: data.name,
        description: data.description,
        created_by: creatorId,
      });
      log('create', 'Group created, adding creator as admin');

      await memberRepo.insert({ group_id: group.id, user_id: creatorId, role: 'admin' });
      log('create', 'Creator added as admin');

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
      log('getGroupsForUser', 'Fetching groups', { userId });
      return groupRepo.findAllForUser(userId);
    },

    async getGroupById(groupId: string): Promise<Group | null> {
      log('getGroupById', 'Fetching group', { groupId });
      return groupRepo.findById(groupId);
    },

    async getMembers(groupId: string): Promise<(GroupMember & { user: User })[]> {
      log('getMembers', 'Fetching members', { groupId });
      const members = await memberRepo.findByGroupId(groupId);
      const userIds = members.map((m) => m.user_id);
      const users = await userRepo.findManyByIds(userIds);
      const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
      return members.map((m) => ({ ...m, user: userMap[m.user_id] }));
    },

    async addMember(groupId: string, email: string, addedById: string): Promise<AddMemberResult> {
      log('addMember', 'Adding member by email', { groupId });

      let user = await userRepo.findByEmail(email);
      let invited = false;

      if (!user) {
        log('addMember', 'User not found, sending invite', { email: email.split('@')[0] });
        const adminDb = createAdminClient();
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
        const { data, error } = await adminDb.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${siteUrl}/dashboard`,
        });
        if (error) throw new Error(`Error al invitar usuario: ${error.message}`);

        // Wait for the trigger to create the public.users row
        user = await userRepo.findById(data.user.id);
        if (!user) throw new Error('Error al crear el usuario invitado');
        invited = true;
      }

      const existing = await memberRepo.findByGroupAndUser(groupId, user.id);
      if (existing) throw new Error('El usuario ya es miembro de este grupo');

      const member = await memberRepo.insert({ group_id: groupId, user_id: user.id, role: 'member' });
      log('addMember', invited ? 'Member invited and added' : 'Member added');

      await activityRepo.insert({
        group_id: groupId,
        user_id: addedById,
        action: invited ? 'member_invited' : 'member_joined',
        entity_type: 'group_member',
        entity_id: member.id,
        metadata: { added_user_id: user.id, added_user_name: user.name ?? email },
      });

      return { member, invited };
    },

    async isMember(groupId: string, userId: string): Promise<boolean> {
      const member = await memberRepo.findByGroupAndUser(groupId, userId);
      return member !== null;
    },
  };
}
