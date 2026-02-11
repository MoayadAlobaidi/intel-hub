/**
 * Test utilities for Intel Hub
 * 
 * This module provides comprehensive mocking patterns for tests,
 * especially for fetch API calls used throughout the application.
 */

export {
  FetchMocker,
  createFetchMock,
  mockFetchSuccess,
  mockFetchError,
  mockFetchNetworkError,
  mockPingEndpoint,
  ResponseBuilder,
  response,
  type MockResponseConfig,
  type MockUrlPattern,
  type FetchMockConfig,
} from './fetch-mock';
