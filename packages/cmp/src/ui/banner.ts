/**
 * @module ui/banner
 * First-layer cookie consent banner rendered inside Shadow DOM.
 * Handles accept/reject/customize actions, animations, and accessibility.
 */

import type { ResolvedCMPConfig } from "@/shared/types";
import type { ConsentStateManager } from "@/core/consent-state";
import type { EventBus } from "@/core/event-bus";
import bannerCss from "@/styles/banner.css?raw";
import { createCategoryDots, createTitle, createTextSection, createActions } from "@/ui/banner-dom";

/** Animation duration for the exit transition (ms). */
const EXIT_ANIMATION_MS = 200;

/**
 * Cookie consent banner component (first layer).
 *
 * Renders inside a Shadow DOM root provided by ThemeEngine.
 * Wires Accept All / Reject All / Customize buttons to consent state
 * and emits events for other components to react.
 */
export class Banner {
  private bannerEl: HTMLElement | null = null;
  private styleEl: HTMLStyleElement | null = null;

  constructor(
    private readonly config: ResolvedCMPConfig,
    private readonly consentState: ConsentStateManager,
    private readonly eventBus: EventBus,
    private readonly shadowRoot: ShadowRoot,
  ) {}

  /** Render the banner DOM into the shadow root. */
  render(): void {
    this.injectStyles();

    const banner = document.createElement("div");
    banner.className = "ca-banner ca-banner--hidden";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", this.config.translations.bannerTitle);

    const content = document.createElement("div");
    content.className = "ca-banner__content";

    content.appendChild(createCategoryDots(this.config.categories));
    content.appendChild(createTitle(this.config.translations.bannerTitle));
    content.appendChild(createTextSection(this.config));
    content.appendChild(
      createActions(this.config, {
        onRejectAll: () => this.handleRejectAll(),
        onCustomize: () => this.handleCustomize(),
        onAcceptAll: () => this.handleAcceptAll(),
      }),
    );

    banner.appendChild(content);
    this.shadowRoot.appendChild(banner);
    this.bannerEl = banner;
  }

  /** Show the banner with entrance animation. */
  show(): void {
    if (!this.bannerEl) return;

    this.bannerEl.classList.remove("ca-banner--hidden", "ca-banner--exiting");

    const animClass = this.getAnimationClass();
    if (animClass) {
      this.bannerEl.classList.add(animClass);
    }

    this.eventBus.emit("ui:banner:show");
    this.focusFirstButton();
  }

  /** Hide the banner with exit animation. */
  hide(): void {
    if (!this.bannerEl) return;

    this.bannerEl.classList.add("ca-banner--exiting");

    setTimeout(() => {
      if (this.bannerEl) {
        this.bannerEl.classList.add("ca-banner--hidden");
        this.bannerEl.classList.remove("ca-banner--exiting");
        this.removeAnimationClass();
      }
      this.eventBus.emit("ui:banner:hide");
    }, EXIT_ANIMATION_MS);
  }

  /**
   * Check whether the banner should be displayed.
   * Returns true when the user has not yet given consent.
   */
  shouldShow(): boolean {
    if (this.config.behavior.showOnEveryVisit) return true;
    return !this.consentState.hasConsent();
  }

  /** Remove banner DOM and styles from the shadow root. */
  destroy(): void {
    this.bannerEl?.remove();
    this.styleEl?.remove();
    this.bannerEl = null;
    this.styleEl = null;
  }

  /** Get the banner root element (for testing). */
  getElement(): HTMLElement | null {
    return this.bannerEl;
  }

  // -- Private helpers --

  /** Inject banner-specific CSS into the shadow root. */
  private injectStyles(): void {
    const style = document.createElement("style");
    style.setAttribute("data-ca-banner", "true");
    style.textContent = bannerCss;

    const existing = this.shadowRoot.querySelector("style[data-ca-banner]");
    if (existing) existing.remove();

    this.shadowRoot.appendChild(style);
    this.styleEl = style;
  }

  /** Handle Accept All button click. */
  private handleAcceptAll(): void {
    this.consentState.acceptAll();
    this.eventBus.emit("consent:updated", {
      state: this.consentState.getConsent()!,
      changes: this.config.categories.map((c) => ({
        category: c.id,
        granted: true,
      })),
    });
    this.hide();
  }

  /** Handle Reject All button click. */
  private handleRejectAll(): void {
    this.consentState.rejectAll();
    this.eventBus.emit("consent:updated", {
      state: this.consentState.getConsent()!,
      changes: this.config.categories.map((c) => ({
        category: c.id,
        granted: c.id === "essential",
      })),
    });
    this.hide();
  }

  /** Handle Customize button click. */
  private handleCustomize(): void {
    this.eventBus.emit("ui:preferences:open");
  }

  /** Get the entrance animation CSS class from theme config. */
  private getAnimationClass(): string {
    const anim = this.config.theme.animation;
    if (anim === "slide-up") return "ca-animate-slide-up";
    if (anim === "fade-in") return "ca-animate-fade-in";
    return "";
  }

  /** Remove entrance animation class from the banner. */
  private removeAnimationClass(): void {
    if (!this.bannerEl) return;
    this.bannerEl.classList.remove("ca-animate-slide-up", "ca-animate-fade-in");
  }

  /** Focus the first button in the banner for keyboard accessibility. */
  private focusFirstButton(): void {
    const firstBtn = this.bannerEl?.querySelector("button");
    if (firstBtn) {
      requestAnimationFrame(() => firstBtn.focus());
    }
  }
}
