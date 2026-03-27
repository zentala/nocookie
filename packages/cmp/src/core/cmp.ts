/**
 * @module core/cmp
 * CMP orchestrator that wires all components together during init().
 * Creates and manages the lifecycle of Banner, PreferenceCenter, ThemeEngine,
 * ConsentStateManager, EventBus, ExtensionBridge, GPCDetector, and AccessibilityManager.
 */

import type {
  CMPConfig,
  ResolvedCMPConfig,
  ConsentState,
  CategoryId,
  CMPEvent,
} from "@/shared/types";
import { parseConfig } from "@/core/config";
import { ConsentStateManager } from "@/core/consent-state";
import { EventBus } from "@/core/event-bus";
import { ThemeEngine } from "@/ui/theme";
import { Banner } from "@/ui/banner";
import { PreferenceCenter } from "@/ui/preference-center";
import { AccessibilityManager } from "@/ui/accessibility";
import { PolicyPageGenerator } from "@/ui/policy-page";
import { ExtensionBridge } from "@/integration/extension-bridge";
import { WellKnownGenerator } from "@/integration/well-known";
import { GPCDetector } from "@/integration/gpc";

/** Internal state for the CMP orchestrator. */
interface CMPState {
  config: ResolvedCMPConfig;
  eventBus: EventBus;
  consentState: ConsentStateManager;
  themeEngine: ThemeEngine;
  shadowRoot: ShadowRoot;
  banner: Banner;
  preferenceCenter: PreferenceCenter;
  accessibility: AccessibilityManager;
  extensionBridge: ExtensionBridge;
  gpcDetector: GPCDetector;
  wellKnownGenerator: WellKnownGenerator;
  policyPageGenerator: PolicyPageGenerator;
}

/**
 * Core CMP orchestrator. Manages component creation, wiring, and lifecycle.
 * Extracted from NoCookieCMP facade to keep index.ts under 250 lines.
 */
export class CMPOrchestrator {
  private state: CMPState | null = null;

  /** Initialize all CMP components and wire them together. */
  init(config: CMPConfig): void {
    if (this.state) {
      this.destroy();
    }

    const resolvedConfig = parseConfig(config);
    const eventBus = new EventBus();
    const consentState = new ConsentStateManager(resolvedConfig);
    const themeEngine = new ThemeEngine(resolvedConfig.theme);
    const shadowRoot = themeEngine.createShadowHost();

    this.setVersionAttribute(themeEngine);

    const gpcDetector = new GPCDetector(resolvedConfig, consentState, eventBus);
    gpcDetector.detect();

    const banner = new Banner(resolvedConfig, consentState, eventBus, shadowRoot);
    const preferenceCenter = new PreferenceCenter(
      resolvedConfig,
      consentState,
      eventBus,
      shadowRoot,
    );
    const accessibility = new AccessibilityManager(shadowRoot, eventBus);
    accessibility.init();

    const extensionBridge = new ExtensionBridge(resolvedConfig, consentState, eventBus, {
      onHideBanner: () => banner.hide(),
      onCloseBanner: () => banner.hide(),
    });
    extensionBridge.start();

    const wellKnownGenerator = new WellKnownGenerator(resolvedConfig);
    const policyPageGenerator = new PolicyPageGenerator(resolvedConfig);

    this.state = {
      config: resolvedConfig,
      eventBus,
      consentState,
      themeEngine,
      shadowRoot,
      banner,
      preferenceCenter,
      accessibility,
      extensionBridge,
      gpcDetector,
      wellKnownGenerator,
      policyPageGenerator,
    };

    if (!consentState.hasConsent()) {
      banner.render();
      banner.show();
    }
  }

  /** Get current consent state from cookie. */
  getConsent(): ConsentState {
    if (!this.state) {
      return defaultConsentState();
    }
    return this.state.consentState.getConsent() ?? defaultConsentState();
  }

