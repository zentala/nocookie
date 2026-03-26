/**
 * @module ui/banner
 * First-layer cookie consent banner rendered inside Shadow DOM.
 * Handles accept/reject/customize actions, animations, and accessibility.
 */

import type { ResolvedCMPConfig, CategoryConfig } from "@/shared/types";
import type { ConsentStateManager } from "@/core/consent-state";
import type { EventBus } from "@/core/event-bus";
import { CATEGORY_META } from "@/shared/constants";
import bannerCss from "@/styles/banner.css?raw";

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

    content.appendChild(this.buildIcons());
    content.appendChild(this.buildTitle());
    content.appendChild(this.buildText());
    content.appendChild(this.buildActions());

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

  /** Build category icon placeholder dots. */
  private buildIcons(): HTMLElement {
    const container = document.createElement("div");
    container.className = "ca-banner__icons";

    for (const cat of this.config.categories) {
      const dot = document.createElement("span");
      dot.className = "ca-banner__icon-dot";
      dot.style.backgroundColor = this.getCategoryColor(cat);
      dot.title = cat.name ?? cat.id;
      container.appendChild(dot);
    }

    return container;
  }

  /** Build the banner title element. */
  private buildTitle(): HTMLElement {
    const title = document.createElement("h2");
    title.className = "ca-banner__title";
    title.textContent = this.config.translations.bannerTitle;
    return title;
  }

  /** Build the banner description text with optional policy link. */
  private buildText(): HTMLElement {
    const p = document.createElement("p");
    p.className = "ca-banner__text";
    p.textContent = this.config.translations.bannerDescription;

    if (this.config.policyUrl) {
      const space = document.createTextNode(" ");
      p.appendChild(space);

      const link = document.createElement("a");
      link.className = "ca-banner__link";
      link.href = this.config.policyUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Learn more";
      p.appendChild(link);
    }

    return p;
  }

  /** Build the action buttons row. */
  private buildActions(): HTMLElement {
    const actions = document.createElement("div");
    actions.className = "ca-banner__actions";

    if (this.config.behavior.rejectAllOnFirstLayer) {
      actions.appendChild(
        this.createButton(
          "ca-btn ca-btn--reject",
          this.config.translations.rejectAll,
          () => this.handleRejectAll(),
        ),
      );
    }

    actions.appendChild(
      this.createButton(
        "ca-btn ca-btn--customize",
        this.config.translations.customize,
        () => this.handleCustomize(),
      ),
    );

    actions.appendChild(
      this.createButton(
        "ca-btn ca-btn--accept",
        this.config.translations.acceptAll,
        () => this.handleAcceptAll(),
      ),
    );

    return actions;
  }

  /** Create a button element with click handler. */
  private createButton(
    className: string,
    text: string,
    onClick: () => void,
  ): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.className = className;
    btn.textContent = text;
    btn.type = "button";
    btn.addEventListener("click", onClick);
    return btn;
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

  /** Resolve color for a category from config or standard metadata. */
  private getCategoryColor(cat: CategoryConfig): string {
    return CATEGORY_META[cat.id]?.color ?? "#6b7280";
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
