import { UserLevel } from '../types/user-level';
import { SessionUser } from '../services/session-user/session-user';
import {
  Court,
  PaginatedRequest,
  Pagination,
  PutAppAccessRequest,
  PutPortalAccessRequest,
  PutUserRequest,
  SearchUsersRequest,
  User,
} from '../services/pre-api/types';
import { PreClient } from '../services/pre-api/pre-client';
import config from 'config';
import { AppAccess } from '../types/user-profile';

export const isSuperUser = (req: Express.Request) => {
  return (
    SessionUser.getLoggedInUserProfile(req).app_access.filter(role => role.role.name === UserLevel.SUPER_USER).length >
    0
  );
};

export const getAllPaginatedCourts = async (
  client: PreClient,
  xUserId: string,
  request: PaginatedRequest
): Promise<Court[]> => {
  let courts: Court[] = [];

  const response = await client.getCourts(xUserId, { ...request, page: 0 });
  courts.push(...response.courts);

  for (let i = 1; i < response.pagination.totalPages; i++) {
    const paginatedRequest = { ...request, page: i };
    const paginatedResponse = await client.getCourts(xUserId, paginatedRequest);
    courts.push(...paginatedResponse.courts);
  }

  return courts;
};

export const getPaginatedPageTitle = (baseTitle: string, data: any[], pagination: Pagination) => {
  return data.length > 0
    ? `${baseTitle} ${pagination.currentPage * pagination.size + 1} to ${Math.min(
        (pagination.currentPage + 1) * pagination.size,
        pagination.totalElements
      )} of ${pagination.totalElements}`
    : baseTitle;
};

export const generateSearchParamsForPage = (params: SearchUsersRequest, page: number) => {
  return Object.entries({ ...params, page })
    .map(([key, value]) => {
      if (!value || key === 'size') {
        return;
      }
      return `${key}=${value}`;
    })
    .filter(s => s)
    .join('&');
};

export const getPaginationLinks = (pagination: Pagination, path: string, currentParams: PaginatedRequest) => {
  const paginationLinks = {
    previous: {},
    next: {},
    items: [] as ({ href: string; number: number; current: boolean } | { ellipsis: boolean })[],
  };

  // Add previous link if not on the first page
  if (pagination.currentPage > 0) {
    paginationLinks.previous = {
      href: `${path}?${generateSearchParamsForPage(currentParams, pagination.currentPage - 1)}`,
    };
  }

  // Add next link if not on the last page
  if (pagination.currentPage < pagination.totalPages - 1) {
    paginationLinks.next = {
      href: `${path}?${generateSearchParamsForPage(currentParams, pagination.currentPage + 1)}`,
    };
  }

  // Always add the first page
  paginationLinks.items.push({
    href: `${path}?${generateSearchParamsForPage(currentParams, 0)}`,
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
      href: `${path}?${generateSearchParamsForPage(currentParams, i)}`,
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
      href: `${path}?${generateSearchParamsForPage(currentParams, pagination.totalPages - 1)}`,
      number: pagination.totalPages,
      current: pagination.totalPages - 1 === pagination.currentPage,
    });
  }
  return paginationLinks;
};

export const validateId = (id: string): boolean => {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
};

export const convertAppAccessResponseToRequest = (appAccess: AppAccess, userId: string): PutAppAccessRequest => {
  return {
    id: appAccess.id,
    user_id: userId,
    court_id: appAccess.court.id,
    role_id: appAccess.role.id,
    default_court: appAccess.default_court,
    active: appAccess.active,
    last_access: appAccess.last_access,
  } as PutAppAccessRequest;
};

export const convertUserResponseToUserRequest = (user: User): PutUserRequest => {
  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.phone,
    organisation: user.organisation,
    app_access: user.app_access.map(access => convertAppAccessResponseToRequest(access, user.id)),
    portal_access: user.portal_access.map(access => {
      return {
        id: access.id,
        user_id: user.id,
        invited_at: access.invited_at,
        last_access: access.last_access,
        registered_at: access.registered_at,
        status: access.status,
      } as PutPortalAccessRequest;
    }),
  };
};

export const isFlagEnabled = (flag: string): boolean => {
  return config.get(flag)?.toString().toLowerCase() === 'true';
};
