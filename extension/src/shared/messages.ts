/**
 * Message passing types for the NoCookie extension.
 *
 * Defines the typed message protocol for communication between
 * background service worker, content scripts, and extension pages.
 */

import type { CMPRule, ConfidenceLevel, ConsentResult, UserPreferences } from "./types";

/** All message type identifiers. */
export type MessageType =
  | "CMP_DETECTED"
  | "CONSENT_EXECUTED"
  | "GET_PREFERENCES"
  | "UPDATE_BADGE"
  | "SCAN_STARTED"
  | "SCAN_COMPLETE"
  | "EXECUTE_CONSENT"
  | "GET_TAB_STATE";

/** Badge visual states shown on the extension icon. */
export type BadgeState = "default" | "handled" | "attention" | "error" | "disabled" | "scanning";

/** Payload definitions for each message type. */
export interface MessagePayloadMap {
  CMP_DETECTED: {
    cmp: string;
    domain: string;
    confidence: ConfidenceLevel;
    layer: number;
  };
  CONSENT_EXECUTED: ConsentResult;
  GET_PREFERENCES: { domain: string };
  UPDATE_BADGE: { state: BadgeState };
  SCAN_STARTED: { tabId: number };
  SCAN_COMPLETE: { tabId: number; cmpFound: boolean };
  EXECUTE_CONSENT: {
    cmp: string;
    rule: CMPRule;
    preferences: UserPreferences;
  };
  GET_TAB_STATE: { tabId: number };
}

/** Strongly typed message envelope. */
export interface Message<T extends MessageType = MessageType> {
  type: T;
  payload: MessagePayloadMap[T];
}

/** Notification sent to popup when tab state changes (not part of request/response protocol). */
export interface TabStateChangedNotification {
  type: "TAB_STATE_CHANGED";
  payload: { tabId: number; state: BadgeState };
}

/**
 * Creates a typed message object.
 * Convenience helper to ensure type safety when sending messages.
 */
export function createMessage<T extends MessageType>(
  type: T,
  payload: MessagePayloadMap[T],
): Message<T> {
  return { type, payload };
}
