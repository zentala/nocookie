/**
 * @module shared/translations
 * Barrel export for all translation files. Maps language codes to FullTranslations.
 */

import type { FullTranslations } from "../i18n";
import { en } from "./en";
import { de, fr, es, pl } from "./european-major";
import { nl, it, pt } from "./european-southern";
import { sv, da, no, fi, cs } from "./european-other";
import { ro, hu, el } from "./european-extra";

/** All available translations keyed by ISO 639-1 language code. */
export const translations: Record<string, FullTranslations> = {
  en,
  de,
  fr,
  es,
  pl,
  nl,
  it,
  pt,
  sv,
  da,
  no,
  fi,
  cs,
  ro,
  hu,
  el,
};

export { en } from "./en";
export { de, fr, es, pl } from "./european-major";
export { nl, it, pt } from "./european-southern";
export { sv, da, no, fi, cs } from "./european-other";
export { ro, hu, el } from "./european-extra";
