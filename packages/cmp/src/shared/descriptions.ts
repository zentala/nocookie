/**
 * @module shared/descriptions
 * Standardized cookie practice descriptions: category taxonomy and common cookie database.
 */

import type { CategoryId, CategoryConfig } from "./types";

/** Short and long description pair for display contexts. */
export interface CategoryDescription {
  /** One-liner for banner display. */
  short: string;
  /** Full description for preference center and policy page. */
  long: string;
}

/** Preset variant identifier. */
export type DescriptionPreset = "default" | "alt1" | "alt2";

/** Information about a well-known third-party cookie. */
export interface CommonCookieInfo {
  category: CategoryId;
  provider: string;
  duration: string;
  purpose: string;
}

/** Category description taxonomy: 5 categories x 3 presets, each with short + long. */
const CATEGORY_DESCRIPTIONS: Record<CategoryId, Record<DescriptionPreset, CategoryDescription>> = {
  essential: {
    default: {
      short: "Required for the website to function",
      long: "These cookies are essential for the website to function properly. They enable basic features like page navigation, secure areas, and shopping carts. The website cannot function without these cookies.",
    },
    alt1: {
      short: "Necessary for core site functionality",
      long: "Strictly necessary cookies ensure that the website works correctly. They handle tasks like maintaining your session, remembering your login, and protecting against security threats.",
    },
    alt2: {
      short: "Powers basic website features",
      long: "These cookies are required for the basic functionality of the website. Without them, services like user authentication, payment processing, and form submissions would not work.",
    },
  },
  functional: {
    default: {
      short: "Enhances your browsing experience",
      long: "Functional cookies enable enhanced features and personalization. They may remember your preferences, language settings, and region to provide a more tailored experience.",
    },
    alt1: {
      short: "Remembers your preferences",
      long: "These cookies allow the website to remember choices you have made, such as your preferred language, region, or display settings, providing a more personalized experience.",
    },
    alt2: {
      short: "Personalizes your site experience",
      long: "Functional cookies help the website provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages.",
    },
  },
  analytics: {
    default: {
      short: "Helps us understand site usage",
      long: "Analytics cookies help us understand how visitors interact with the website by collecting and reporting information anonymously. This helps us improve the website's performance and user experience.",
    },
    alt1: {
      short: "Measures site performance",
      long: "These cookies collect information about how you use the website, such as which pages you visit most often and whether you encounter error messages. This data is used to improve how the website works.",
    },
    alt2: {
      short: "Tracks anonymous usage statistics",
      long: "We use analytics cookies to count visits and traffic sources so we can measure and improve the performance of our site. They help us know which pages are the most and least popular.",
    },
  },
  marketing: {
    default: {
      short: "Delivers relevant advertisements",
      long: "Marketing cookies are used to track visitors across websites. The intention is to display ads that are relevant and engaging for the individual user, making them more valuable for publishers and third-party advertisers.",
    },
    alt1: {
      short: "Powers targeted advertising",
      long: "These cookies may be set through our site by our advertising partners. They may be used to build a profile of your interests and show you relevant adverts on other sites.",
    },
    alt2: {
      short: "Enables personalized ads",
      long: "Marketing cookies are used to deliver advertisements that are more relevant to you and your interests. They are also used to limit the number of times you see an advertisement and help measure the effectiveness of advertising campaigns.",
    },
  },
  "social-media": {
    default: {
      short: "Enables social sharing features",
      long: "Social media cookies enable social media features on our website, such as sharing content with friends and networks. They may track your browser across other sites and build up a profile of your interests.",
    },
    alt1: {
      short: "Connects you to social networks",
      long: "These cookies are set by social media services that we have added to the site. They enable you to share our content with your friends and networks. They are capable of tracking your browser across other sites.",
    },
    alt2: {
      short: "Powers social media integrations",
      long: "Social media cookies allow you to interact with social media platforms directly from our website. These cookies may also be used by the social media platform to track your browsing activity.",
    },
  },
};

