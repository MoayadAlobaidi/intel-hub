import { vi, type Mock } from 'vitest';

/**
 * Response configuration for mocking fetch calls
 */
export interface MockResponseConfig {
  /** HTTP status code (default: 200) */
  status?: number;
  /** Whether the response should be considered "ok" (default: based on status) */
  ok?: boolean;
  /** Response body - will be JSON stringified if object */
  body?: unknown;
  /** Response headers */
  headers?: Record<string, string>;
  /** Simulate network error instead of returning a response */
  networkError?: boolean;
  /** Delay in milliseconds before resolving */
  delay?: number;
  /** Custom status text */
  statusText?: string;
}

/**
 * URL pattern matching configuration
 */
export interface MockUrlPattern {
  /** Exact URL match */
  url?: string;
  /** URL pattern (regex) */
  pattern?: RegExp;
  /** URL must contain this string */
  contains?: string;
  /** Match any URL (default handler) */
  any?: boolean;
}

/**
 * Complete mock configuration
 */
export interface FetchMockConfig extends MockUrlPattern {
  /** Response configuration */
  response: MockResponseConfig;
  /** HTTP method to match (GET, POST, etc.) - optional */
  method?: string;
  /** Number of times this mock should be used (-1 for unlimited, default: -1) */
  times?: number;
}

/**
 * Creates a mock Response object
 */
function createMockResponse(config: MockResponseConfig): Response {
  const status = config.status ?? 200;
  const ok = config.ok ?? (status >= 200 && status < 300);
  const statusText = config.statusText ?? (ok ? 'OK' : 'Error');
  
  const body = config.body !== undefined 
    ? (typeof config.body === 'string' ? config.body : JSON.stringify(config.body))
    : '';

  const headers = new Headers(config.headers ?? { 'Content-Type': 'application/json' });

  // Parse JSON body safely
  let jsonBody: unknown;
  if (typeof config.body === 'string' && config.body !== '') {
    try {
      jsonBody = JSON.parse(config.body);
    } catch {
      jsonBody = config.body;
    }
  } else {
    jsonBody = config.body;
  }

  return {
    ok,
    status,
    statusText,
    headers,
    json: vi.fn().mockResolvedValue(jsonBody),
    text: vi.fn().mockResolvedValue(body),
    blob: vi.fn().mockResolvedValue(new Blob([body])),
    arrayBuffer: vi.fn().mockResolvedValue(new TextEncoder().encode(body).buffer),
    clone: vi.fn().mockReturnThis(),
    body: null,
    bodyUsed: false,
    formData: vi.fn().mockRejectedValue(new Error('Not implemented')),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
  } as Response;
}

/**
 * FetchMocker class for comprehensive fetch mocking
 * 
 * @example
 * ```typescript
 * const mocker = new FetchMocker();
 * 
 * // Mock a successful response
 * mocker.mock({ url: '/api/data', response: { body: { success: true } } });
 * 
 * // Mock a network error
 * mocker.mock({ url: '/api/error', response: { networkError: true } });
 * 
 * // Install the mock
 * mocker.install();
 * 
 * // Your tests here...
 * 
 * // Restore original fetch
 * mocker.restore();
 * ```
 */
export class FetchMocker {
  private mocks: Array<FetchMockConfig & { usageCount: number }> = [];
  private originalFetch: typeof fetch | null = null;
  private mockFetch: Mock | null = null;
  private callHistory: Array<{ url: string; options?: RequestInit }> = [];
  private defaultResponse: MockResponseConfig = { status: 404, body: { error: 'Not Found' } };

  /**
   * Add a mock configuration
   */
  mock(config: FetchMockConfig): this {
    this.mocks.push({ ...config, usageCount: 0 });
    return this;
  }

  /**
   * Set the default response for unmatched URLs
   */
  setDefault(response: MockResponseConfig): this {
    this.defaultResponse = response;
    return this;
  }

