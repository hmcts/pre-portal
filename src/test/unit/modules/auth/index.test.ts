/* eslint-disable jest/expect-expect */

import { Auth } from '../../../../main/modules/auth';
import config from 'config';
import { set } from 'lodash';
import { Logger } from '@hmcts/nodejs-logging';
import axios from 'axios';
import { OpenidRequest, OpenidResponse, Session } from 'express-openid-connect';
import { AccessStatus } from '../../../../main/types/access-status';

jest.mock('axios');
jest.mock('jose', () => {
  return {
    decodeJwt: jest.fn().mockImplementation((s: string) => {
      return { email: 'test@testy.com' };
    }),
  };
});

describe('Auth Module', () => {
  test('test redis config is loaded when there is a redisHost', async () => {
    const app = require('express')();
    const auth = new Auth();
    set(config, 'session.redis.host', 'http://localhost:6379');
    set(config, 'session.redis.key', 'rediskey');
    set(config, 'b2c.appClientSecret', 'appClientSecret');
    auth.enableFor(app);
    expect(app.locals.redisClient).toBeDefined();
  });

  test('Checks if a user is newly invited during callback', async () => {
    const mockedAxios = axios as jest.Mocked<typeof axios>;
    // @ts-ignore
    mockedAxios.get.mockImplementation((url: string, config: object) => {
      if (url === '/invites/9ffcc9fb-db21-4d77-a983-c39b01141c6a') {
        return Promise.resolve({
          status: 200,
          data: {
            "user_id": "9ffcc9fb-db21-4d77-a983-c39b01141c6a",
            "first_name": "Jason",
            "last_name": "Paige",
            "email": "test@testy.com",
            "invited_at": "2024-03-19T17:56:35.381+00:00",
            "code": null
          },
        });
      }
      if (url === '/users/by-email/test@testy.com') {
        return Promise.resolve({
          status: 200,
          data: {
            app_access: [
              {
                active: true,
                court: {
                  id: 'e2ca657c-8f4f-4d41-b545-c434bb779f20',
                  name: 'Leeds Youth',
                  court_type: 'CROWN',
                  location_code: '',
                  regions: [
                    {
                      name: 'Yorkshire and The Humber',
                    },
                  ],
                  rooms: [],
                },
                id: '5000e766-b50d-4473-85b2-0bb54785c169',
                last_access: null,
                role: {
                  id: 'c920307f-5198-48c1-8954-d5277b415853',
                  name: 'Super User',
                  description: 'Super User',
                  permissions: [],
                },
              },
            ],

            portal_access: [
              {
                deleted_at: null,
                id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                invited_at: '2024-03-13T11:22:03.655Z',
                last_access: null,
                registered_at: null,
                status: AccessStatus.INVITATION_SENT,
              },
            ],
            user: {
              id: '9ffcc9fb-db21-4d77-a983-c39b01141c6a',
              first_name: 'Jason',
              last_name: 'Paige',
              email: 'test@testy.com',
              phone_number: null,
              organisation: null,
            },
          },
        });
      }
    });
    // @ts-ignore
    mockedAxios.post.mockImplementation((url: string, config: object) => {
      if (url === '/invites/redeem/test@testy.com') {
        return Promise.resolve({
          status: 200,
          data: {},
        });
      }
    });
    const app = require('express')();
    const auth = new Auth();
    const logger = Logger.getLogger('auth-module-test');
    const configParams = auth['getConfigParams'](app, logger);
    // @ts-ignore
    const result = await configParams['afterCallback']({} as OpenidRequest, {} as OpenidResponse, {} as Session, {});
    expect(result.userProfile.user.email).toBe('test@testy.com');
  });
});
