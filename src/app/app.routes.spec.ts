import { RenderMode } from '@angular/ssr';
import { routes } from './app.routes';
import { serverRoutes } from './app.routes.server';

describe('Careers routes', () => {
  it('should lazy-load Careers before the client wildcard', () => {
    const careersRouteIndex = routes.findIndex((route) => route.path === 'careers');
    const wildcardRouteIndex = routes.findIndex((route) => route.path === '**');
    const careersRoute = routes[careersRouteIndex];

    expect(careersRouteIndex).toBeGreaterThan(-1);
    expect(careersRouteIndex).toBeLessThan(wildcardRouteIndex);
    expect(typeof careersRoute?.loadComponent).toBe('function');
  });

  it('should prerender the Careers page', () => {
    const careersRoute = serverRoutes.find((route) => route.path === 'careers');

    expect(careersRoute?.renderMode).toBe(RenderMode.Prerender);
  });
});
