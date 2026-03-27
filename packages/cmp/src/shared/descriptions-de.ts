/**
 * @module shared/descriptions-de
 * German translations for cookie category descriptions and common cookie purposes.
 */

import type { LocalizedDescriptions } from "./descriptions-i18n";

/** German cookie practice descriptions. */
export const descriptionsDE: LocalizedDescriptions = {
  categories: {
    essential: {
      default: {
        short: "Erforderlich fuer die Funktion der Website",
        long: "Diese Cookies sind fuer das ordnungsgemaesse Funktionieren der Website unerlasslich. Sie ermoeglichen grundlegende Funktionen wie Seitennavigation, sichere Bereiche und Warenkoerbe. Ohne diese Cookies kann die Website nicht funktionieren.",
      },
      alt1: {
        short: "Notwendig fuer die Kernfunktionalitaet",
        long: "Unbedingt erforderliche Cookies stellen sicher, dass die Website korrekt funktioniert. Sie uebernehmen Aufgaben wie die Aufrechterhaltung Ihrer Sitzung, das Speichern Ihres Logins und den Schutz vor Sicherheitsbedrohungen.",
      },
      alt2: {
        short: "Ermoeglicht grundlegende Website-Funktionen",
        long: "Diese Cookies sind fuer die Grundfunktionen der Website erforderlich. Ohne sie wuerden Dienste wie Benutzerauthentifizierung, Zahlungsabwicklung und Formulareingaben nicht funktionieren.",
      },
    },
    functional: {
      default: {
        short: "Verbessert Ihr Surferlebnis",
        long: "Funktionale Cookies ermoeglichen erweiterte Funktionen und Personalisierung. Sie koennen Ihre Praeferenzen, Spracheinstellungen und Region speichern, um ein massgeschneidertes Erlebnis zu bieten.",
      },
      alt1: {
        short: "Speichert Ihre Einstellungen",
        long: "Diese Cookies ermoeglichen es der Website, Ihre Entscheidungen zu speichern, z. B. bevorzugte Sprache, Region oder Anzeigeeinstellungen, um ein personalisiertes Erlebnis zu bieten.",
      },
      alt2: {
        short: "Personalisiert Ihr Website-Erlebnis",
        long: "Funktionale Cookies helfen der Website, erweiterte Funktionalitaet und Personalisierung bereitzustellen. Sie koennen von uns oder von Drittanbietern gesetzt werden, deren Dienste wir auf unseren Seiten eingebunden haben.",
      },
    },
    analytics: {
      default: {
        short: "Hilft uns, die Nutzung der Website zu verstehen",
        long: "Analyse-Cookies helfen uns zu verstehen, wie Besucher mit der Website interagieren, indem sie Informationen anonym sammeln und melden. Dies hilft uns, die Leistung und Benutzerfreundlichkeit der Website zu verbessern.",
      },
      alt1: {
        short: "Misst die Website-Leistung",
        long: "Diese Cookies sammeln Informationen darueber, wie Sie die Website nutzen, z. B. welche Seiten Sie am haeufigsten besuchen und ob Fehlermeldungen auftreten. Diese Daten dienen der Verbesserung der Website.",
      },
      alt2: {
        short: "Erfasst anonyme Nutzungsstatistiken",
        long: "Wir verwenden Analyse-Cookies, um Besuche und Zugangsquellen zu zaehlen, damit wir die Leistung unserer Website messen und verbessern koennen. Sie helfen uns zu erkennen, welche Seiten am beliebtesten sind.",
      },
    },
    marketing: {
      default: {
        short: "Liefert relevante Werbung",
        long: "Marketing-Cookies werden verwendet, um Besucher ueber Websites hinweg zu verfolgen. Ziel ist es, Anzeigen anzuzeigen, die fuer den einzelnen Nutzer relevant und ansprechend sind, was sie fuer Herausgeber und Drittanbieter wertvoller macht.",
      },
      alt1: {
        short: "Ermoeglicht gezielte Werbung",
        long: "Diese Cookies koennen ueber unsere Website von unseren Werbepartnern gesetzt werden. Sie koennen dazu verwendet werden, ein Profil Ihrer Interessen zu erstellen und Ihnen relevante Werbung auf anderen Websites zu zeigen.",
      },
      alt2: {
        short: "Ermoeglicht personalisierte Anzeigen",
        long: "Marketing-Cookies werden verwendet, um Ihnen Werbung zu liefern, die fuer Sie und Ihre Interessen relevanter ist. Sie werden auch verwendet, um die Haeufigkeit einer Anzeige zu begrenzen und die Wirksamkeit von Werbekampagnen zu messen.",
      },
    },
    "social-media": {
      default: {
        short: "Ermoeglicht Funktionen zum Teilen in sozialen Medien",
        long: "Social-Media-Cookies ermoeglichen Social-Media-Funktionen auf unserer Website, wie das Teilen von Inhalten mit Freunden und Netzwerken. Sie koennen Ihren Browser ueber andere Websites hinweg verfolgen und ein Profil Ihrer Interessen erstellen.",
      },
      alt1: {
        short: "Verbindet Sie mit sozialen Netzwerken",
        long: "Diese Cookies werden von Social-Media-Diensten gesetzt, die wir auf unserer Website eingebunden haben. Sie ermoeglichen es Ihnen, unsere Inhalte mit Freunden und Netzwerken zu teilen. Sie koennen Ihren Browser ueber andere Websites verfolgen.",
      },
      alt2: {
        short: "Ermoeglicht Social-Media-Integrationen",
        long: "Social-Media-Cookies ermoeglichen Ihnen die Interaktion mit Social-Media-Plattformen direkt von unserer Website aus. Diese Cookies koennen auch von der Social-Media-Plattform verwendet werden, um Ihre Browsing-Aktivitaeten zu verfolgen.",
      },
    },
  },
  cookies: {
    _ga: {
      purpose:
        "Unterscheidet eindeutige Nutzer durch Zuweisung einer zufaellig generierten Nummer als Client-Kennung",
    },
    _gid: {
      purpose:
        "Unterscheidet eindeutige Nutzer, speichert und aktualisiert einen eindeutigen Wert fuer jede besuchte Seite",
    },
    _fbp: { purpose: "Verfolgt Besuche ueber Websites hinweg, um gezielte Werbung auszuliefern" },
    fr: { purpose: "Liefert, misst und verbessert die Relevanz von Werbeanzeigen" },
    _gcl_au: { purpose: "Speichert Konversionsdaten fuer Google Ads-Kampagnen" },
    IDE: { purpose: "Wird von Google DoubleClick verwendet, um gezielte Werbung auszuliefern" },
    __hssc: { purpose: "Verfolgt Sitzungsdaten fuer HubSpot-Analysen" },
    __hstc: {
      purpose:
        "Verfolgt Besucher und enthaelt Domain-, Erstbesuchs-, Letztbesuchs- und Sitzungsdaten",
    },
    _hjSessionUser: {
      purpose: "Stellt sicher, dass nachfolgende Besuche derselben Nutzer-ID zugeordnet werden",
    },
    __stripe_mid: { purpose: "Betrugspraevention fuer die Zahlungsabwicklung" },
  },
};
