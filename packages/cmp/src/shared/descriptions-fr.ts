/**
 * @module shared/descriptions-fr
 * French translations for cookie category descriptions and common cookie purposes.
 */

import type { LocalizedDescriptions } from "./descriptions-i18n";

/** French cookie practice descriptions. */
export const descriptionsFR: LocalizedDescriptions = {
  categories: {
    essential: {
      default: {
        short: "Necessaires au fonctionnement du site",
        long: "Ces cookies sont essentiels au bon fonctionnement du site web. Ils activent des fonctions de base comme la navigation entre les pages, les zones securisees et les paniers d'achat. Le site ne peut pas fonctionner sans ces cookies.",
      },
      alt1: {
        short: "Indispensables aux fonctions principales",
        long: "Les cookies strictement necessaires garantissent le bon fonctionnement du site web. Ils gerent des taches comme le maintien de votre session, la memorisation de votre connexion et la protection contre les menaces de securite.",
      },
      alt2: {
        short: "Assure les fonctions de base du site",
        long: "Ces cookies sont necessaires aux fonctionnalites de base du site web. Sans eux, des services comme l'authentification, le traitement des paiements et la soumission de formulaires ne fonctionneraient pas.",
      },
    },
    functional: {
      default: {
        short: "Ameliore votre experience de navigation",
        long: "Les cookies fonctionnels permettent des fonctionnalites avancees et la personnalisation. Ils peuvent memoriser vos preferences, parametres linguistiques et region pour offrir une experience plus adaptee.",
      },
      alt1: {
        short: "Memorise vos preferences",
        long: "Ces cookies permettent au site de se souvenir de vos choix, comme votre langue preferee, votre region ou vos parametres d'affichage, pour une experience plus personnalisee.",
      },
      alt2: {
        short: "Personnalise votre experience du site",
        long: "Les cookies fonctionnels aident le site a fournir des fonctionnalites avancees et une personnalisation. Ils peuvent etre definis par nous ou par des fournisseurs tiers dont nous avons integre les services.",
      },
    },
    analytics: {
      default: {
        short: "Nous aide a comprendre l'utilisation du site",
        long: "Les cookies analytiques nous aident a comprendre comment les visiteurs interagissent avec le site en collectant et rapportant des informations de maniere anonyme. Cela nous aide a ameliorer les performances et l'experience utilisateur.",
      },
      alt1: {
        short: "Mesure les performances du site",
        long: "Ces cookies collectent des informations sur votre utilisation du site, comme les pages les plus visitees et les eventuels messages d'erreur. Ces donnees servent a ameliorer le fonctionnement du site.",
      },
      alt2: {
        short: "Collecte des statistiques d'utilisation anonymes",
        long: "Nous utilisons des cookies analytiques pour compter les visites et les sources de trafic afin de mesurer et d'ameliorer les performances de notre site. Ils nous aident a identifier les pages les plus et les moins populaires.",
      },
    },
    marketing: {
      default: {
        short: "Diffuse des publicites pertinentes",
        long: "Les cookies marketing sont utilises pour suivre les visiteurs sur les sites web. L'objectif est d'afficher des publicites pertinentes et engageantes pour l'utilisateur, les rendant plus precieuses pour les editeurs et annonceurs tiers.",
      },
      alt1: {
        short: "Active la publicite ciblee",
        long: "Ces cookies peuvent etre definis via notre site par nos partenaires publicitaires. Ils peuvent etre utilises pour creer un profil de vos interets et vous montrer des publicites pertinentes sur d'autres sites.",
      },
      alt2: {
        short: "Permet les publicites personnalisees",
        long: "Les cookies marketing sont utilises pour vous diffuser des publicites plus pertinentes par rapport a vos interets. Ils servent egalement a limiter le nombre de fois ou vous voyez une publicite et a mesurer l'efficacite des campagnes.",
      },
    },
    "social-media": {
      default: {
        short: "Active les fonctions de partage social",
        long: "Les cookies de reseaux sociaux activent les fonctionnalites sociales sur notre site, comme le partage de contenu avec vos amis et reseaux. Ils peuvent suivre votre navigateur sur d'autres sites et etablir un profil de vos interets.",
      },
      alt1: {
        short: "Vous connecte aux reseaux sociaux",
        long: "Ces cookies sont definis par les services de reseaux sociaux integres a notre site. Ils vous permettent de partager notre contenu avec vos amis et reseaux. Ils peuvent suivre votre navigateur sur d'autres sites.",
      },
      alt2: {
        short: "Active les integrations de reseaux sociaux",
        long: "Les cookies de reseaux sociaux vous permettent d'interagir avec les plateformes sociales directement depuis notre site. Ces cookies peuvent egalement etre utilises par la plateforme sociale pour suivre votre activite de navigation.",
      },
    },
  },
  cookies: {
    _ga: {
      purpose:
        "Distingue les utilisateurs uniques en attribuant un numero genere aleatoirement comme identifiant client",
    },
    _gid: {
      purpose:
        "Distingue les utilisateurs uniques, stocke et met a jour une valeur unique pour chaque page visitee",
    },
    _fbp: { purpose: "Suit les visites sur les sites web pour diffuser des publicites ciblees" },
    fr: { purpose: "Diffuse, mesure et ameliore la pertinence des publicites" },
    _gcl_au: { purpose: "Stocke les donnees de conversion pour les campagnes Google Ads" },
    IDE: { purpose: "Utilise par Google DoubleClick pour diffuser des publicites ciblees" },
    __hssc: { purpose: "Suit les donnees de session pour les analyses HubSpot" },
    __hstc: {
      purpose:
        "Suit les visiteurs et contient les donnees de domaine, premiere visite, derniere visite et session",
    },
    _hjSessionUser: {
      purpose: "Garantit que les visites suivantes sont attribuees au meme identifiant utilisateur",
    },
    __stripe_mid: { purpose: "Prevention de la fraude pour le traitement des paiements" },
  },
};
