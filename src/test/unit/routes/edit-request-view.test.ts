import { Nunjucks } from '../../../main/modules/nunjucks';
import config from 'config';
import { mockUser } from '../test-helper';
import { set } from 'lodash';
import { mockedEditRequest, mockGetCurrentEditRequest, mockGetRecording, reset } from '../../mock-api';
import { describe } from '@jest/globals';
import { PreClient } from '../../../main/services/pre-api/pre-client';

mockUser();
set(config, 'pre.enableAutomatedEditing', 'true');

describe('edit-request-view route', () => {
  beforeAll(() => {
    reset();
  });

  describe('on GET /edit-request/:id/view', () => {
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');

    const watch = require('../../../main/routes/edit-request-view').default;
    watch(app);

    it('should render edit-request-view', async () => {
      mockGetRecording();
      mockGetCurrentEditRequest();

      const res = await request(app).get('/edit-request/12345678-1234-1234-1234-1234567890ab/view').expect(200);

      // make sure has 'submit' button
      expect(res.text).toContain('Confirm Submission');
      // check title
      expect(res.text).toContain('<h1 class="govuk-heading-xl">Submit edits');
    });

    it('should render edit-request-view for submitted request', async () => {
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

      const res = await request(app).get('/edit-request/12345678-1234-1234-1234-1234567890ab/view').expect(200);

      // make sure does not have 'submit' button
      expect(res.text).not.toContain('Confirm Submission');
      // check title
      expect(res.text).toContain('<h1 class="govuk-heading-xl">Submitted edits');
    });

    test('should return 500 when getCurrentEditRequest fails', async () => {
      jest
        .spyOn(PreClient.prototype, 'getMostRecentEditRequests')
        .mockImplementation(async (xUserId: string, sourceRecordingId: string) => {
          throw new Error('Error');
        });
      await request(app)
        .get('/edit-request/12345678-1234-1234-1234-1234567890ab/view')
        .expect(res => expect(res.status).toBe(500));
    });

    test('should return 500 when getRecording fails', async () => {
      jest.spyOn(PreClient.prototype, 'getRecording').mockImplementation(async (xUserId: string, id: string) => {
        throw new Error('Error');
      });
      await request(app)
        .get('/edit-request/12345678-1234-1234-1234-1234567890ab/view')
        .expect(res => expect(res.status).toBe(500));
    });

    it('should render not-found when recording is not found', async () => {
      mockGetRecording(null);
      mockGetCurrentEditRequest();

      await request(app).get('/edit-request/12345678-1234-1234-1234-1234567890ff/view').expect(404);
    });

    it('should render not-found when edit request is not found', async () => {
      mockGetRecording();
      mockGetCurrentEditRequest(null);

      await request(app).get('/edit-request/12345678-1234-1234-1234-1234567890ab/view').expect(404);
    });
  });

  describe('on POST /edit-request/:id/submit', () => {
    const app = require('express')();
    app.use(require('body-parser').json());
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');

    const watch = require('../../../main/routes/edit-request-view').default;
    watch(app);

    test('should return 404 when id is invalid', async () => {
      await request(app)
        .post('/edit-request/invalid-id/submit')
        .set('Content-Type', 'application/json')
        .send(
          JSON.stringify({
            id: '12345678-1234-1234-1234-1234567890ab',
            source_recording_id: '12345678-1234-1234-1234-1234567890ab',
            status: 'SUBMITTED',
            jointly_agreed: true,
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

    test('should return 404 when id is invalid', async () => {
      await request(app)
        .post('/edit-request/invalid-id/submit')
        .set('Content-Type', 'application/json')
        .send(
          JSON.stringify({
            id: '12345678-1234-1234-1234-1234567890ab',
            source_recording_id: '12345678-1234-1234-1234-1234567890ab',
            status: 'SUBMITTED',
            jointly_agreed: true,
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
      jest
        .spyOn(PreClient.prototype, 'putEditRequest')
        .mockImplementation(async (xUserId: string, editRequest: any) => {
          throw new Error('Error');
        });
      await request(app)
        .post('/edit-request/12345678-1234-1234-1234-1234567890ab/submit')
        .set('Content-Type', 'application/json')
        .send(
          JSON.stringify({
            id: '12345678-1234-1234-1234-1234567890ab',
            source_recording_id: '12345678-1234-1234-1234-1234567890ab',
            status: 'SUBMITTED',
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
      jest
        .spyOn(PreClient.prototype, 'putEditRequest')
        .mockImplementation(async (xUserId: string, editRequest: any) => {
          return Promise.resolve();
        });
      await request(app)
        .post('/edit-request/12345678-1234-1234-1234-1234567890ab/submit')
        .set('Content-Type', 'application/json')
        .send(
          JSON.stringify({
            id: '12345678-1234-1234-1234-1234567890ab',
            source_recording_id: '12345678-1234-1234-1234-1234567890ab',
            status: 'SUBMITTED',
            jointly_agreed: true,
            edit_instructions: [
              {
                start_of_cut: '00:00:00',
                end_of_cut: '00:00:01',
              },
            ],
          })
        )
        .expect(200);
    });
  });
});
