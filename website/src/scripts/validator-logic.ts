/**
 * Client-side cookie-consent.json validator.
 *
 * Inlined from packages/schema/src/validator.ts to avoid cross-package
 * build dependencies. Validates JSON objects against the schema and
 * returns structured errors and warnings.
 */

/** Standard cookie category identifiers. */
export const VALID_CATEGORIES = [
  "essential",
  "functional",
  "analytics",
  "marketing",
  "social-media",
] as const;

export interface ValidationError {
  path: string;
  message: string;
  value?: unknown;
}

export interface ValidationWarning {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  data?: Record<string, unknown>;
}

const VERSION_PATTERN = /^\d+\.\d+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URI_PATTERN = /^https?:\/\/.+/;
const RECOMMENDED_FIELDS = ["selectors", "cmp"] as const;

/** Validate a parsed JSON value against the cookie-consent.json schema. */
export function validate(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    errors.push({ path: "", message: "Root value must be a JSON object.", value: data });
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
  if (valid) result.data = obj;
  return result;
}

/** Validate a raw JSON string. */
export function validateString(json: string): ValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return {
      valid: false,
      errors: [{ path: "", message: "Invalid JSON: could not parse input." }],
      warnings: [],
    };
  }
  return validate(parsed);
}

function validateVersion(obj: Record<string, unknown>, errors: ValidationError[]): void {
  if (!("version" in obj)) {
    errors.push({ path: "version", message: 'Required field "version" is missing.' });
    return;
  }
  if (typeof obj.version !== "string") {
    errors.push({ path: "version", message: '"version" must be a string.', value: obj.version });
    return;
  }
  if (!VERSION_PATTERN.test(obj.version)) {
    errors.push({
      path: "version",
      message: '"version" must match "major.minor" (e.g., "1.0").',
      value: obj.version,
    });
  }
}

