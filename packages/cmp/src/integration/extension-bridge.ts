/**
 * @module integration/extension-bridge
 * Communication bridge between the CMP and the NoCookie Chrome extension.
 * Implements the handshake protocol via window.postMessage.
 */

import type { CategoryId, ResolvedCMPConfig } from "@/shared/types";
import type { ConsentStateManager } from "@/core/consent-state";
import type { EventBus } from "@/core/event-bus";

/** CMP protocol version for extension communication. */
const CMP_PROTOCOL_VERSION = "1.0";

/** Timeout in ms before logging a warning if no ACK is sent. */
const ACK_TIMEOUT_MS = 2000;

/** Extension hello message sent from extension to CMP. */
export interface ExtensionHelloMessage {
  type: "CA_EXTENSION_HELLO";
  version: string;
  preferences: Record<string, boolean>;
}

/** CMP acknowledgement message sent back to the extension. */
export interface ExtensionAckMessage {
  type: "CA_EXTENSION_ACK";
  version: string;
  applied: Record<string, boolean>;
  conflicts: string[];
}

/** Global marker exposed on window for extension detection. */
export interface CMPGlobalMarker {
  version: string;
  protocol: string;
}

/** Options for banner lifecycle callbacks. */
export interface ExtensionBridgeOptions {
  onHideBanner?: () => void;
  onCloseBanner?: () => void;
}

/**
 * Manages communication between the CMP plugin and the NoCookie extension.
 * Listens for extension hello messages, applies preferences, and sends ACK.
 */
export class ExtensionBridge {
  private readonly config: ResolvedCMPConfig;
  private readonly consentState: ConsentStateManager;
  private readonly eventBus: EventBus;
  private readonly options?: ExtensionBridgeOptions;
  private readonly configuredCategoryIds: Set<CategoryId>;

  private messageHandler: ((event: MessageEvent) => void) | null = null;
  private detected = false;
  private bannerVisible = false;
  private ackTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    config: ResolvedCMPConfig,
    consentState: ConsentStateManager,
    eventBus: EventBus,
    options?: ExtensionBridgeOptions,
  ) {
    this.config = config;
    this.consentState = consentState;
    this.eventBus = eventBus;
    this.options = options;
    this.configuredCategoryIds = new Set(config.categories.map((c) => c.id));
  }

  /** Start listening for extension messages and set the global marker. */
  start(): void {
    this.setGlobalMarker();
    this.messageHandler = (event: MessageEvent) => this.handleMessage(event);
    window.addEventListener("message", this.messageHandler);
  }

  /** Stop listening for extension messages and clean up. */
  stop(): void {
    if (this.messageHandler) {
      window.removeEventListener("message", this.messageHandler);
      this.messageHandler = null;
    }
    if (this.ackTimeoutId !== null) {
      clearTimeout(this.ackTimeoutId);
      this.ackTimeoutId = null;
    }
    this.cleanupGlobalMarker();
  }

  /** Set the global marker and data attribute on the root element. */
  setMarkers(rootElement: HTMLElement): void {
    rootElement.setAttribute(
      "data-ca-version",
      this.config.siteName ? CMP_PROTOCOL_VERSION : CMP_PROTOCOL_VERSION,
    );
  }

  /** Mark the banner as visible (called when banner is rendered). */
  setBannerVisible(visible: boolean): void {
    this.bannerVisible = visible;
  }

  /** Whether the extension has been detected during this session. */
  get extensionDetected(): boolean {
    return this.detected;
  }

  /** Handle incoming window messages. */
  private handleMessage(event: MessageEvent): void {
    if (!this.isValidHelloMessage(event.data)) return;

    const msg = event.data as ExtensionHelloMessage;

    if (!this.isVersionCompatible(msg.version)) {
      // eslint-disable-next-line no-console
      console.warn(`[NoCookie CMP] Incompatible extension version: ${msg.version}`);
      return;
    }

    this.detected = true;
    this.eventBus.emit("extension:detected");

    const { applied, conflicts } = this.applyPreferences(msg.preferences);

    if (this.bannerVisible) {
      this.options?.onCloseBanner?.();
    } else {
      this.options?.onHideBanner?.();
    }

    this.sendAck(applied, conflicts);

    const state = this.consentState.getConsent();
    if (state) {
      this.eventBus.emit("extension:applied", { state });
    }
  }

  /** Validate that data looks like a well-formed hello message. */
  private isValidHelloMessage(data: unknown): boolean {
    if (typeof data !== "object" || data === null) return false;
    const obj = data as Record<string, unknown>;
    if (obj.type !== "CA_EXTENSION_HELLO") return false;
    if (typeof obj.version !== "string") return false;
    if (typeof obj.preferences !== "object" || obj.preferences === null) return false;
    return true;
  }

  /**
   * Check version compatibility (major version must match).
   * E.g., "1.0" is compatible with "1.5" but not "2.0".
   */
  private isVersionCompatible(extensionVersion: string): boolean {
    const extMajor = this.parseMajorVersion(extensionVersion);
    const cmpMajor = this.parseMajorVersion(CMP_PROTOCOL_VERSION);
    return extMajor !== null && cmpMajor !== null && extMajor === cmpMajor;
  }

  /** Extract major version number from a semver-like string. */
  private parseMajorVersion(version: string): number | null {
    const parts = version.split(".");
    const major = Number(parts[0]);
    return Number.isFinite(major) ? major : null;
  }

  /** Apply extension preferences to consent state. Returns applied state and conflicts. */
  private applyPreferences(preferences: Record<string, boolean>): {
    applied: Record<string, boolean>;
    conflicts: string[];
  } {
    const applied: Record<string, boolean> = {};
    const conflicts: string[] = [];

    for (const [category, granted] of Object.entries(preferences)) {
      if (this.configuredCategoryIds.has(category as CategoryId)) {
        this.consentState.setConsent(category as CategoryId, granted);
        applied[category] = category === "essential" ? true : granted;
      } else {
        conflicts.push(category);
      }
    }

    return { applied, conflicts };
  }

  /** Send ACK message back to the extension via postMessage. */
  private sendAck(applied: Record<string, boolean>, conflicts: string[]): void {
    const ackMessage: ExtensionAckMessage = {
      type: "CA_EXTENSION_ACK",
      version: CMP_PROTOCOL_VERSION,
      applied,
      conflicts,
    };
    window.postMessage(ackMessage, window.location.origin);

    this.ackTimeoutId = setTimeout(() => {
      // eslint-disable-next-line no-console
      console.warn("[NoCookie CMP] Extension ACK sent but no confirmation within 2s");
      this.ackTimeoutId = null;
    }, ACK_TIMEOUT_MS);
  }

  /** Set the global CMP marker on window. */
  private setGlobalMarker(): void {
    (window as unknown as Record<string, unknown>).__cookiesAccepterCMP = {
      version: "0.1.0",
      protocol: CMP_PROTOCOL_VERSION,
    } satisfies CMPGlobalMarker;
  }

  /** Remove the global marker from window. */
  private cleanupGlobalMarker(): void {
    delete (window as unknown as Record<string, unknown>).__cookiesAccepterCMP;
  }
}
