import {
  EditRequest,
  Pagination,
  PutAuditRequest,
  Recording,
  RecordingPlaybackData,
  SearchRecordingsRequest,
} from '../main/services/pre-api/types';
import { PreClient } from '../main/services/pre-api/pre-client';
import { AxiosResponse } from 'axios';
import { Terms } from '../main/types/terms';

export const mockRecordings: Recording[] = [
  {
    id: '12345678-1234-1234-1234-1234567890ab',
    parent_recording_id: 'parentId',
    version: 1,
    filename: 'filename',
    duration: 'PT1H1M1S',
    edit_instructions: 'editInstructions',
    case_id: '12345678-1234-1234-1234-1234567890ab',
    capture_session: {
      id: '',
      booking_id: '',
      origin: '',
      ingest_address: '',
      live_output_url: '',
      started_at: '',
      started_by_user_id: '',
      finished_at: '',
      finished_by_user_id: '',
      status: '',
      deleted_at: '',
      court_name: '',
      case_state: 'PENDING_CLOSURE',
    },
    deleted_at: 'deletedAt',
    created_at: 'createdAt',
    case_reference: 'caseReference',
    is_test_case: false,
    participants: [],
  } as Recording,
  {
    id: '12345678-1234-1234-1234-1234567890ac',
    parent_recording_id: 'parentId',
    version: 1,
    filename: 'filename',
    duration: 'PT1H1M1S',
    edit_instructions: 'editInstructions',
    case_id: '12345678-1234-1234-1234-1234567890ac',
    capture_session: {
      id: '',
      booking_id: '',
      origin: '',
      ingest_address: '',
      live_output_url: '',
      started_at: '',
      started_by_user_id: '',
      finished_at: '',
      finished_by_user_id: '',
      status: '',
      deleted_at: '',
      court_name: '',
      case_state: 'OPEN',
    },
    deleted_at: 'deletedAt',
    created_at: 'createdAt',
    case_reference: 'caseReference',
    is_test_case: false,
    participants: [],
  } as Recording,
];

export const mockPagination = {
  currentPage: 0,
  totalPages: 1,
  totalElements: 2,
  size: 10,
} as Pagination;

// needs to return the paginated list
export const mockedPaginatedRecordings = {
  _embedded: {
    recordingDTOList: mockRecordings,
  },
  page: {
    size: 20,
    totalElements: 2,
    totalPages: 1,
    number: 0,
  },
};

export const mockedEditRequest = {
  id: '12345678-1234-1234-1234-1234567890ac',
  source_recording: mockRecordings[0],
  status: 'DRAFT',
  edit_instruction: {
    requestedInstructions: [
      {
        start_of_cut: '00:00:00',
        end_of_cut: '00:00:01',
        reason: 'reason',
      },
      {
        start_of_cut: '00:00:10',
        end_of_cut: '00:00:11',
      },
    ],
  },
};

export const mockXUserId = 'a114f40e-bdba-432d-b53f-37169ee5bf99';

export function mock() {
  mockGetRecording();
  mockGetRecordings();
  mockGetRecordingPlaybackData();
}

export function mockGetRecording(recording?: Recording | null) {
  if (recording !== undefined) {
    jest.spyOn(PreClient.prototype, 'getRecording').mockImplementation(async (xUserId: string, id: string) => {
      return Promise.resolve(recording);
    });
    return;
  }

  jest.spyOn(PreClient.prototype, 'getRecording').mockImplementation(async (xUserId: string, id: string) => {
    return Promise.resolve(mockRecordings.find(r => r.id === id) || null);
  });
}

export function mockGetCurrentEditRequest(editRequests?: EditRequest[] | null) {
  if (editRequests !== undefined) {
    jest
      .spyOn(PreClient.prototype, 'getMostRecentEditRequests')
      .mockImplementation(async (xUserId: string, sourceRecordingId: string) => {
        return Promise.resolve(editRequests);
      });
    return;
  }

  jest
    .spyOn(PreClient.prototype, 'getMostRecentEditRequests')
    .mockImplementation(async (xUserId: string, sourceRecordingId: string) => {
      return Promise.resolve([mockedEditRequest]);
    });
}

export function mockGetRecordings(recordings?: Recording[], page: number = 0) {
  if (recordings !== undefined) {
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(recordings.length / 10),
      totalElements: recordings.length,
      size: 10,
    } as Pagination;
    const recordingSubset = recordings.slice(page * 10, (page + 1) * 10);

    jest
      .spyOn(PreClient.prototype, 'getRecordings')
      .mockImplementation(async (xUserId: string, request: SearchRecordingsRequest) => {
        return Promise.resolve({ recordings: recordingSubset, pagination });
      });
    return;
  }

  jest
    .spyOn(PreClient.prototype, 'getRecordings')
    .mockImplementation(async (xUserId: string, req: SearchRecordingsRequest) => {
      return Promise.resolve({ recordings: mockRecordings, pagination: mockPagination });
    });
}

export const mockPutAudit = () => {
  jest.spyOn(PreClient.prototype, 'putAudit').mockImplementation(async (xUserId: string, request: PutAuditRequest) => {
    return Promise.resolve({
      status: 201,
      statusText: 'CREATED',
    } as AxiosResponse);
  });
};

export function mockGetLatestTermsAndConditions(data?: Terms | null) {
  if (data !== undefined) {
    jest
      .spyOn(PreClient.prototype, 'getLatestTermsAndConditions')
      .mockImplementation(async (xUserId: string, id: string) => {
        return Promise.resolve(data);
      });
  }
}

export function mockAcceptTermsAndConditions() {
  jest
    .spyOn(PreClient.prototype, 'acceptTermsAndConditions')
    .mockImplementation(async (xUserId: string, termsId: string) => {
      return Promise.resolve();
    });
}

export function mockGetRecordingPlaybackData(data?: RecordingPlaybackData | null) {
  if (data !== undefined) {
    jest
      .spyOn(PreClient.prototype, 'getRecordingPlaybackData')
      .mockImplementation(async (xUserId: string, id: string) => {
        return Promise.resolve(data);
      });
    jest
      .spyOn(PreClient.prototype, 'getRecordingPlaybackDataMk')
      .mockImplementation(async (xUserId: string, id: string) => {
        return Promise.resolve(data);
      });
    return;
  }

  jest
    .spyOn(PreClient.prototype, 'getRecordingPlaybackData')
    .mockImplementation(async (xUserId: string, id: string) => {
      return Promise.resolve({
        src: 'src',
        type: 'type',
        protectionInfo: [],
      } as RecordingPlaybackData);
    });
  jest
    .spyOn(PreClient.prototype, 'getRecordingPlaybackDataMk')
    .mockImplementation(async (xUserId: string, id: string) => {
      return Promise.resolve({
        src: 'src',
        type: 'type',
        protectionInfo: [],
      } as RecordingPlaybackData);
    });
}

export function reset() {
  jest.spyOn(PreClient.prototype, 'getRecording').mockRestore();
  jest.spyOn(PreClient.prototype, 'getRecordings').mockRestore();
  jest.spyOn(PreClient.prototype, 'getRecordingPlaybackData').mockRestore();
  jest.spyOn(PreClient.prototype, 'getMostRecentEditRequests').mockRestore();
}
