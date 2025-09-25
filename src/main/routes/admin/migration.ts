import { Application } from 'express';
import { PreClient } from '../../services/pre-api/pre-client';
import { requiresAuth } from 'express-openid-connect';
import { RequiresSuperUser } from '../../middleware/admin-middleware';

import { MigrationRecordService } from '../../services/system-status/migration-status';
import { CourtService } from '../../services/system-status/courts';
import { formatDateToDDMMYYYY, toIsoDateString } from '../../utils/convert-date';
import { COURT_ALIASES } from '../../utils/court-alias';
import { formatDuration } from '../../utils/format-duration';

export default function (app: Application): void {
  app.get('/admin/migration', requiresAuth(), RequiresSuperUser, async (req, res) => {
    const client = new PreClient();

    let resourceState: string | undefined;

    if (req.query.resource_state === undefined) {
      resourceState = 'Unresolved';
    } else {
      resourceState = req.query.resource_state as string;
    }
    let reasonIn: string[] = [];

    if (resourceState === 'Unresolved' && req.query.reasonIn) {
      reasonIn = Array.isArray(req.query.reasonIn) ? (req.query.reasonIn as string[]) : [req.query.reasonIn as string];
    } else {
      reasonIn = [];
    }
    const startDateInput = req.query['start-date'] as string;
    const endDateInput = req.query['end-date'] as string;
    const filters = {
      caseReference: req.query['case-reference'] as string,
      witness: req.query.witness as string,
      defendant: req.query.defendant as string,
      court: req.query.court as string,
      resource_state: resourceState,
      startDate: toIsoDateString(startDateInput),
      endDate: toIsoDateString(endDateInput),
      reasonIn,
      page: req.query.page as unknown as number,
      size: 10,
    };

    const courtService = new CourtService(req, client);
    const migrationRecordService = new MigrationRecordService(req, client);

    const courts = await courtService.getCourtOptions();

    const page = req.query.page ? Number(req.query.page) : 0;
    const size = 20;
    const { migrationRecords, pagination } = await migrationRecordService.getMigrationRecords({
      caseReference: filters.caseReference,
      witness: filters.witness,
      defendant: filters.defendant,
      court: '',
      resource_state: filters.resource_state,
      startDate: filters.startDate,
      endDate: filters.endDate,
      reasonIn: filters.reasonIn,
      page,
      size,
      sort: 'createTime,DESC',
    });

    let filteredRecords = migrationRecords || [];
    if (filters.court) {
      const aliases = COURT_ALIASES[filters.court] || [filters.court];
      filteredRecords = filteredRecords.filter(record => {
        const recordCourt =
          record.court
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .trim() || '';
        return aliases.includes(recordCourt);
      });
    }

    function buildPageUrl(page: number, filters: any) {
      const params = new URLSearchParams();

      if (filters.caseReference) params.set('case-reference', filters.caseReference);
      if (filters.witness) params.set('witness', filters.witness);
      if (filters.defendant) params.set('defendant', filters.defendant);
      if (filters.court) params.set('court', filters.court);
      if (filters.resource_state !== undefined) {
        params.set('resource_state', filters.resource_state);
      }
      if (filters.startDate) params.set('start-date', filters.startDate);
      if (filters.endDate) params.set('end-date', filters.endDate);

      if (filters.reasonIn) {
        const reasons = Array.isArray(filters.reasonIn) ? filters.reasonIn : [filters.reasonIn];
        reasons.forEach((reason: string) => params.append('reasonIn', reason));
      }

      params.set('page', page.toString());
      return `/admin/migration?${params.toString()}`;
    }
    const paginationLinks = {
      previous: {},
      next: {},
      items: [] as ({ href: string; number: number; current: boolean } | { ellipsis: boolean })[],
    };

    if (pagination.currentPage > 0) {
      paginationLinks.previous = {
        href: buildPageUrl(pagination.currentPage - 1, filters),
      };
    }

    if (pagination.currentPage < pagination.totalPages - 1) {
      paginationLinks.next = {
        href: buildPageUrl(pagination.currentPage + 1, filters),
      };
    }

    paginationLinks.items.push({
      href: buildPageUrl(0, filters),
      number: 1,
      current: 0 === pagination.currentPage,
    });

    if (pagination.currentPage > 3) {
      paginationLinks.items.push({ ellipsis: true });
    }

    for (
      let i = Math.max(1, pagination.currentPage - 2);
      i <= Math.min(pagination.currentPage + 2, pagination.totalPages - 2);
      i++
    ) {
      paginationLinks.items.push({
        href: buildPageUrl(i, filters),
        number: i + 1,
        current: i === pagination.currentPage,
      });
    }

    if (pagination.currentPage < pagination.totalPages - 4) {
      paginationLinks.items.push({ ellipsis: true });
    }

    if (pagination.totalPages > 1) {
      paginationLinks.items.push({
        href: buildPageUrl(pagination.totalPages - 1, filters),

        number: pagination.totalPages,
        current: pagination.totalPages - 1 === pagination.currentPage,
      });
    }

    const formattedMigrationRecords = filteredRecords?.map(record => ({
      ...record,
      displayCreateDate: formatDateToDDMMYYYY(record.createDate),
      displayDuration: formatDuration(record.duration),
    }));

    const recordsCount = pagination?.totalElements || 0;

    const allRecordsResponse = await migrationRecordService.getMigrationRecords({
      caseReference: '',
      witness: '',
      defendant: '',
      court: '',
      resource_state: '',
      startDate: '',
      endDate: '',
      reasonIn: [],
      page: 0,
      size: 100000,
    });

    const allMigrationRecords = allRecordsResponse.migrationRecords || [];
    const hasReadyRecords = allMigrationRecords.some(r => r.status === 'READY');
    const hasSubmittedRecords = allMigrationRecords.some(r => r.status === 'SUBMITTED');

    res.render('admin/migration', {
      isSuperUser: true,
      migrationRecords: formattedMigrationRecords,
      hasReadyRecords,
      hasSubmittedRecords,
      paginationLinks,
      filters: {
        ...filters,
        startDateInput,
        endDateInput,
      },
      courts,
      recordsCount,
      selectedCourt: req.query.court || '',
      request: req,
      pageUrl: req.url,
    });
  });

  app.put('/admin/migration/:id', requiresAuth(), RequiresSuperUser, async (req, res) => {
    const client = new PreClient();
    const migrationRecordService = new MigrationRecordService(req, client);
    const recordId = req.params.id;

    try {
      await migrationRecordService.updateMigrationRecord(recordId, req.body);
      res.status(204).send();
    } catch (e: any) {
      console.error('Error updating migration record:', e.response?.data || e.message);
      res.status(e.response?.status || 500).json({ error: e.response?.data || e.message });
    }
  });

  app.post('/admin/migration/submit', requiresAuth(), RequiresSuperUser, async (req, res) => {
    const client = new PreClient();
    const migrationRecordService = new MigrationRecordService(req, client);

    try {
      await migrationRecordService.submitMigrationRecords();
      res.status(204).send();
    } catch (e: any) {
      console.error('Error submitting migration records:', e.response?.data || e.message);
      res.status(e.response?.status || 500).json({ error: e.response?.data || e.message });
    }
  });
}
