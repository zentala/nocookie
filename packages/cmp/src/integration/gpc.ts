/**
 * @module integration/gpc
 * Global Privacy Control (GPC) signal detection and consent adjustment.
 *
 * Checks `navigator.globalPrivacyControl` and, when enabled alongside
 * `config.behavior.respectGPC`, auto-rejects marketing and social-media
 * categories while leaving analytics, functional, and essential untouched.
 */

import type { CategoryId, ResolvedCMPConfig } from "@/shared/types";
import type { ConsentStateManager } from "@/core/consent-state";
import type { EventBus } from "@/core/event-bus";

/** Categories that GPC targets (sale/sharing of personal data). */
const GPC_REJECTED_CATEGORIES: readonly CategoryId[] = ["marketing", "social-media"] as const;

/** Result of a GPC detection check. */
export interface GPCResult {
  /** Whether the browser's GPC signal was detected. */
  detected: boolean;
  /** Whether consent categories were actually adjusted (respectGPC was on). */
  applied: boolean;
  /** Category IDs that were auto-rejected due to GPC. */
  rejectedCategories: CategoryId[];
}

/**
 * Detects the Global Privacy Control signal and optionally adjusts consent.
 *
 * GPC is a browser-level signal (`navigator.globalPrivacyControl`) indicating
 * the user does not want their personal data sold or shared. When detected and
 * `respectGPC` is enabled, the detector rejects marketing and social-media
 * categories but does NOT reject analytics, functional, or essential.
 */
export class GPCDetector {
  private gpcDetected = false;

  constructor(
    private readonly config: ResolvedCMPConfig,
    private readonly consentState: ConsentStateManager,
    private readonly eventBus: EventBus,
  ) {}

  /** Check for GPC signal and apply consent adjustments if configured. */
  detect(): GPCResult {
    this.gpcDetected = readGPCSignal();

    if (!this.gpcDetected) {
      return { detected: false, applied: false, rejectedCategories: [] };
    }

    this.eventBus.emit("gpc:detected");

    if (!this.config.behavior.respectGPC) {
      return { detected: true, applied: false, rejectedCategories: [] };
    }

    const configuredIds = new Set(this.config.categories.map((c) => c.id));
    const rejectedCategories: CategoryId[] = [];

    for (const categoryId of GPC_REJECTED_CATEGORIES) {
      if (configuredIds.has(categoryId)) {
        this.consentState.setConsent(categoryId, false);
        rejectedCategories.push(categoryId);
      }
    }

    return { detected: true, applied: true, rejectedCategories };
  }

  /** Whether GPC was detected in the last `detect()` call. */
  get isGPCEnabled(): boolean {
    return this.gpcDetected;
  }
}

/**
 * Read the GPC signal from the navigator object.
 * Returns `false` when the property is absent or explicitly `false`.
 */
function readGPCSignal(): boolean {
  if (typeof navigator !== "undefined" && "globalPrivacyControl" in navigator) {
    return (
      (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true
    );
  }
  return false;
}
