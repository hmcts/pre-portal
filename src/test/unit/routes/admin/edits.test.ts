import { mockeduser } from '../../test-helper';
import { Nunjucks } from '../../../../main/modules/nunjucks';
import { UserLevel } from '../../../../main/types/user-level';

jest.mock('express-openid-connect', () => {
  return {
    requiresAuth: jest.fn().mockImplementation(() => {
      return (req, res, next) => {
        next();
      };
    }),
  };
});

jest.mock('../../../../main/services/session-user/session-user', () => {
  return {
    SessionUser: {
      getLoggedInUserPortalId: jest.fn().mockImplementation(() => '123'),
      getLoggedInUserProfile: jest.fn().mockImplementation(() => mockeduser),
    },
  };
});

const mockGetEditRequests = jest.fn();
const mockGetRecordings = jest.fn();
const mockPostEditsFromCsv = jest.fn();

jest.mock('../../../../main/services/pre-api/pre-client', () => ({
  PreClient: jest.fn().mockImplementation(() => ({
    getEditRequests: mockGetEditRequests,
    getRecordings: mockGetRecordings,
    postEditsFromCsv: mockPostEditsFromCsv,
  })),
}));

describe('Admin Edits Page', () => {
  let app;
  let request;

  beforeAll(() => {
    app = require('express')();
    new Nunjucks(false).enableFor(app);
    request = require('supertest');
    const editRoute = require('../../../../main/routes/admin/edits').default;
    editRoute(app);
  });

  describe('GET /admin/edit-request', () => {
    test('should render edits page for super user', async () => {
      if (mockeduser.app_access?.[0]?.role) {
        mockeduser.app_access[0].role.name = UserLevel.SUPER_USER;
      }

      mockGetEditRequests.mockResolvedValueOnce({
        edits: [{ id: 1, text: 'Edit A' }],
        pagination: { currentPage: 0, totalPages: 1, totalElements: 1, size: 1 },
      });

      const res = await request(app).get('/admin/edit-request');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Edit Upload');
    });

    test('should render not-found for non-super user', async () => {
      if (mockeduser.app_access?.[0]?.role) {
        mockeduser.app_access[0].role.name = UserLevel.EXTERNAL_USER;
      }

      const res = await request(app).get('/admin/edit-request');
      expect(res.status).toBe(404);
      expect(res.text).toContain('Page is not available - PRE Portal');
    });
  });

  describe('GET /edits/recordings', () => {
    test('should return recordings when valid query is provided', async () => {
      if (mockeduser.app_access?.[0]?.role) {
        mockeduser.app_access[0].role.name = UserLevel.SUPER_USER;
      }

      mockGetRecordings.mockResolvedValueOnce({
        recordings: [{ id: 'rec1' }],
      });

      const res = await request(app).get('/edits/recordings?case_reference=abc123');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 'rec1' }]);
    });

    test('should return 400 when case_reference is missing', async () => {
      if (mockeduser.app_access?.[0]?.role) {
        mockeduser.app_access[0].role.name = UserLevel.SUPER_USER;
      }

      const res = await request(app).get('/edits/recordings');
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'case_reference is required');
    });

    test('should render not-found for non-super user', async () => {
      if (mockeduser.app_access?.[0]?.role) {
        mockeduser.app_access[0].role.name = UserLevel.EXTERNAL_USER;
      }

      const res = await request(app).get('/edits/recordings?case_reference=abc123');
      expect(res.status).toBe(404);
      expect(res.text).toContain('Page is not available - PRE Portal');
    });
  });

  describe('POST /edit-request/upload', () => {
    test('should return 400 when missing file or source_recording', async () => {
      if (mockeduser.app_access?.[0]?.role) {
        mockeduser.app_access[0].role.name = UserLevel.SUPER_USER;
      }

      const res = await request(app)
        .post('/edit-request/upload')
        .field('source_recording', '')
        .attach('file-upload', Buffer.from('id,text\n1,edit'), 'test.csv');

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Missing file or source recording id/);
    });

    test('should redirect on successful CSV upload', async () => {
      if (mockeduser.app_access?.[0]?.role) {
        mockeduser.app_access[0].role.name = UserLevel.SUPER_USER;
      }

      mockPostEditsFromCsv.mockResolvedValueOnce({ status: 200 });

      const res = await request(app)
        .post('/edit-request/upload')
        .field('source_recording', 'e2ca657c-8f4f-4d41-b545-c434bb779f20')
        .attach('file-upload', Buffer.from('id,text\n1,edit'), 'test.csv');

      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/admin/edit-request');
    });

    test('should error on non-CSV upload', async () => {
      if (mockeduser.app_access?.[0]?.role) {
        mockeduser.app_access[0].role.name = UserLevel.SUPER_USER;
      }

      const res = await request(app)
        .post('/edit-request/upload')
        .field('source_recording', 'e2ca657c-8f4f-4d41-b545-c434bb779f20')
        .attach('file-upload', Buffer.from('id,text\n1,edit'), 'test.txt');

      expect(res.status).toBe(500);
    });

    test('should return 400 if CSV processing fails', async () => {
      if (mockeduser.app_access?.[0]?.role) {
        mockeduser.app_access[0].role.name = UserLevel.SUPER_USER;
      }

      mockPostEditsFromCsv.mockRejectedValueOnce(new Error('Processing failed'));

      const res = await request(app)
        .post('/edit-request/upload')
        .field('source_recording', 'e2ca657c-8f4f-4d41-b545-c434bb779f20')
        .attach('file-upload', Buffer.from('invalid'), 'test.csv');

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Processing failed');
    });

    test('should render not-found for non-super user', async () => {
      if (mockeduser.app_access?.[0]?.role) {
        mockeduser.app_access[0].role.name = UserLevel.EXTERNAL_USER;
      }

      const res = await request(app)
        .post('/edit-request/upload')
        .field('source_recording', 'e2ca657c-8f4f-4d41-b545-c434bb779f20')
        .attach('file-upload', Buffer.from('id,text\n1,edit'), 'test.csv');

      expect(res.status).toBe(404);
      expect(res.text).toContain('Page is not available - PRE Portal');
    });
  });
});
