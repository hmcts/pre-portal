import { AccessStatus } from '../../types/access-status';
import { TermsNotAcceptedError } from '../../types/errors';
import { Terms } from '../../types/terms';
import { UserProfile } from '../../types/user-profile';
import { RedisService } from '../../app/redis/RedisService';
import { LiveEvent } from '../../types/live-event';
import {
  EditRequest,
  Pagination,
  PutAuditRequest,
  Recording,
  SearchEditsRequest,
  SearchRecordingsRequest,
  CaptureSession,
} from './types';

import { Logger } from '@hmcts/nodejs-logging';
import axios, { AxiosResponse } from 'axios';
import FormData from 'form-data';
import config from 'config';
import { HealthResponse } from '../../types/health';
import { Court } from '../../types/court';
import qs from 'qs';
import { UpdateUser } from '../../types/update-user';

export class PreClient {
  logger = Logger.getLogger('pre-client');
  private readonly redisService = new RedisService();
  private redisClient: any;

  public setRedisClientForTest(mockClient: any) {
    this.redisClient = mockClient;
  }

  public async init() {
    const redisHost = config.get('session.redis.host') as string;
    const redisKey = config.get('session.redis.key') as string;
    await this.initializeRedisClient(redisHost, redisKey);
  }
  private async initializeRedisClient(redisHost: string, redisKey: string) {
    try {
      this.redisClient = await this.redisService.getClient(redisHost, redisKey, this.logger);
      this.logger.info(' Redis client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Redis client:', error);
    }
  }

  private extractPaginationAndData<T>(response: any, embeddedKey: string): { data: T[]; pagination: Pagination } {
    const pagination: Pagination = {
      currentPage: response.data.page.number,
      totalPages: response.data.page.totalPages,
      totalElements: response.data.page.totalElements,
      size: response.data.page.size,
    };

    const data: T[] = response.data.page.totalElements === 0 ? [] : (response.data._embedded[embeddedKey] as T[]);

    return { data, pagination };
  }

  public async healthCheck(): Promise<AxiosResponse<HealthResponse>> {
    try {
      return await axios.get<HealthResponse>('/health');
    } catch (error) {
      this.logger.error('Health check failed:', error);
      throw error;
    }
  }

  public async putAudit(xUserId: string, request: PutAuditRequest): Promise<AxiosResponse> {
    try {
      return await axios.put('/audit/' + request.id, request, {
        headers: {
          'X-User-Id': xUserId,
        },
      });
    } catch (e) {
      this.logger.error(e.message);
      throw e;
    }
  }

  public async getUserByClaimEmail(email: string): Promise<UserProfile> {
    let userProfile: UserProfile;
    try {
      userProfile = await this.getUserByEmail(email);
    } catch (e) {
      this.logger.error(e.message);
      throw new Error('User has not been invited to the portal');
    }

    if (
      !userProfile.portal_access ||
      (Array.isArray(userProfile.portal_access) && userProfile.portal_access.length === 0)
    ) {
      const invitedUser = await this.isInvitedUser(email);
      if (!invitedUser) {
        throw new Error(
          'User access is not available at this time. Please confirm with support if access is expected.'
        );
      }
      try {
        await this.redeemInvitedUser(email);
        userProfile = await this.getUserByEmail(email);
      } catch (e) {
        throw new Error('Error redeeming user invitation: ' + email);
      }
    } else if (userProfile.portal_access[0].status === AccessStatus.INACTIVE) {
      throw new Error('User is not active: ' + email);
    }

    return userProfile;
  }

  public async isInvitedUser(email: string): Promise<boolean> {
    try {
      const response = await axios.get('/invites', {
        params: {
          email,
          status: AccessStatus.INVITATION_SENT,
        },
      });
      return response.data.page.totalElements > 0;
    } catch (e) {
      this.logger.error(e.message);
      return false;
    }
  }

  public async redeemInvitedUser(email: string): Promise<void> {
    await axios.post(
      '/invites/redeem',
      {},
      {
        params: {
          email,
        },
      }
    );
  }

