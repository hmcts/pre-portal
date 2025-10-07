import { MigrationRecordService } from '../../../../main/services/system-status/migration-status';
import { PreClient } from '../../../../main/services/pre-api/pre-client';
import { Request } from 'express';
import { SessionUser } from '../../../../main/services/session-user/session-user';
import { UserLevel } from '../../../../main/types/user-level';

jest.mock('../../../../main/services/pre-api/pre-client');
jest.mock('../../../../main/services/session-user/session-user');

describe('MigrationRecordService', () => {
  let mockRequest: Partial<Request>;
  let mockClient: jest.Mocked<PreClient>;
  let service: MigrationRecordService;

  beforeEach(() => {
    mockClient = {
      getMigrationRecords: jest.fn(),
      updateMigrationRecord: jest.fn(),
      submitMigrationRecords: jest.fn(),
      putAudit: jest.fn(),
    } as unknown as jest.Mocked<PreClient>;

    mockRequest = {} as Partial<Request>;

    (SessionUser.getLoggedInUserProfile as jest.Mock).mockReturnValue({
      user: { email: 'test-user@example.com' },
      app_access: [{ role: { name: UserLevel.SUPER_USER }, id: 'test-user' }],
    });

    service = new MigrationRecordService(mockRequest as Request, mockClient);
  });

  test('should return an empty array if no migration records are found', async () => {
    (SessionUser.getLoggedInUserProfile as jest.Mock).mockReturnValue({
      user: { email: 'test-user@example.com' },
      app_access: [{ role: { name: UserLevel.SUPER_USER }, id: 'test-user' }],
    });

    mockClient.getMigrationRecords = jest.fn().mockResolvedValue({ records: [], pagination: {} });

    service = new MigrationRecordService(mockRequest as Request, mockClient);
    const result = await service.getMigrationRecords();

    expect(result.migrationRecords).toEqual([]);
    expect(mockClient.getMigrationRecords).toHaveBeenCalledWith(
      'test-user',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );
  });

  test('should return formatted migration records', async () => {
    mockClient.getMigrationRecords = jest.fn().mockResolvedValue({
      records: [
        {
          id: 'rec-001',
          archive_name: 'ARCH-002',
          urn: 'URN654321',
          court_reference: 'Birmingham Youth',
          court_id: 'C-001',
          exhibit_reference: 'EX456',
          witness_name: 'Zaheera',
          defendant_name: 'Brown',
          recording_version: 'ORIG',
          recording_version_number: '1',
          duration: '01:23:45',
          error_message: 'Unknown reason',
          status: 'Unresolved',
          create_time: '10/12/2023',
        },
      ],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalElements: 1,
        size: 10,
      },
    });

    service = new MigrationRecordService(mockRequest as Request, mockClient);
    const result = await service.getMigrationRecords();

    expect(result.migrationRecords).toEqual([
      {
        recordId: 'rec-001',
        archiveName: 'ARCH-002',
        urn: 'URN654321',
        court: 'Birmingham Youth',
        courtId: 'C-001',
        exhibitReference: 'EX456',
        witnessName: 'Zaheera',
        defendantName: 'Brown',
        recordingVersion: 'ORIG',
        recordingVersionNumber: '1',
        duration: '01:23:45',
        reason: 'Unknown reason',
        status: 'Unresolved',
        createDate: '10/12/2023',
      },
    ]);
  });

  test('should handle errors when fetching migration records', async () => {
    (SessionUser.getLoggedInUserProfile as jest.Mock).mockReturnValue({
      app_access: [{ role: { name: UserLevel.SUPER_USER }, id: 'test-user' }],
    });

    mockClient.getMigrationRecords = jest.fn().mockRejectedValue(new Error('API error'));

    service = new MigrationRecordService(mockRequest as Request, mockClient);

    await expect(service.getMigrationRecords()).rejects.toThrow('Failed to retrieve migration statuses.');
  });

  describe('updateMigrationRecord', () => {
    it('should call client.updateMigrationRecord with correct params', async () => {
      mockClient.updateMigrationRecord.mockResolvedValue(undefined);

      const dto = { status: 'Resolved' };
      await service.updateMigrationRecord('rec-123', dto);

      expect(mockClient.updateMigrationRecord).toHaveBeenCalledWith('test-user', 'rec-123', dto);
    });

    it('should throw if user not authorized', async () => {
      (SessionUser.getLoggedInUserProfile as jest.Mock).mockReturnValue(undefined);
      const unauthorizedService = new MigrationRecordService({} as Request, mockClient);

      await expect(unauthorizedService.updateMigrationRecord('rec-123', { status: 'X' })).rejects.toThrow(
        'User not authorized to update migration records.'
      );
    });

    it('should rethrow client errors', async () => {
      mockClient.updateMigrationRecord.mockRejectedValue(new Error('Update failed'));

      await expect(service.updateMigrationRecord('rec-123', { status: 'Resolved' })).rejects.toThrow('Update failed');
    });

    it('should detect changed fields when original is provided', async () => {
      mockClient.updateMigrationRecord.mockResolvedValue(undefined);

      const dto = { status: 'Resolved', reason: 'Completed' };
      const original = { status: 'Pending', reason: 'Completed' };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await service.updateMigrationRecord('rec-123', dto, original);

      expect(mockClient.updateMigrationRecord).toHaveBeenCalledWith('test-user', 'rec-123', dto);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should log and rethrow errors from updateMigrationRecord', async () => {
      const error = new Error('Network failure');
      mockClient.updateMigrationRecord.mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(service.updateMigrationRecord('rec-999', { status: 'Failed' })).rejects.toThrow('Network failure');

      expect(consoleSpy).toHaveBeenCalledWith('MigrationRecordService.updateMigrationRecord error:', 'Network failure');

      consoleSpy.mockRestore();
    });
  });

  describe('submitMigrationRecords', () => {
    it('should call submitMigrationRecords and putAudit with correct params', async () => {
      mockClient.getMigrationRecords.mockResolvedValue({
        records: [
          {
            id: 'rec-001',
            archive_id: 'ARCH-002',
            urn: 'URN654321',
            court_reference: 'Birmingham Youth',
            court_id: 'C-001',
            exhibit_reference: 'EX456',
            witness_name: 'Zaheera',
            defendant_name: 'Brown',
            recording_version: 'ORIG',
            recording_version_number: '1',
            duration: '01:23:45',
            error_message: 'Unknown reason',
            status: 'READY',
            create_time: '10/12/2023',
          },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalElements: 1,
          size: 10,
        },
      });

      mockClient.submitMigrationRecords.mockResolvedValue(undefined);
      mockClient.putAudit.mockResolvedValue({} as any);

      await service.submitMigrationRecords();

      expect(mockClient.submitMigrationRecords).toHaveBeenCalledWith('test-user');
      expect(mockClient.putAudit).toHaveBeenCalledWith(
        'test-user',
        expect.objectContaining({
          functional_area: 'Admin Migration',
          category: 'Migration',
          activity: 'Submit Ready Record',
          source: 'PORTAL',
          table_name: 'vf_migration_records',
          audit_details: expect.objectContaining({
            description: expect.stringMatching(/Migration record .* submitted by user test-user@example.com/),
          }),
        })
      );
    });

    it('should throw if user not authorized', async () => {
      (SessionUser.getLoggedInUserProfile as jest.Mock).mockReturnValue(undefined);
      const unauthorizedService = new MigrationRecordService({} as Request, mockClient);

      await expect(unauthorizedService.submitMigrationRecords()).rejects.toThrow(
        'User not authorized to update migration records.'
      );
    });

    it('should rethrow client errors', async () => {
      mockClient.submitMigrationRecords.mockRejectedValue(new Error('No records to submit'));

      await expect(service.submitMigrationRecords()).rejects.toThrow('No records to submit');
    });
  });

  describe('logAudit', () => {
    it('should call client.putAudit with enriched payload', async () => {
      mockClient.putAudit.mockResolvedValue({} as any);

      const auditPayload = {
        id: 'audit-001',
        functional_area: 'Admin Migration',
        category: 'Migration',
        activity: 'Update Migration Record',
        audit_details: {
          record: '{"field":"value"}',
          description: 'Test description',
        },
      };

      await service.logAudit(auditPayload);

      expect(mockClient.putAudit).toHaveBeenCalledWith(
        'test-user',
        expect.objectContaining({
          id: 'audit-001',
          audit_details: expect.objectContaining({
            description: expect.stringContaining('Test description by test-user@example.com'),
          }),
        })
      );
    });

    it('should throw error if user is not authorized', async () => {
      (SessionUser.getLoggedInUserProfile as jest.Mock).mockReturnValue(undefined);
      const unauthorizedService = new MigrationRecordService({} as Request, mockClient);

      await expect(
        unauthorizedService.logAudit({
          id: 'audit-002',
          audit_details: { description: 'Unauthorized' },
        })
      ).rejects.toThrow('User not authorized to write audit logs.');
    });

    it('should rethrow client errors', async () => {
      mockClient.putAudit.mockRejectedValue(new Error('Audit failed'));

      const auditPayload = {
        id: 'audit-003',
        audit_details: { description: 'Something broke' },
      };

      await expect(service.logAudit(auditPayload)).rejects.toThrow('Audit failed');
    });
  });
});
