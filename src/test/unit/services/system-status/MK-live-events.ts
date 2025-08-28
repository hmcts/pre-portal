import { LiveEventStatusService } from '../../../../main/services/system-status/live-events-status';
import { PreClient } from '../../../../main/services/pre-api/pre-client';
import { Request } from 'express';
import { SessionUser } from '../../../../main/services/session-user/session-user';
import { UserLevel } from '../../../../main/types/user-level';

jest.mock('../../../../main/services/pre-api/pre-client');
jest.mock('../../../../main/services/session-user/session-user');

describe('LiveEventStatusService', () => {
  let mockRequest: Partial<Request>;
  let mockClient: jest.Mocked<PreClient>;
  let service: LiveEventStatusService;

  beforeEach(() => {
    mockClient = new PreClient() as jest.Mocked<PreClient>;
    mockRequest = {} as Partial<Request>;
  });

  test('should return an empty array if no live events are found', async () => {
    (SessionUser.getLoggedInUserProfile as jest.Mock).mockReturnValue({
      app_access: [{ role: { name: UserLevel.SUPER_USER }, id: 'test-user' }],
    });

    mockClient.getLiveEvents = jest.fn().mockResolvedValue([]);

    service = new LiveEventStatusService(mockRequest as Request, mockClient);
    const result = await service.getMediaKindLiveEventStatuses();

    expect(result).toEqual([]);
    expect(mockClient.getLiveEvents).toHaveBeenCalledWith('test-user');
  });

  test('should return formatted live event statuses', async () => {
    (SessionUser.getLoggedInUserProfile as jest.Mock).mockReturnValue({
      app_access: [{ role: { name: UserLevel.SUPER_USER }, id: 'test-user' }],
    });

    mockClient.getLiveEvents = jest.fn().mockResolvedValue([
      { id: 'event1', name: 'Live Event 1', description: 'Test Event 1', resource_state: 'Running' },
      { id: 'event2', name: 'Live Event 2', description: 'Test Event 2', resource_state: 'Stopped' },
    ]);
    mockClient.getCaptureSession.mockImplementation(async (id: string, userId: string) => {
      return {
        id: 'capture1',
        booking_id: 'booking1',
        origin: 'origin',
        ingest_address: 'ingest-url',
        start_time: new Date().toISOString(),
        stop_time: new Date().toISOString(),
        case_reference: id === 'event1' ? 'abcd' : 'dfed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source_type: 'source-type',
        resource_state: 'Running',
        hearing_id: 'hearing1',
        live_output_url: 'rtmp://example.com/live',
        started_at: new Date().toISOString(),
        started_by_user_id: 'user1',
        finished_at: new Date().toISOString(),
        finished_by_user_id: 'user2',
        retry_count: 0,
        metadata: {},
        status: 'active',

        // 🔧 Fixed field
        deleted_at: '', // or new Date().toISOString()

        court_name: 'Test Court',
        case_state: 'Open',
      };
    });

    service = new LiveEventStatusService(mockRequest as Request, mockClient);
    const result = await service.getMediaKindLiveEventStatuses();

    expect(result).toEqual([
      { id: 'event1', name: 'Live Event 1', description: 'Test Event 1', status: 'Running', caseReference: 'abcd' },
      { id: 'event2', name: 'Live Event 2', description: 'Test Event 2', status: 'Stopped', caseReference: 'dfed' },
    ]);
    expect(mockClient.getLiveEvents).toHaveBeenCalledWith('test-user');
  });

  test('should handle errors when fetching live events', async () => {
    (SessionUser.getLoggedInUserProfile as jest.Mock).mockReturnValue({
      app_access: [{ role: { name: UserLevel.SUPER_USER }, id: 'test-user' }],
    });

    mockClient.getLiveEvents = jest.fn().mockRejectedValue(new Error('API error'));

    service = new LiveEventStatusService(mockRequest as Request, mockClient);

    await expect(service.getMediaKindLiveEventStatuses()).rejects.toThrow('Failed to retrieve live event statuses.');
  });
});
