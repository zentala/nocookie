/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, beforeEach } from "vitest";
import {
  findAcceptButton,
  findRejectButton,
  findSettingsButton,
  findConsentOverlay,
  scoreConsentLikelihood,
  heuristicScan,
  buildHeuristicRule,
  heuristicRuleSource,
} from "@/content/heuristic-detector";

/** Helper: create an element with given tag, text, and optional styles. */
function createElement(
  tag: string,
  text: string,
  styles: Partial<CSSStyleDeclaration> = {},
): HTMLElement {
  const el = document.createElement(tag);
  el.textContent = text;
  Object.assign(el.style, styles);
  return el;
}

/** Helper: create a button element with given text. */
function createButton(text: string): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.textContent = text;
  return btn;
}

/** Build a mock consent overlay div with fixed positioning. */
function buildConsentOverlay(options: {
  acceptText?: string;
  rejectText?: string;
  settingsText?: string;
  bodyText?: string;
  position?: string;
}): HTMLDivElement {
  const div = document.createElement("div");
  div.style.position = options.position ?? "fixed";
  div.style.width = "600px";

  const p = document.createElement("p");
  p.textContent = options.bodyText ?? "We use cookies to improve your experience.";
  div.appendChild(p);

  if (options.acceptText) div.appendChild(createButton(options.acceptText));
  if (options.rejectText) div.appendChild(createButton(options.rejectText));
  if (options.settingsText) div.appendChild(createButton(options.settingsText));

  return div;
}

/** Clear the document body safely between tests. */
function clearBody(): void {
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild);
  }
}

