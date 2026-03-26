/**
 * About tab (Tab 5) for the options page.
 *
 * Displays extension version, description, and useful links.
 */

/** Extension metadata for the about page. */
const ABOUT_INFO = {
  name: "NoCookie",
  version: "0.1.0",
  tagline: "Set cookie preferences once. Auto-apply everywhere.",
  links: [
    { label: "GitHub", url: "https://github.com/zentala/cookies-accepter" },
    { label: "Website", url: "https://nocookie.zentala.io" },
    { label: "Report a bug", url: "https://github.com/zentala/cookies-accepter/issues" },
  ],
} as const;

/** Build the about panel content. */
export function buildAboutPanel(container: HTMLElement): void {
  container.textContent = "";

  const title = document.createElement("h2");
  title.id = "about-title";
  title.textContent = `${ABOUT_INFO.name} v${ABOUT_INFO.version}`;
  container.appendChild(title);

  const tagline = document.createElement("p");
  tagline.className = "about-tagline";
  tagline.textContent = ABOUT_INFO.tagline;
  container.appendChild(tagline);

  const list = document.createElement("ul");
  list.className = "about-links";
  for (const link of ABOUT_INFO.links) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = link.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = link.label;
    li.appendChild(a);
    list.appendChild(li);
  }
  container.appendChild(list);
}

/** Initialize the about tab. */
export function initAbout(): void {
  const container = document.getElementById("panel-about");
  if (!container) return;
  buildAboutPanel(container);
}
