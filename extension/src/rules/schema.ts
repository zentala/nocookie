/**
 * CMP rule validation utilities.
 *
 * Validates rule JSON objects against the expected CMPRule schema
 * at runtime, providing typed results or descriptive errors.
 */

import type { ActionStep, CMPRule } from "@/shared/types";

/** Valid action step types. */
const VALID_ACTION_TYPES: ActionStep["type"][] = ["click", "eval", "waitFor", "toggle"];

/**
 * Validate that a value is a non-empty string.
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/**
 * Validate that a value is an array of non-empty strings.
 */
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => isNonEmptyString(item));
}

/**
 * Validate a single ActionStep object.
 * Returns an error message or null if valid.
 */
function validateActionStep(step: unknown, index: number, path: string): string | null {
  if (typeof step !== "object" || step === null) {
    return `${path}[${index}]: must be an object`;
  }
  const s = step as Record<string, unknown>;
  if (!VALID_ACTION_TYPES.includes(s.type as ActionStep["type"])) {
    return `${path}[${index}].type: must be one of ${VALID_ACTION_TYPES.join(", ")}`;
  }
  if (s.target !== undefined && typeof s.target !== "string") {
    return `${path}[${index}].target: must be a string`;
  }
  if (s.value !== undefined && typeof s.value !== "string") {
    return `${path}[${index}].value: must be a string`;
  }
  if (s.timeout !== undefined && typeof s.timeout !== "number") {
    return `${path}[${index}].timeout: must be a number`;
  }
  return null;
}

/**
 * Validate an ActionSequence (array of ActionStep).
 * Returns an array of error messages (empty if valid).
 */
function validateActionSequence(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) {
    return [`${path}: must be an array`];
  }
  const errors: string[] = [];
  for (let i = 0; i < value.length; i++) {
    const err = validateActionStep(value[i], i, path);
    if (err) errors.push(err);
  }
  return errors;
}

/**
 * Validate a CMP rule JSON object against the expected schema.
 * Returns a typed CMPRule or throws with validation errors.
 */
export function validateRule(data: unknown): CMPRule {
  const errors: string[] = [];

  if (typeof data !== "object" || data === null) {
    throw new Error("Rule must be a non-null object");
  }

  const rule = data as Record<string, unknown>;

  // name
  if (!isNonEmptyString(rule.name)) {
    errors.push("name: required non-empty string");
  }

  // detection
  if (typeof rule.detection !== "object" || rule.detection === null) {
    errors.push("detection: required object");
  } else {
    const det = rule.detection as Record<string, unknown>;
    if (det.domSelectors !== undefined && !isStringArray(det.domSelectors)) {
      errors.push("detection.domSelectors: must be string[]");
    }
    if (det.scriptUrls !== undefined && !isStringArray(det.scriptUrls)) {
      errors.push("detection.scriptUrls: must be string[]");
    }
    if (det.jsGlobals !== undefined && !isStringArray(det.jsGlobals)) {
      errors.push("detection.jsGlobals: must be string[]");
    }
  }

  // categoryMapping
  if (typeof rule.categoryMapping !== "object" || rule.categoryMapping === null) {
    errors.push("categoryMapping: required object");
  } else {
    const cm = rule.categoryMapping as Record<string, unknown>;
    if (!isNonEmptyString(cm.functional)) {
      errors.push("categoryMapping.functional: required non-empty string");
    }
    if (!isNonEmptyString(cm.analytics)) {
      errors.push("categoryMapping.analytics: required non-empty string");
    }
    if (!isNonEmptyString(cm.marketing)) {
      errors.push("categoryMapping.marketing: required non-empty string");
    }
    if (cm.socialMedia !== undefined && !isNonEmptyString(cm.socialMedia)) {
      errors.push("categoryMapping.socialMedia: must be a non-empty string if present");
    }
  }

  // actions
  if (typeof rule.actions !== "object" || rule.actions === null) {
    errors.push("actions: required object");
  } else {
    const acts = rule.actions as Record<string, unknown>;
    errors.push(...validateActionSequence(acts.acceptAll, "actions.acceptAll"));
    errors.push(...validateActionSequence(acts.rejectAll, "actions.rejectAll"));
    errors.push(...validateActionSequence(acts.custom, "actions.custom"));
  }

  if (errors.length > 0) {
    throw new Error(`Invalid CMP rule:\n${errors.join("\n")}`);
  }

  return data as CMPRule;
}

/**
 * Type guard: check if a value is a valid CMPRule.
 */
export function isValidRule(data: unknown): data is CMPRule {
  try {
    validateRule(data);
    return true;
  } catch {
    return false;
  }
}
