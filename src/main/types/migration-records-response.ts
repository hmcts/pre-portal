export interface MigrationRecordsResponse {
  migrationRecords: any[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalElements: number;
    size: number;
  };
}
