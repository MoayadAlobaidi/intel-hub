import { checkOne, TabKey, TabStatus } from '@/utils/checkOne';

describe('checkOne', () => {
  let mockSetStatus: jest.Mock<void, [updater: (prev: Record<TabKey, TabStatus>) => Record<TabKey, TabStatus>]>;
  let statusUpdates: Record<TabKey, TabStatus>[];
  let initialStatus: Record<TabKey, TabStatus>;

  beforeEach(() => {
    // Reset status updates tracking
    statusUpdates = [];
    initialStatus = {
      worldmonitor: 'offline',
      deltaintel: 'offline',
    };

    // Create a mock setStatus that tracks all state updates
    mockSetStatus = jest.fn((updater) => {
      const newStatus = updater(initialStatus);
      statusUpdates.push({ ...newStatus });
      initialStatus = newStatus;
    });
  });

  describe('successful API response', () => {
    it('should set status to "checking" then "online" when API returns ok: true', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ ok: true, status: 200 }),
      });

      await checkOne({
        key: 'worldmonitor',
        url: 'http://localhost:5173',
        setStatus: mockSetStatus,
        fetchFn: mockFetch,
      });

      // Verify fetch was called with correct URL
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/ping?url=http%3A%2F%2Flocalhost%3A5173',
        { cache: 'no-store' }
      );

      // Verify setStatus was called twice
      expect(mockSetStatus).toHaveBeenCalledTimes(2);

      // First call should set status to "checking"
      expect(statusUpdates[0].worldmonitor).toBe('checking');

      // Second call should set status to "online"
      expect(statusUpdates[1].worldmonitor).toBe('online');
    });

    it('should correctly URL-encode special characters in the URL', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ ok: true }),
      });

      await checkOne({
        key: 'deltaintel',
        url: 'http://localhost:3000/path?query=value&other=test',
        setStatus: mockSetStatus,
        fetchFn: mockFetch,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/ping?url=http%3A%2F%2Flocalhost%3A3000%2Fpath%3Fquery%3Dvalue%26other%3Dtest',
        { cache: 'no-store' }
      );
    });

    it('should work correctly for deltaintel tab', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ ok: true, status: 200 }),
      });

      await checkOne({
        key: 'deltaintel',
        url: 'http://localhost:3000',
        setStatus: mockSetStatus,
        fetchFn: mockFetch,
      });

      expect(statusUpdates[0].deltaintel).toBe('checking');
      expect(statusUpdates[1].deltaintel).toBe('online');
    });
  });

  describe('failed API response (ok: false)', () => {
    it('should set status to "checking" then "offline" when API returns ok: false', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ ok: false, status: 500 }),
      });

      await checkOne({
        key: 'worldmonitor',
        url: 'http://localhost:5173',
        setStatus: mockSetStatus,
        fetchFn: mockFetch,
      });

      expect(mockSetStatus).toHaveBeenCalledTimes(2);
      expect(statusUpdates[0].worldmonitor).toBe('checking');
      expect(statusUpdates[1].worldmonitor).toBe('offline');
    });

    it('should set status to "offline" when API returns ok: false with error message', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ ok: false, error: 'Connection refused' }),
      });

      await checkOne({
        key: 'deltaintel',
        url: 'http://localhost:3000',
        setStatus: mockSetStatus,
        fetchFn: mockFetch,
      });

      expect(statusUpdates[1].deltaintel).toBe('offline');
    });

    it('should handle API returning 404 status', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ ok: false, status: 404 }),
      });

      await checkOne({
        key: 'worldmonitor',
        url: 'http://localhost:5173',
        setStatus: mockSetStatus,
        fetchFn: mockFetch,
      });

      expect(statusUpdates[1].worldmonitor).toBe('offline');
    });

    it('should handle API returning 503 service unavailable', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ ok: false, status: 503 }),
      });

      await checkOne({
        key: 'deltaintel',
        url: 'http://localhost:3000',
        setStatus: mockSetStatus,
        fetchFn: mockFetch,
      });

      expect(statusUpdates[1].deltaintel).toBe('offline');
    });
  });

  describe('network/fetch error', () => {
    it('should set status to "offline" when fetch throws a network error', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await checkOne({
        key: 'worldmonitor',
        url: 'http://localhost:5173',
        setStatus: mockSetStatus,
        fetchFn: mockFetch,
      });

      expect(mockSetStatus).toHaveBeenCalledTimes(2);
      expect(statusUpdates[0].worldmonitor).toBe('checking');
      expect(statusUpdates[1].worldmonitor).toBe('offline');
    });

    it('should set status to "offline" when fetch times out', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error('Timeout'));

      await checkOne({
        key: 'deltaintel',
        url: 'http://localhost:3000',
        setStatus: mockSetStatus,
        fetchFn: mockFetch,
      });

      expect(statusUpdates[1].deltaintel).toBe('offline');
    });

    it('should set status to "offline" when json parsing fails', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await checkOne({
        key: 'worldmonitor',
        url: 'http://localhost:5173',
        setStatus: mockSetStatus,
        fetchFn: mockFetch,
      });

      expect(statusUpdates[0].worldmonitor).toBe('checking');
      expect(statusUpdates[1].worldmonitor).toBe('offline');
    });

    it('should handle DNS resolution failure', async () => {
      const mockFetch = jest.fn().mockRejectedValue(
        new Error('getaddrinfo ENOTFOUND localhost')
      );

      await checkOne({
        key: 'deltaintel',
        url: 'http://localhost:3000',
        setStatus: mockSetStatus,
        fetchFn: mockFetch,
      });

      expect(statusUpdates[1].deltaintel).toBe('offline');
    });

    it('should handle connection refused error', async () => {
      const mockFetch = jest.fn().mockRejectedValue(
        new Error('ECONNREFUSED')
      );

      await checkOne({
        key: 'worldmonitor',
        url: 'http://localhost:5173',
        setStatus: mockSetStatus,
        fetchFn: mockFetch,
      });

      expect(statusUpdates[1].worldmonitor).toBe('offline');
    });
  });

  describe('invalid URL scenarios', () => {
    it('should attempt to fetch and handle error for malformed URL', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error('Invalid URL'));

      await checkOne({
        key: 'worldmonitor',
        url: 'not-a-valid-url',
        setStatus: mockSetStatus,
        fetchFn: mockFetch,
      });

      // Should still encode the URL and make the request
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/ping?url=not-a-valid-url',
        { cache: 'no-store' }
      );
      expect(statusUpdates[1].worldmonitor).toBe('offline');
    });

    it('should handle empty URL string', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ ok: false, error: 'Missing url' }),
      });

      await checkOne({
        key: 'deltaintel',
        url: '',
        setStatus: mockSetStatus,
        fetchFn: mockFetch,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/ping?url=',
        { cache: 'no-store' }
      );
      expect(statusUpdates[1].deltaintel).toBe('offline');
    });

    it('should handle URL with special characters', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ ok: true }),
      });

      await checkOne({
        key: 'worldmonitor',
        url: 'http://localhost:5173/path with spaces',
        setStatus: mockSetStatus,
        fetchFn: mockFetch,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/ping?url=http%3A%2F%2Flocalhost%3A5173%2Fpath%20with%20spaces',
        { cache: 'no-store' }
      );
    });

    it('should handle URL with unicode characters', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ ok: true }),
      });

      await checkOne({
        key: 'deltaintel',
        url: 'http://localhost:3000/path/\u00e9\u00e8',
        setStatus: mockSetStatus,
        fetchFn: mockFetch,
      });

      // URL should be properly encoded
      expect(mockFetch).toHaveBeenCalled();
      expect(statusUpdates[1].deltaintel).toBe('online');
    });

    it('should handle https URL', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ ok: true }),
      });

      await checkOne({
        key: 'worldmonitor',
        url: 'https://example.com:443/secure',
        setStatus: mockSetStatus,
        fetchFn: mockFetch,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/ping?url=https%3A%2F%2Fexample.com%3A443%2Fsecure',
        { cache: 'no-store' }
      );
    });
  });

  describe('state management', () => {
    it('should not modify other tab statuses when updating one tab', async () => {
      initialStatus = {
        worldmonitor: 'online',
        deltaintel: 'online',
      };

      const mockFetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ ok: false }),
      });

      await checkOne({
        key: 'worldmonitor',
        url: 'http://localhost:5173',
        setStatus: mockSetStatus,
        fetchFn: mockFetch,
      });

      // deltaintel should remain unchanged
      expect(statusUpdates[0].deltaintel).toBe('online');
      expect(statusUpdates[1].deltaintel).toBe('online');

      // Only worldmonitor should change
      expect(statusUpdates[0].worldmonitor).toBe('checking');
      expect(statusUpdates[1].worldmonitor).toBe('offline');
    });

    it('should preserve existing status values for other tabs', async () => {
      initialStatus = {
        worldmonitor: 'checking',
        deltaintel: 'offline',
      };

      const mockFetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ ok: true }),
      });

      await checkOne({
        key: 'deltaintel',
        url: 'http://localhost:3000',
        setStatus: mockSetStatus,
        fetchFn: mockFetch,
      });

      // worldmonitor should remain 'checking'
      expect(statusUpdates[0].worldmonitor).toBe('checking');
      expect(statusUpdates[1].worldmonitor).toBe('checking');
    });
  });

  describe('edge cases', () => {
    it('should handle API returning undefined ok value as offline', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({}),
      });

      await checkOne({
        key: 'worldmonitor',
        url: 'http://localhost:5173',
        setStatus: mockSetStatus,
        fetchFn: mockFetch,
      });

      // undefined is falsy, so should be treated as offline
      expect(statusUpdates[1].worldmonitor).toBe('offline');
    });

    it('should handle API returning null ok value as offline', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ ok: null }),
      });

      await checkOne({
        key: 'deltaintel',
        url: 'http://localhost:3000',
        setStatus: mockSetStatus,
        fetchFn: mockFetch,
      });

      expect(statusUpdates[1].deltaintel).toBe('offline');
    });

    it('should handle rapid sequential calls', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ ok: true }),
      });

      // Make two calls in quick succession
      const promise1 = checkOne({
        key: 'worldmonitor',
        url: 'http://localhost:5173',
        setStatus: mockSetStatus,
        fetchFn: mockFetch,
      });

      const promise2 = checkOne({
        key: 'deltaintel',
        url: 'http://localhost:3000',
        setStatus: mockSetStatus,
        fetchFn: mockFetch,
      });

      await Promise.all([promise1, promise2]);

      // Both should complete successfully
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should use default fetch when fetchFn is not provided', async () => {
      // Mock global fetch
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ ok: true }),
      });

      await checkOne({
        key: 'worldmonitor',
        url: 'http://localhost:5173',
        setStatus: mockSetStatus,
      });

      expect(global.fetch).toHaveBeenCalled();

      // Restore original fetch
      global.fetch = originalFetch;
    });
  });
});
