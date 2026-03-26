/**
 * @module ui
 * Shadow DOM UI components: banner, preference center, policy page.
 */

export {
  ThemeEngine,
  mergeTheme,
  buildStylesheet,
  buildThemeVariables,
  darkenColor,
} from "./theme";

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
