import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FetchMocker, mockFetchSuccess, mockFetchError, mockFetchNetworkError, response } from '../utils';
import { NextResponse } from 'next/server';

// We test the route handler by directly calling the function
// The function uses global fetch, which we mock

describe('GET /api/ping', () => {
  let fetchMocker: FetchMocker;
  let GET: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    fetchMocker = new FetchMocker();
    // Dynamically import to ensure fresh module state
    const module = await import('@/app/api/ping/route');
    GET = module.GET;
  });

  afterEach(() => {
    fetchMocker.restore();
    vi.resetModules();
  });

  describe('parameter validation', () => {
    it('should return 400 error when url parameter is missing', async () => {
      const request = new Request('http://localhost:3001/api/ping');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ ok: false, error: 'Missing url' });
    });

    it('should return 400 error when url parameter is empty', async () => {
      const request = new Request('http://localhost:3001/api/ping?url=');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ ok: false, error: 'Missing url' });
    });
  });

  describe('successful health checks', () => {
    it('should return ok:true when target URL responds with 200', async () => {
      fetchMocker
        .mock({
          url: 'http://example.com',
          response: { status: 200, ok: true, body: '' },
        })
        .install();

      const request = new Request('http://localhost:3001/api/ping?url=http://example.com');
      
      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual({ ok: true, status: 200 });
      expect(fetchMocker.wasCalled('http://example.com')).toBe(true);
    });

    it('should return ok:true for any 2xx status code', async () => {
      fetchMocker
        .mock({
          url: 'http://example.com',
          response: { status: 201, ok: true, body: '' },
        })
        .install();

      const request = new Request('http://localhost:3001/api/ping?url=http://example.com');
      
      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual({ ok: true, status: 201 });
    });

    it('should correctly encode URLs with special characters', async () => {
      const targetUrl = 'http://example.com/path?param=value&other=123';
      
      fetchMocker
        .mock({
          url: targetUrl,
          response: { status: 200, ok: true, body: '' },
        })
        .install();

      const request = new Request(`http://localhost:3001/api/ping?url=${encodeURIComponent(targetUrl)}`);
      
      await GET(request);

      expect(fetchMocker.wasCalled(targetUrl)).toBe(true);
    });
  });

  describe('failed health checks', () => {
    it('should return ok:false when target URL responds with 404', async () => {
      fetchMocker
        .mock({
          url: 'http://example.com',
          response: { status: 404, ok: false, body: '' },
        })
        .install();

      const request = new Request('http://localhost:3001/api/ping?url=http://example.com');
      
      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual({ ok: false, status: 404 });
    });

    it('should return ok:false when target URL responds with 500', async () => {
      fetchMocker
        .mock({
          url: 'http://example.com',
          response: { status: 500, ok: false, body: '' },
        })
        .install();

      const request = new Request('http://localhost:3001/api/ping?url=http://example.com');
      
      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual({ ok: false, status: 500 });
    });

    it('should return ok:false when target URL responds with 503', async () => {
      fetchMocker
        .mock({
          url: 'http://example.com',
          response: { status: 503, ok: false, body: '' },
        })
        .install();

      const request = new Request('http://localhost:3001/api/ping?url=http://example.com');
      
      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual({ ok: false, status: 503 });
    });
  });

  describe('network errors', () => {
    it('should handle network errors gracefully', async () => {
      fetchMocker
        .mock({
          url: 'http://example.com',
          response: { networkError: true },
        })
        .install();

      const request = new Request('http://localhost:3001/api/ping?url=http://example.com');
      
      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual({ ok: false, error: 'Failed to fetch' });
    });

    it('should handle DNS resolution errors', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND invalid.domain'));

      const request = new Request('http://localhost:3001/api/ping?url=http://invalid.domain');
      
      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual({ ok: false, error: 'getaddrinfo ENOTFOUND invalid.domain' });

      globalThis.fetch = originalFetch;
    });

    it('should handle connection timeout errors', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('ETIMEDOUT'));

      const request = new Request('http://localhost:3001/api/ping?url=http://slow.example.com');
      
      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual({ ok: false, error: 'ETIMEDOUT' });

      globalThis.fetch = originalFetch;
    });

    it('should handle connection refused errors', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      const request = new Request('http://localhost:3001/api/ping?url=http://localhost:9999');
      
      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual({ ok: false, error: 'ECONNREFUSED' });

      globalThis.fetch = originalFetch;
    });
  });

  describe('edge cases', () => {
    it('should use GET method for health checks', async () => {
      fetchMocker
        .mock({
          url: 'http://example.com',
          method: 'GET',
          response: { status: 200, ok: true, body: '' },
        })
        .install();

      const request = new Request('http://localhost:3001/api/ping?url=http://example.com');
      
      await GET(request);

      const callHistory = fetchMocker.getCallHistory();
      expect(callHistory.length).toBe(1);
      // Default method should be GET (undefined defaults to GET)
      expect(callHistory[0].options?.method ?? 'GET').toBe('GET');
    });

    it('should use no-store cache option', async () => {
      fetchMocker
        .mock({
          url: 'http://example.com',
          response: { status: 200, ok: true, body: '' },
        })
        .install();

      const request = new Request('http://localhost:3001/api/ping?url=http://example.com');
      
      await GET(request);

      const callHistory = fetchMocker.getCallHistory();
      expect(callHistory[0].options?.cache).toBe('no-store');
    });

    it('should handle URLs with ports', async () => {
      const targetUrl = 'http://localhost:5173';
      
      fetchMocker
        .mock({
          url: targetUrl,
          response: { status: 200, ok: true, body: '' },
        })
        .install();

      const request = new Request(`http://localhost:3001/api/ping?url=${encodeURIComponent(targetUrl)}`);
      
      await GET(request);

      expect(fetchMocker.wasCalled(targetUrl)).toBe(true);
    });

    it('should handle HTTPS URLs', async () => {
      const targetUrl = 'https://secure.example.com';
      
      fetchMocker
        .mock({
          url: targetUrl,
          response: { status: 200, ok: true, body: '' },
        })
        .install();

      const request = new Request(`http://localhost:3001/api/ping?url=${encodeURIComponent(targetUrl)}`);
      
      await GET(request);

      expect(fetchMocker.wasCalled(targetUrl)).toBe(true);
    });
  });

  describe('using helper functions', () => {
    it('should work with mockFetchSuccess helper', async () => {
      const { mock, restore } = mockFetchSuccess({ message: 'OK' });

      const request = new Request('http://localhost:3001/api/ping?url=http://example.com');
      
      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual({ ok: true, status: 200 });
      
      restore();
    });

    it('should work with mockFetchError helper', async () => {
      const { mock, restore } = mockFetchError(503, { error: 'Service Unavailable' });

      const request = new Request('http://localhost:3001/api/ping?url=http://example.com');
      
      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual({ ok: false, status: 503 });
      
      restore();
    });

    it('should work with mockFetchNetworkError helper', async () => {
      const { mock, restore } = mockFetchNetworkError();

      const request = new Request('http://localhost:3001/api/ping?url=http://example.com');
      
      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual({ ok: false, error: 'Failed to fetch' });
      
      restore();
    });

    it('should work with response builder', async () => {
      fetchMocker
        .mock({
          url: 'http://example.com',
          response: response().status(200).ok(true).body('').build(),
        })
        .install();

      const request = new Request('http://localhost:3001/api/ping?url=http://example.com');
      
      const res = await GET(request);
      const data = await res.json();

      expect(data).toEqual({ ok: true, status: 200 });
    });
  });
});