function validateCategories(obj: Record<string, unknown>, errors: ValidationError[]): void {
  if (!("categories" in obj)) {
    errors.push({ path: "categories", message: 'Required field "categories" is missing.' });
    return;
  }
  if (!Array.isArray(obj.categories)) {
    errors.push({
      path: "categories",
      message: '"categories" must be an array.',
      value: obj.categories,
    });
    return;
  }
  const validSet = new Set<string>(VALID_CATEGORIES);
  for (let i = 0; i < obj.categories.length; i++) {
    const cat = obj.categories[i];
    if (typeof cat !== "string" || !validSet.has(cat)) {
      errors.push({
        path: `categories[${i}]`,
        message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}.`,
        value: cat,
      });
    }
  }
  if (!obj.categories.includes("essential")) {
    errors.push({
      path: "categories",
      message: 'Categories must include "essential".',
      value: obj.categories,
    });
  }
}

function validateCmp(obj: Record<string, unknown>, errors: ValidationError[]): void {
  if (!("cmp" in obj)) return;
  if (typeof obj.cmp !== "object" || obj.cmp === null || Array.isArray(obj.cmp)) {
    errors.push({ path: "cmp", message: '"cmp" must be an object.', value: obj.cmp });
    return;
  }
  const cmp = obj.cmp as Record<string, unknown>;
  if ("name" in cmp && typeof cmp.name !== "string") {
    errors.push({ path: "cmp.name", message: '"cmp.name" must be a string.', value: cmp.name });
  }
  if ("version" in cmp && typeof cmp.version !== "string") {
    errors.push({
      path: "cmp.version",
      message: '"cmp.version" must be a string.',
      value: cmp.version,
    });
  }
}

function validateSelectors(obj: Record<string, unknown>, errors: ValidationError[]): void {
  if (!("selectors" in obj)) return;
  if (typeof obj.selectors !== "object" || obj.selectors === null || Array.isArray(obj.selectors)) {
    errors.push({
      path: "selectors",
      message: '"selectors" must be an object.',
      value: obj.selectors,
    });
    return;
  }
  const sel = obj.selectors as Record<string, unknown>;
  for (const key of ["banner", "acceptAll", "rejectAll", "preferences", "save"]) {
    if (key in sel && typeof sel[key] !== "string") {
      errors.push({
        path: `selectors.${key}`,
        message: `"selectors.${key}" must be a string.`,
        value: sel[key],
      });
    }
  }
}

function validateCategorySelectors(obj: Record<string, unknown>, errors: ValidationError[]): void {
  if (!("categorySelectors" in obj)) return;
  const cs = obj.categorySelectors;
  if (typeof cs !== "object" || cs === null || Array.isArray(cs)) {
    errors.push({
      path: "categorySelectors",
      message: '"categorySelectors" must be an object.',
      value: cs,
    });
    return;
  }
  for (const [key, val] of Object.entries(cs as Record<string, unknown>)) {
    if (typeof val !== "object" || val === null || Array.isArray(val)) {
      errors.push({
        path: `categorySelectors.${key}`,
        message: `"categorySelectors.${key}" must be an object.`,
        value: val,
      });
      continue;
    }
    const entry = val as Record<string, unknown>;
    if ("toggle" in entry && typeof entry.toggle !== "string") {
      errors.push({
        path: `categorySelectors.${key}.toggle`,
        message: `Must be a string.`,
        value: entry.toggle,
      });
    }
    if ("cmpId" in entry && typeof entry.cmpId !== "string") {
      errors.push({
        path: `categorySelectors.${key}.cmpId`,
        message: `Must be a string.`,
        value: entry.cmpId,
      });
    }
  }
}

function validateApi(obj: Record<string, unknown>, errors: ValidationError[]): void {
  if (!("api" in obj)) return;
  if (typeof obj.api !== "object" || obj.api === null || Array.isArray(obj.api)) {
    errors.push({ path: "api", message: '"api" must be an object.', value: obj.api });
    return;
  }
  const api = obj.api as Record<string, unknown>;
  for (const key of ["type", "acceptAll", "rejectAll", "setCategory"]) {
    if (key in api && typeof api[key] !== "string") {
      errors.push({
        path: `api.${key}`,
        message: `"api.${key}" must be a string.`,
        value: api[key],
      });
    }
  }
}

function validateBooleanField(
  obj: Record<string, unknown>,
  field: string,
  errors: ValidationError[],
): void {
  if (!(field in obj)) return;
  if (typeof obj[field] !== "boolean") {
    errors.push({ path: field, message: `"${field}" must be a boolean.`, value: obj[field] });
  }
}

function validateContact(obj: Record<string, unknown>, errors: ValidationError[]): void {
  if (!("contact" in obj)) return;
  if (typeof obj.contact !== "string") {
    errors.push({ path: "contact", message: '"contact" must be a string.', value: obj.contact });
    return;
  }
  if (!EMAIL_PATTERN.test(obj.contact)) {
    errors.push({
      path: "contact",
      message: '"contact" must be a valid email address.',
      value: obj.contact,
    });
  }
}

function validatePolicyUrl(obj: Record<string, unknown>, errors: ValidationError[]): void {
  if (!("policyUrl" in obj)) return;
  if (typeof obj.policyUrl !== "string") {
    errors.push({
      path: "policyUrl",
      message: '"policyUrl" must be a string.',
      value: obj.policyUrl,
    });
    return;
  }
  if (!URI_PATTERN.test(obj.policyUrl)) {
    errors.push({
      path: "policyUrl",
      message: '"policyUrl" must be a valid URI (http:// or https://).',
      value: obj.policyUrl,
    });
  }
}

function checkRecommendedFields(obj: Record<string, unknown>, warnings: ValidationWarning[]): void {
  for (const field of RECOMMENDED_FIELDS) {
    if (!(field in obj)) {
      warnings.push({ path: field, message: `Recommended field "${field}" is missing.` });
    }
  }
}
