import { RenderMode, type ServerRoute } from '@angular/ssr';

/**
 * Public content routes are generated at build time. Express still handles the
 * form APIs at runtime, and unknown application URLs fall back to SSR so the
 * Angular wildcard redirect can resolve them.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'home', renderMode: RenderMode.Prerender },
  { path: 'urgent-care', renderMode: RenderMode.Prerender },
  { path: 'primary-care', renderMode: RenderMode.Prerender },
  { path: 'occupational-health', renderMode: RenderMode.Prerender },
  { path: 'weight-loss', renderMode: RenderMode.Prerender },
  { path: 'lab-diagnostics', renderMode: RenderMode.Prerender },
  { path: 'injury-care', renderMode: RenderMode.Prerender },
  { path: 'locations', renderMode: RenderMode.Prerender },
  { path: 'for-patients', renderMode: RenderMode.Prerender },
  { path: 'careers', renderMode: RenderMode.Prerender },
  { path: 'privacy-policy', renderMode: RenderMode.Prerender },
  { path: 'terms-of-use', renderMode: RenderMode.Prerender },
  { path: 'accessibility', renderMode: RenderMode.Prerender },
  { path: 'hipaa-notice', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Server },
];
