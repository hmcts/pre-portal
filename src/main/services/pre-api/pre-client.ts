import { AccessStatus } from '../../types/access-status';
import { TermsNotAcceptedError } from '../../types/errors';
import { Terms } from '../../types/terms';
import { UserProfile } from '../../types/user-profile';

import { Pagination, PutAuditRequest, Recording, SearchRecordingsRequest } from './types';
import { RedisService } from '../../app/redis/RedisService';

import { LiveEvent } from '../../types/live-event';
import { CaptureSession } from './types';

import { Logger } from '@hmcts/nodejs-logging';
import axios, { AxiosResponse } from 'axios';
import config from 'config';
import { HealthResponse } from '../../types/health';
//import { VfMigrationRecord } from '../../types/vf-migration-record'
import { Court } from '../../types/court';
import qs from 'qs';

export class PreClient {
  logger = Logger.getLogger('pre-client');
  private redisService = new RedisService();
  private redisClient: any;

  constructor() {
    const redisHost = config.get('session.redis.host') as string;
    const redisKey = config.get('session.redis.key') as string;

    this.initializeRedisClient(redisHost, redisKey);
  }

  private async initializeRedisClient(redisHost: string, redisKey: string) {
    try {
      this.redisClient = await this.redisService.getClient(redisHost, redisKey, this.logger);
      this.logger.info(' Redis client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Redis client:', error);
    }
  }
  public healthCheck() {
    return axios.get<HealthResponse>('/health');
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
      console.log(userProfile);
    } catch (e) {
      console.log(email);
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
    return response.data as UserProfile;
  }

  public async getActiveUserByEmail(email: string): Promise<UserProfile> {
    const userProfile = await this.getUserByEmail(email);
    if (!userProfile.portal_access || userProfile.portal_access.length === 0) {
      throw new Error('User does not have access to the portal: ' + email);
    } else if (userProfile.portal_access[0].status === AccessStatus.INACTIVE) {
      throw new Error('User is not active: ' + email);
    } else if (!userProfile.terms_accepted || !userProfile.terms_accepted['PORTAL']) {
      if (config.get('pre.tsAndCsRedirectEnabled') === 'true') {
        throw new TermsNotAcceptedError(email);
      }
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

      const pagination = {
        currentPage: response.data['page']['number'],
        totalPages: response.data['page']['totalPages'],
        totalElements: response.data['page']['totalElements'],
        size: response.data['page']['size'],
      } as Pagination;
      const recordings =
        response.data['page']['totalElements'] === 0
          ? []
          : (response.data['_embedded']['recordingDTOList'] as Recording[]);

      return { recordings, pagination };
    } catch (e) {
      this.logger.info('path', e.response?.request.path);
      this.logger.info('res headers', e.response?.headers);
      this.logger.info('data', e.response?.data);
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
      function formatDate(dateString?: string): string | undefined {
        if (!dateString) return undefined;

        const [day, month, year] = dateString.split('/');
        if (!day || !month || !year) return undefined;

        return `${year}-${month}-${day}`;
      }

      if (createDateFrom) queryParams.createDateFrom = formatDate(createDateFrom);
      if (createDateTo) queryParams.createDateTo = formatDate(createDateTo);

      if (reasonIn) queryParams.reasonIn = reasonIn;
      if (page !== undefined) queryParams.page = page;
      if (size !== undefined) queryParams.size = size;

      if (sort) queryParams.sort = sort;

      console.log('Calling Migration API with params:', queryParams);

      const VfFailureReasonMap: Record<string, string> = {
        Incomplete_Data: 'INCOMPLETE_DATA',
        Invalid_Format: 'INVALID_FORMAT',
        Not_Most_Recent: 'NOT_MOST_RECENT',
        Pre_Go_Live: 'PRE_GO_LIVE',
        Pre_Existing: 'PRE_EXISTING',
        Validation_Failed: 'VALIDATION_FAILED',
        Alternative_Available: 'ALTERNATIVE_AVAILABLE',
        General_Error: 'GENERAL_ERROR',
        Test: 'TEST',
      };

      function mapReasonsToEnum(reasons?: string[]): string[] | undefined {
        if (!reasons || reasons.length === 0) return undefined;
        return reasons.map(r => VfFailureReasonMap[r] || r);
      }

      if (reasonIn && reasonIn.length > 0) {
        queryParams.reasonIn = mapReasonsToEnum(reasonIn);
      }

      console.log('Final queryParams.reasonIn:', queryParams.reasonIn);

      const response = await axios.get('https://pre-api.staging.platform.hmcts.net/vf-migration-records', {
        headers: { 'X-User-Id': xUserId },
        params: queryParams,
        paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' }), // 👈 key line
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
      console.log('records', records);

      //return response.data._embedded?.vfMigrationRecordDTOList || [];
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
      await axios.post('https://pre-api.staging.platform.hmcts.net/vf-migration-records/submit', null, {
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
    console.log('dto', dto);
    try {
      await axios.put(`https://pre-api.staging.platform.hmcts.net/vf-migration-records/${recordId}`, dto, {
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