describe("Heuristic detector", () => {
  beforeEach(() => {
    clearBody();
  });

  describe("findAcceptButton", () => {
    it("finds English accept button", () => {
      const container = document.createElement("div");
      container.appendChild(createButton("Accept All"));
      expect(findAcceptButton(container)).not.toBeNull();
    });

    it("finds German accept button", () => {
      const container = document.createElement("div");
      container.appendChild(createButton("Alle akzeptieren"));
      expect(findAcceptButton(container)).not.toBeNull();
    });

    it("finds French accept button", () => {
      const container = document.createElement("div");
      container.appendChild(createButton("Tout accepter"));
      expect(findAcceptButton(container)).not.toBeNull();
    });

    it("finds Polish accept button", () => {
      const container = document.createElement("div");
      container.appendChild(createButton("Zaakceptuj wszystkie"));
      expect(findAcceptButton(container)).not.toBeNull();
    });

    it("finds Spanish accept button", () => {
      const container = document.createElement("div");
      container.appendChild(createButton("Aceptar todo"));
      expect(findAcceptButton(container)).not.toBeNull();
    });

    it("finds Dutch accept button", () => {
      const container = document.createElement("div");
      container.appendChild(createButton("Alles accepteren"));
      expect(findAcceptButton(container)).not.toBeNull();
    });

    it("finds Italian accept button", () => {
      const container = document.createElement("div");
      container.appendChild(createButton("Accetta tutto"));
      expect(findAcceptButton(container)).not.toBeNull();
    });

    it("returns null when no accept button exists", () => {
      const container = document.createElement("div");
      container.appendChild(createButton("Submit"));
      expect(findAcceptButton(container)).toBeNull();
    });
  });

  describe("findRejectButton", () => {
    it("finds English reject button", () => {
      const container = document.createElement("div");
      container.appendChild(createButton("Reject All"));
      expect(findRejectButton(container)).not.toBeNull();
    });

    it("finds German reject button", () => {
      const container = document.createElement("div");
      container.appendChild(createButton("Nur Notwendige"));
      expect(findRejectButton(container)).not.toBeNull();
    });

    it("finds Polish reject button", () => {
      const container = document.createElement("div");
      container.appendChild(createButton("Odrzuć wszystkie"));
      expect(findRejectButton(container)).not.toBeNull();
    });

    it("finds 'necessary only' button", () => {
      const container = document.createElement("div");
      container.appendChild(createButton("Necessary Only"));
      expect(findRejectButton(container)).not.toBeNull();
    });

    it("returns null when no reject button exists", () => {
      const container = document.createElement("div");
      container.appendChild(createButton("Submit"));
      expect(findRejectButton(container)).toBeNull();
    });
  });

  describe("findSettingsButton", () => {
    it("finds settings button", () => {
      const container = document.createElement("div");
      container.appendChild(createButton("Cookie Settings"));
      expect(findSettingsButton(container)).not.toBeNull();
    });

    it("finds preferences button", () => {
      const container = document.createElement("div");
      container.appendChild(createButton("Manage Preferences"));
      expect(findSettingsButton(container)).not.toBeNull();
    });
  });

  describe("scoreConsentLikelihood", () => {
    it("scores high for fixed element with cookie text and buttons", () => {
      const overlay = buildConsentOverlay({
        acceptText: "Accept All",
        rejectText: "Reject All",
      });
      document.body.appendChild(overlay);

      const score = scoreConsentLikelihood(overlay);
      expect(score).toBeGreaterThanOrEqual(70);
    });

    it("scores low for non-consent element", () => {
      const div = createElement("div", "Hello World", { position: "static" });
      document.body.appendChild(div);

      const score = scoreConsentLikelihood(div);
      expect(score).toBeLessThan(30);
    });

    it("gives points for fixed positioning", () => {
      const fixed = createElement("div", "No cookie text", { position: "fixed" });
      document.body.appendChild(fixed);
      const stat = createElement("div", "No cookie text", { position: "static" });
      document.body.appendChild(stat);

      expect(scoreConsentLikelihood(fixed)).toBeGreaterThan(scoreConsentLikelihood(stat));
    });
  });

  describe("findConsentOverlay", () => {
    it("finds overlay with fixed position and cookie keywords", () => {
      const overlay = buildConsentOverlay({ acceptText: "Accept All" });
      document.body.appendChild(overlay);

      const found = findConsentOverlay();
      expect(found).not.toBeNull();
    });

    it("returns null when no overlay exists", () => {
      const div = createElement("div", "Just a regular div");
      document.body.appendChild(div);

      expect(findConsentOverlay()).toBeNull();
    });
  });

  describe("heuristicScan", () => {
    it("returns full scan result with overlay and buttons", () => {
      const overlay = buildConsentOverlay({
        acceptText: "Accept All",
        rejectText: "Reject All",
      });
      document.body.appendChild(overlay);

      const result = heuristicScan();
      expect(result.overlay).not.toBeNull();
      expect(result.acceptBtn).not.toBeNull();
      expect(result.rejectBtn).not.toBeNull();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("returns null result when no overlay found", () => {
      const result = heuristicScan();
      expect(result.overlay).toBeNull();
      expect(result.acceptBtn).toBeNull();
      expect(result.confidence).toBe(0);
    });
  });

  describe("buildHeuristicRule", () => {
    it("builds rule from valid scan result", () => {
      const overlay = buildConsentOverlay({
        acceptText: "Accept All",
        rejectText: "Reject All",
      });
      document.body.appendChild(overlay);

      const scan = heuristicScan();
      const rule = buildHeuristicRule(scan);
      expect(rule).not.toBeNull();
      expect(rule!.name).toBe("heuristic");
      expect(rule!.actions.acceptAll).toHaveLength(1);
      expect(rule!.actions.rejectAll).toHaveLength(1);
    });

    it("returns null when no overlay in scan result", () => {
      const rule = buildHeuristicRule({
        overlay: null,
        acceptBtn: null,
        rejectBtn: null,
        settingsBtn: null,
        confidence: 0,
      });
      expect(rule).toBeNull();
    });

    it("returns null when no accept button found", () => {
      const overlay = document.createElement("div");
      const rule = buildHeuristicRule({
        overlay,
        acceptBtn: null,
        rejectBtn: null,
        settingsBtn: null,
        confidence: 50,
      });
      expect(rule).toBeNull();
    });
  });

  describe("heuristicRuleSource", () => {
    it("has correct name and priority", () => {
      expect(heuristicRuleSource.name).toBe("heuristic");
      expect(heuristicRuleSource.priority).toBe(50);
    });

    it("returns null for non-heuristic CMP names", () => {
      expect(heuristicRuleSource.match("onetrust")).toBeNull();
      expect(heuristicRuleSource.match("cookiebot")).toBeNull();
    });

    it("returns null for heuristic when no overlay on page", () => {
      expect(heuristicRuleSource.match("heuristic")).toBeNull();
    });
  });
});
