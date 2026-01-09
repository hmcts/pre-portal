import { Nunjucks } from '../../../../main/modules/nunjucks';
import config from 'config';
import { mockUser } from '../../test-helper';
import { set } from 'lodash';
import {
  mockedEditRequest,
  mockGetCurrentEditRequest,
  mockGetRecording,
  mockGetRecordingPlaybackData,
  reset,
} from '../../../mock-api';
import { describe } from '@jest/globals';
import { PreClient } from '../../../../main/services/pre-api/pre-client';

mockUser();
set(config, 'pre.enableAutomatedEditing', 'true');

describe('edit-request route', () => {
  beforeAll(() => {
    reset();
  });

  describe('on GET', () => {
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');

    const watch = require('../../../../main/routes/edit-request').default;
    watch(app);

    test('should return 500 when getCurrentEditRequest fails', async () => {
      jest
        .spyOn(PreClient.prototype, 'getMostRecentEditRequests')
        .mockImplementation(async (xUserId: string, sourceRecordingId: string) => {
          throw new Error('Error');
        });
      await request(app)
        .get('/edit-request/12345678-1234-1234-1234-1234567890ab')
        .expect(res => expect(res.status).toBe(500));
    });

    test('should return 500 when calculateTimeRemoved fails', async () => {
      jest
        .spyOn(PreClient.prototype, 'getMostRecentEditRequests')
        .mockImplementation(async (xUserId: string, sourceRecordingId: string) => {
          return [
            {
              id: '123',
              status: 'DRAFT',
              source_recording_id: '12345678-1234-1234-1234-1234567890ab',
              edit_instruction: {
                requestedInstructions: [
                  {
                    start_of_cut: '00:00:00',
                    end_of_cut: '00:00:00',
                  },
                ],
              },
              rejection_reason: '',
            },
          ];
        });
      await request(app)
        .get('/edit-request/12345678-1234-1234-1234-1234567890ab')
        .expect(res => expect(res.status).toBe(500));
    });

    test('should return 404 when getRecording returns null', async () => {
      mockGetRecording(null);
      await request(app)
        .get('/edit-request/12345678-1234-1234-1234-1234567890ff')
        .expect(res => expect(res.status).toBe(404));
    });

    test('should return 404 when getRecordingPlaybackData returns null', async () => {
      mockGetRecordingPlaybackData(null);
      await request(app)
        .get('/edit-request/12345678-1234-1234-1234-1234567890ff/playback')
        .expect(res => expect(res.status).toBe(404));
    });

    test('should return 404 when getRecording id is invalid', async () => {
      mockGetRecording(null);
      await request(app)
        .get('/edit-request/something')
        .expect(res => expect(res.status).toBe(404));
    });

    test('should return 404 when getRecordingPlaybackData id is invalid', async () => {
      mockGetRecordingPlaybackData(null);
      await request(app)
        .get('/edit-request/something/playback')
        .expect(res => expect(res.status).toBe(404));
    });

    test('should return 500 when getRecording fails', async () => {
      jest.spyOn(PreClient.prototype, 'getRecording').mockImplementation(async (xUserId: string, id: string) => {
        throw new Error('Error');
      });
      await request(app)
        .get('/edit-request/12345678-1234-1234-1234-1234567890ab')
        .expect(res => expect(res.status).toBe(500));
    });

    test('should redirect to /edit-request/:id/view when getRecording and getCurrentEditRequest succeed', async () => {
      mockGetRecording();
      mockGetCurrentEditRequest([
        {
          ...mockedEditRequest,
          status: 'SUBMITTED',
          created_at: new Date().toISOString(),
          created_by: 'Test User',
          modified_at: new Date().toISOString(),
        },
      ]);
      await request(app)
        .get('/edit-request/12345678-1234-1234-1234-1234567890ab')
        .expect(res => expect(res.status).toBe(302))
        .expect(res => expect(res.header.location).toBe('/edit-request/12345678-1234-1234-1234-1234567890ab/view'));
    });
  });

  describe('on POST', () => {
    const app = require('express')();
    app.use(require('body-parser').json());
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');

    const watch = require('../../../../main/routes/edit-request').default;
    watch(app);

    test('should return 404 when id is invalid', async () => {
      await request(app)
        .post('/edit-request/invalid-id')
        .set('Content-Type', 'application/json')
        .send(
          JSON.stringify({
            id: '12345678-1234-1234-1234-1234567890ab',
            source_recording_id: '12345678-1234-1234-1234-1234567890ab',
            status: 'DRAFT',
            edit_instructions: [
              {
                start_of_cut: '00:00:00',
                end_of_cut: '00:00:01',
              },
            ],
          })
        )
        .expect(res => expect(res.status).toBe(404));
    });

    test('should return 500 when putEditRequest fails', async () => {
      jest.spyOn(PreClient.prototype, 'putEditRequest').mockImplementation(async (xUserId: string, body: any) => {
        throw new Error('Error');
      });
      await request(app)
        .post('/edit-request/12345678-1234-1234-1234-1234567890ab')
        .set('Content-Type', 'application/json')
        .send(
          JSON.stringify({
            id: '12345678-1234-1234-1234-1234567890ab',
            source_recording_id: '12345678-1234-1234-1234-1234567890ab',
            status: 'DRAFT',
            edit_instructions: [
              {
                start_of_cut: '00:00:00',
                end_of_cut: '00:00:01',
              },
            ],
          })
        )
        .expect(res => expect(res.status).toBe(500));
    });

    test('should return 200 when putEditRequest succeeds', async () => {
      mockGetRecording();
      jest.spyOn(PreClient.prototype, 'putEditRequest').mockImplementation(async (xUserId: string, body: any) => {
        return [
          {
            status: 201,
          }
        ]
      });
      jest
        .spyOn(PreClient.prototype, 'getMostRecentEditRequests')
        .mockImplementation(async (xUserId: string, sourceRecordingId: string) => {
          return [
            {
              id: '123',
              status: 'DRAFT',
              source_recording_id: '12345678-1234-1234-1234-1234567890ab',
              edit_instruction: {
                requestedInstructions: [
                  {
                    start_of_cut: '00:00:00',
                    end_of_cut: '00:00:00',
                  },
                ],
              },
              rejection_reason: '',
            },
          ];
        });
      await request(app)
        .post('/edit-request/12345678-1234-1234-1234-1234567890ab')
        .set('Content-Type', 'application/json')
        .send(
          JSON.stringify({
            id: '12345678-1234-1234-1234-1234567890ab',
            source_recording_id: '12345678-1234-1234-1234-1234567890ab',
            status: 'DRAFT',
            edit_instructions: [
              {
                start_of_cut: '00:00:00',
                end_of_cut: '00:00:01',
              },
            ],
          })
        )
        .expect(res => expect(res.status).toBe(200));
    });

    test('should return 400 when validation fails', async () => {
      mockGetRecording();
      jest.spyOn(PreClient.prototype, 'putEditRequest').mockImplementation(async (xUserId: string, body: any) => {
        return;
      });
      jest
        .spyOn(PreClient.prototype, 'getMostRecentEditRequests')
        .mockImplementation(async (xUserId: string, sourceRecordingId: string) => {
          return [
            {
              id: '123',
              status: 'DRAFT',
              source_recording_id: '12345678-1234-1234-1234-1234567890ab',
              edit_instruction: {
                requestedInstructions: [
                  {
                    start_of_cut: '00:00:00',
                    end_of_cut: '00:00:00',
                  },
                ],
              },
              rejection_reason: '',
            },
          ];
        });
      await request(app)
        .post('/edit-request/12345678-1234-1234-1234-1234567890ab')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send(
          JSON.stringify({
            id: '12345678-1234-1234-1234-1234567890ab',
            source_recording_id: '12345678-1234-1234-1234-1234567890ab',
            status: 'DRAFT',
            edit_instructions: [
              {
                start_of_cut: '00:00:00',
                end_of_cut: '00:00:00',
              },
            ],
          })
        )
        .expect(res => expect(res.status).toBe(400))
        .expect(res =>
          expect(res.body).toStrictEqual({
            errors: {
              endTime: 'End reference cannot be equal or less than the Start reference',
            },
          })
        );
    });
  });

  describe('validation for put', () => {
    const { validateRequest } = require('../../../../main/routes/edit-request');

    test('should return an error when start_of_cut is empty', () => {
      const duration = 'PT10S';
      const instruction = {
        start_of_cut: '',
        end_of_cut: '00:00:01',
      };
      const errors = validateRequest(
        { id: '', source_recording_id: '', status: '', edit_instructions: [instruction] },
        duration
      );
      expect(errors).toEqual({ startTime: 'Please enter a valid time reference' });
    });

    test('should return an error when start_of_cut is not in HH:MM:SS format', () => {
      const duration = 'PT10S';
      const instruction = {
        start_of_cut: '00:00:0t',
        end_of_cut: '00:00:01',
      };
      const errors = validateRequest(
        { id: '', source_recording_id: '', status: '', edit_instructions: [instruction] },
        duration
      );
      expect(errors).toEqual({ startTime: 'The Start reference entered is not in the HH:MM:SS format' });
    });

    test('should return an error when end_of_cut is empty', () => {
      const duration = 'PT10S';
      const instruction = {
        start_of_cut: '00:00:00',
        end_of_cut: '',
      };
      const errors = validateRequest(
        { id: '', source_recording_id: '', status: '', edit_instructions: [instruction] },
        duration
      );
      expect(errors).toEqual({ endTime: 'Please enter a valid time reference' });
    });

    test('should return an error when end_of_cut is not in HH:MM:SS format', () => {
      const duration = 'PT10S';
      const instruction = {
        start_of_cut: '00:00:00',
        end_of_cut: '00:00:0t',
      };
      const errors = validateRequest(
        { id: '', source_recording_id: '', status: '', edit_instructions: [instruction] },
        duration
      );
      expect(errors).toEqual({ endTime: 'The End reference entered is not in the HH:MM:SS format' });
    });

    test('should return an error when end_of_cut is less than start_of_cut', () => {
      const duration = 'PT10S';
      const instruction = {
        start_of_cut: '00:00:01',
        end_of_cut: '00:00:00',
      };
      const errors = validateRequest(
        { id: '', source_recording_id: '', status: '', edit_instructions: [instruction] },
        duration
      );
      expect(errors).toEqual({ endTime: 'End reference cannot be equal or less than the Start reference' });
    });

    test('should return an error when end_of_cut is greater than the duration of the recording', () => {
      const duration = 'PT10S';
      const instruction = {
        start_of_cut: '00:00:00',
        end_of_cut: '00:00:11',
      };
      const errors = validateRequest(
        { id: '', source_recording_id: '', status: '', edit_instructions: [instruction] },
        duration
      );
      expect(errors).toEqual({ endTime: 'References cannot be greater than the duration of the recording' });
    });
  });
});