/** Database of well-known third-party cookies with their metadata. */
const COMMON_COOKIES: Record<string, CommonCookieInfo> = {
  // Google Analytics
  _ga: {
    category: "analytics",
    provider: "Google Analytics",
    duration: "2 years",
    purpose:
      "Distinguishes unique users by assigning a randomly generated number as a client identifier",
  },
  _gid: {
    category: "analytics",
    provider: "Google Analytics",
    duration: "24 hours",
    purpose: "Distinguishes unique users, stores and updates a unique value for each page visited",
  },
  _gat: {
    category: "analytics",
    provider: "Google Analytics",
    duration: "1 minute",
    purpose: "Used to throttle request rate to Google Analytics",
  },
  // Facebook
  _fbp: {
    category: "marketing",
    provider: "Facebook",
    duration: "3 months",
    purpose: "Tracks visits across websites to deliver targeted advertising",
  },
  fr: {
    category: "marketing",
    provider: "Facebook",
    duration: "3 months",
    purpose: "Delivers, measures, and improves the relevancy of ads",
  },
  // Google Ads
  _gcl_au: {
    category: "marketing",
    provider: "Google Ads",
    duration: "3 months",
    purpose: "Stores conversion data for Google Ads campaigns",
  },
  IDE: {
    category: "marketing",
    provider: "Google DoubleClick",
    duration: "1 year",
    purpose: "Used by Google DoubleClick to serve targeted advertisements",
  },
  // LinkedIn
  li_sugr: {
    category: "marketing",
    provider: "LinkedIn",
    duration: "3 months",
    purpose: "Used for LinkedIn ad targeting and analytics",
  },
  bcookie: {
    category: "social-media",
    provider: "LinkedIn",
    duration: "1 year",
    purpose: "Browser identifier cookie for LinkedIn sharing features",
  },
  // Twitter/X
  guest_id: {
    category: "social-media",
    provider: "Twitter/X",
    duration: "2 years",
    purpose: "Identifies non-logged-in users for embedded content",
  },
  // HubSpot
  __hssc: {
    category: "analytics",
    provider: "HubSpot",
    duration: "30 minutes",
    purpose: "Tracks session data for HubSpot analytics",
  },
  __hssrc: {
    category: "analytics",
    provider: "HubSpot",
    duration: "Session",
    purpose: "Determines if the user has restarted their browser",
  },
  __hstc: {
    category: "analytics",
    provider: "HubSpot",
    duration: "13 months",
    purpose:
      "Tracks visitors and contains domain, first visit timestamp, last visit timestamp, current visit timestamp, and session number",
  },
  // Hotjar
  _hjSessionUser: {
    category: "analytics",
    provider: "Hotjar",
    duration: "1 year",
    purpose: "Ensures subsequent visits are attributed to the same user ID",
  },
  _hjSession: {
    category: "analytics",
    provider: "Hotjar",
    duration: "30 minutes",
    purpose: "Holds current session data",
  },
  // Microsoft Clarity
  _clck: {
    category: "analytics",
    provider: "Microsoft Clarity",
    duration: "1 year",
    purpose: "Persists the Clarity User ID and preferences",
  },
  _clsk: {
    category: "analytics",
    provider: "Microsoft Clarity",
    duration: "1 day",
    purpose: "Connects multiple page views by a user into a single Clarity session recording",
  },
  // TikTok
  _ttp: {
    category: "marketing",
    provider: "TikTok",
    duration: "13 months",
    purpose: "Tracks performance of TikTok advertising campaigns",
  },
  // Stripe
  __stripe_mid: {
    category: "essential",
    provider: "Stripe",
    duration: "1 year",
    purpose: "Fraud prevention for payment processing",
  },
  __stripe_sid: {
    category: "essential",
    provider: "Stripe",
    duration: "Session",
    purpose: "Fraud prevention for payment processing",
  },
};

/**
 * Retrieve the category description for a given preset.
 * Falls back to 'default' if the preset is not recognized.
 */
export function getCategoryDescription(
  categoryId: CategoryId,
  preset: DescriptionPreset = "default",
): CategoryDescription {
  const presets = CATEGORY_DESCRIPTIONS[categoryId];
  return presets[preset] ?? presets.default;
}

/**
 * Look up metadata for a well-known cookie by name.
 * Returns null if the cookie is not in the database.
 */
export function getCommonCookieInfo(cookieName: string): CommonCookieInfo | null {
  return COMMON_COOKIES[cookieName] ?? null;
}

/**
 * Resolve the description for a category config using the priority chain:
 * 1. Custom description on the CategoryConfig (used as both short and long)
 * 2. Specified preset
 * 3. Default preset
 */
export function resolveDescription(
  category: CategoryConfig,
  preset?: DescriptionPreset,
): CategoryDescription {
  if (category.description) {
    return { short: category.description, long: category.description };
  }
  return getCategoryDescription(category.id, preset);
}