  /** Set consent for a single category and emit events. */
  setConsent(category: CategoryId, granted: boolean): void {
    if (!this.state) return;
    this.state.consentState.setConsent(category, granted);
    this.emitConsentChange(category, granted);
  }

  /** Accept all categories, hide banner, emit events. */
  acceptAll(): void {
    if (!this.state) return;
    this.state.consentState.acceptAll();
    const current = this.state.consentState.getConsent()!;
    this.state.eventBus.emit("consent:updated", {
      state: current,
      changes: this.state.config.categories.map((c) => ({
        category: c.id,
        granted: true,
      })),
    });
    this.state.banner.hide();
  }

  /** Reject all non-essential categories, hide banner, emit events. */
  rejectAll(): void {
    if (!this.state) return;
    this.state.consentState.rejectAll();
    const current = this.state.consentState.getConsent()!;
    this.state.eventBus.emit("consent:updated", {
      state: current,
      changes: this.state.config.categories.map((c) => ({
        category: c.id,
        granted: c.id === "essential",
      })),
    });
    this.state.banner.hide();
  }

  /** Open the preference center modal. */
  openPreferences(): void {
    if (!this.state) return;
    this.state.eventBus.emit("ui:preferences:open");
  }

  /** Close all CMP UI (banner + preference center). */
  close(): void {
    if (!this.state) return;
    this.state.banner.hide();
    this.state.preferenceCenter.close();
  }

  /** Reset consent cookie and re-show the banner. */
  reset(): void {
    if (!this.state) return;
    this.state.consentState.reset();
    this.state.eventBus.emit("consent:reset");
    this.state.banner.render();
    this.state.banner.show();
  }

  /** Subscribe to a CMP event. */
  on(event: CMPEvent | "*", handler: (...args: unknown[]) => void): void {
    if (!this.state) return;
    this.state.eventBus.on(event as CMPEvent, handler as () => void);
  }

  /** Unsubscribe from a CMP event. */
  off(event: CMPEvent | "*", handler: (...args: unknown[]) => void): void {
    if (!this.state) return;
    this.state.eventBus.off(event as CMPEvent, handler as () => void);
  }

  /** Generate the well-known cookie-consent.json object. */
  getWellKnownJSON(): object {
    if (!this.state) return {};
    return this.state.wellKnownGenerator.generate();
  }

  /** Generate cookie policy HTML. */
  getPolicyHTML(): string {
    if (!this.state) return "";
    return this.state.policyPageGenerator.generateHTML();
  }

  /** Get the resolved config, or null if not initialized. */
  getConfig(): ResolvedCMPConfig | null {
    return this.state?.config ?? null;
  }

  /** Whether the CMP has been initialized. */
  get initialized(): boolean {
    return this.state !== null;
  }

  /** Tear down all components and clean up. */
  destroy(): void {
    if (!this.state) return;
    this.state.extensionBridge.stop();
    this.state.accessibility.destroy();
    this.state.preferenceCenter.destroy();
    this.state.banner.destroy();
    this.state.themeEngine.destroy();
    this.state.eventBus.removeAllListeners();
    this.state = null;
  }

  /** Set data-ca-version on the shadow host element. */
  private setVersionAttribute(themeEngine: ThemeEngine): void {
    const root = themeEngine.getShadowRoot();
    if (root) {
      (root.host as HTMLElement).setAttribute("data-ca-version", "0.1.0");
    }
  }

  /** Emit consent change events for a single category update. */
  private emitConsentChange(category: CategoryId, granted: boolean): void {
    if (!this.state) return;
    const current = this.state.consentState.getConsent()!;
    const eventName = granted ? "consent:granted" : "consent:denied";
    this.state.eventBus.emit(eventName, { category, granted });
    this.state.eventBus.emit("consent:updated", {
      state: current,
      changes: [{ category, granted }],
    });
  }
}

/** Build a default consent state where only essential is true. */
function defaultConsentState(): ConsentState {
  return {
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
    "social-media": false,
  };
}
