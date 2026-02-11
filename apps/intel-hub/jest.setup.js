// Jest setup file
// Add any global test setup here

// Polyfill for fetch if not available
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn();
}
