/**
 * @module core/event-bus
 * Typed event bus for CMP inter-component communication.
 */

import type { CategoryId, CMPEvent, ConsentState } from "@/shared/types";

/** Payload for consent:granted and consent:denied events. */
export interface ConsentCategoryPayload {
  category: CategoryId;
  granted: boolean;
}

/** Payload for consent:updated event. */
export interface ConsentUpdatedPayload {
  state: ConsentState;
  changes: { category: CategoryId; granted: boolean }[];
}

/** Payload for extension:applied event. */
export interface ExtensionAppliedPayload {
  state: ConsentState;
}

/** Maps each CMP event to its payload type. */
export interface CMPEventPayloadMap {
  "consent:granted": ConsentCategoryPayload;
  "consent:denied": ConsentCategoryPayload;
  "consent:updated": ConsentUpdatedPayload;
  "consent:reset": void;
  "ui:banner:show": void;
  "ui:banner:hide": void;
  "ui:preferences:open": void;
  "ui:preferences:close": void;
  "extension:detected": void;
  "extension:applied": ExtensionAppliedPayload;
  "gpc:detected": void;
}

/** Handler for a specific typed event. */
type EventHandler<E extends CMPEvent> = CMPEventPayloadMap[E] extends void
  ? () => void
  : (payload: CMPEventPayloadMap[E]) => void;

/** Handler for the wildcard listener that receives all events. */
type WildcardHandler = (event: CMPEvent, payload?: unknown) => void;

// Internal handler type broad enough for both specific and wildcard signatures.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyHandler = (...args: any[]) => void;

/**
 * Typed event bus for CMP components.
 *
 * Supports subscribing to specific events or using `'*'` to listen to all.
 * Wildcard listeners receive the event name as the first argument.
 */
export class EventBus {
  private listeners = new Map<string, Set<AnyHandler>>();

  /**
   * Subscribe to a specific CMP event.
   * @param event - The event name to listen for.
   * @param handler - Callback invoked when the event fires.
   */
  on<E extends CMPEvent>(event: E, handler: EventHandler<E>): void;
  /**
   * Subscribe to ALL CMP events via the wildcard.
   * @param event - Must be `'*'`.
   * @param handler - Callback receiving `(eventName, payload?)`.
   */
  on(event: "*", handler: WildcardHandler): void;
  on(event: CMPEvent | "*", handler: AnyHandler): void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(handler);
  }

  /**
   * Unsubscribe a handler from an event.
   * Safe to call with an unregistered handler (no-op).
   * @param event - The event name or `'*'`.
   * @param handler - The handler to remove.
   */
  off(event: CMPEvent | "*", handler: AnyHandler): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(handler);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Subscribe to an event and automatically unsubscribe after the first invocation.
   * @param event - The event name to listen for.
   * @param handler - Callback invoked once when the event fires.
   */
  once<E extends CMPEvent>(event: E, handler: EventHandler<E>): void {
    const wrapper: AnyHandler = (...args: unknown[]) => {
      this.off(event, wrapper);
      (handler as AnyHandler)(...args);
    };
    this.on(event, wrapper as EventHandler<E>);
  }

  /**
   * Emit a CMP event, notifying specific listeners first then wildcards.
   * @param event - The event name.
   * @param payload - Optional payload matching the event's type.
   */
  emit<E extends CMPEvent>(
    event: E,
    ...args: CMPEventPayloadMap[E] extends void ? [] : [CMPEventPayloadMap[E]]
  ): void {
    // Specific listeners
    const specific = this.listeners.get(event);
    if (specific) {
      for (const handler of specific) {
        handler(args[0] as unknown);
      }
    }

    // Wildcard listeners
    const wildcards = this.listeners.get("*");
    if (wildcards) {
      for (const handler of wildcards) {
        handler(event, args[0] as unknown);
      }
    }
  }

  /** Remove all listeners. Useful for cleanup and testing. */
  removeAllListeners(): void {
    this.listeners.clear();
  }
}
