/**
 * Manages Global Privacy Control (GPC) signal emission.
 *
 * When the user rejects marketing cookies and GPC is enabled in settings,
 * this module adds a `Sec-GPC: 1` header to all outgoing requests via
 * declarativeNetRequest and injects `navigator.globalPrivacyControl = true`
 * into page contexts via a MAIN-world content script.
 */

import { getPreferences, getSettings } from "@/shared/storage-api";

/** Stable rule ID for the GPC header rule. */
export const GPC_RULE_ID = 1;

/** All resource types we attach the Sec-GPC header to. */
const GPC_RESOURCE_TYPES: chrome.declarativeNetRequest.ResourceType[] = [
  "main_frame" as chrome.declarativeNetRequest.ResourceType,
  "sub_frame" as chrome.declarativeNetRequest.ResourceType,
  "xmlhttprequest" as chrome.declarativeNetRequest.ResourceType,
  "script" as chrome.declarativeNetRequest.ResourceType,
  "image" as chrome.declarativeNetRequest.ResourceType,
  "stylesheet" as chrome.declarativeNetRequest.ResourceType,
  "font" as chrome.declarativeNetRequest.ResourceType,
];

/** Add the Sec-GPC: 1 header to all outgoing requests. */
export async function enableGpc(): Promise<void> {
  await chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [
      {
        id: GPC_RULE_ID,
        priority: 1,
        action: {
          type: "modifyHeaders" as chrome.declarativeNetRequest.RuleActionType,
          requestHeaders: [
            {
              header: "Sec-GPC",
              operation: "set" as chrome.declarativeNetRequest.HeaderOperation,
              value: "1",
            },
          ],
        },
        condition: {
          resourceTypes: GPC_RESOURCE_TYPES,
        },
      },
    ],
    removeRuleIds: [GPC_RULE_ID],
  });
}

/** Remove the Sec-GPC header rule. */
export async function disableGpc(): Promise<void> {
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [GPC_RULE_ID],
  });
}

/**
 * Synchronise the GPC declarativeNetRequest rule with current
 * user settings and cookie preferences.
 *
 * GPC is enabled when both `settings.enableGpc` is true AND
 * the user rejects marketing cookies.
 */
export async function syncGpcState(): Promise<void> {
  const settings = await getSettings();
  const preferences = await getPreferences();

  if (settings.enableGpc && !preferences.marketing) {
    await enableGpc();
  } else {
    await disableGpc();
  }
}

/**
 * Returns the JS snippet that sets `navigator.globalPrivacyControl = true`.
 * Intended for injection into a MAIN-world content script.
 */
export function getGpcContentScript(): string {
  return [
    "Object.defineProperty(navigator, 'globalPrivacyControl', {",
    "  value: true,",
    "  writable: false,",
    "  configurable: false",
    "});",
  ].join("\n");
}

/**
 * Inject the GPC navigator property into a tab's main world,
 * but only when GPC should be active.
 */
export async function injectGpcScript(tabId: number): Promise<void> {
  const settings = await getSettings();
  const preferences = await getPreferences();

  if (!settings.enableGpc || preferences.marketing) {
    return;
  }

  await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: () => {
      Object.defineProperty(navigator, "globalPrivacyControl", {
        value: true,
        writable: false,
        configurable: false,
      });
    },
  });
}
