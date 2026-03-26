/**
 * Comprehensive chrome API mock for tests.
 * Covers: storage, runtime, tabs, action, scripting, declarativeNetRequest.
 */
import { vi } from "vitest";

import { createStorageMock } from "./chrome-storage-mock";

/** Set up a full chrome API mock on globalThis and return it. */
export function setupChromeMock() {
  const storageMock = {
    sync: createStorageMock(),
    local: createStorageMock(),
    onChanged: { addListener: vi.fn() },
  };

  const chromeMock = {
    storage: storageMock,
    runtime: {
      onMessage: { addListener: vi.fn() },
      onInstalled: { addListener: vi.fn() },
      sendMessage: vi.fn().mockResolvedValue(undefined),
      getURL: vi.fn((path: string) => `chrome-extension://mock-id/${path}`),
      openOptionsPage: vi.fn(),
    },
    tabs: {
      query: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({}),
      onUpdated: { addListener: vi.fn() },
      onRemoved: { addListener: vi.fn() },
      onActivated: { addListener: vi.fn() },
    },
    action: {
      setBadgeText: vi.fn().mockResolvedValue(undefined),
      setBadgeBackgroundColor: vi.fn().mockResolvedValue(undefined),
      setIcon: vi.fn().mockResolvedValue(undefined),
    },
    scripting: {
      executeScript: vi.fn().mockResolvedValue(undefined),
    },
    declarativeNetRequest: {
      updateDynamicRules: vi.fn().mockResolvedValue(undefined),
    },
  };

  globalThis.chrome = chromeMock as unknown as typeof chrome;
  return chromeMock;
}

/** Reset storage state in an existing chrome mock. */
export function resetChromeMock() {
  const mock = globalThis.chrome as any;
  mock?.storage?.sync?._reset?.();
  mock?.storage?.local?._reset?.();
}
