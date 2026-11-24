# Weight Loss / GLP-1 page status

The Weight Loss / GLP-1 Therapy page is intentionally offline.

Its full UI, styles, SEO metadata, structured data, and functionality remain preserved in:

`src/app/pages/weight-loss/weight-loss.ts`

No page implementation or related assets were deleted.

## Restore the page

1. Restore the lazy-loaded `weight-loss` route in `src/app/app.routes.ts` before the wildcard route:

   ```ts
   {
     path: 'weight-loss',
     loadComponent: () =>
       import('./pages/weight-loss/weight-loss').then((m) => m.WeightLossComponent),
   },
   ```

2. Restore the prerender entry in `src/app/app.routes.server.ts` before the wildcard route:

   ```ts
   { path: 'weight-loss', renderMode: RenderMode.Prerender },
   ```

3. Restore the `/weight-loss` links in both the desktop and mobile sections of
   `src/app/components/header/header.html`.
4. Restore the `/weight-loss` link in `src/app/components/footer/footer.html`.
5. Restore the `https://local-md.com/weight-loss` URL entry in `public/sitemap.xml` with a current
   `lastmod` date.
6. Run a production build and verify navigation, the direct URL, responsive behavior, metadata,
   and the generated sitemap before deploying.

While disabled, `/weight-loss` is handled by Angular's wildcard route and redirects to `/home`.
