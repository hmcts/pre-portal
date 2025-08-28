import { PreClient } from '../pre-api/pre-client';
//////import { VfMigrationRecord } from '../../types/vf-migration-record';
import { SessionUser } from '../session-user/session-user';
import { UserLevel } from '../../types/user-level';
import { Request } from 'express';
import { MigrationFilters } from '../../types/migration-filters';
//import { PutAuditRequest } from '../pre-api/types';
import { v4 as uuid } from 'uuid';

// interface MigrationFilters {
//   caseReference?: string;
//   witness?: string;
//   defendant?: string;
//   court?: string;
//   resource_state?: string;
//   reasonIn?: string[];
//   startDate?: string;
//   endDate?: string;
//     page?: number;
//     size?: number;
//     sort?: string;
// }

export interface MigrationRecordsResponse {
  migrationRecords: any[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalElements: number;
    size: number;
  };
}
export class MigrationRecordService {
  private client: PreClient;
  private user: string | undefined;

  constructor(req: Request, client: PreClient) {
    this.client = client;
    const loggedInUser = SessionUser.getLoggedInUserProfile(req);
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
      console.log('records', records);
      let migrationRecords = records.map((record: any) => ({
        recordId: record.id,
        archiveId: record.archive_id || '',
        urn: record.urn || '',
        court: record.court_reference || '',
        courtId: record.court_id || '',
        exhibitReference: record.exhibit_reference || '',
        witnessName: record.witness_name || '',
        defendantName: record.defendant_name || '',
        recordingVersion: record.recording_version || '',
        recordingVersionNumber: record.recording_version_number || '',
        duration: record.duration || '',
        reason: record.error_message || '',
        status: record.status || '',
        createDate: record.create_time || '',
      }));
      console.log('migrationRecords', migrationRecords);
      //   if (filters.court) {
      //     const search = filters.court.toLowerCase();
      //     migrationRecords = migrationRecords.filter(r =>
      //       r.court.toLowerCase().includes(search)
      //     );
      //   }
      // console.log('migrationRecords2', migrationRecords)
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
      throw new Error('Failed to retrieve migration statuses.');
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

    try {
      await this.client.submitMigrationRecords(this.user);
      console.log('migration records submitted');
      //         const auditRequest: PutAuditRequest = {
      //            id: crypto.randomUUID(),
      //            category: "Migration",
      //            activity: "Submit Ready Records",
      //            functional_area: "Admin",
      //            source: "Pre Portal",           // e.g., frontend or service name
      //            table_name: "vf_migration_records",  // optional: which table affected
      //            table_record_id: "ALL_READY",     // optional: could be 'ALL_READY' or blank
      //            audit_details: {
      //              user: this.user,
      //              action: "Submitted all READY migration records",
      //              timestamp: new Date().toISOString(),
      //            }
      //          };

      await this.client.putAudit(this.user, {
        id: uuid(),
        functional_area: 'Admin Migration',
        category: 'Migration',
        activity: 'Submit Ready Records',
        source: 'PORTAL',
        table_name: 'vf_migration_records',
        audit_details: {
          //                recordingId: recording.id,
          //                caseReference: recording.case_reference,
          //                caseId: recording.case_id,
          //                courtName: recording.capture_session.court_name,
          description: 'Migration records submitted by User ' + this.user,
          email: this.user,
        },
      });
      console.log('Put audit');
    } catch (e: any) {
      console.error('MigrationRecordService.updateMigrationRecord error:', e.response?.data || e.message);
      throw e;
    }
  }
}
