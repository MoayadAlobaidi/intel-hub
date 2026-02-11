import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { FetchMocker, mockPingEndpoint, response } from '../utils';

// Import the component
import Home from '@/app/page';

describe('Home Page', () => {
  let fetchMocker: FetchMocker;

  beforeEach(() => {
    fetchMocker = new FetchMocker();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    
    // Clear localStorage mock
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    vi.mocked(localStorage.setItem).mockClear();
  });

  afterEach(() => {
    fetchMocker.restore();
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('should render the header with Intel Hub title', async () => {
      fetchMocker
        .mock({
          contains: '/api/ping',
          response: response().status(200).ok().body({ ok: true, status: 200 }).build(),
        })
        .install();

      await act(async () => {
        render(<Home />);
      });

      expect(screen.getByText('Intel Hub')).toBeInTheDocument();
    });

    it('should render both tab buttons', async () => {
      fetchMocker
        .mock({
          contains: '/api/ping',
          response: response().status(200).ok().body({ ok: true, status: 200 }).build(),
        })
        .install();

      await act(async () => {
        render(<Home />);
      });

      expect(screen.getByText('World Monitor')).toBeInTheDocument();
      expect(screen.getByText('Delta Intel')).toBeInTheDocument();
    });

    it('should render action buttons', async () => {
      fetchMocker
        .mock({
          contains: '/api/ping',
          response: response().status(200).ok().body({ ok: true, status: 200 }).build(),
        })
        .install();

      await act(async () => {
        render(<Home />);
      });

      expect(screen.getByText('Open in new tab')).toBeInTheDocument();
      expect(screen.getByText('Refresh status')).toBeInTheDocument();
    });
  });

  describe('checkOne function behavior', () => {
    it('should show checking status indicator initially', async () => {
      fetchMocker
        .mock({
          contains: '/api/ping',
          response: response().status(200).ok().body({ ok: true, status: 200 }).delay(100).build(),
        })
        .install();

      render(<Home />);

      // Both should show the ellipsis character (checking indicator) initially
      // Using a custom text matcher to handle the special character
      const checkingElements = screen.getAllByText((content) => content === '\u2026');
      expect(checkingElements.length).toBeGreaterThan(0);
    });

    it('should update status to "online" when ping succeeds', async () => {
      fetchMocker
        .mock({
          contains: '/api/ping',
          response: response().status(200).ok().body({ ok: true, status: 200 }).build(),
        })
        .install();

      await act(async () => {
        render(<Home />);
      });

      await waitFor(() => {
        expect(screen.getAllByText('online').length).toBeGreaterThan(0);
      });
    });

    it('should update status to "offline" when ping fails with ok:false', async () => {
      fetchMocker
        .mock({
          contains: '/api/ping',
          response: response().status(200).ok().body({ ok: false, status: 503 }).build(),
        })
        .install();

      await act(async () => {
        render(<Home />);
      });

      await waitFor(() => {
        expect(screen.getAllByText('offline').length).toBeGreaterThan(0);
      });
    });

    it('should update status to "offline" when fetch throws network error', async () => {
      fetchMocker
        .mock({
          contains: '/api/ping',
          response: { networkError: true },
        })
        .install();

      await act(async () => {
        render(<Home />);
      });

      await waitFor(() => {
        expect(screen.getAllByText('offline').length).toBeGreaterThan(0);
      });
    });

    it('should call the correct ping endpoint with encoded URL', async () => {
      fetchMocker
        .mock({
          contains: '/api/ping',
          response: response().status(200).ok().body({ ok: true, status: 200 }).build(),
        })
        .install();

      await act(async () => {
        render(<Home />);
      });

      await waitFor(() => {
        const callHistory = fetchMocker.getCallHistory();
        expect(callHistory.some(c => c.url.includes('/api/ping?url='))).toBe(true);
      });
    });
  });

  describe('tab switching', () => {
    it('should switch active tab when clicked', async () => {
      fetchMocker
        .mock({
          contains: '/api/ping',
          response: response().status(200).ok().body({ ok: true, status: 200 }).build(),
        })
        .install();

      await act(async () => {
        render(<Home />);
      });

      const deltaIntelButton = screen.getByText('Delta Intel').closest('button')!;
      
      await act(async () => {
        fireEvent.click(deltaIntelButton);
      });

      // Should save to localStorage
      expect(localStorage.setItem).toHaveBeenCalledWith('intelHub.activeTab', 'deltaintel');
    });

    it('should restore active tab from localStorage', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('deltaintel');

      fetchMocker
        .mock({
          contains: '/api/ping',
          response: response().status(200).ok().body({ ok: true, status: 200 }).build(),
        })
        .install();

      await act(async () => {
        render(<Home />);
      });

      expect(localStorage.getItem).toHaveBeenCalledWith('intelHub.activeTab');
    });
  });

  describe('refresh status button', () => {
    it('should trigger status check when clicked', async () => {
      fetchMocker
        .mock({
          contains: '/api/ping',
          response: response().status(200).ok().body({ ok: true, status: 200 }).build(),
        })
        .install();

      await act(async () => {
        render(<Home />);
      });

      // Wait for initial checks to complete
      await waitFor(() => {
        expect(screen.getAllByText('online').length).toBeGreaterThan(0);
      });

      const initialCallCount = fetchMocker.callCount();

      // Click refresh button
      const refreshButton = screen.getByText('Refresh status');
      await act(async () => {
        fireEvent.click(refreshButton);
      });

      // Should have made additional fetch calls
      await waitFor(() => {
        expect(fetchMocker.callCount()).toBeGreaterThan(initialCallCount);
      });
    });
  });

  describe('periodic health checks', () => {
    it('should perform periodic health checks every 15 seconds', async () => {
      fetchMocker
        .mock({
          contains: '/api/ping',
          response: response().status(200).ok().body({ ok: true, status: 200 }).build(),
        })
        .install();

      await act(async () => {
        render(<Home />);
      });

      // Wait for initial checks
      await waitFor(() => {
        expect(fetchMocker.callCount()).toBe(2); // 2 tabs checked
      });

      // Advance timer by 15 seconds
      await act(async () => {
        vi.advanceTimersByTime(15000);
      });

      // Should have made 2 more calls (one for each tab)
      await waitFor(() => {
        expect(fetchMocker.callCount()).toBe(4);
      });
    });

    it('should cleanup interval on unmount', async () => {
      fetchMocker
        .mock({
          contains: '/api/ping',
          response: response().status(200).ok().body({ ok: true, status: 200 }).build(),
        })
        .install();

      const { unmount } = render(<Home />);

      // Wait for initial checks
      await waitFor(() => {
        expect(fetchMocker.callCount()).toBe(2);
      });

      unmount();
      fetchMocker.clearHistory();

      // Advance timer - should not trigger more fetches
      await act(async () => {
        vi.advanceTimersByTime(15000);
      });

      expect(fetchMocker.callCount()).toBe(0);
    });
  });

  describe('open in new tab button', () => {
    it('should open the active tab URL in new window', async () => {
      const windowOpenMock = vi.fn();
      globalThis.open = windowOpenMock;

      fetchMocker
        .mock({
          contains: '/api/ping',
          response: response().status(200).ok().body({ ok: true, status: 200 }).build(),
        })
        .install();

      await act(async () => {
        render(<Home />);
      });

      const openButton = screen.getByText('Open in new tab');
      
      await act(async () => {
        fireEvent.click(openButton);
      });

      expect(windowOpenMock).toHaveBeenCalledWith(
        expect.stringContaining('localhost'),
        '_blank'
      );
    });
  });

  describe('using mockPingEndpoint helper', () => {
    it('should work with mockPingEndpoint for online status', async () => {
      const mocker = mockPingEndpoint({ targetOk: true, targetStatus: 200 });

      await act(async () => {
        render(<Home />);
      });

      await waitFor(() => {
        expect(screen.getAllByText('online').length).toBeGreaterThan(0);
      });

      mocker.restore();
    });

    it('should work with mockPingEndpoint for offline status', async () => {
      const mocker = mockPingEndpoint({ targetOk: false, targetStatus: 503 });

      await act(async () => {
        render(<Home />);
      });

      await waitFor(() => {
        expect(screen.getAllByText('offline').length).toBeGreaterThan(0);
      });

      mocker.restore();
    });

    it('should work with mockPingEndpoint for network failure', async () => {
      const mocker = mockPingEndpoint({ shouldFail: true });

      await act(async () => {
        render(<Home />);
      });

      await waitFor(() => {
        expect(screen.getAllByText('offline').length).toBeGreaterThan(0);
      });

      mocker.restore();
    });
  });
});
