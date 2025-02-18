import { UserLevel } from '../types/user-level';
import { SessionUser } from '../services/session-user/session-user';
import { Court, PaginatedRequest, Pagination, SearchUsersRequest } from '../services/pre-api/types';
import { PreClient } from '../services/pre-api/pre-client';

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
