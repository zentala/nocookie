/**
 * @module core
 * Core CMP modules: config, consent state, category registry, event bus.
 */

export { parseConfig, expandCategory, isValidCategoryId, ConfigValidationError } from "./config";
export {
  ConsentStateManager,
  autoDetectDomain,
  buildCookieValue,
  parseCookieValue,
} from "./consent-state";
export {
  EventBus,
  type ConsentCategoryPayload,
  type ConsentUpdatedPayload,
  type ExtensionAppliedPayload,
  type CMPEventPayloadMap,
} from "./event-bus";
export { CMPOrchestrator } from "./cmp";
