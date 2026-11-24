import { NextFunction, Request, Response } from 'express';
import offboarding from '../../../../main/routes/users/offboarding';
import { SessionUser } from '../../../../main/services/session-user/session-user';
import { PreClient } from '../../../../main/services/pre-api/pre-client';
import { Logger } from '@hmcts/nodejs-logging';
import { RequiresSuperUser } from '../../../../main/middleware/admin-middleware';
import { requiresAuth } from 'express-openid-connect';

const authMw = jest.fn();

jest.mock('express-openid-connect', () => ({
  requiresAuth: jest.fn(() => authMw),
}));

jest.mock('../../../../main/middleware/admin-middleware', () => ({
  RequiresSuperUser: jest.fn(),
}));

jest.mock('../../../../main/services/pre-api/pre-client', () => ({
  PreClient: jest.fn(),
}));

jest.mock('../../../../main/services/session-user/session-user', () => ({
  SessionUser: {
    isLoggedInSuperUser: jest.fn(),
    getLoggedInUserBrowseId: jest.fn(),
  },
}));

jest.mock('@hmcts/nodejs-logging', () => ({
  Logger: {
    getLogger: jest.fn(),
  },
}));

describe('offboarding route', () => {
  const info = jest.fn();
  const error = jest.fn();
  const logger = { info, error };

  let app: { get: jest.Mock };
  let handler: (req: Request, res: Response, next: NextFunction) => Promise<void>;

  beforeEach(() => {
    jest.clearAllMocks();
    (Logger.getLogger as jest.Mock).mockReturnValue(logger);

    app = { get: jest.fn() };
    offboarding(app as any);

    expect(app.get).toHaveBeenCalledTimes(1);
    handler = app.get.mock.calls[0][3];
  });

  it('registers GET /user-admin/offboarding with auth and superuser middleware', () => {
    expect(app.get.mock.calls[0][0]).toBe('/user-admin/offboarding');
    expect(app.get.mock.calls[0][1]).toBe(authMw);
    expect(app.get.mock.calls[0][2]).toBe(RequiresSuperUser);
    expect(app.get.mock.calls[0][1]).toBe((requiresAuth as jest.Mock).mock.results[0].value);
    expect(app.get.mock.calls[0][2]).toBe(RequiresSuperUser);
    expect(typeof app.get.mock.calls[0][3]).toBe('function');
  });

  it('returns 404 not-found when user is not super user', async () => {
    (SessionUser.isLoggedInSuperUser as jest.Mock).mockReturnValue(false);

    const req = { query: {}, url: '/user-admin/offboarding' } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      render: jest.fn(),
    } as unknown as Response;
    const next = jest.fn();

    await handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.render).toHaveBeenCalledWith('utility/not-found', { isSuperUser: false });
    expect(next).not.toHaveBeenCalled();
  });

  it('renders page with courts and empty users when no court selected', async () => {
    (SessionUser.isLoggedInSuperUser as jest.Mock).mockReturnValue(true);
    (SessionUser.getLoggedInUserBrowseId as jest.Mock).mockResolvedValue('browse-1');

    const getCourtIdsAndNames = jest.fn().mockResolvedValue(new Map([['1', 'Court A']]));
    const getUsersByCourt = jest.fn();
    (PreClient as jest.Mock).mockImplementation(() => ({ getCourtIdsAndNames, getUsersByCourt }));

    const req = { query: {}, url: '/user-admin/offboarding' } as unknown as Request;
    const res = { render: jest.fn() } as unknown as Response;
    const next = jest.fn();

    await handler(req, res, next);

    expect(getCourtIdsAndNames).toHaveBeenCalledWith('browse-1');
    expect(getUsersByCourt).not.toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith('users/offboarding.njk', {
      users: [],
      courtList: [{ id: '1', name: 'Court A' }],
      selectedCourtId: '',
      selectedCourtName: '',
      isSuperUser: true,
      pageUrl: '/user-admin/offboarding',
    });
  });

  it('loads users when courtId is provided', async () => {
    (SessionUser.isLoggedInSuperUser as jest.Mock).mockReturnValue(true);
    (SessionUser.getLoggedInUserBrowseId as jest.Mock).mockResolvedValue('browse-1');

    const users = [{ email: 'a@x.com' }];
    const getCourtIdsAndNames = jest.fn().mockResolvedValue(
      new Map([
        ['1', 'Court A'],
        ['2', 'Court B'],
      ])
    );
    const getUsersByCourt = jest.fn().mockResolvedValue(users);
    (PreClient as jest.Mock).mockImplementation(() => ({ getCourtIdsAndNames, getUsersByCourt }));

    const req = { query: { courtId: ' 2 ' }, url: '/user-admin/offboarding?courtId=2' } as unknown as Request;
    const res = { render: jest.fn() } as unknown as Response;
    const next = jest.fn();

    await handler(req, res, next);

    expect(getUsersByCourt).toHaveBeenCalledWith('browse-1', '2');
    expect(res.render).toHaveBeenCalledWith(
      'users/offboarding.njk',
      expect.objectContaining({
        users,
        selectedCourtId: '2',
        selectedCourtName: 'Court B',
      })
    );
  });

  it('calls next(error) when API call fails', async () => {
    (SessionUser.isLoggedInSuperUser as jest.Mock).mockReturnValue(true);
    (SessionUser.getLoggedInUserBrowseId as jest.Mock).mockResolvedValue('browse-1');

    const thrown = new Error('boom');
    (PreClient as jest.Mock).mockImplementation(() => ({
      getCourtIdsAndNames: jest.fn().mockRejectedValue(thrown),
      getUsersByCourt: jest.fn(),
    }));

    const req = { query: {}, url: '/user-admin/offboarding' } as unknown as Request;
    const res = { render: jest.fn() } as unknown as Response;
    const next = jest.fn();

    await handler(req, res, next);

    expect(error).toHaveBeenCalledWith('Error loading offboarding page', { error: thrown });
    expect(next).toHaveBeenCalledWith(thrown);
  });
});