  public async getUserByEmail(email: string): Promise<UserProfile> {
    const response = await axios.get('/users/by-email/' + encodeURIComponent(email));
    // check if this is a cjsm email
    const data = response.data as UserProfile;
    this.logger.info('Fetched user by email: ' + email);
    if (
      email.toLowerCase().endsWith('.cjsm.net') &&
      data.user.alternative_email?.toLowerCase() == email.toLowerCase() &&
      data.portal_access.length > 0
    ) {
      this.logger.info('CJSM email detected for user: ' + this.obfuscateEmail(email));
      // update the user
      data.user.alternative_email = data.user.email;
      data.user.email = email.toLowerCase();
      await this.updateUser(UpdateUser.fromUserProfile(data));
      this.logger.info('Updated user email to CJSM email for user: ' + this.obfuscateEmail(email));
    }
    return data;
  }

  private async updateUser(user: UpdateUser) {
    const portalXUserId = config.get('pre.portalXUserId') as string;
    // PUT to API
    await axios.put('/users/' + user.id, user, {
      headers: {
        'X-User-Id': portalXUserId,
      },
    });
  }

  private obfuscateEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    const obfuscatedLocalPart =
      localPart.length <= 2
        ? localPart[0] + '*'
        : localPart[0] + '*'.repeat(localPart.length - 2) + localPart.slice(-1);
    return `${obfuscatedLocalPart}@${domain}`;
  }

  public async getActiveUserByEmail(email: string): Promise<UserProfile> {
    const userProfile = await this.getUserByEmail(email);
    if (!userProfile.portal_access || userProfile.portal_access.length === 0) {
      throw new Error('User does not have access to the portal: ' + email);
    } else if (userProfile.portal_access[0].status === AccessStatus.INACTIVE) {
      throw new Error('User is not active: ' + email);
    } else if (!userProfile.terms_accepted || !userProfile.terms_accepted['PORTAL']) {
      throw new TermsNotAcceptedError(email);
    }
    return userProfile;
  }

  public async getRecordings(
    xUserId: string,
    request: SearchRecordingsRequest
  ): Promise<{ recordings: Recording[]; pagination: Pagination }> {
    this.logger.debug('Getting recordings with request: ' + JSON.stringify(request));

    try {
      const response = await axios.get('/recordings', {
        headers: {
          'X-User-Id': xUserId,
        },
        params: request,
      });

      const { data, pagination } = this.extractPaginationAndData<Recording>(response, 'recordingDTOList');
      return { recordings: data, pagination };
    } catch (e) {
      // log the error
      this.logger.info('path', e.response?.request.path);
      this.logger.info('res headers', e.response?.headers);
      this.logger.info('data', e.response?.data);
      // rethrow the error for the UI
      throw e;
    }
  }

  public async getEditRequests(
    xUserId: string,
    request: SearchEditsRequest
  ): Promise<{ edits: EditRequest[]; pagination: Pagination }> {
    this.logger.debug('Getting edit requests with request: ' + JSON.stringify(request));

    try {
      const response = await axios.get('/edits', {
        headers: {
          'X-User-Id': xUserId,
        },
        params: request,
      });

      const { data, pagination } = this.extractPaginationAndData<EditRequest>(response, 'editRequestDTOList');
      return { edits: data, pagination };
    } catch (e) {
      this.logger.info('path', e.response?.request.path);
      this.logger.info('res headers', e.response?.headers);
      this.logger.info('data', e.response?.data);
      // rethrow the error for the UI
      throw e;
    }
  }

  public async getRecording(xUserId: string, id: string): Promise<Recording | null> {
    try {
      const response = await axios.get(`/recordings/${id}`, {
        headers: {
          'X-User-Id': xUserId,
        },
      });

      return response.data as Recording;
    } catch (e) {
      // handle 403 and 404 the same so we don't expose the existence of recordings
      if (e.response?.status === 404 || e.response?.status === 403) {
        return null;
      }

      throw e;
    }
  }

  public async getRecordingPlaybackDataMk(xUserId: string, id: string): Promise<Recording | null> {
    try {
      const response = await axios.get(`/media-service/vod?recordingId=${id}`, {
        headers: {
          'X-User-Id': xUserId,
        },
      });

      return response.data as Recording;
    } catch (e) {
      if (e.response?.status === 404) {
        return null;
      }

      this.logger.error(e.message);
      throw e;
    }
  }

  public async getLatestTermsAndConditions(): Promise<Terms> {
    try {
      const response = await axios.get('/portal-terms-and-conditions/latest');
      return response.data as Terms;
    } catch (e) {
      this.logger.error(e.message);
      throw e;
    }
  }

  public async acceptTermsAndConditions(xUserId: string, termsId: string): Promise<void> {
    const response = await axios.post(`/accept-terms-and-conditions/${termsId}`, null, {
      headers: {
        'X-User-Id': xUserId,
      },
    });
    if (response.status.toString().substring(0, 1) !== '2') {
      throw new Error('Failed to accept terms and conditions');
    }
  }

  public async getLiveEvents(xUserId: string): Promise<LiveEvent[]> {
    try {
      if (!this.redisClient) {
        this.logger.warn('Redis client is not available, fetching live events from API');
        return this.fetchLiveEventsFromAPI(xUserId);
      }

      const cacheKey = `live-events-${xUserId}`;
      const cachedEvents = await this.redisClient.get(cacheKey);

      if (cachedEvents) {
        this.logger.info('Returning cached live events');
        return JSON.parse(cachedEvents) as LiveEvent[];
      }

      this.logger.info('Fetching live events from API...');
      const liveEvents = await this.fetchLiveEventsFromAPI(xUserId);

      await this.redisClient.setEx(cacheKey, 30, JSON.stringify(liveEvents));
      this.logger.info('Live events cached successfully');

      return liveEvents;
    } catch (e) {
      this.logger.error('Error fetching live events:', e);
      throw new Error(`Failed to fetch live events: ${e.message || e}`);
    }
  }

  private async fetchLiveEventsFromAPI(xUserId: string): Promise<LiveEvent[]> {
    const response = await axios.get('/media-service/live-events', {
      headers: { 'X-User-Id': xUserId },
    });
    return response.data as LiveEvent[];
  }

  public async getCaptureSession(liveEventId: string, xUserId: string): Promise<CaptureSession> {
    try {
      function formatToUUID(liveEventId) {
        if (liveEventId.length !== 32) {
          throw new Error('Invalid liveEventId length');
        }
        return liveEventId.replace(
          /([a-f0-9]{8})([a-f0-9]{4})([a-f0-9]{4})([a-f0-9]{4})([a-f0-9]{12})/,
          '$1-$2-$3-$4-$5'
        );
      }

      const formattedUUID = formatToUUID(liveEventId);

      const response = await axios.get(`/capture-sessions/${formattedUUID}`, {
        headers: { 'X-User-Id': xUserId },
      });
      return response.data as CaptureSession;
    } catch (e) {
      this.logger.error(e.message);
      throw e;
    }
  }

  public async postEditsFromCsv(xUserId: string, sourceRecordingId: string, csvFile: Buffer): Promise<AxiosResponse> {
    try {
      const formData = new FormData();
      formData.append('file', csvFile, {
        filename: 'upload.csv',
        contentType: 'text/csv',
      });

      return await axios.post(`/edits/from-csv/${sourceRecordingId}`, formData, {
        headers: {
          'X-User-Id': xUserId,
          ...formData.getHeaders(),
        },
        maxBodyLength: 2 * 1024 * 1024, // 2 MB,
      });
    } catch (e) {
      if (e.response?.status === 400 || e.response?.status === 404) {
        throw new Error(e.response?.data?.message);
      }
      throw e;
    }
  }

  public async getMigrationRecords(
    xUserId: string,
    caseReference?: string,
    witnessName?: string,
    defendantName?: string,
    courtReference?: string,
    status?: string,
    createDateFrom?: string,
    createDateTo?: string,
    reasonIn?: string[],
    page?: number,
    size?: number,
    sort?: string
  ): Promise<{ records: any[]; pagination: Pagination }> {
    try {
      const queryParams: Record<string, any> = {};

      if (caseReference) queryParams.caseReference = caseReference;
      if (witnessName) queryParams.witnessName = witnessName;
      if (defendantName) queryParams.defendantName = defendantName;
      if (courtReference) queryParams.courtReference = courtReference;
      const statusMap: Record<string, string> = {
        Unresolved: 'FAILED',
        Resolved: 'RESOLVED',
        Pending: 'PENDING',
      };
      if (status) queryParams.status = statusMap[status] || status.toUpperCase();
      if (createDateFrom) queryParams.createDateFrom = createDateFrom;
      if (createDateTo) queryParams.createDateTo = createDateTo;

      if (reasonIn) queryParams.reasonIn = reasonIn;
      if (page !== undefined) queryParams.page = page;
      if (size !== undefined) queryParams.size = size;

      if (sort) queryParams.sort = sort;

      const VfFailureReasonMap: Record<string, string> = {
        Incomplete_Data: 'INCOMPLETE_DATA',
        Invalid_Format: 'INVALID_FORMAT',
        Not_Most_Recent: 'NOT_MOST_RECENT',
        Raw_Files: 'RAW_FILES',
        Pre_Go_Live: 'PRE_GO_LIVE',
        Pre_Existing: 'PRE_EXISTING',
        Validation_Failed: 'VALIDATION_FAILED',
        Alternative_Available: 'ALTERNATIVE_AVAILABLE',
        General_Error: 'GENERAL_ERROR',
        Case_Closed: 'CASE_CLOSED',
        Test: 'TEST',
      };

      function mapReasonsToEnum(reasons?: string[]): string[] | undefined {
        if (!reasons || reasons.length === 0) return undefined;
        return reasons.map(r => VfFailureReasonMap[r] || r);
      }

      if (reasonIn && reasonIn.length > 0) {
        queryParams.reasonIn = mapReasonsToEnum(reasonIn);
      }

      this.logger.info('Final queryParams.reasonIn:', queryParams.reasonIn);

      const response = await axios.get('/vf-migration-records', {
        headers: { 'X-User-Id': xUserId },
        params: queryParams,
        paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' }),
      });

      const pagination = {
        currentPage: response.data['page']['number'],
        totalPages: response.data['page']['totalPages'],
        totalElements: response.data['page']['totalElements'],
        size: response.data['page']['size'],
      } as Pagination;
      const records =
        pagination.totalElements === 0 ? [] : (response.data['_embedded']?.['vfMigrationRecordDTOList'] as any[]);

      return { records, pagination };
    } catch (e: any) {
      console.error('Error fetching migration records', {
        path: e.response?.request?.path,
        status: e.response?.status,
        data: e.response?.data,
      });
      throw e;
    }
  }
  public async submitMigrationRecords(xUserId: string): Promise<void> {
    try {
      await axios.post('/vf-migration-records/submit', null, {
        headers: {
          'X-User-Id': xUserId,
        },
      });
    } catch (e: any) {
      this.logger.info('submitMigrationRecords error path:', e.response?.request?.path);
      this.logger.info('res headers:', e.response?.headers);
      this.logger.info('data:', e.response?.data);
      throw e;
    }
  }

  public async updateMigrationRecord(xUserId: string, recordId: string, dto: any): Promise<void> {
    this.logger.debug('dto', JSON.stringify(dto));
    try {
      await axios.put(`/vf-migration-records/${recordId}`, dto, {
        headers: {
          'X-User-Id': xUserId,
        },
      });
    } catch (e: any) {
      this.logger.info('updateMigrationRecord error path:', e.response?.request?.path);
      this.logger.info('res headers:', e.response?.headers);
      this.logger.info('data:', e.response?.data);
      throw e;
    }
  }

  public async getCourts(xUserId: string, page: number = 0, size: number = 50): Promise<any> {
    const response = await axios.get(`/courts`, {
      headers: { 'X-User-Id': xUserId },
      params: { page, size },
    });

    return response.data as Court[];
  }
}
