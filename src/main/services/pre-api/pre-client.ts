import { AccessStatus } from '../../types/access-status';
import { TermsNotAcceptedError } from '../../types/errors';
import { Terms } from '../../types/terms';
import { UserProfile } from '../../types/user-profile';

import {
  Audit,
  Court,
  PaginatedRequest,
  Pagination,
  PutAuditRequest,
  Recording,
  RecordingPlaybackData,
  SearchAuditLogsRequest,
  SearchRecordingsRequest,
} from './types';
import { LiveEvent } from '../../types/live-event';

import { Logger } from '@hmcts/nodejs-logging';
import axios, { AxiosResponse } from 'axios';
import config from 'config';
import { HealthResponse } from '../../types/health';

export class PreClient {
  logger = Logger.getLogger('pre-client');

  public createPagination(
    pagination: Pagination,
    url: string,
    pageTitle: string,
    resourceLength: number
  ): {
    paginationLinks: {
      previous: {};
      next: {};
      items: ({ href: string; number: number; current: boolean } | { ellipsis: boolean })[];
    };
    title: string;
  } {
    const paginationLinks = {
      previous: {},
      next: {},
      items: [] as ({ href: string; number: number; current: boolean } | { ellipsis: boolean })[],
    };

    // Add previous link if not on the first page
    if (pagination.currentPage > 0) {
      paginationLinks.previous = {
        href: `/` + url + `?page=${pagination.currentPage - 1}`,
      };
    }

    // Add next link if not on the last page
    if (pagination.currentPage < pagination.totalPages - 1) {
      paginationLinks.next = {
        href: `/` + url + `?page=${pagination.currentPage + 1}`,
      };
    }

    // Always add the first page
    paginationLinks.items.push({
      href: '/' + url + '?page=0',
      number: 1,
      current: 0 === pagination.currentPage,
    });

    // Add an ellipsis after the first page if the 2nd page is not in the window
    if (pagination.currentPage > 3) {
      paginationLinks.items.push({ ellipsis: true });
    }

    // Add the pages immediately 2 before and 2 after the current page to create a rolling window of 5 pages
    for (
      let i = Math.max(1, pagination.currentPage - 2);
      i <= Math.min(pagination.currentPage + 2, pagination.totalPages - 2);
      i++
    ) {
      paginationLinks.items.push({
        href: `/` + url + `?page=${i}`,
        number: i + 1,
        current: i === pagination.currentPage,
      });
    }

    // Add an ellipsis before the last page if the 2nd last page is not in the window
    if (pagination.currentPage < pagination.totalPages - 4) {
      paginationLinks.items.push({ ellipsis: true });
    }

    // Add the last page if there is more than one page (don't repeat the first page)
    if (pagination.totalPages > 1) {
      paginationLinks.items.push({
        href: `/` + url + `?page=${pagination.totalPages - 1}`,
        number: pagination.totalPages,
        current: pagination.totalPages - 1 === pagination.currentPage,
      });
    }

    let title = pageTitle;
    if (resourceLength > 0) {
      title =
        pageTitle +
        ` ${pagination.currentPage * pagination.size + 1} to ${Math.min(
          (pagination.currentPage + 1) * pagination.size,
          pagination.totalElements
        )} of ${pagination.totalElements}`;
    }
    return { paginationLinks, title };
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

  public async getAudit(xUserId: string, id: string): Promise<Audit | null> {
    try {
      const response = await axios.get('/audit/' + id, {
        headers: {
          'X-User-Id': xUserId,
        },
      });

      return response.data as Audit;
    } catch (e) {
      if (e.response?.status === 404) {
        return null;
      }
      this.logger.error(e);
      throw e;
    }
  }

  public async getAuditLogs(
    xUserId: string,
    request: SearchAuditLogsRequest
  ): Promise<{ auditLogs: Audit[]; pagination: Pagination }> {
    this.logger.debug('Getting audit logs');

    try {
      const response = await axios.get('/audit', {
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
      const auditLogs =
        response.data['page']['totalElements'] === 0 ? [] : (response.data['_embedded']['auditDTOList'] as Audit[]);

      return { auditLogs, pagination };
    } catch (e) {
      // log the error
      this.logger.info('path', e.response?.request.path);
      this.logger.info('res headers', e.response?.headers);
      this.logger.info('data', e.response?.data);
      // rethrow the error for the UI
      throw e;
    }
  }

  public async getCourts(
    xUserId: string,
    request: PaginatedRequest
  ): Promise<{ courts: Court[]; pagination: Pagination }> {
    this.logger.debug('Getting courts with request: ' + JSON.stringify(request));

    try {
      const response = await axios.get('/courts', {
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
      const courts =
        response.data['page']['totalElements'] === 0 ? [] : (response.data['_embedded']['courtDTOList'] as Court[]);

      return { courts, pagination };
    } catch (e) {
      // log the error
      this.logger.info('path', e.response?.request.path);
      this.logger.info('res headers', e.response?.headers);
      this.logger.info('data', e.response?.data);
      // rethrow the error for the UI
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
      // log the error
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

  public async getRecordingPlaybackDataMk(xUserId: string, id: string): Promise<RecordingPlaybackData | null> {
    try {
      const response = await axios.get(`/media-service/vod?recordingId=${id}`, {
        headers: {
          'X-User-Id': xUserId,
        },
      });

      return response.data as RecordingPlaybackData;
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
      const response = await axios.get('/media-service/live-events', {
        headers: {
          'X-User-Id': xUserId,
        },
      });
      console.log(response.data);
      return response.data as LiveEvent[];
    } catch (e) {
      console.error('Error fetching live events:', e);

      throw new Error(`Failed to fetch live events: ${e.message || e}`);
    }
  }
}
