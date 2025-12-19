const PRODUCTION_URL = "https://orangepages.bitcoinforcorporations.com";

/**
 * Returns the production URL for OAuth and email redirects.
 * This ensures users always see the production domain in OAuth consent screens
 * and email links, rather than preview/localhost URLs.
 */
export function getProductionUrl(): string {
  const origin = window.location.origin;
  
  // Use production URL when on preview or development environments
  if (origin.includes("lovable") || origin.includes("localhost")) {
    return PRODUCTION_URL;
  }
  
  return origin;
}
