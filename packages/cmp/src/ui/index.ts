/**
 * @module ui
 * Shadow DOM UI components: banner, preference center, policy page.
 */

export { ThemeEngine } from "./theme";

export { mergeTheme, buildStylesheet, buildThemeVariables, darkenColor } from "./theme-css";

export { Banner } from "./banner";

export {
  renderCategoryIcon,
  renderPrivacyBadge,
  renderComplianceBadge,
  getPrivacyLevel,
  generateSpriteSheet,
} from "./icons";

export type { IconSize, PrivacyLevel, ComplianceBadgeType } from "./icons";

export { PreferenceCenter } from "./preference-center";

export { PolicyPageGenerator } from "./policy-page";

export { AccessibilityManager } from "./accessibility";
