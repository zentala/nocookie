/**
 * Type definitions for cookie-consent.json validation results.
 *
 * Used by the validator to return structured errors and warnings
 * when validating a cookie consent declaration.
 */

/** Standard cookie category identifiers for the wire format. */
export type WireCategory = "essential" | "functional" | "analytics" | "marketing" | "social-media";

/** All valid wire-format category values. */
export const VALID_CATEGORIES: readonly WireCategory[] = [
  "essential",
  "functional",
  "analytics",
  "marketing",
  "social-media",
] as const;

/** CMP metadata in a cookie consent declaration. */
export interface CmpInfo {
  name: string;
  version?: string;
}

/** CSS selectors for consent UI elements. */
export interface ConsentSelectors {
  banner?: string;
  acceptAll?: string;
  rejectAll?: string;
  preferences?: string;
  save?: string;
}

/** Per-category selector configuration. */
export interface CategorySelector {
  toggle?: string;
  cmpId?: string;
}

/** JavaScript API configuration for programmatic consent. */
export interface ConsentApi {
  type: string;
  acceptAll?: string;
  rejectAll?: string;
  setCategory?: string;
}

/** Parsed and validated cookie consent declaration. */
export interface CookieConsentDeclaration {
  version: string;
  categories: WireCategory[];
  cmp?: CmpInfo;
  selectors?: ConsentSelectors;
  categorySelectors?: Record<string, CategorySelector>;
  api?: ConsentApi;
  gpc?: boolean;
  tcf?: boolean;
  contact?: string;
  policyUrl?: string;
  [key: string]: unknown;
}

/** A single validation error with path and context. */
export interface ValidationError {
  /** JSON path to the invalid field (e.g., "categories", "version"). */
  path: string;
  /** Human-readable description of what is wrong. */
  message: string;
  /** The invalid value, if available. */
  value?: unknown;
}

/** A non-fatal validation warning. */
export interface ValidationWarning {
  /** JSON path to the field triggering the warning. */
  path: string;
  /** Human-readable suggestion. */
  message: string;
}

/** Result of validating a cookie consent declaration. */
export interface ValidationResult {
  /** Whether the declaration is valid (no errors). */
  valid: boolean;
  /** List of validation errors (empty if valid). */
  errors: ValidationError[];
  /** List of non-fatal warnings. */
  warnings: ValidationWarning[];
  /** The parsed declaration data, present only when valid. */
  data?: CookieConsentDeclaration;
}
