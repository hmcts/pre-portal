import {
  Court,
  PaginatedRequest,
  Pagination,
  PutAuditRequest,
  PutUserRequest,
  Recording,
  RecordingPlaybackData,
  SearchRecordingsRequest,
  SearchUsersRequest,
  User,
} from '../main/services/pre-api/types';
import { PreClient } from '../main/services/pre-api/pre-client';
import { AxiosResponse } from 'axios';
import { Terms } from '../main/types/terms';
import { AppAccess, PortalAccess, Role } from '../main/types/user-profile';

export const mockRecordings: Recording[] = [
  {
    id: '12345678-1234-1234-1234-1234567890ab',
    parent_recording_id: 'parentId',
    version: 1,
    filename: 'filename',
    duration: 'duration',
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
    duration: 'duration',
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

export const mockRoles: Role[] = [
  {
    id: '12345678-1234-1234-1234-1234567890ab',
    name: 'Super User',
    permissions: [],
  } as Role,
  {
    id: '12345678-1234-1234-1234-1234567890ac',
    name: 'Level 1',
    permissions: [],
  } as Role,
  {
    id: '12345678-1234-1234-1234-1234567890ad',
    name: 'Level 2',
    permissions: [],
  } as Role,
  {
    id: '12345678-1234-1234-1234-1234567890ae',
    name: 'Level 3',
    permissions: [],
  } as Role,
  {
    id: '12345678-1234-1234-1234-1234567890af',
    name: 'Level 4',
    permissions: [],
  } as Role,
];

export const mockCourts: Court[] = [
  {
    id: '12345678-1234-1234-1234-1234567890ab',
    name: 'Example Court',
    court_type: 'CROWN',
    location_code: 'LOC',
    regions: [
      {
        name: 'Region Name',
      },
    ],
  } as Court,
  {
    id: '12345678-1234-1234-1234-1234567890ac',
    name: 'Example Court 2',
    court_type: 'CROWN',
    location_code: 'LOC2',
    regions: [
      {
        name: 'Region Name 2',
      },
    ],
  } as Court,
];

export const mockUsers: User[] = [
  {
    id: '12345678-1234-1234-1234-1234567890ab',
    first_name: 'Example',
    last_name: 'User',
    email: 'example@example.com',
    phone: '0123456789',
    organisation: 'Example Organisation',
    terms_accepted: {},
    app_access: [
      {
        id: '12345678-1234-1234-1234-1234567890ab',
        active: true,
        court: {
          id: '12345678-1234-1234-1234-1234567890ab',
          name: 'Example Court',
          court_type: 'Crown',
          location_code: 'LOC',
          regions: [
            {
              name: 'Region Name',
            },
          ],
          rooms: [],
        },
        last_access: '01/01/2025',
        default_court: true,
        role: {
          id: '12345678-1234-1234-1234-1234567890ab',
          name: 'Example Role',
          permissions: [],
        },
      } as AppAccess,
    ],
    portal_access: [
      {
        id: '12345678-1234-1234-1234-1234567890ab',
        invited_at: '01/01/2025',
        registered_at: '01/01/2025',
        last_access: '01/01/2025',
        deleted_at: null,
        status: 'ACTIVE',
      } as PortalAccess,
    ],
  } as User,
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
    totalElements: 1,
    totalPages: 1,
    number: 0,
  },
};

export const mockedPaginatedUsers = {
  _embedded: {
    userDTOList: mockUsers,
  },
  page: {
    size: 20,
    totalElements: 2,
    totalPages: 1,
    number: 0,
  },
};

export const mockedPaginatedCourts = {
  _embedded: {
    courtDTOList: mockCourts,
  },
  page: {
    size: 20,
    totalElements: 2,
    totalPages: 1,
    number: 0,
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

export function mockGetUsers(users?: User[], page: number = 0) {
  if (users !== undefined) {
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(users.length / 10),
      totalElements: users.length,
      size: 10,
    } as Pagination;
    const userSubset = users.slice(page * 10, (page + 1) * 10);
    jest
      .spyOn(PreClient.prototype, 'getUsers')
      .mockImplementation(async (xUserId: string, request: SearchUsersRequest) => {
        return Promise.resolve({ users: userSubset, pagination });
      });
    return;
  }

  jest.spyOn(PreClient.prototype, 'getUsers').mockImplementation(async (xUserId: string, req: SearchUsersRequest) => {
    return Promise.resolve({ users: mockUsers, pagination: mockPagination });
  });
}

export function mockGetUser(user?: User | null) {
  if (user !== undefined) {
    jest.spyOn(PreClient.prototype, 'getUser').mockImplementation(async (xUserId: string, id: string) => {
      return Promise.resolve(user);
    });
    return;
  }

  jest.spyOn(PreClient.prototype, 'getUser').mockImplementation(async (xUserId: string, id: string) => {
    return Promise.resolve(mockUsers[0]);
  });
}

export function mockPutUser(isUpdated: boolean = false) {
  jest.spyOn(PreClient.prototype, 'putUser').mockImplementation(async (xUserId: string, request: PutUserRequest) => {
    return Promise.resolve({
      status: isUpdated ? 204 : 201,
    } as AxiosResponse);
  });
}

export function mockGetCourts(courts?: Court[], page: number = 0) {
  if (courts !== undefined) {
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(courts.length / 10),
      totalElements: courts.length,
      size: 10,
    } as Pagination;
    const courtSubset = courts.slice(page * 10, (page + 1) * 10);

    jest
      .spyOn(PreClient.prototype, 'getCourts')
      .mockImplementation(async (xUserId: string, request: PaginatedRequest) => {
        return Promise.resolve({ courts: courtSubset, pagination });
      });
    return;
  }

  jest.spyOn(PreClient.prototype, 'getCourts').mockImplementation(async (xUserId: string, req: PaginatedRequest) => {
    return Promise.resolve({ courts: mockCourts, pagination: mockPagination });
  });
}

export function mockGetRoles(roles?: Role[]) {
  if (roles !== undefined) {
    jest
      .spyOn(PreClient.prototype, 'getRoles')
      .mockImplementation(async (xUserId: string, request: PaginatedRequest) => {
        return Promise.resolve(roles);
      });
    return;
  }

  jest.spyOn(PreClient.prototype, 'getRoles').mockImplementation(async (xUserId: string, req: PaginatedRequest) => {
    return Promise.resolve(mockRoles);
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
      .spyOn(PreClient.prototype, 'getRecordingPlaybackDataMk')
      .mockImplementation(async (xUserId: string, id: string) => {
        return Promise.resolve(data);
      });
    return;
  }

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
  jest.spyOn(PreClient.prototype, 'getRecordingPlaybackDataMk').mockRestore();
  jest.spyOn(PreClient.prototype, 'getUsers').mockRestore();
  jest.spyOn(PreClient.prototype, 'getUser').mockRestore();
  jest.spyOn(PreClient.prototype, 'getCourts').mockRestore();
  jest.spyOn(PreClient.prototype, 'getRoles').mockRestore();
}
