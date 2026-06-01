/**
 * GroupService - Domain Service for Group Operations
 * 
 * Enterprise Patterns Used:
 * - Repository Pattern (via ApiClientService)
 * - Service Locator Pattern
 * - Command/Query Separation
 * - Business Logic Encapsulation
 * - Error Handling & Validation
 * 
 * Responsibilities:
 * - CRUD operations for groups
 * - Business rule enforcement
 * - Data transformation (DTOs)
 * - Validation & error handling
 */

import { BaseService, Logger } from '../infrastructure/service-base';
import type {
  GroupSummaryDto,
  GroupDto,
  CreateGroupRequest,
  UpdateGroupRequest,
  AddMemberRequest,
} from '../../models';
import type { ApiClientService } from '../api/api-client.service';

/**
 * Business rule violations
 */
export class GroupBusinessRuleError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'GroupBusinessRuleError';
  }
}

/**
 * Query/Command DTOs for separation
 */
namespace GroupCommand {
  export interface Create extends CreateGroupRequest {}
  export interface Update extends UpdateGroupRequest {}
  export interface AddMember extends AddMemberRequest {}
}

namespace GroupQuery {
  export interface GetAll {}
  export interface GetById {
    groupId: string;
  }
  export interface GetMembers {
    groupId: string;
  }
}

/**
 * GroupService - Encapsulates group business logic
 */
export class GroupService extends BaseService {
  constructor(apiClient: ApiClientService) {
    super(apiClient);
  }

  /**
   * QUERY: Get all groups for current user
   * Command/Query Separation Pattern
   */
  async getAll(query?: GroupQuery.GetAll): Promise<GroupSummaryDto[]> {
    try {
      this.logger.debug('Query: Getting all groups');
      const groups = await this.apiClient.getGroups();
      this.logger.info(`Retrieved ${groups.length} groups`);
      return groups;
    } catch (error) {
      throw this.handleError(error, 'Failed to get groups');
    }
  }

  /**
   * QUERY: Get single group by ID
   */
  async getById(groupId: string): Promise<GroupDto> {
    // Validation
    if (!groupId?.trim()) {
      throw new GroupBusinessRuleError(
        'INVALID_GROUP_ID',
        'Group ID is required'
      );
    }

    try {
      this.logger.debug(`Query: Getting group ${groupId}`);
      const group = await this.apiClient.getGroup(groupId);

      if (!group) {
        throw new GroupBusinessRuleError(
          'GROUP_NOT_FOUND',
          `Group not found: ${groupId}`
        );
      }

      return group;
    } catch (error) {
      throw this.handleError(error, `Failed to get group ${groupId}`);
    }
  }

  /**
   * COMMAND: Create new group
   * Business Rules:
   * - Name is required and unique (per user)
   * - Creator is automatically admin
   * - Currency must be valid
   */
  async create(cmd: GroupCommand.Create): Promise<GroupDto> {
    // Validation
    this.validateGroupCreation(cmd);

    try {
      this.logger.info(`Command: Creating group "${cmd.name}"`);

      const group = await this.apiClient.createGroup(cmd);

      this.logger.info(`Group created: ${group.id} (${group.name})`);
      return group;
    } catch (error) {
      throw this.handleError(error, 'Failed to create group');
    }
  }

  /**
   * COMMAND: Update group (admin only)
   */
  async update(groupId: string, cmd: GroupCommand.Update): Promise<GroupDto> {
    // Validation
    if (!groupId?.trim()) {
      throw new GroupBusinessRuleError(
        'INVALID_GROUP_ID',
        'Group ID is required'
      );
    }

    try {
      this.logger.info(`Command: Updating group ${groupId}`);

      const updated = await this.apiClient.updateGroup(groupId, cmd);

      this.logger.info(`Group updated: ${groupId}`);
      return updated;
    } catch (error) {
      throw this.handleError(error, `Failed to update group ${groupId}`);
    }
  }

  /**
   * COMMAND: Add member to group (admin only)
   * Business Rules:
   * - User must exist
   * - User cannot be added twice
   * - Only admin can add members
   */
  async addMember(
    groupId: string,
    cmd: GroupCommand.AddMember
  ): Promise<void> {
    // Validation
    if (!groupId?.trim()) {
      throw new GroupBusinessRuleError(
        'INVALID_GROUP_ID',
        'Group ID is required'
      );
    }

    if (!cmd.userId?.trim()) {
      throw new GroupBusinessRuleError(
        'INVALID_USER_ID',
        'User ID is required'
      );
    }

    try {
      this.logger.info(
        `Command: Adding member ${cmd.userId} to group ${groupId}`
      );

      await this.apiClient.addGroupMember(groupId, cmd);

      this.logger.info(`Member added: ${cmd.userId} to ${groupId}`);
    } catch (error) {
      throw this.handleError(
        error,
        `Failed to add member to group ${groupId}`
      );
    }
  }

  /**
   * COMMAND: Remove member from group (admin only)
   * Business Rules:
   * - Member must have no outstanding balance
   * - Only admin can remove members
   */
  async removeMember(groupId: string, userId: string): Promise<void> {
    // Validation
    if (!groupId?.trim() || !userId?.trim()) {
      throw new GroupBusinessRuleError(
        'INVALID_PARAMS',
        'Group ID and User ID required'
      );
    }

    // Check if member can be removed (no outstanding balance)
    const canRemove = await this.canRemoveMember(groupId, userId);
    if (!canRemove) {
      throw new GroupBusinessRuleError(
        'MEMBER_HAS_BALANCE',
        'Cannot remove member with outstanding balance'
      );
    }

    try {
      this.logger.info(
        `Command: Removing member ${userId} from group ${groupId}`
      );

      await this.apiClient.removeGroupMember(groupId, userId);

      this.logger.info(`Member removed: ${userId} from ${groupId}`);
    } catch (error) {
      throw this.handleError(
        error,
        `Failed to remove member from group ${groupId}`
      );
    }
  }

  /**
   * QUERY: Check if member can be removed
   * Business Logic: Has no unsettled balance
   */
  async canRemoveMember(groupId: string, userId: string): Promise<boolean> {
    try {
      // In real implementation, would call balance API
      // For now, assume can remove
      return true;
    } catch (error) {
      this.logger.error(`Failed to check if member can be removed`, error);
      return false;
    }
  }

  /**
   * Validation helper
   */
  private validateGroupCreation(cmd: GroupCommand.Create): void {
    const errors: string[] = [];

    // Name validation
    if (!cmd.name?.trim()) {
      errors.push('Group name is required');
    } else if (cmd.name.trim().length > 100) {
      errors.push('Group name must be 100 characters or less');
    }

    // Description validation (optional)
    if (cmd.description && cmd.description.length > 500) {
      errors.push('Description must be 500 characters or less');
    }

    // Currency validation
    const validCurrencies = ['USD', 'EUR', 'GBP', 'INR'];
    if (cmd.baseCurrency && !validCurrencies.includes(cmd.baseCurrency)) {
      errors.push(`Invalid currency: ${cmd.baseCurrency}`);
    }

    if (errors.length > 0) {
      throw new GroupBusinessRuleError('VALIDATION_FAILED', errors.join('; '));
    }
  }
}

export type { GroupCommand, GroupQuery };
