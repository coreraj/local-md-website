# Locations map privacy and operations notes

The Locations page uses Leaflet with the public OpenStreetMap tile endpoint configured in
`src/app/pages/locations/locations.ts`.

- Map tiles are requested only for the visible clinic map. The application does not bulk download,
  prefetch, scrape, or bypass tile caching.
- OpenStreetMap attribution remains visible on the map and links to the OpenStreetMap copyright
  page.
- The public OpenStreetMap tile service has no guaranteed service-level agreement. Clinic cards,
  directions, and ClockwiseMD booking links remain usable if Leaflet or map tiles fail.
- Browser coordinates are processed only in memory to calculate straight-line distance. They are
  not stored in cookies or local storage and are not added to analytics, booking URLs, map-tile
  URLs, or geocoding requests.
- The map intentionally fits and focuses on clinic coordinates, not the patient's exact location.
- Loading map tiles sends normal browser requests to a third-party provider. This integration
  should be included in the site's standard privacy review before production deployment.
- `MAP_TILE_CONFIG` keeps the tile URL, attribution, and maximum zoom in one place so the provider
  can be replaced later without restructuring the component.

Operational policy: <https://operations.osmfoundation.org/policies/tiles/>
