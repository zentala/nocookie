/**
 * @module ui/accessibility
 * Manages ARIA live regions and screen reader announcements for the CMP.
 * Listens to EventBus events and announces UI state changes to assistive technology.
 */

import type { EventBus } from "@/core/event-bus";
import type { CMPEvent } from "@/shared/types";
import accessibilityCss from "@/styles/accessibility.css?raw";

/** Maps CMP events to screen reader announcement messages. */
const EVENT_ANNOUNCEMENTS: Partial<Record<CMPEvent, string>> = {
  "consent:updated": "Cookie preferences saved",
  "ui:banner:show": "Cookie consent dialog opened",
  "ui:banner:hide": "Cookie consent dialog closed",
  "ui:preferences:open": "Cookie preferences dialog opened",
  "ui:preferences:close": "Cookie preferences dialog closed",
};

/**
 * Manages accessibility features for the CMP Shadow DOM.
 *
 * Creates an ARIA live region inside the shadow root and listens
 * to EventBus events, announcing UI state changes to screen readers.
 */
export class AccessibilityManager {
  private liveRegion: HTMLDivElement | null = null;
  private styleEl: HTMLStyleElement | null = null;
  private boundWildcard: ((event: CMPEvent, payload?: unknown) => void) | null = null;

  constructor(
    private readonly shadowRoot: ShadowRoot,
    private readonly eventBus: EventBus,
  ) {}

  /** Set up ARIA live region, inject styles, and start listening. */
  init(): void {
    this.injectStyles();
    this.createLiveRegion();
    this.bindEvents();
  }

  /** Announce a message to screen readers via the ARIA live region. */
  announce(message: string): void {
    if (!this.liveRegion) return;
    this.liveRegion.textContent = "";
    // Use a microtask to ensure the DOM update triggers an announcement
    requestAnimationFrame(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = message;
      }
    });
  }

  /** Remove DOM elements and event listeners. */
  destroy(): void {
    this.unbindEvents();
    this.liveRegion?.remove();
    this.styleEl?.remove();
    this.liveRegion = null;
    this.styleEl = null;
  }

  /** Get the live region element (for testing). */
  getLiveRegion(): HTMLDivElement | null {
    return this.liveRegion;
  }

  // -- Private helpers --

  /** Inject accessibility CSS into the shadow root. */
  private injectStyles(): void {
    const style = document.createElement("style");
    style.setAttribute("data-ca-accessibility", "true");
    style.textContent = accessibilityCss;

    const existing = this.shadowRoot.querySelector("style[data-ca-accessibility]");
    if (existing) existing.remove();

    this.shadowRoot.appendChild(style);
    this.styleEl = style;
  }

  /** Create the visually hidden ARIA live region. */
  private createLiveRegion(): void {
    const region = document.createElement("div");
    region.className = "ca-sr-only";
    region.setAttribute("role", "status");
    region.setAttribute("aria-live", "polite");
    region.setAttribute("aria-atomic", "true");
    this.shadowRoot.appendChild(region);
    this.liveRegion = region;
  }

  /** Bind wildcard EventBus listener for announcements. */
  private bindEvents(): void {
    this.boundWildcard = (event: CMPEvent) => {
      const message = EVENT_ANNOUNCEMENTS[event];
      if (message) {
        this.announce(message);
      }
    };
    this.eventBus.on("*", this.boundWildcard);
  }

  /** Unbind EventBus listener. */
  private unbindEvents(): void {
    if (this.boundWildcard) {
      this.eventBus.off("*", this.boundWildcard);
      this.boundWildcard = null;
    }
  }
}
