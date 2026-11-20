import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Setup full browser mocks
Object.defineProperty(window, 'isSecureContext', {
  value: true,
  writable: true,
});

Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
});

document.execCommand = vi.fn().mockReturnValue(true);

window.open = vi.fn().mockReturnValue(null);
window.confirm = vi.fn().mockReturnValue(true);

if (!window.URL.createObjectURL) {
  window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
  window.URL.revokeObjectURL = vi.fn();
}
