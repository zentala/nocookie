/**
 * @module ui/preference-center
 * Modal preference center (second layer) with per-category consent toggles,
 * collapsible cookie detail tables, and focus trapping.
 */

import type { CategoryId, ResolvedCMPConfig } from "@/shared/types";
import type { ConsentStateManager } from "@/core/consent-state";
import type { EventBus } from "@/core/event-bus";
import { buildOverlay } from "./preference-center-dom";

/** Focusable element selector for focus trap. */
const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Preference center modal that renders per-category consent toggles
 * inside a Shadow DOM host. Supports focus trapping, keyboard navigation,
 * collapsible cookie tables, and bulk accept/reject actions.
 */
export class PreferenceCenter {
  private overlay: HTMLDivElement | null = null;
  private previousFocus: HTMLElement | null = null;
  private boundKeydown: ((e: KeyboardEvent) => void) | null = null;
  private boundOpen: (() => void) | null = null;
  private isOpen = false;

  constructor(
    private readonly config: ResolvedCMPConfig,
    private readonly consentState: ConsentStateManager,
    private readonly eventBus: EventBus,
    private readonly shadowRoot: ShadowRoot,
  ) {
    this.boundOpen = () => this.open();
    this.eventBus.on("ui:preferences:open", this.boundOpen);
  }

  /** Build and append the preference center DOM into the shadow root. */
  render(): void {
    this.overlay = buildOverlay(this.config, {
      onClose: () => this.close(),
      onSave: () => this.savePreferences(),
      onAcceptAll: () => {
        this.consentState.acceptAll();
        this.close();
      },
      onRejectAll: () => {
        this.consentState.rejectAll();
        this.close();
      },
    });
    this.shadowRoot.appendChild(this.overlay);
  }

  /** Show the preference center and trap focus inside. */
  open(): void {
    if (this.isOpen) return;
    if (!this.overlay) this.render();
    this.isOpen = true;
    this.syncToggles();
    this.previousFocus = (this.shadowRoot.host.getRootNode() as Document)
      .activeElement as HTMLElement | null;
    this.overlay!.hidden = false;
    this.setupFocusTrap();
    const first = this.getFirstFocusable();
    first?.focus();
    this.eventBus.emit("ui:preferences:open");
  }

  /** Hide the preference center and restore focus. */
  close(): void {
    if (!this.overlay) return;
    this.isOpen = false;
    this.overlay.hidden = true;
    this.teardownFocusTrap();
    this.eventBus.emit("ui:preferences:close");
    this.previousFocus?.focus();
  }

  /** Remove all DOM elements and event listeners. */
  destroy(): void {
    this.teardownFocusTrap();
    if (this.boundOpen) {
      this.eventBus.off("ui:preferences:open", this.boundOpen);
    }
    this.overlay?.remove();
    this.overlay = null;
  }

  // -- Private: state & focus --

  /** Read toggle states and persist each category's consent. */
  private savePreferences(): void {
    const inputs = this.overlay?.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"][data-category-id]',
    );
    if (inputs) {
      for (const input of inputs) {
        const id = input.dataset.categoryId as CategoryId;
        this.consentState.setConsent(id, input.checked);
      }
    }
    this.close();
  }

  /** Sync checkbox states from current consent (or defaults). */
  private syncToggles(): void {
    const current = this.consentState.getConsent();
    const inputs = this.overlay?.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"][data-category-id]',
    );
    if (!inputs) return;
    for (const input of inputs) {
      const id = input.dataset.categoryId as CategoryId;
      const cat = this.config.categories.find((c) => c.id === id);
      input.checked = current ? current[id] : (cat?.defaultState ?? false);
    }
  }

  private getFirstFocusable(): HTMLElement | null {
    return this.overlay?.querySelector<HTMLElement>(FOCUSABLE) ?? null;
  }

  private getFocusableElements(): HTMLElement[] {
    if (!this.overlay) return [];
    return Array.from(this.overlay.querySelectorAll<HTMLElement>(FOCUSABLE));
  }

  private setupFocusTrap(): void {
    this.boundKeydown = (e: KeyboardEvent) => this.handleKeydown(e);
    this.shadowRoot.addEventListener("keydown", this.boundKeydown as EventListener);
  }

  private teardownFocusTrap(): void {
    if (this.boundKeydown) {
      this.shadowRoot.removeEventListener("keydown", this.boundKeydown as EventListener);
      this.boundKeydown = null;
    }
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (e.key === "Escape") {
      e.preventDefault();
      this.close();
      return;
    }
    if (e.key !== "Tab") return;

    const elements = this.getFocusableElements();
    if (elements.length === 0) return;

    const active = this.shadowRoot.activeElement as HTMLElement | null;
    const first = elements[0];
    const last = elements[elements.length - 1];

    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }
}
