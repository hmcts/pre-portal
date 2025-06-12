import { mockedPaginatedRecordings, mockRecordings, mockXUserId } from '../mock-api';
import { PreClient } from '../../main/services/pre-api/pre-client';
import { PutAuditRequest, SearchRecordingsRequest } from '../../main/services/pre-api/types';
import { describe } from '@jest/globals';
import axios from 'axios';
import { mockeduser } from './test-helper';
import { AccessStatus } from '../../main/types/access-status';

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
});
