import { Pagination } from '../../../main/services/pre-api/types';
import { generatePaginatedTitle, generatePaginationLinks } from '../../../main/utils/helpers';

describe('generatePaginationLinks', () => {
  const route = '/test-route';

  it('should generate links with a previous and next link when not on the first or last page', () => {
    const pagination: Pagination = { currentPage: 2, totalPages: 6, totalElements: 120, size: 20 };
    const result = generatePaginationLinks(pagination, route);

    expect(result.previous).toEqual({ href: '/test-route?page=1' });
    expect(result.next).toEqual({ href: '/test-route?page=3' });
    expect(result.items).toHaveLength(6); // First page, ellipsis, 2 before, current, 2 after, Last page
  });

  it('should not have a previous link when on the first page', () => {
    const pagination: Pagination = { currentPage: 0, totalPages: 3, totalElements: 50, size: 20 };
    const result = generatePaginationLinks(pagination, route);

    expect(result.previous).toEqual({});
    expect(result.next).toEqual({ href: '/test-route?page=1' });
    expect(result.items[0]).toEqual({
      href: '/test-route?page=0',
      number: 1,
      current: true,
    });
  });

  it('should not have a next link when on the last page', () => {
    const pagination: Pagination = { currentPage: 4, totalPages: 5, totalElements: 50, size: 20 };
    const result = generatePaginationLinks(pagination, route);

    expect(result.previous).toEqual({ href: '/test-route?page=3' });
    expect(result.next).toEqual({});
    expect(result.items[result.items.length - 1]).toEqual({
      href: '/test-route?page=4',
      number: 5,
      current: true,
    });
  });

  it('should include ellipsis when there are pages skipped between the first and current page', () => {
    const pagination: Pagination = { currentPage: 4, totalPages: 10, totalElements: 200, size: 20 };
    const result = generatePaginationLinks(pagination, route);

    expect(result.items).toContainEqual({ ellipsis: true });
  });

  it('should include all pages when totalPages are less than or equal to 5', () => {
    const pagination: Pagination = { currentPage: 2, totalPages: 5, totalElements: 50, size: 10 };
    const result = generatePaginationLinks(pagination, route);

    expect(result.items).toHaveLength(5);
    expect(result.items.every(item => 'number' in item)).toBe(true);
  });

  it('should always include the first and last pages', () => {
    const pagination: Pagination = { currentPage: 3, totalPages: 7, totalElements: 70, size: 10 };
    const result = generatePaginationLinks(pagination, route);

    expect(result.items[0]).toEqual({
      href: '/test-route?page=0',
      number: 1,
      current: false,
    });

    expect(result.items[result.items.length - 1]).toEqual({
      href: '/test-route?page=6',
      number: 7,
      current: false,
    });
  });
});

describe('generatePaginatedTitle', () => {
  it('should generate the correct title when pagination is in the middle', () => {
    const pagination: Pagination = { currentPage: 2, totalPages: 10, totalElements: 100, size: 10 };
    const title = generatePaginatedTitle(pagination, 'Items');

    expect(title).toBe('Items 21 to 30 of 100');
  });

  it('should generate the correct title when there is a single page', () => {
    const pagination: Pagination = { currentPage: 0, totalPages: 1, totalElements: 10, size: 10 };
    const title = generatePaginatedTitle(pagination, 'Products');

    expect(title).toBe('Products 1 to 10 of 10');
  });

  it('should generate the correct title for the first page', () => {
    const pagination: Pagination = { currentPage: 0, totalPages: 5, totalElements: 50, size: 10 };
    const title = generatePaginatedTitle(pagination, 'Results');

    expect(title).toBe('Results 1 to 10 of 50');
  });

  it('should generate the correct title for the last page', () => {
    const pagination: Pagination = { currentPage: 4, totalPages: 5, totalElements: 47, size: 10 };
    const title = generatePaginatedTitle(pagination, 'Overview');

    expect(title).toBe('Overview 41 to 47 of 47');
  });
});
