/**
 * @nocookie/schema — JSON Schema and validator for cookie-consent.json.
 *
 * Provides a JSON Schema definition and a zero-dependency TypeScript
 * validator for the `/.well-known/cookie-consent.json` open standard.
 */

export { validate, validateString } from "./validator";
export type {
  CookieConsentDeclaration,
  ValidationError,
  ValidationResult,
  ValidationWarning,
  WireCategory,
  CmpInfo,
  ConsentSelectors,
  CategorySelector,
  ConsentApi,
} from "./types";
export { VALID_CATEGORIES } from "./types";
