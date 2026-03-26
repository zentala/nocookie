import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventBus } from "../src/core/event-bus";
import type { ConsentCategoryPayload, ConsentUpdatedPayload } from "../src/core/event-bus";

describe("EventBus", () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  describe("on / emit", () => {
    it("delivers events to subscribed handlers", () => {
      const handler = vi.fn();
      bus.on("ui:banner:show", handler);
      bus.emit("ui:banner:show");
      expect(handler).toHaveBeenCalledOnce();
    });

    it("delivers payload for consent:granted", () => {
      const handler = vi.fn();
      bus.on("consent:granted", handler);

      const payload: ConsentCategoryPayload = {
        category: "analytics",
        granted: true,
      };
      bus.emit("consent:granted", payload);

      expect(handler).toHaveBeenCalledWith(payload);
    });

    it("delivers payload for consent:updated", () => {
      const handler = vi.fn();
      bus.on("consent:updated", handler);

      const payload: ConsentUpdatedPayload = {
        state: {
          essential: true,
          functional: false,
          analytics: false,
          marketing: false,
          "social-media": false,
        },
        changes: [{ category: "functional", granted: false }],
      };
      bus.emit("consent:updated", payload);

      expect(handler).toHaveBeenCalledWith(payload);
    });

    it("supports multiple handlers for the same event", () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      bus.on("consent:reset", h1);
      bus.on("consent:reset", h2);

      bus.emit("consent:reset");

      expect(h1).toHaveBeenCalledOnce();
      expect(h2).toHaveBeenCalledOnce();
    });

    it("does not deliver events to handlers of other events", () => {
      const handler = vi.fn();
      bus.on("ui:banner:show", handler);
      bus.emit("ui:banner:hide");
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("off", () => {
    it("unsubscribes a handler so it stops receiving events", () => {
      const handler = vi.fn();
      bus.on("gpc:detected", handler);
      bus.off("gpc:detected", handler);

      bus.emit("gpc:detected");
      expect(handler).not.toHaveBeenCalled();
    });

    it("is a no-op when called with an unregistered handler", () => {
      const unregistered = vi.fn();
      expect(() => bus.off("gpc:detected", unregistered)).not.toThrow();
    });

    it("does not affect other handlers on the same event", () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      bus.on("consent:reset", h1);
      bus.on("consent:reset", h2);

      bus.off("consent:reset", h1);
      bus.emit("consent:reset");

      expect(h1).not.toHaveBeenCalled();
      expect(h2).toHaveBeenCalledOnce();
    });
  });

  describe("wildcard listener", () => {
    it("receives all events with event name as first argument", () => {
      const handler = vi.fn();
      bus.on("*", handler);

      bus.emit("ui:banner:show");
      bus.emit("consent:reset");

      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenNthCalledWith(1, "ui:banner:show", undefined);
      expect(handler).toHaveBeenNthCalledWith(2, "consent:reset", undefined);
    });

    it("receives event payload as second argument", () => {
      const handler = vi.fn();
      bus.on("*", handler);

      const payload: ConsentCategoryPayload = {
        category: "marketing",
        granted: false,
      };
      bus.emit("consent:denied", payload);

      expect(handler).toHaveBeenCalledWith("consent:denied", payload);
    });

    it("fires after specific listeners", () => {
      const order: string[] = [];
      bus.on("ui:banner:show", () => order.push("specific"));
      bus.on("*", () => order.push("wildcard"));

      bus.emit("ui:banner:show");

      expect(order).toEqual(["specific", "wildcard"]);
    });

    it("can be unsubscribed with off", () => {
      const handler = vi.fn();
      bus.on("*", handler);
      bus.off("*", handler);

      bus.emit("ui:banner:show");
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("removeAllListeners", () => {
    it("removes all specific and wildcard listeners", () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      const wildcard = vi.fn();

      bus.on("consent:reset", h1);
      bus.on("ui:banner:show", h2);
      bus.on("*", wildcard);

      bus.removeAllListeners();

      bus.emit("consent:reset");
      bus.emit("ui:banner:show");

      expect(h1).not.toHaveBeenCalled();
      expect(h2).not.toHaveBeenCalled();
      expect(wildcard).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("does not throw when emitting with no listeners", () => {
      expect(() => bus.emit("gpc:detected")).not.toThrow();
    });

    it("does not throw when emitting with payload and no listeners", () => {
      expect(() =>
        bus.emit("consent:granted", { category: "analytics", granted: true }),
      ).not.toThrow();
    });

    it("handles extension:applied with state payload", () => {
      const handler = vi.fn();
      bus.on("extension:applied", handler);

      const state = {
        essential: true,
        functional: true,
        analytics: false,
        marketing: false,
        "social-media": false,
      };
      bus.emit("extension:applied", { state });

      expect(handler).toHaveBeenCalledWith({ state });
    });
  });
});
