// src/lib/api/types.ts
// Standard backend envelope. Confirm/extend against aashray-backend responses
// as feature types are added in Phase 3.
export interface ApiEnvelope<T> {
  message?: string;
  data: T;
}

export interface ApiErrorDetails {
  message: string;
  status?: number;
  data?: unknown;
  correlationId: string;
}

export class ApiError extends Error {
  status?: number;
  data?: unknown;
  correlationId: string;

  constructor(details: ApiErrorDetails) {
    super(details.message);
    this.name = 'ApiError';
    this.status = details.status;
    this.data = details.data;
    this.correlationId = details.correlationId;
  }
}
