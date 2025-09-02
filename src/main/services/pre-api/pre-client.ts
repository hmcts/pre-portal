import { AccessStatus } from '../../types/access-status';
import { TermsNotAcceptedError } from '../../types/errors';
import { Terms } from '../../types/terms';
import { UserProfile } from '../../types/user-profile';

import {
  EditRequest,
  Pagination,
  PutAuditRequest,
  Recording,
  SearchEditsRequest,
  SearchRecordingsRequest,
} from './types';

import { Logger } from '@hmcts/nodejs-logging';
import axios, { AxiosResponse } from 'axios';
import FormData from 'form-data';

export class PreClient {
  logger = Logger.getLogger('pre-client');

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

  public async healthCheck(): Promise<void> {
    await axios.get('/health');
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
    return response.data as UserProfile;
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
      this.logger.debug('Response' + response?.data);
      this.logger.debug('X-User-ID' + xUserId);
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
}