  /**
   * Install the fetch mock
   */
  install(): this {
    this.originalFetch = globalThis.fetch;
    this.mockFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method?.toUpperCase() ?? 'GET';
      
      this.callHistory.push({ url, options: init });

      // Find matching mock
      const matchingMock = this.findMatchingMock(url, method);
      const responseConfig = matchingMock?.response ?? this.defaultResponse;

      // Handle network errors
      if (responseConfig.networkError) {
        throw new TypeError('Failed to fetch');
      }

      // Handle delay
      if (responseConfig.delay) {
        await new Promise(resolve => setTimeout(resolve, responseConfig.delay));
      }

      return createMockResponse(responseConfig);
    });

    globalThis.fetch = this.mockFetch;
    return this;
  }

  /**
   * Find a mock that matches the given URL and method
   */
  private findMatchingMock(url: string, method: string): (FetchMockConfig & { usageCount: number }) | undefined {
    for (const mock of this.mocks) {
      // Check method
      if (mock.method && mock.method.toUpperCase() !== method) {
        continue;
      }

      // Check times
      if (mock.times !== undefined && mock.times !== -1 && mock.usageCount >= mock.times) {
        continue;
      }

      // Check URL matching
      let matches = false;
      
      if (mock.any) {
        matches = true;
      } else if (mock.url && url === mock.url) {
        matches = true;
      } else if (mock.pattern && mock.pattern.test(url)) {
        matches = true;
      } else if (mock.contains && url.includes(mock.contains)) {
        matches = true;
      }

      if (matches) {
        mock.usageCount++;
        return mock;
      }
    }
    return undefined;
  }

  /**
   * Restore the original fetch function
   */
  restore(): this {
    if (this.originalFetch) {
      globalThis.fetch = this.originalFetch;
      this.originalFetch = null;
    }
    this.mocks = [];
    this.callHistory = [];
    this.mockFetch = null;
    return this;
  }

  /**
   * Get the mock function (for assertions)
   */
  getMock(): Mock {
    if (!this.mockFetch) {
      throw new Error('FetchMocker not installed. Call install() first.');
    }
    return this.mockFetch;
  }

  /**
   * Get call history
   */
  getCallHistory(): Array<{ url: string; options?: RequestInit }> {
    return [...this.callHistory];
  }

  /**
   * Clear call history
   */
  clearHistory(): this {
    this.callHistory = [];
    return this;
  }

  /**
   * Check if a URL was called
   */
  wasCalled(urlOrPattern: string | RegExp): boolean {
    return this.callHistory.some(call => {
      if (typeof urlOrPattern === 'string') {
        return call.url === urlOrPattern || call.url.includes(urlOrPattern);
      }
      return urlOrPattern.test(call.url);
    });
  }

  /**
   * Get the number of times fetch was called
   */
  callCount(): number {
    return this.callHistory.length;
  }
}

/**
 * Create a simple fetch mock for basic use cases
 * 
 * @example
 * ```typescript
 * const { mock, restore } = createFetchMock({ ok: true, status: 200 });
 * // ... tests
 * restore();
 * ```
 */
export function createFetchMock(responseConfig: MockResponseConfig): {
  mock: Mock;
  restore: () => void;
} {
  const originalFetch = globalThis.fetch;
  
  const mock = vi.fn(async () => {
    if (responseConfig.networkError) {
      throw new TypeError('Failed to fetch');
    }
    
    if (responseConfig.delay) {
      await new Promise(resolve => setTimeout(resolve, responseConfig.delay));
    }
    
    return createMockResponse(responseConfig);
  });

  globalThis.fetch = mock;

  return {
    mock,
    restore: () => {
      globalThis.fetch = originalFetch;
    },
  };
}

/**
 * Mock fetch to return a successful JSON response
 */
export function mockFetchSuccess<T>(data: T, status = 200): {
  mock: Mock;
  restore: () => void;
} {
  return createFetchMock({ status, ok: true, body: data });
}

/**
 * Mock fetch to return an error response
 */
export function mockFetchError(status: number, errorBody?: unknown): {
  mock: Mock;
  restore: () => void;
} {
  return createFetchMock({ 
    status, 
    ok: false, 
    body: errorBody ?? { error: 'Request failed' } 
  });
}

/**
 * Mock fetch to throw a network error
 */
export function mockFetchNetworkError(): {
  mock: Mock;
  restore: () => void;
} {
  return createFetchMock({ networkError: true });
}

/**
 * Create a mock for the Next.js API ping endpoint
 */
export function mockPingEndpoint(options: {
  targetOk?: boolean;
  targetStatus?: number;
  shouldFail?: boolean;
}): FetchMocker {
  const mocker = new FetchMocker();
  
  if (options.shouldFail) {
    mocker.mock({
      contains: '/api/ping',
      response: { networkError: true },
    });
  } else {
    mocker.mock({
      contains: '/api/ping',
      response: {
        status: 200,
        ok: true,
        body: {
          ok: options.targetOk ?? true,
          status: options.targetStatus ?? 200,
        },
      },
    });
  }

  return mocker.install();
}

/**
 * Type-safe mock response builder
 */
export class ResponseBuilder {
  private config: MockResponseConfig = {};

  status(code: number): this {
    this.config.status = code;
    return this;
  }

  ok(value = true): this {
    this.config.ok = value;
    return this;
  }

  body<T>(data: T): this {
    this.config.body = data;
    return this;
  }

  headers(headers: Record<string, string>): this {
    this.config.headers = headers;
    return this;
  }

  delay(ms: number): this {
    this.config.delay = ms;
    return this;
  }

  networkError(): this {
    this.config.networkError = true;
    return this;
  }

  build(): MockResponseConfig {
    return { ...this.config };
  }
}

/**
 * Factory function to start building a response
 */
export function response(): ResponseBuilder {
  return new ResponseBuilder();
}
