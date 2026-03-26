/**
 * In-memory mock for chrome.storage.sync and chrome.storage.local.
 *
 * Provides a factory that creates a storage area mock with get/set/remove/clear,
 * plus test helpers _store() and _reset() for inspection and teardown.
 */

import { vi } from "vitest";

/** A mock storage area compatible with chrome.storage.sync / local. */
export interface StorageAreaMock {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
  /** Peek at raw store contents (test helper). */
  _store: () => Record<string, unknown>;
  /** Reset the store to empty (test helper). */
  _reset: () => void;
}

/** Create a fresh in-memory chrome.storage area mock. */
export function createStorageMock(): StorageAreaMock {
  let store: Record<string, unknown> = {};
  return {
    get: vi.fn((keys: unknown) => {
      if (typeof keys === "string") {
        return Promise.resolve({ [keys]: store[keys] });
      }
      if (Array.isArray(keys)) {
        const result: Record<string, unknown> = {};
        keys.forEach((k: string) => {
          if (k in store) result[k] = store[k];
        });
        return Promise.resolve(result);
      }
      const result: Record<string, unknown> = {};
      for (const [k, def] of Object.entries(keys as Record<string, unknown>)) {
        result[k] = k in store ? store[k] : def;
      }
      return Promise.resolve(result);
    }),
    set: vi.fn((items: Record<string, unknown>) => {
      Object.assign(store, items);
      return Promise.resolve();
    }),
    remove: vi.fn((keys: string | string[]) => {
      (Array.isArray(keys) ? keys : [keys]).forEach((k) => delete store[k]);
      return Promise.resolve();
    }),
    clear: vi.fn(() => {
      store = {};
      return Promise.resolve();
    }),
    _store: () => store,
    _reset: () => {
      store = {};
    },
  };
}

/** Install chrome storage mocks on globalThis and return them. */
export function installChromeMock(): {
  syncMock: StorageAreaMock;
  localMock: StorageAreaMock;
} {
  const syncMock = createStorageMock();
  const localMock = createStorageMock();
  globalThis.chrome = {
    storage: { sync: syncMock, local: localMock },
  } as unknown as typeof chrome;
  return { syncMock, localMock };
}
