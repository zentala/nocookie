/**
 * @module ui/policy-page
 * Generates a complete cookie policy page from CMP configuration.
 * Supports both injection into an existing element and standalone HTML page output.
 */

import type { ResolvedCMPConfig, CategoryConfig, CookieDeclaration } from "@/shared/types";
import { CATEGORY_META } from "@/shared/constants";
import { resolveDescription } from "@/shared/descriptions";
import {
  renderCategoryIcon,
  renderPrivacyBadge,
  renderComplianceBadge,
  getPrivacyLevel,
} from "@/ui/icons";

/**
 * Generates cookie policy page HTML from a resolved CMP configuration.
 * Renders all categories, cookie tables, badges, legal text, and action buttons.
 */
export class PolicyPageGenerator {
  constructor(private config: ResolvedCMPConfig) {}

  /** Generate policy page HTML for injection into an existing page. */
  generateHTML(): string {
    const sections = [
      this.renderHeader(),
      this.renderBadges(),
      this.renderWhatAreCookies(),
      this.renderHowWeUseCookies(),
      this.renderManagingPreferences(),
      this.renderYourRights(),
      this.renderContact(),
      this.renderFooter(),
    ];
    return `<div class="ca-policy">${sections.join("")}</div>`;
  }

  /** Generate a complete standalone HTML page with head, styles, and body. */
  generateStandalonePage(): string {
    const title = this.config.policyPage.title || "Cookie Policy";
    const content = this.generateHTML();
    return [
      "<!DOCTYPE html>",
      '<html lang="en">',
      "<head>",
      '<meta charset="UTF-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
      `<title>${escapeHtml(title)} - ${escapeHtml(this.config.siteName)}</title>`,
      "</head>",
      "<body>",
      content,
      "</body>",
      "</html>",
    ].join("\n");
  }

  /**
   * Inject the policy page content into a target DOM element.
   * All user-provided strings are escaped via escapeHtml before rendering,
   * so the generated HTML is safe to assign as markup.
   */
  inject(target: HTMLElement): void {
    const safeHTML = this.generateHTML();
    target.replaceChildren();
    target.insertAdjacentHTML("afterbegin", safeHTML);
  }

  private renderHeader(): string {
    const title = this.config.policyPage.title || "Cookie Policy";
    const lastUpdated = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return (
      `<h1>${escapeHtml(title)} - ${escapeHtml(this.config.siteName)}</h1>` +
      `<p class="ca-policy__meta">Last updated: ${lastUpdated}</p>`
    );
  }

  private renderBadges(): string {
    const categoryIds = this.config.categories.map((c) => c.id);
    const privacyLevel = getPrivacyLevel(categoryIds);
    const badges = [
      renderPrivacyBadge(privacyLevel),
      renderComplianceBadge("gdpr"),
      renderComplianceBadge("gpc"),
      renderComplianceBadge("standard"),
    ];
    return `<div class="ca-policy__badges">${badges.join("")}</div>`;
  }

  private renderWhatAreCookies(): string {
    return (
      '<div class="ca-policy__section">' +
      "<h2>1. What Are Cookies</h2>" +
      "<p>Cookies are small text files stored on your device when you visit a website. " +
      "They help the site remember your preferences, understand how you use it, and " +
      "improve your browsing experience. Some cookies are essential for the site to " +
      "function, while others help us analyze traffic or personalize content.</p>" +
      "</div>"
    );
  }

  private renderHowWeUseCookies(): string {
    const categories = this.config.categories.map((cat) => this.renderCategory(cat)).join("");
    return (
      '<div class="ca-policy__section">' + "<h2>2. How We Use Cookies</h2>" + categories + "</div>"
    );
  }

  private renderCategory(category: CategoryConfig): string {
    const meta = CATEGORY_META[category.id];
    const name = category.name ?? meta.name;
    const desc = resolveDescription(category);
    const icon = renderCategoryIcon(category.id, "sm");
    const requiredTag = category.required ? " <em>(Always active)</em>" : "";

    let html =
      '<div class="ca-policy__category">' +
      `<div class="ca-policy__category-header">${icon} ${escapeHtml(name)}${requiredTag}</div>` +
      `<p>${escapeHtml(desc.long)}</p>`;

    if (category.cookies && category.cookies.length > 0) {
      html += this.renderCookieTable(category.cookies);
    }

    html += "</div>";
    return html;
  }

  private renderCookieTable(cookies: CookieDeclaration[]): string {
    const rows = cookies
      .map(
        (c) =>
          "<tr>" +
          `<td>${escapeHtml(c.name)}</td>` +
          `<td>${escapeHtml(c.provider)}</td>` +
          `<td>${escapeHtml(c.purpose)}</td>` +
          `<td>${escapeHtml(c.duration)}</td>` +
          `<td>${escapeHtml(c.type ?? "first-party")}</td>` +
          "</tr>",
      )
      .join("");

    return (
      '<table class="ca-policy__cookie-table">' +
      "<thead><tr>" +
      "<th>Cookie</th><th>Provider</th><th>Purpose</th><th>Duration</th><th>Type</th>" +
      "</tr></thead>" +
      `<tbody>${rows}</tbody>` +
      "</table>"
    );
  }

  private renderManagingPreferences(): string {
    return (
      '<div class="ca-policy__section">' +
      "<h2>3. Managing Your Preferences</h2>" +
      "<p>You can change your cookie preferences at any time by clicking the button below. " +
      "This will reopen the consent preference center where you can toggle individual " +
      "cookie categories on or off.</p>" +
      '<button class="ca-policy__change-btn" data-ca-action="open-preferences">' +
      "Change my preferences</button>" +
      "</div>"
    );
  }

  private renderYourRights(): string {
    return (
      '<div class="ca-policy__section">' +
      "<h2>4. Your Rights</h2>" +
      "<p>Under the General Data Protection Regulation (GDPR) and the ePrivacy Directive, " +
      "you have the right to:</p>" +
      "<ul>" +
      "<li>Be informed about the cookies we use and their purposes</li>" +
      "<li>Accept or reject non-essential cookies</li>" +
      "<li>Change your cookie preferences at any time</li>" +
      "<li>Request deletion of data collected through cookies</li>" +
      "</ul>" +
      "<p>We also respect the Global Privacy Control (GPC) signal. If your browser sends " +
      "a GPC signal, we will treat it as a request to opt out of non-essential cookies.</p>" +
      "</div>"
    );
  }

  private renderContact(): string {
    const { privacyContact, dpo } = this.config;
    if (!privacyContact && !dpo) return "";

    let html =
      '<div class="ca-policy__section">' +
      "<h2>5. Contact</h2>" +
      "<p>If you have questions about our use of cookies, you can reach us at:</p>" +
      "<ul>";

    if (privacyContact) {
      html += `<li>Privacy Contact: ${escapeHtml(privacyContact)}</li>`;
    }
    if (dpo) {
      html += `<li>Data Protection Officer: ${escapeHtml(dpo)}</li>`;
    }

    html += "</ul></div>";
    return html;
  }

  private renderFooter(): string {
    return (
      '<div class="ca-policy__footer">' +
      '<p>Powered by <a href="https://nocookie.dev" target="_blank" rel="noopener">NoCookie</a>' +
      " — open-source cookie consent management.</p>" +
      "</div>"
    );
  }
}

/** Escape HTML special characters to prevent XSS. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
