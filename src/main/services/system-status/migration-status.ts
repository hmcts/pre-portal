import { PreClient } from '../pre-api/pre-client';
import { SessionUser } from '../session-user/session-user';
import { UserLevel } from '../../types/user-level';
import { Request } from 'express';
import { MigrationFilters } from '../../types/migration-filters';
import { v4 as uuid } from 'uuid';
import { mapMigrationRecord } from '../../utils/map-migration-record';
import { MigrationRecordsResponse } from '../../types/migration-records-response';
import { Logger } from '@hmcts/nodejs-logging';

export class MigrationRecordService {
  logger = Logger.getLogger('migration-status');
  private readonly client: PreClient;
  private readonly user: string | undefined;
  private userEmail: string | null;

  constructor(req: Request, client: PreClient) {
    this.client = client;
    const loggedInUser = SessionUser.getLoggedInUserProfile(req);
    this.userEmail = loggedInUser?.user?.email ?? null;
    this.user = loggedInUser?.app_access?.find(role => role?.role?.name === UserLevel.SUPER_USER)?.id;
  }

  public async getMigrationRecords(filters: MigrationFilters = {}): Promise<MigrationRecordsResponse> {
    if (!this.user || !this.client) {
      throw new Error('User not authorized to access migration resolutions.');
    }
    try {
      const { records, pagination } = await this.client.getMigrationRecords(
        this.user,
        filters.caseReference,
        filters.witness,
        filters.defendant,
        filters.court,
        filters.resource_state,
        filters.startDate,
        filters.endDate,
        filters.reasonIn,
        filters.page,
        filters.size,
        filters.sort
      );
      let migrationRecords = records.map(mapMigrationRecord);

      return {
        migrationRecords: migrationRecords,
        pagination: {
          currentPage: pagination.currentPage,
          totalPages: pagination.totalPages,
          totalElements: pagination.totalElements,
          size: pagination.size,
        },
      };
    } catch (e) {
      throw new Error(`Failed to retrieve migration statuses. ${e}`);
    }
  }

  public async updateMigrationRecord(recordId: string, dto: any, original?: any): Promise<void> {
    if (!this.user || !this.client) {
      throw new Error('User not authorized to update migration records.');
    }

    try {
      await this.client.updateMigrationRecord(this.user, recordId, dto);

      let changedFields: any = dto;
      if (original) {
        changedFields = {};
        for (const key of Object.keys(dto)) {
          if (dto[key] !== original[key]) {
            changedFields[key] = dto[key];
          }
        }
      }
    } catch (e: any) {
      console.error('MigrationRecordService.updateMigrationRecord error:', e.response?.data || e.message);
      throw e;
    }
  }

  public async logAudit(auditPayload: any): Promise<void> {
    if (!this.user || !this.client) {
      throw new Error('User not authorized to write audit logs.');
    }

    const enrichedPayload = {
      ...auditPayload,
      audit_details: {
        ...auditPayload.audit_details,
        description: `${auditPayload.audit_details?.description} by ${this.userEmail}` || `Audit by ${this.userEmail}`,
      },
    };

    await this.client.putAudit(this.user, enrichedPayload);
  }

  public async submitMigrationRecords(): Promise<void> {
    if (!this.user || !this.client) {
      throw new Error('User not authorized to update migration records.');
    }
    const user = this.user;

    try {
      this.logger.info('migration records submitted');

      const response = await this.client.getMigrationRecords(user, '', '', '', '', 'READY', '', '', []);

      const readyRecords = response?.records || [];

      if (readyRecords.length === 0) {
        throw new Error('No records to submit');
      }

      await this.client.submitMigrationRecords(this.user);

      const submittedResponse = await this.client.getMigrationRecords(user, '', '', '', '', 'SUBMITTED', '', '', []);

      const submittedRecords = submittedResponse?.records || [];

      for (const record of submittedRecords) {
        await this.client.putAudit(user, {
          id: uuid(),
          functional_area: 'Admin Migration',
          category: 'Migration',
          activity: 'Submit Ready Record',
          source: 'PORTAL',
          table_name: 'vf_migration_records',
          audit_details: {
            record: JSON.stringify(mapMigrationRecord(record)),
            description: `Migration record ${record.id} submitted by user ${this.userEmail}`,
          },
        });
      }

      this.logger.info(`Audit complete for ${readyRecords.length} record(s)`);
    } catch (e: any) {
      console.error('MigrationRecordService.updateMigrationRecord error:', e.response?.data || e.message);
      throw e;
    }
  }
}
