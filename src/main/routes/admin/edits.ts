import { PreClient } from '../../services/pre-api/pre-client';
import { SessionUser } from '../../services/session-user/session-user';
import { UserLevel } from '../../types/user-level';
import { Application } from 'express';
import openidConnect from 'express-openid-connect';
import multer from 'multer';
import path from 'path';
import { generatePaginatedTitle, generatePaginationLinks } from '../../utils/helpers';

const storage = multer.memoryStorage();

const csvFileFilter = (req: any, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (file.mimetype === 'text/csv' || ext === '.csv') {
    callback(null, true);
  } else {
    callback(new Error('Only CSV files are allowed'));
  }
};

const upload = multer({ storage, fileFilter: csvFileFilter, limits: { fileSize: 2000000 } });

const getSuperUserId = (req: any): string | undefined => {
  return SessionUser.getLoggedInUserProfile(req).app_access.filter(role => role.role.name === UserLevel.SUPER_USER)[0]
    ?.id;
};

const getDateOneWeekAgo = (): string => {
  const date = new Date();
  date.setDate(date.getDate() - 7);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // months are 0-based
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export default function (app: Application): void {
  app.get('/admin/edit-request', openidConnect.requiresAuth(), async (req, res) => {
    const superUserId = getSuperUserId(req);
    if (!superUserId) {
      res.status(404);
      res.render('not-found');
      return;
    }

    const client = new PreClient();

    const { edits, pagination } = await client.getEditRequests(superUserId, {
      lastModifiedAfter: getDateOneWeekAgo(),
      page: (req.query.page as unknown as number) || 0,
    });

    const paginationLinks = generatePaginationLinks(pagination, '/admin/edit-request');

    res.render('admin/edits', {
      title: 'Edit Upload',
      tableTitle: generatePaginatedTitle(pagination, 'Edit requests in the last week:'),
      isSuperUser: true,
      edits,
      paginationLinks,
      pageUrl: req.url,
    });
  });

  app.get('/edits/recordings', openidConnect.requiresAuth(), async (req, res) => {
    const superUserId = getSuperUserId(req);
    if (!superUserId) {
      res.status(404);
      res.render('not-found');
      return;
    }

    const { case_reference } = req.query;
    if (!case_reference || typeof case_reference !== 'string') {
      res.status(400).json({ error: 'case_reference is required' });
      return;
    }

    const client = new PreClient();
    const { recordings } = await client.getRecordings(superUserId, {
      caseReference: req.query.case_reference as string,
      // todo more reasonable number here?
      size: 50,
    });

    res.json(recordings);
  });

  app.post(
    '/admin/edit-request/upload',
    openidConnect.requiresAuth(),
    upload.single('file-upload'),
    async (req, res) => {
      const superUserId = getSuperUserId(req);
      if (!superUserId) {
        res.status(404);
        res.render('not-found');
        return;
      }

      try {
        const file = req.file;
        const sourceRecordingId = req.body.source_recording;

        if (!file || !sourceRecordingId) {
          res.status(400).json({ message: 'Missing file or source recording id' });
          return;
        }

        await new PreClient().postEditsFromCsv(superUserId, sourceRecordingId, file.buffer);
        res.redirect('/admin/edit-request');
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }
  );
}
