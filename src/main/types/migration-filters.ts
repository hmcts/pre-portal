export interface MigrationFilters {
  caseReference?: string;
  witness?: string;
  defendant?: string;
  court?: string;
  resource_state?: string;
  reasonIn?: string[];
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
  sort?: string;
}
