import { PreClient } from '../pre-api/pre-client';
//////import { VfMigrationRecord } from '../../types/vf-migration-record';
import { SessionUser } from '../session-user/session-user';
import { UserLevel } from '../../types/user-level';
import { Request } from 'express';
import { MigrationFilters } from '../../types/migration-filters';
import { v4 as uuid } from 'uuid';
import { mapMigrationRecord } from '../../utils/map-migration-record';
import { MigrationRecordsResponse } from '../../types/migration-records-response';

export class MigrationRecordService {
  private readonly client: PreClient;
  private readonly user: string | undefined;
  private userEmail: string;

  constructor(req: Request, client: PreClient) {
    this.client = client;
    const loggedInUser = SessionUser.getLoggedInUserProfile(req);
    this.userEmail = loggedInUser.user.email;
    console.log('loggedInUser', loggedInUser);
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

  public async updateMigrationRecord(recordId: string, dto: any): Promise<void> {
    if (!this.user || !this.client) {
      throw new Error('User not authorized to update migration records.');
    }

    try {
      await this.client.updateMigrationRecord(this.user, recordId, dto);
    } catch (e: any) {
      console.error('MigrationRecordService.updateMigrationRecord error:', e.response?.data || e.message);
      throw e;
    }
  }

  public async submitMigrationRecords(): Promise<void> {
    if (!this.user || !this.client) {
      throw new Error('User not authorized to update migration records.');
    }
    const user = this.user;

    try {
      console.log('migration records submitted');

      const response = await this.client.getMigrationRecords(user, '', '', '', '', 'READY', '', '', []);

      const readyRecords = response?.records || [];

      if (readyRecords.length === 0) {
        throw new Error('No records to submit');
      }

      await this.client.submitMigrationRecords(this.user);

      for (const record of readyRecords) {
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

      console.log(`Audit complete for ${readyRecords.length} record(s)`);
    } catch (e: any) {
      console.error('MigrationRecordService.updateMigrationRecord error:', e.response?.data || e.message);
      throw e;
    }
  }
}
