/**
 * Cookie consent declaration validator.
 *
 * Validates JSON objects against the cookie-consent.json schema
 * without external dependencies. Returns typed errors and warnings.
 */

import type {
  CookieConsentDeclaration,
  ValidationError,
  ValidationResult,
  ValidationWarning,
} from "./types";
import { VALID_CATEGORIES } from "./types";

/** Regex for the version field: major.minor numeric format. */
const VERSION_PATTERN = /^\d+\.\d+$/;

/** Basic email format check (not RFC 5322 — just a reasonable heuristic). */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Basic URI format check. */
const URI_PATTERN = /^https?:\/\/.+/;

/** Fields recommended but not required. Generates warnings when absent. */
const RECOMMENDED_FIELDS = ["selectors", "cmp"] as const;

/**
 * Validate a parsed JSON value against the cookie-consent.json schema.
 *
 * @param data - The unknown value to validate (typically from JSON.parse).
 * @returns A ValidationResult with errors, warnings, and parsed data if valid.
 */
export function validate(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    errors.push({
      path: "",
      message: "Root value must be a JSON object.",
      value: data,
    });
    return { valid: false, errors, warnings };
  }

  const obj = data as Record<string, unknown>;

  validateVersion(obj, errors);
  validateCategories(obj, errors);
  validateCmp(obj, errors);
  validateSelectors(obj, errors);
  validateCategorySelectors(obj, errors);
  validateApi(obj, errors);
  validateBooleanField(obj, "gpc", errors);
  validateBooleanField(obj, "tcf", errors);
  validateContact(obj, errors);
  validatePolicyUrl(obj, errors);
  checkRecommendedFields(obj, warnings);

  const valid = errors.length === 0;
  const result: ValidationResult = { valid, errors, warnings };

  if (valid) {
    result.data = data as CookieConsentDeclaration;
  }

  return result;
}

/**
 * Validate a raw JSON string against the cookie-consent.json schema.
 *
 * @param json - A JSON string to parse and validate.
 * @returns A ValidationResult; includes a parse error if JSON is malformed.
 */
export function validateString(json: string): ValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return {
      valid: false,
      errors: [
        {
          path: "",
          message: "Invalid JSON: could not parse input.",
        },
      ],
      warnings: [],
    };
  }
  return validate(parsed);
}

/** Validate the required `version` field. */
function validateVersion(obj: Record<string, unknown>, errors: ValidationError[]): void {
  if (!("version" in obj)) {
    errors.push({ path: "version", message: 'Required field "version" is missing.' });
    return;
  }
  if (typeof obj.version !== "string") {
    errors.push({
      path: "version",
      message: 'Field "version" must be a string.',
      value: obj.version,
    });
    return;
  }
  if (!VERSION_PATTERN.test(obj.version)) {
    errors.push({
      path: "version",
      message: 'Field "version" must match pattern "major.minor" (e.g., "1.0").',
      value: obj.version,
    });
  }
}

/** Validate the required `categories` field. */
function validateCategories(obj: Record<string, unknown>, errors: ValidationError[]): void {
  if (!("categories" in obj)) {
    errors.push({
      path: "categories",
      message: 'Required field "categories" is missing.',
    });
    return;
  }
  if (!Array.isArray(obj.categories)) {
    errors.push({
      path: "categories",
      message: 'Field "categories" must be an array.',
      value: obj.categories,
    });
    return;
  }

  const cats = obj.categories as unknown[];
  const validSet = new Set<string>(VALID_CATEGORIES);

  for (let i = 0; i < cats.length; i++) {
    if (typeof cats[i] !== "string" || !validSet.has(cats[i] as string)) {
      errors.push({
        path: `categories[${i}]`,
        message: `Invalid category value. Must be one of: ${VALID_CATEGORIES.join(", ")}.`,
        value: cats[i],
      });
    }
  }

  const hasEssential = cats.includes("essential");
  if (!hasEssential) {
    errors.push({
      path: "categories",
      message: 'Categories must include "essential".',
      value: cats,
    });
  }
}

/** Validate the optional `cmp` object. */
function validateCmp(obj: Record<string, unknown>, errors: ValidationError[]): void {
  if (!("cmp" in obj)) return;
  if (typeof obj.cmp !== "object" || obj.cmp === null || Array.isArray(obj.cmp)) {
    errors.push({
      path: "cmp",
      message: 'Field "cmp" must be an object.',
      value: obj.cmp,
    });
    return;
  }
  const cmp = obj.cmp as Record<string, unknown>;
  if ("name" in cmp && typeof cmp.name !== "string") {
    errors.push({
      path: "cmp.name",
      message: 'Field "cmp.name" must be a string.',
      value: cmp.name,
    });
  }
  if ("version" in cmp && typeof cmp.version !== "string") {
    errors.push({
      path: "cmp.version",
      message: 'Field "cmp.version" must be a string.',
      value: cmp.version,
    });
  }
}

