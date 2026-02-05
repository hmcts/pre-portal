import { mockedPaginatedRecordings, mockRecordings, mockXUserId } from '../mock-api';
import { PreClient } from '../../main/services/pre-api/pre-client';
import { PutAuditRequest, SearchRecordingsRequest } from '../../main/services/pre-api/types';
import { describe } from '@jest/globals';
import axios from 'axios';
import { mockeduser } from './test-helper';
import { AccessStatus } from '../../main/types/access-status';
import FormData from 'form-data';

const preClient = new PreClient();
const mockRecordingId = '12345678-1234-1234-1234-1234567890ab';
const mockRecordingMissingId = '4f37c46f-142d-42df-953f-0b7ca3f87995';
const mockRecordingNoPermsId = '4f37c46f-142d-42df-953f-0b7ca3f87996';
jest.mock('axios');

/* eslint-disable jest/expect-expect */
describe('PreClient', () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  // @ts-ignore
  mockedAxios.put.mockImplementation((url: string, data: object, config: object) => {
    if (url.startsWith('/audit/')) {
      return Promise.resolve({
        status: 201,
      });
    }
  });

  // @ts-ignore
  mockedAxios.get.mockImplementation((url: string, config: object) => {
    // @ts-ignore
    if (url === '/users/by-email/' + encodeURIComponent('test@testy.com')) {
      return Promise.resolve({
        status: 200,
        data: mockeduser,
      });
    }
    if (url === '/users/by-email/' + encodeURIComponent('inactive@testy.com')) {
      const inactiveUser = { ...mockeduser };
      // @ts-ignore
      inactiveUser.portal_access[0].status = AccessStatus.INACTIVE;
      return Promise.resolve({
        status: 200,
        data: inactiveUser,
      });
    }
    if (url === '/users/by-email/' + encodeURIComponent('noportal_access@testy.com')) {
      const noPortalUser = { ...mockeduser };
      // @ts-ignore
      delete noPortalUser.portal_access;
      return Promise.resolve({
        status: 200,
        data: noPortalUser,
      });
    }
    if (url === '/users/by-email/' + encodeURIComponent('noapi@testy.com')) {
      // @ts-ignore
      return Promise.reject({
        status: 404,
        data: {
          message: 'Not found: User: noapi@testy.com',
        },
      });
    }
    if (url === '/users/by-email/' + encodeURIComponent('getActiveUserByEmail@inactive.com')) {
      const inactiveUser = { ...mockeduser };
      // @ts-ignore
      inactiveUser.portal_access[0].status = AccessStatus.INACTIVE;
      return Promise.resolve({
        status: 200,
        data: inactiveUser,
      });
    }
    if (url === '/users/by-email/' + encodeURIComponent('getActiveUserByEmail@noportal_access.com')) {
      const noPortalUser = { ...mockeduser };
      // @ts-ignore
      delete noPortalUser.portal_access;
      return Promise.resolve({
        status: 200,
        data: noPortalUser,
      });
    }
    if (url === '/users/by-email/' + encodeURIComponent('getActiveUserByEmail@ok.com')) {
      const activeUser = { ...mockeduser };
      // @ts-ignore
      activeUser.portal_access[0].status = AccessStatus.ACTIVE;
      return Promise.resolve({
        status: 200,
        data: activeUser,
      });
    }

    if (url === `/recordings/${mockRecordingId}`) {
      return Promise.resolve({
        status: 200,
        data: mockRecordings.find(r => r.id === mockRecordingId),
      });
    }
    if (url === `/recordings/${mockRecordingMissingId}`) {
      return Promise.reject({
        response: {
          status: 404,
        },
      });
    }
    if (url === `/recordings/${mockRecordingNoPermsId}`) {
      return Promise.reject({
        response: {
          status: 403,
        },
      });
    }
    if (url === '/recordings') {
      if (config['headers']['X-User-Id'] === mockXUserId) {
        return Promise.resolve({
          status: 200,
          data: mockedPaginatedRecordings,
        });
      } else if (config['params']['caseReference'] == 'uhoh') {
        return Promise.reject('Network Error');
      }
      return Promise.resolve({
        status: 200,
        data: {
          page: {
            size: 20,
            totalElements: 0,
            totalPages: 1,
            number: 0,
          },
        },
      });
    }
    if (url === '/media-service/vod?recordingId=123') {
      return Promise.resolve({
        status: 200,
        data: mockRecordings[0],
      });
    }
    if (url === '/media-service/vod?recordingId=101112') {
      return Promise.reject({
        response: {
          status: 404,
        },
      });
    }
    if (url === '/media-service/vod?recordingId=789') {
      return Promise.reject(new Error('dunno'));
    }
    if (url === '/portal-terms-and-conditions/latest') {
      return Promise.resolve({
        status: 200,
        data: {
          id: '12345678-1234-1234-1234-1234567890ab',
          type: 'portal',
          html: 'Terms and conditions',
          created_at: '2021-09-01T12:00:00Z',
        },
      });
    }
    throw new Error('Invalid URL: ' + url);
  });
  mockedAxios.post.mockImplementation((url, data, _config) => {
    if (url === '/accept-terms-and-conditions/12345678-1234-1234-1234-1234567890ab') {
      return Promise.resolve({
        status: 200,
      });
    }
    throw new Error('Invalid URL: ' + url);
  });
  mockedAxios.create.mockImplementation(() => mockedAxios);

  const otherXUserId = 'a114f40e-bdba-432d-b53f-37169ee5bf90';

  test('get recording missing', async () => {
    const recording = await preClient.getRecording(mockXUserId, mockRecordingMissingId);
    expect(recording).toBeNull();
  });
  test('get recording no permissions', async () => {
    const recording = await preClient.getRecording(mockXUserId, mockRecordingNoPermsId);
    expect(recording).toBeNull();
  });

  test('get recording', async () => {
    const recording = await preClient.getRecording(mockXUserId, mockRecordingId);
    expect(recording).toBeTruthy();
    expect(recording?.id).toBe(mockRecordingId);
  });
  test('get recordings', async () => {
    const request = {} as SearchRecordingsRequest;
    const { recordings, pagination } = await preClient.getRecordings(mockXUserId, request);
    expect(recordings).toBeTruthy();
    expect(recordings.length).toBe(2);
    expect(pagination).toBeTruthy();
  });
  test('get recordings no results', async () => {
    const request = {} as SearchRecordingsRequest;
    const { recordings, pagination } = await preClient.getRecordings(otherXUserId, request);
    expect(recordings).toBeTruthy();
    expect(recordings.length).toBe(0);
    expect(pagination).toBeTruthy();
  });
  test('network error', async () => {
    try {
      await preClient.getRecordings(otherXUserId, { caseReference: 'uhoh' } as SearchRecordingsRequest);
      expect(true).toBe(false); // shouldn't get here...
    } catch (e) {
      expect(e).toBe('Network Error');
    }
  });
  test('get user by email ok', async () => {
    const user = await preClient.getUserByClaimEmail('test@testy.com');
    expect(user).toBeTruthy();
    expect(user.user.email).toBe('test@testy.com');
  });
  test('get user by email inactive', async () => {
    const t = async () => {
      await preClient.getUserByClaimEmail('inactive@testy.com');
    };
    await expect(t).rejects.toThrow('User is not active: inactive@testy.com');
  });
  test("user doesn't have a portal_access object in their profile", async () => {
    try {
      await preClient.getUserByClaimEmail('noportal_access@testy.com');
    } catch (e) {
      expect(e.message).toEqual(
        'User access is not available at this time. Please confirm with support if access is expected.'
      );
    }
  });
  test("User doesn't exist in the API", async () => {
    const t = async () => {
      await preClient.getUserByClaimEmail('noapi@testy.com');
    };
    await expect(t).rejects.toThrow('User has not been invited to the portal');
  });
  test('getActiveUserByEmail inactive', async () => {
    const t = async () => {
      await preClient.getActiveUserByEmail('getActiveUserByEmail@inactive.com');
    };
    await expect(t).rejects.toThrow('User is not active: getActiveUserByEmail@inactive.com');
  });
  test('getActiveUserByEmail no portal_access', async () => {
    const t = async () => {
      await preClient.getActiveUserByEmail('getActiveUserByEmail@noportal_access.com');
    };
    await expect(t).rejects.toThrow(
      'User does not have access to the portal: getActiveUserByEmail@noportal_access.com'
    );
  });
  test('getActiveUserByEmail ok', async () => {
    const userProfile = await preClient.getActiveUserByEmail('getActiveUserByEmail@ok.com');
    expect(userProfile).toBeTruthy();
  });
  test('putAudit created', async () => {
    const req = {
      id: '12345678-1234-1234-1234-1234567890ab',
      functional_area: 'Video Player',
      category: 'Recording',
      activity: 'Play',
      source: 'PORTAL',
      audit_details: {
        recordingId: mockRecordingId,
      },
    } as PutAuditRequest;
    // @ts-ignore
    const res = await preClient.putAudit(mockXUserId, req);
    expect(res).toBeTruthy();
    expect(res?.status).toBe(201);
  });
  test('putAudit error', async () => {
    mockedAxios.put.mockRejectedValue(new Error('Axios Put Error'));
    const req = {
      id: '12345678-1234-1234-1234-1234567890ab',
      functional_area: 'Video Player',
      category: 'Recording',
      activity: 'Play',
      source: 'PORTAL',
      audit_details: {
        recordingId: mockRecordingId,
      },
    } as PutAuditRequest;
    let error: { message: any } | undefined;
    try {
      await expect(await preClient.putAudit(mockXUserId, req)).rejects.toThrow('Axios Put Error');
    } catch (e) {
      error = e;
    }
    expect(error).toBeTruthy();
    expect(error?.message).toEqual('Axios Put Error');
  });

  test('getRecordingPlaybackDataMk success', async () => {
    var result = await preClient.getRecordingPlaybackDataMk('456', '123');
    expect(result).toBeTruthy();
    expect(result?.id).toEqual(mockRecordings[0].id);
  });

  test('getRecordingPlaybackDataMk 404', async () => {
    var result = await preClient.getRecordingPlaybackDataMk('456', '101112');
    expect(result).toEqual(null);
  });

  test('getRecordingPlaybackDataMk exception', async () => {
    const t = async () => {
      await preClient.getRecordingPlaybackDataMk('456', '789');
    };
    await expect(t).rejects.toThrow('dunno');
  });

  test('getLatestTermsAndConditions', async () => {
    const result = await preClient.getLatestTermsAndConditions();
    expect(result).toBeTruthy();
    expect(result?.id).toEqual('12345678-1234-1234-1234-1234567890ab');
  });

  test('getLatestTermsAndConditions error', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Axios Get Error'));
    let error: { message: any } | undefined;
    try {
      await preClient.getLatestTermsAndConditions();
    } catch (e) {
      error = e;
    }
    expect(error).toBeTruthy();
    expect(error?.message).toEqual('Axios Get Error');
  });

  test('acceptTermsAndConditions', async () => {
    await preClient.acceptTermsAndConditions('456', '12345678-1234-1234-1234-1234567890ab');
  });

  test('acceptTermsAndConditions error', async () => {
    mockedAxios.post.mockRejectedValue(new Error('Axios Post Error'));
    let error: { message: any } | undefined;
    try {
      await preClient.acceptTermsAndConditions('456', '12345678-1234-1234-1234-1234567890ab');
    } catch (e) {
      error = e;
    }
    expect(error).toBeTruthy();
    expect(error?.message).toEqual('Axios Post Error');
  });

  test('acceptTermsAndConditions response not 200', async () => {
    mockedAxios.post.mockResolvedValue({ status: 500 });
    const t = async () => {
      await preClient.acceptTermsAndConditions('456', '12345678-1234-1234-1234-1234567890ab');
    };
    await expect(t).rejects.toThrow('Failed to accept terms and conditions');
  });

  test('getEditRequests success', async () => {
    const mockResponse = {
      page: {
        number: 0,
        totalPages: 1,
        totalElements: 2,
        size: 10,
      },
      _embedded: {
        editRequestDTOList: [
          { id: 'edit-1', status: 'PENDING' },
          { id: 'edit-2', status: 'APPROVED' },
        ],
      },
    };

    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: mockResponse });

    const request = { page: 0, size: 10 } as any;
    const result = await preClient.getEditRequests(mockXUserId, request);

    expect(result.edits.length).toBe(2);
    expect(result.pagination.totalElements).toBe(2);
  });

  test('getEditRequests no results', async () => {
    const mockResponse = {
      page: {
        number: 0,
        totalPages: 1,
        totalElements: 0,
        size: 10,
      },
      _embedded: {
        editRequestDTOList: [],
      },
    };

    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: mockResponse });

    const request = { page: 0, size: 10 } as any;
    const result = await preClient.getEditRequests(mockXUserId, request);

    expect(result.edits).toEqual([]);
    expect(result.pagination.totalElements).toBe(0);
  });

  test('postEditsFromCsv success', async () => {
    const mockResponse = { status: 200, data: { message: 'Uploaded successfully' } };
    const mockBuffer = Buffer.from('start,end\n00:01,00:02');

    mockedAxios.post.mockResolvedValueOnce(mockResponse);

    const result = await preClient.postEditsFromCsv(mockXUserId, 'source-id-123', mockBuffer);

    expect(result).toEqual(mockResponse);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      '/edits/from-csv/source-id-123',
      expect.any(FormData),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-User-Id': mockXUserId,
        }),
      })
    );
  });

  test('postEditsFromCsv handles known error response', async () => {
    const mockError = {
      response: {
        status: 400,
        data: { message: 'Invalid CSV format' },
      },
    };

    mockedAxios.post.mockRejectedValueOnce(mockError);

    const mockBuffer = Buffer.from('bad,data');

    await expect(preClient.postEditsFromCsv(mockXUserId, 'source-id-123', mockBuffer)).rejects.toThrow(
      'Invalid CSV format'
    );
  });

  describe('PreClient', () => {
    let client: PreClient;
    const mockRedisClient = { get: jest.fn(), setEx: jest.fn() };

    beforeEach(() => {
      client = new PreClient();
      // inject mock Redis to avoid calling init()
      client.setRedisClientForTest(mockRedisClient);
    });

    test('getLiveEvents returns cached events', async () => {
      mockRedisClient.get.mockResolvedValue(
        JSON.stringify([{ id: 'event1', name: 'Test Event', resource_state: 'Running' }])
      );

      const events = await client.getLiveEvents('user1');
      expect(events).toHaveLength(1);
      expect(mockRedisClient.get).toHaveBeenCalledWith('live-events-user1');
    });

    test('getLiveEvents fetches from API if no cache', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      const mockAxios = axios as jest.Mocked<typeof axios>;
      mockAxios.get.mockResolvedValue({ data: [{ id: 'event2', name: 'API Event', resource_state: 'Stopped' }] });

      const events = await client.getLiveEvents('user2');
      expect(events).toHaveLength(1);
      expect(events[0].name).toBe('API Event');
    });

    test('getCaptureSession formats UUID and fetches', async () => {
      const liveEventId = '123456781234123412341234567890ab';
      const mockAxios = axios as jest.Mocked<typeof axios>;
      mockAxios.get.mockResolvedValue({ data: { case_reference: 'CASE123' } });

      const session = await client.getCaptureSession(liveEventId, 'user1');
      expect(session.case_reference).toBe('CASE123');
    });

    test('getCaptureSession invalid UUID throws', async () => {
      await expect(client.getCaptureSession('badid', 'user1')).rejects.toThrow('Invalid liveEventId length');
    });
  });

  test('getMigrationRecords builds query params and returns data', async () => {
    const mockResponse = {
      data: {
        page: {
          number: 0,
          totalPages: 1,
          totalElements: 2,
          size: 10,
        },
        _embedded: {
          vfMigrationRecordDTOList: [{ id: 'rec1' }, { id: 'rec2' }],
        },
      },
    };

    mockedAxios.get.mockResolvedValueOnce(mockResponse);

    const result = await preClient.getMigrationRecords(
      mockXUserId,
      'CASE123',
      'John Doe',
      'Jane Doe',
      'COURT1',
      'RESOLVED',
      '2024-01-01',
      '2024-01-31',
      ['Incomplete_Data'],
      0,
      10,
      'createTime,DESC'
    );

    expect(mockedAxios.get).toHaveBeenCalledWith(
      '/vf-migration-records',
      expect.objectContaining({
        headers: { 'X-User-Id': mockXUserId },
        params: expect.objectContaining({
          caseReference: 'CASE123',
          witnessName: 'John Doe',
          defendantName: 'Jane Doe',
          courtReference: 'COURT1',
          status: 'RESOLVED',
          createDateFrom: '2024-01-01',
          createDateTo: '2024-01-31',
          reasonIn: ['INCOMPLETE_DATA'],
          page: 0,
          size: 10,
          sort: 'createTime,DESC',
        }),
        paramsSerializer: expect.any(Function),
      })
    );

    expect(result.records.length).toBe(2);
    expect(result.pagination.totalElements).toBe(2);
  });

  test('getMigrationRecords handles empty results', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        page: { number: 0, totalPages: 1, totalElements: 0, size: 10 },
      },
    });

    const result = await preClient.getMigrationRecords(mockXUserId);
    expect(result.records).toEqual([]);
    expect(result.pagination.totalElements).toBe(0);
  });

  test('getMigrationRecords throws on API error', async () => {
    mockedAxios.get.mockRejectedValueOnce({ response: { status: 500, data: 'Server error' } });

    await expect(preClient.getMigrationRecords(mockXUserId)).rejects.toMatchObject({
      response: { status: 500, data: 'Server error' },
    });
  });

  test('submitMigrationRecords calls POST endpoint', async () => {
    mockedAxios.post.mockResolvedValueOnce({ status: 200 });

    await preClient.submitMigrationRecords(mockXUserId);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      '/vf-migration-records/submit',
      null,
      expect.objectContaining({
        headers: { 'X-User-Id': mockXUserId },
      })
    );
  });

  test('submitMigrationRecords throws on error', async () => {
    mockedAxios.post.mockRejectedValueOnce({ response: { status: 500 } });

    await expect(preClient.submitMigrationRecords(mockXUserId)).rejects.toMatchObject({
      response: { status: 500 },
    });
  });

  test('updateMigrationRecord calls PUT endpoint', async () => {
    const mockDto = { status: 'RESOLVED' };
    mockedAxios.put.mockResolvedValueOnce({ status: 200 });

    await preClient.updateMigrationRecord(mockXUserId, 'record-123', mockDto);
    expect(mockedAxios.put).toHaveBeenCalledWith(
      '/vf-migration-records/record-123',
      mockDto,
      expect.objectContaining({
        headers: { 'X-User-Id': mockXUserId },
      })
    );
  });

  test('getCourts calls endpoint and returns data', async () => {
    const mockCourts = [{ id: 'COURT1', name: 'Test Court' }];
    mockedAxios.get.mockResolvedValueOnce({ data: mockCourts });

    const result = await preClient.getCourts(mockXUserId, 1, 25);
    expect(mockedAxios.get).toHaveBeenCalledWith('/courts', {
      headers: { 'X-User-Id': mockXUserId },
      params: { page: 1, size: 25 },
    });
    expect(result).toEqual(mockCourts);
  });

  describe('getUserByEmail', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('returns user profile for regular email', async () => {
      const mockUser = { ...mockeduser };
      mockedAxios.get.mockResolvedValueOnce({ status: 200, data: mockUser });

      const result = await preClient.getUserByEmail('regular@example.com');

      expect(result).toBeTruthy();
      expect(result.user.email).toBe('test@testy.com');
      expect(mockedAxios.get).toHaveBeenCalledWith('/users/by-email/' + encodeURIComponent('regular@example.com'));
    });

    test('returns user profile for non-cjsm email without update', async () => {
      const mockUser = { ...mockeduser };
      mockedAxios.get.mockResolvedValueOnce({ status: 200, data: mockUser });

      const result = await preClient.getUserByEmail('user@example.com');

      expect(result).toBeTruthy();
      expect(mockedAxios.put).not.toHaveBeenCalled();
    });

    test('detects CJSM email and updates user when alternative_email matches', async () => {
      const mockUser = {
        ...mockeduser,
        user: {
          ...mockeduser.user,
          email: 'original@example.com',
          alternative_email: 'user@test.cjsm.net',
        },
        portal_access: [
          {
            deleted_at: null,
            id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
            invited_at: '2024-03-13T11:22:03.655Z',
            last_access: null,
            registered_at: null,
            status: AccessStatus.ACTIVE,
          },
        ],
      };

      mockedAxios.get.mockResolvedValueOnce({ status: 200, data: mockUser });
      mockedAxios.put.mockResolvedValueOnce({ status: 200 });

      const result = await preClient.getUserByEmail('user@test.cjsm.net');

      expect(result).toBeTruthy();
      expect(result.user.email).toBe('user@test.cjsm.net');
      expect(result.user.alternative_email).toBe('original@example.com');
      expect(mockedAxios.put).toHaveBeenCalledWith(
        '/users/' + mockUser.user.id,
        expect.objectContaining({
          id: mockUser.user.id,
          email: 'user@test.cjsm.net',
          alternative_email: 'original@example.com',
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-User-Id': expect.any(String),
          }),
        })
      );
    });

    test('does not update user for CJSM email when alternative_email does not match', async () => {
      const mockUser = {
        ...mockeduser,
        user: {
          ...mockeduser.user,
          email: 'original@example.com',
          alternative_email: 'different@test.com',
        },
        portal_access: [
          {
            deleted_at: null,
            id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
            invited_at: '2024-03-13T11:22:03.655Z',
            last_access: null,
            registered_at: null,
            status: AccessStatus.ACTIVE,
          },
        ],
      };

      mockedAxios.get.mockResolvedValueOnce({ status: 200, data: mockUser });

      const result = await preClient.getUserByEmail('user@test.cjsm.net');

      expect(result).toBeTruthy();
      expect(result.user.email).toBe('original@example.com');
      expect(mockedAxios.put).not.toHaveBeenCalled();
    });

    test('does not update user for CJSM email when portal_access is empty', async () => {
      const mockUser = {
        ...mockeduser,
        user: {
          ...mockeduser.user,
          email: 'original@example.com',
          alternative_email: 'user@test.cjsm.net',
        },
        portal_access: [],
      };

      mockedAxios.get.mockResolvedValueOnce({ status: 200, data: mockUser });

      const result = await preClient.getUserByEmail('user@test.cjsm.net');

      expect(result).toBeTruthy();
      expect(result.user.email).toBe('original@example.com');
      expect(mockedAxios.put).not.toHaveBeenCalled();
    });

    test('handles CJSM email with case-insensitive matching', async () => {
      const mockUser = {
        ...mockeduser,
        user: {
          ...mockeduser.user,
          email: 'original@example.com',
          alternative_email: 'User@Test.CJSM.NET',
        },
        portal_access: [
          {
            deleted_at: null,
            id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
            invited_at: '2024-03-13T11:22:03.655Z',
            last_access: null,
            registered_at: null,
            status: AccessStatus.ACTIVE,
          },
        ],
      };

      mockedAxios.get.mockResolvedValueOnce({ status: 200, data: mockUser });
      mockedAxios.put.mockResolvedValueOnce({ status: 200 });

      const result = await preClient.getUserByEmail('User@Test.CJSM.NET');

      expect(result).toBeTruthy();
      expect(result.user.email).toBe('user@test.cjsm.net');
      expect(mockedAxios.put).toHaveBeenCalled();
    });

    test('throws error when user API call fails', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { message: 'User not found' },
        },
      });

      await expect(preClient.getUserByEmail('notfound@example.com')).rejects.toMatchObject({
        response: {
          status: 404,
        },
      });
    });

    test('handles null alternative_email gracefully', async () => {
      const mockUser = {
        ...mockeduser,
        user: {
          ...mockeduser.user,
          email: 'user@example.com',
          alternative_email: null,
        },
      };

      mockedAxios.get.mockResolvedValueOnce({ status: 200, data: mockUser });

      const result = await preClient.getUserByEmail('different@test.cjsm.net');

      expect(result).toBeTruthy();
      expect(mockedAxios.put).not.toHaveBeenCalled();
    });
  });
});
