/**
 * @module shared/descriptions-es
 * Spanish translations for cookie category descriptions and common cookie purposes.
 */

import type { LocalizedDescriptions } from "./descriptions-i18n";

/** Spanish cookie practice descriptions. */
export const descriptionsES: LocalizedDescriptions = {
  categories: {
    essential: {
      default: {
        short: "Necesarias para el funcionamiento del sitio",
        long: "Estas cookies son esenciales para el correcto funcionamiento del sitio web. Permiten funciones basicas como la navegacion entre paginas, areas seguras y carritos de compra. El sitio no puede funcionar sin estas cookies.",
      },
      alt1: {
        short: "Imprescindibles para la funcionalidad principal",
        long: "Las cookies estrictamente necesarias garantizan que el sitio web funcione correctamente. Gestionan tareas como mantener su sesion, recordar su inicio de sesion y proteger contra amenazas de seguridad.",
      },
      alt2: {
        short: "Habilita las funciones basicas del sitio",
        long: "Estas cookies son necesarias para las funciones basicas del sitio web. Sin ellas, servicios como la autenticacion de usuarios, el procesamiento de pagos y el envio de formularios no funcionarian.",
      },
    },
    functional: {
      default: {
        short: "Mejora su experiencia de navegacion",
        long: "Las cookies funcionales permiten funciones avanzadas y personalizacion. Pueden recordar sus preferencias, configuracion de idioma y region para ofrecer una experiencia mas adaptada.",
      },
      alt1: {
        short: "Recuerda sus preferencias",
        long: "Estas cookies permiten que el sitio web recuerde las decisiones que ha tomado, como su idioma preferido, region o configuracion de visualizacion, para una experiencia mas personalizada.",
      },
      alt2: {
        short: "Personaliza su experiencia en el sitio",
        long: "Las cookies funcionales ayudan al sitio web a proporcionar funcionalidades avanzadas y personalizacion. Pueden ser establecidas por nosotros o por proveedores externos cuyos servicios hemos integrado en nuestras paginas.",
      },
    },
    analytics: {
      default: {
        short: "Nos ayuda a comprender el uso del sitio",
        long: "Las cookies analiticas nos ayudan a comprender como los visitantes interactuan con el sitio web mediante la recopilacion y el reporte anonimo de informacion. Esto nos ayuda a mejorar el rendimiento y la experiencia de usuario.",
      },
      alt1: {
        short: "Mide el rendimiento del sitio",
        long: "Estas cookies recopilan informacion sobre como utiliza el sitio web, como las paginas que visita con mas frecuencia y si aparecen mensajes de error. Estos datos se utilizan para mejorar el funcionamiento del sitio.",
      },
      alt2: {
        short: "Registra estadisticas de uso anonimas",
        long: "Utilizamos cookies analiticas para contar las visitas y fuentes de trafico con el fin de medir y mejorar el rendimiento de nuestro sitio. Nos ayudan a saber cuales son las paginas mas y menos populares.",
      },
    },
    marketing: {
      default: {
        short: "Muestra publicidad relevante",
        long: "Las cookies de marketing se utilizan para rastrear a los visitantes en los sitios web. El objetivo es mostrar anuncios relevantes y atractivos para cada usuario, haciendolos mas valiosos para editores y anunciantes externos.",
      },
      alt1: {
        short: "Permite la publicidad dirigida",
        long: "Estas cookies pueden ser establecidas a traves de nuestro sitio por nuestros socios publicitarios. Pueden usarse para crear un perfil de sus intereses y mostrarle anuncios relevantes en otros sitios.",
      },
      alt2: {
        short: "Permite anuncios personalizados",
        long: "Las cookies de marketing se utilizan para mostrarle anuncios mas relevantes para usted y sus intereses. Tambien se usan para limitar la frecuencia con la que ve un anuncio y para medir la eficacia de las campanas publicitarias.",
      },
    },
    "social-media": {
      default: {
        short: "Habilita funciones para compartir en redes sociales",
        long: "Las cookies de redes sociales habilitan funciones sociales en nuestro sitio, como compartir contenido con amigos y redes. Pueden rastrear su navegador en otros sitios y crear un perfil de sus intereses.",
      },
      alt1: {
        short: "Le conecta con las redes sociales",
        long: "Estas cookies son establecidas por servicios de redes sociales que hemos integrado en nuestro sitio. Le permiten compartir nuestro contenido con sus amigos y redes. Pueden rastrear su navegador en otros sitios.",
      },
      alt2: {
        short: "Activa las integraciones de redes sociales",
        long: "Las cookies de redes sociales le permiten interactuar con plataformas sociales directamente desde nuestro sitio. Estas cookies tambien pueden ser utilizadas por la plataforma social para rastrear su actividad de navegacion.",
      },
    },
  },
  cookies: {
    _ga: {
      purpose:
        "Distingue usuarios unicos asignando un numero generado aleatoriamente como identificador de cliente",
    },
    _gid: {
      purpose:
        "Distingue usuarios unicos, almacena y actualiza un valor unico para cada pagina visitada",
    },
    _fbp: { purpose: "Rastrea visitas en sitios web para ofrecer publicidad dirigida" },
    fr: { purpose: "Muestra, mide y mejora la relevancia de los anuncios" },
    _gcl_au: { purpose: "Almacena datos de conversion para campanas de Google Ads" },
    IDE: { purpose: "Usado por Google DoubleClick para mostrar publicidad dirigida" },
    __hssc: { purpose: "Rastrea datos de sesion para las analiticas de HubSpot" },
    __hstc: {
      purpose:
        "Rastrea visitantes y contiene datos de dominio, primera visita, ultima visita y sesion",
    },
    _hjSessionUser: {
      purpose:
        "Garantiza que las visitas posteriores se atribuyan al mismo identificador de usuario",
    },
    __stripe_mid: { purpose: "Prevencion de fraude para el procesamiento de pagos" },
  },
};
