export type HealthStatus = 'UP' | 'DOWN' | 'UNKNOWN' | 'OPERATIONAL' | 'DEGRADED';

interface HealthDetails {
  database?: string;
  validationQuery?: string;
  total?: number;
  free?: number;
  threshold?: number;
  path?: string;
  exists?: boolean;
  mediakindConnections?: Record<string, boolean>;
}

interface HealthComponent {
  status: HealthStatus;
  description?: string;
  details?: HealthDetails;
  components?: Record<string, HealthComponent>;
}

export interface HealthResponse {
  status: HealthStatus;
  groups: string[];
  components: {
    [key: string]: HealthComponent;
  };
}

interface SimplifiedHealthComponent {
  status: HealthStatus;
  components: Record<string, HealthStatus>;
  connections?: Record<string, boolean>;
}

export interface SimplifiedHealthResponse {
  [key: string]: SimplifiedHealthComponent;
}
