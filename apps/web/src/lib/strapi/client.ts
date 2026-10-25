import qs from 'qs';

const STRAPI_URL = process.env.STRAPI_URL ?? 'http://127.0.0.1:1337';

export class StrapiRequestError extends Error {
  readonly status: number;
  readonly fieldErrors?: Record<string, string>;

  constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'StrapiRequestError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

interface StrapiErrorDetails {
  errors?: Array<{ path?: string[]; message?: string }>;
}

interface StrapiErrorBody {
  error?: {
    status?: number;
    message?: string;
    details?: StrapiErrorDetails;
  };
}

function mapFieldErrors(details?: StrapiErrorDetails) {
  const errors = details?.errors;
  if (!errors?.length) return undefined;

  const fieldErrors: Record<string, string> = {};
  for (const fieldError of errors) {
    const field = fieldError.path?.[0];
    if (field && fieldError.message) fieldErrors[field] = fieldError.message;
  }
  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
}

interface StrapiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  query?: Record<string, unknown>;
  body?: unknown;
  token?: string;
}

// The one place that calls Strapi over HTTP — every other lib/strapi
// module, and the two Route Handlers, go through this. Never call fetch()
// against STRAPI_URL anywhere else.
export async function strapiFetch(path: string, options: StrapiRequestOptions = {}): Promise<unknown> {
  const { method = 'GET', query, body, token } = options;

  const queryString = query ? qs.stringify(query, { encodeValuesOnly: true }) : '';
  const url = `${STRAPI_URL}${path}${queryString ? `?${queryString}` : ''}`;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = (await response.json()) as unknown;

  if (!response.ok) {
    const errorBody = json as StrapiErrorBody;
    throw new StrapiRequestError(
      errorBody.error?.status ?? response.status,
      errorBody.error?.message ?? 'Une erreur est survenue.',
      mapFieldErrors(errorBody.error?.details),
    );
  }

  return json;
}
