import { Pagination } from '../services/pre-api/types';

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
