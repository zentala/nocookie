/**
 * @module e2e/setup
 * Global setup for E2E integration tests. Clears DOM and cookies
 * between tests to ensure isolation.
 */

import { afterEach } from "vitest";

afterEach(() => {
  document.body.textContent = "";
  document.cookie.split(";").forEach((c) => {
    const name = c.split("=")[0].trim();
    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  });
});
