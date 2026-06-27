/** Fallback: hide boot splash if React is slow to hydrate (e.g. cold PWA start). */
export const bootFallbackScript = `(function(){setTimeout(function(){document.body.classList.add("brief-ready");},2500);})();`;