/** Validate the optional `selectors` object. */
function validateSelectors(obj: Record<string, unknown>, errors: ValidationError[]): void {
  if (!("selectors" in obj)) return;
  if (typeof obj.selectors !== "object" || obj.selectors === null || Array.isArray(obj.selectors)) {
    errors.push({
      path: "selectors",
      message: 'Field "selectors" must be an object.',
      value: obj.selectors,
    });
    return;
  }
  const sel = obj.selectors as Record<string, unknown>;
  const validKeys = ["banner", "acceptAll", "rejectAll", "preferences", "save"];
  for (const key of validKeys) {
    if (key in sel && typeof sel[key] !== "string") {
      errors.push({
        path: `selectors.${key}`,
        message: `Field "selectors.${key}" must be a string.`,
        value: sel[key],
      });
    }
  }
}

/** Validate the optional `categorySelectors` object. */
function validateCategorySelectors(obj: Record<string, unknown>, errors: ValidationError[]): void {
  if (!("categorySelectors" in obj)) return;
  if (
    typeof obj.categorySelectors !== "object" ||
    obj.categorySelectors === null ||
    Array.isArray(obj.categorySelectors)
  ) {
    errors.push({
      path: "categorySelectors",
      message: 'Field "categorySelectors" must be an object.',
      value: obj.categorySelectors,
    });
    return;
  }
  const cs = obj.categorySelectors as Record<string, unknown>;
  for (const [key, val] of Object.entries(cs)) {
    if (typeof val !== "object" || val === null || Array.isArray(val)) {
      errors.push({
        path: `categorySelectors.${key}`,
        message: `Field "categorySelectors.${key}" must be an object.`,
        value: val,
      });
      continue;
    }
    const entry = val as Record<string, unknown>;
    if ("toggle" in entry && typeof entry.toggle !== "string") {
      errors.push({
        path: `categorySelectors.${key}.toggle`,
        message: `Field "categorySelectors.${key}.toggle" must be a string.`,
        value: entry.toggle,
      });
    }
    if ("cmpId" in entry && typeof entry.cmpId !== "string") {
      errors.push({
        path: `categorySelectors.${key}.cmpId`,
        message: `Field "categorySelectors.${key}.cmpId" must be a string.`,
        value: entry.cmpId,
      });
    }
  }
}

/** Validate the optional `api` object. */
function validateApi(obj: Record<string, unknown>, errors: ValidationError[]): void {
  if (!("api" in obj)) return;
  if (typeof obj.api !== "object" || obj.api === null || Array.isArray(obj.api)) {
    errors.push({
      path: "api",
      message: 'Field "api" must be an object.',
      value: obj.api,
    });
    return;
  }
  const api = obj.api as Record<string, unknown>;
  const stringFields = ["type", "acceptAll", "rejectAll", "setCategory"];
  for (const key of stringFields) {
    if (key in api && typeof api[key] !== "string") {
      errors.push({
        path: `api.${key}`,
        message: `Field "api.${key}" must be a string.`,
        value: api[key],
      });
    }
  }
}

/** Validate a boolean field if present. */
function validateBooleanField(
  obj: Record<string, unknown>,
  field: string,
  errors: ValidationError[],
): void {
  if (!(field in obj)) return;
  if (typeof obj[field] !== "boolean") {
    errors.push({
      path: field,
      message: `Field "${field}" must be a boolean.`,
      value: obj[field],
    });
  }
}

/** Validate the optional `contact` field (email format). */
function validateContact(obj: Record<string, unknown>, errors: ValidationError[]): void {
  if (!("contact" in obj)) return;
  if (typeof obj.contact !== "string") {
    errors.push({
      path: "contact",
      message: 'Field "contact" must be a string.',
      value: obj.contact,
    });
    return;
  }
  if (!EMAIL_PATTERN.test(obj.contact)) {
    errors.push({
      path: "contact",
      message: 'Field "contact" must be a valid email address.',
      value: obj.contact,
    });
  }
}

/** Validate the optional `policyUrl` field (URI format). */
function validatePolicyUrl(obj: Record<string, unknown>, errors: ValidationError[]): void {
  if (!("policyUrl" in obj)) return;
  if (typeof obj.policyUrl !== "string") {
    errors.push({
      path: "policyUrl",
      message: 'Field "policyUrl" must be a string.',
      value: obj.policyUrl,
    });
    return;
  }
  if (!URI_PATTERN.test(obj.policyUrl)) {
    errors.push({
      path: "policyUrl",
      message: 'Field "policyUrl" must be a valid URI (http:// or https://).',
      value: obj.policyUrl,
    });
  }
}

/** Add warnings for missing recommended fields. */
function checkRecommendedFields(obj: Record<string, unknown>, warnings: ValidationWarning[]): void {
  for (const field of RECOMMENDED_FIELDS) {
    if (!(field in obj)) {
      warnings.push({
        path: field,
        message: `Recommended field "${field}" is missing.`,
      });
    }
  }
}
