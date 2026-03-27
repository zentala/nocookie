/**
 * @module shared/descriptions-pl
 * Polish translations for cookie category descriptions and common cookie purposes.
 */

import type { LocalizedDescriptions } from "./descriptions-i18n";

/** Polish cookie practice descriptions. */
export const descriptionsPL: LocalizedDescriptions = {
  categories: {
    essential: {
      default: {
        short: "Niezbedne do funkcjonowania strony",
        long: "Te pliki cookie sa niezbedne do prawidlowego funkcjonowania strony internetowej. Umozliwiaja podstawowe funkcje, takie jak nawigacja po stronach, bezpieczne obszary i koszyki zakupowe. Strona nie moze funkcjonowac bez tych plikow cookie.",
      },
      alt1: {
        short: "Konieczne dla glownych funkcji strony",
        long: "Scisle niezbedne pliki cookie zapewniaja prawidlowe dzialanie strony internetowej. Obsluguja zadania takie jak utrzymanie sesji, zapamietanie logowania i ochrona przed zagrozeniami bezpieczenstwa.",
      },
      alt2: {
        short: "Zapewnia podstawowe funkcje strony",
        long: "Te pliki cookie sa wymagane do podstawowego funkcjonowania strony internetowej. Bez nich uslugi takie jak uwierzytelnianie uzytkownikow, przetwarzanie platnosci i przesylanie formularzy nie dzialaloby.",
      },
    },
    functional: {
      default: {
        short: "Ulepsza Twoje doswiadczenie przegladania",
        long: "Funkcjonalne pliki cookie umozliwiaja zaawansowane funkcje i personalizacje. Moga zapamietac Twoje preferencje, ustawienia jezykowe i region, aby zapewnic bardziej dostosowane doswiadczenie.",
      },
      alt1: {
        short: "Zapamietuje Twoje preferencje",
        long: "Te pliki cookie pozwalaja stronie zapamietac dokonane przez Ciebie wybory, takie jak preferowany jezyk, region lub ustawienia wyswietlania, zapewniajac bardziej spersonalizowane doswiadczenie.",
      },
      alt2: {
        short: "Personalizuje Twoje doswiadczenie na stronie",
        long: "Funkcjonalne pliki cookie pomagaja stronie zapewniac zaawansowana funkcjonalnosc i personalizacje. Moga byc ustawiane przez nas lub przez zewnetrznych dostawcow, ktorych uslugi dodalismy do naszych stron.",
      },
    },
    analytics: {
      default: {
        short: "Pomaga nam zrozumiec uzytkowanie strony",
        long: "Analityczne pliki cookie pomagaja nam zrozumiec, w jaki sposob odwiedzajacy wchodza w interakcje ze strona, zbierajac i raportujac informacje anonimowo. Pomaga nam to poprawiac wydajnosc i doswiadczenie uzytkownika.",
      },
      alt1: {
        short: "Mierzy wydajnosc strony",
        long: "Te pliki cookie zbieraja informacje o tym, jak korzystasz ze strony internetowej, np. ktore strony odwiedzasz najczesciej i czy pojawiaja sie komunikaty o bledach. Dane te sluza do poprawy dzialania strony.",
      },
      alt2: {
        short: "Rejestruje anonimowe statystyki uzytkowania",
        long: "Uzywamy analitycznych plikow cookie do zliczania odwiedzin i zrodel ruchu, abysmy mogli mierzyc i poprawiac wydajnosc naszej strony. Pomagaja nam poznac najpopularniejsze i najmniej popularne podstrony.",
      },
    },
    marketing: {
      default: {
        short: "Wyswietla trafne reklamy",
        long: "Marketingowe pliki cookie sluza do sledzenia odwiedzajacych na stronach internetowych. Celem jest wyswietlanie reklam, ktore sa istotne i angazujace dla uzytkownika, co czyni je bardziej wartosciowymi dla wydawcow i zewnetrznych reklamodawcow.",
      },
      alt1: {
        short: "Umozliwia reklame ukierunkowana",
        long: "Te pliki cookie moga byc ustawiane na naszej stronie przez naszych partnerow reklamowych. Moga byc uzywane do tworzenia profilu Twoich zainteresowac i wyswietlania odpowiednich reklam na innych stronach.",
      },
      alt2: {
        short: "Umozliwia spersonalizowane reklamy",
        long: "Marketingowe pliki cookie sluza do dostarczania reklam bardziej odpowiadajacych Tobie i Twoim zainteresowaniom. Sluza rowniez do ograniczania czestotliwosci wyswietlania reklamy oraz mierzenia skutecznosci kampanii reklamowych.",
      },
    },
    "social-media": {
      default: {
        short: "Umozliwia udostepnianie w mediach spolecznosciowych",
        long: "Pliki cookie mediow spolecznosciowych umozliwiaja funkcje spolecznosciowe na naszej stronie, takie jak udostepnianie tresci znajomym i sieciom. Moga sledzic Twoja przegladarke na innych stronach i tworzyc profil Twoich zainteresowac.",
      },
      alt1: {
        short: "Laczy Cie z sieciami spolecznosciowymi",
        long: "Te pliki cookie sa ustawiane przez serwisy spolecznosciowe, ktore dodalismy do naszej strony. Umozliwiaja Ci udostepnianie naszych tresci znajomym i sieciom. Moga sledzic Twoja przegladarke na innych stronach.",
      },
      alt2: {
        short: "Zapewnia integracje z mediami spolecznosciowymi",
        long: "Pliki cookie mediow spolecznosciowych pozwalaja na interakcje z platformami spolecznosciowymi bezposrednio z naszej strony. Te pliki cookie moga byc rowniez uzywane przez platforme spolecznosciowa do sledzenia Twojej aktywnosci przegladania.",
      },
    },
  },
  cookies: {
    _ga: {
      purpose:
        "Rozroznia unikalnych uzytkownikow przypisujac losowo wygenerowany numer jako identyfikator klienta",
    },
    _gid: {
      purpose:
        "Rozroznia unikalnych uzytkownikow, przechowuje i aktualizuje unikalna wartosc dla kazdej odwiedzonej strony",
    },
    _fbp: {
      purpose:
        "Sledzi odwiedziny na stronach internetowych w celu dostarczania ukierunkowanych reklam",
    },
    fr: { purpose: "Dostarcza, mierzy i poprawia trafnosc reklam" },
    _gcl_au: { purpose: "Przechowuje dane konwersji dla kampanii Google Ads" },
    IDE: { purpose: "Uzywany przez Google DoubleClick do wyswietlania ukierunkowanych reklam" },
    __hssc: { purpose: "Sledzi dane sesji dla analityki HubSpot" },
    __hstc: {
      purpose:
        "Sledzi odwiedzajacych i zawiera dane domeny, pierwszej wizyty, ostatniej wizyty i sesji",
    },
    _hjSessionUser: {
      purpose: "Zapewnia przypisanie kolejnych wizyt do tego samego identyfikatora uzytkownika",
    },
    __stripe_mid: { purpose: "Zapobieganie oszustwom przy przetwarzaniu platnosci" },
  },
};
