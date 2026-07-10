import { PreClient } from '../services/pre-api/pre-client';
import { Court, PaginatedRequest } from '../services/pre-api/types';

export const getAllPaginatedCourts = async (
  client: PreClient,
  xUserId: string,
  request: PaginatedRequest
): Promise<Court[]> => {
  let courts: Court[] = [];

  const response = await client.getCourtsWithPagination(xUserId, { ...request, page: 0 });
  courts.push(...response.courts);

  for (let i = 1; i < response.pagination.totalPages; i++) {
    const paginatedRequest = { ...request, page: i };
    const paginatedResponse = await client.getCourtsWithPagination(xUserId, paginatedRequest);
    courts.push(...paginatedResponse.courts);
  }

  courts.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'en', { sensitivity: 'base' }))

  return courts;
};
