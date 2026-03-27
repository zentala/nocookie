/**
 * @module shared/translations/en
 * English (default) translation strings for the NoCookie CMP.
 */

import type { FullTranslations } from "../i18n";

/** Complete English translations serving as the default fallback. */
export const en: FullTranslations = {
  bannerTitle: "Cookie Consent",
  bannerDescription:
    "We use cookies to enhance your browsing experience. Choose which categories you allow.",
  preferencesTitle: "Cookie Preferences",
  acceptAll: "Accept All",
  rejectAll: "Reject All",
  customize: "Customize",
  savePreferences: "Save Preferences",
  closeAriaLabel: "Close cookie consent banner",
  categoryRequired: "Always active",
  cookiePolicy: "Cookie Policy",
  poweredBy: "Powered by NoCookie",
  alwaysActive: "Always Active",
  learnMore: "Learn More",
  categories: {
    essential: {
      name: "Strictly Necessary",
      description: "Required for the website to function properly",
    },
    functional: {
      name: "Functional",
      description: "Enhanced functionality like preferences and language",
    },
    analytics: {
      name: "Analytics & Performance",
      description: "Understanding how visitors interact with the website",
    },
    marketing: {
      name: "Marketing & Advertising",
      description: "Delivering relevant advertisements",
    },
    "social-media": {
      name: "Social Media",
      description: "Social media features like share buttons",
    },
  },
  legal: {
    whatAreCookies: "What Are Cookies?",
    whatAreCookiesText:
      "Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences and improve your experience.",
    yourRights: "Your Rights",
    yourRightsText:
      "Under GDPR and ePrivacy regulations, you have the right to accept or reject non-essential cookies. You can change your preferences at any time.",
    gdprReference: "General Data Protection Regulation (EU) 2016/679",
    eprivacyReference: "ePrivacy Directive 2002/58/EC",
    gpcReference: "Global Privacy Control (GPC) signal is supported",
    lastUpdated: "Last updated",
    contact: "Contact",
    changePreferences: "Change your cookie preferences",
  },
};
