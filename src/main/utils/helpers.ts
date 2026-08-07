import { PreClient } from '../services/pre-api/pre-client';
import { Pagination, PutEditRequest, PutEditInstruction } from '../services/pre-api/types';

import { v4 as uuid } from 'uuid';
import config from 'config';

interface PaginationLinks {
  next: { href?: string };
  previous: { href?: string };
  items: ({ href: string; number: number; current: boolean } | { ellipsis: boolean })[];
}

export const generatePaginationLinks = (pagination: Pagination, route: string) => {
  const paginationLinks: PaginationLinks = {
    previous: {},
    next: {},
    items: [],
  };

  // Add a previous link if not on the first page
  if (pagination.currentPage > 0) {
    paginationLinks.previous = {
      href: `${route}?page=${pagination.currentPage - 1}`,
    };
  }

  // Add a next link if not on the last page
  if (pagination.currentPage < pagination.totalPages - 1) {
    paginationLinks.next = {
      href: `${route}?page=${pagination.currentPage + 1}`,
    };
  }

  // Always add the first page
  paginationLinks.items.push({
    href: `${route}?page=0`,
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
      href: `${route}?page=${i}`,
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
      href: `${route}?page=${pagination.totalPages - 1}`,
      number: pagination.totalPages,
      current: pagination.totalPages - 1 === pagination.currentPage,
    });
  }

  return paginationLinks;
};

export const generatePaginatedTitle = (pagination: Pagination, title: string) => {
  return `${title} ${pagination.currentPage * pagination.size + 1} to ${Math.min(
    (pagination.currentPage + 1) * pagination.size,
    pagination.totalElements
  )} of ${pagination.totalElements}`;
};

export const validateId = (id: string): boolean => {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
};

export const timeStringToSeconds = (timeString: string) => {
  const [h, m, s] = timeString.split(':').map(Number);
  return h * 3600 + m * 60 + s;
};

export const secondsToTimeString = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const calculateTimeRemoved = (start: string, end: string): string => {
  const startTotalSeconds = timeStringToSeconds(start);
  const endTotalSeconds = timeStringToSeconds(end);

  const diffInSeconds = Math.abs(startTotalSeconds - endTotalSeconds);
  return secondsToTimeString(diffInSeconds);
};

export const getCurrentEditRequest = async (
  client: PreClient,
  xUserId: string,
  sourceRecordingId: string
): Promise<(PutEditRequest & { created_by?: string; modified_at?: string }) | null> => {
  const editRequests = await client.getMostRecentEditRequests(xUserId, sourceRecordingId);
  if (editRequests === null) {
    return null;
  }

  const editRequest = editRequests[0]
    ? ({
        id: editRequests[0].id,
        status: editRequests[0].status,
        source_recording_id: sourceRecordingId,
        edit_instructions: editRequests[0].edit_instruction.requestedInstructions,
        rejection_reason: editRequests[0].rejection_reason,
        jointly_agreed: editRequests[0].jointly_agreed,
        created_by: editRequests[0].created_by,
        modified_at: new Date(editRequests[0].modified_at).toLocaleDateString(),
      } as PutEditRequest & { created_by?: string; modified_at?: string })
    : ({
        id: uuid(),
        status: 'DRAFT',
        source_recording_id: sourceRecordingId,
        edit_instructions: [] as PutEditInstruction[],
      } as PutEditRequest & { created_by?: string; modified_at?: string });

  editRequest.edit_instructions = editRequest.edit_instructions.map(i => {
    return {
      ...i,
      difference: calculateTimeRemoved(i.start_of_cut, i.end_of_cut),
    };
  });
  return editRequest;
};

export const isFlagEnabled = (flag: string): boolean => {
  return config.get(flag)?.toString().toLowerCase() === 'true';
};

export const isStatusEditable = (status: string): boolean => {
  return ['DRAFT', 'REJECTED', 'COMPLETE'].includes(status);
};
