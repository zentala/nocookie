/**
 * @module integration
 * External integrations: extension bridge, well-known, GPC, TCF signals.
 */

export { ExtensionBridge } from "./extension-bridge";
export type {
  ExtensionHelloMessage,
  ExtensionAckMessage,
  ExtensionBridgeOptions,
  CMPGlobalMarker,
} from "./extension-bridge";

export { WellKnownGenerator } from "./well-known";
export type { WellKnownCookieConsent, WellKnownCategory } from "./well-known";

export { GPCDetector } from "./gpc";
export type { GPCResult } from "./gpc";
