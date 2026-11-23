# Local MD website

This repository contains Local MD Urgent Care's public website. It uses Angular 22 with hybrid
rendering, an Express 5 server, and two forms that deliver submissions through SMTP.

## Project guides

| Guide                              | Use it for                                                                               |
| ---------------------------------- | ---------------------------------------------------------------------------------------- |
| [Operations](docs/OPERATIONS.md)   | Build, deployment, configuration, go-live checks, rollback, and troubleshooting          |
| [Maintenance](docs/MAINTENANCE.md) | Content edits, clinic data, external integrations, routes, and the medical PDF           |
| [Form APIs](docs/FORM_APIS.md)     | Request fields, exact service values, validation, responses, and email delivery behavior |

The website serves **English only**. There is no language switcher or locale prefix. Templates
retain Angular localization markers and hydration support, but unused translation assets have
been removed.

## Technology

- Angular 22 (locked to 22.0.6) with standalone components, signals, built-in control flow, and Signal Forms
- TypeScript 6.0
- Angular SSR 22 with prerendering and hydration
- Express 5 (locked to 5.2.1) for the application server and form APIs
- Nodemailer 9 with pooled SMTP connections
- Vitest through Angular's unit-test builder
- ESLint, angular-eslint, and Prettier
- Node.js 24 or newer and pnpm 11.5 or newer

The pinned package manager is `pnpm@11.5.3`.

## Application architecture

`src/app/app.ts` owns the persistent header, router outlet, footer, and cookie-consent UI. The
homepage is kept eager because it is the primary landing route. Every other page uses Angular
`loadComponent`, so its component and page-specific dependencies are fetched only when that route
is visited.

The shell and homepage use the compact icon set in `src/app/components/core-icon`. The complete
clinical icon catalog in `src/app/components/icon` is reserved for lazy page chunks. This keeps
the large SVG template out of the initial JavaScript bundle.

### Routes and rendering

| URL                       | Client loading       | Initial rendering    |
| ------------------------- | -------------------- | -------------------- |
| `/`                       | Redirects to `/home` | Prerendered          |
| `/home`                   | Eager                | Prerendered          |
| `/urgent-care`            | Lazy                 | Prerendered          |
| `/primary-care`           | Lazy                 | Prerendered          |
| `/occupational-health`    | Lazy                 | Prerendered          |
| `/weight-loss`            | Lazy                 | Prerendered          |
| `/lab-diagnostics`        | Lazy                 | Prerendered          |
| `/injury-care`            | Lazy                 | Prerendered          |
| `/locations`              | Lazy                 | Prerendered          |
| `/for-patients`           | Lazy                 | Prerendered          |
| `/careers`                | Lazy                 | Prerendered          |
| `/privacy-policy`         | Lazy                 | Prerendered          |
| `/terms-of-use`           | Lazy                 | Prerendered          |
| `/accessibility`          | Lazy                 | Prerendered          |
| `/hipaa-notice`           | Lazy                 | Prerendered          |
| Unknown application route | Redirects to `/home` | Runtime SSR fallback |

Client routes are defined in `src/app/app.routes.ts`. Render modes are defined separately in
`src/app/app.routes.server.ts`. Add new public static pages to both files so they are loaded lazily
and prerendered.

Angular hydration reuses the generated HTML and enables event replay. i18n hydration support is
enabled because templates still contain Angular `i18n` markers even though the site is English-only.
Incremental hydration boundaries defer below-fold homepage locations, insurance content, and FAQs
until they approach the viewport. The locations page also delays downloading the Google Maps API
until the map workspace is within 300 px of the viewport.

### Main source layout

```text
src/
  app/
    components/          Header, footer, icons, consent, and shared presentation components
    pages/               Route components and page content
    services/            SEO metadata service
    app.config.ts        Router and client hydration providers
    app.config.server.ts Server rendering providers
    app.routes.ts        Browser route definitions and lazy imports
    app.routes.server.ts Per-route prerender/SSR policy
  environments/          Public build-time links and Google Maps browser key
  form-security.ts       Server-side form schemas, sanitization, and rate limiting
  server-config.ts       Provider-neutral SMTP and trusted-proxy configuration
  main.ts                Browser bootstrap
  main.server.ts         Server bootstrap
  server.ts              Express APIs, static assets, and Angular request handler
  styles.css             Global design tokens and styles
public/                  Images, icons, the medical PDF, and other copied assets
```

Clinic locations, prices, insurance plans, FAQs, and most marketing content are currently stored in
page component source rather than a CMS or database. External destinations such as billing, patient
results, social profiles, and Google Maps configuration are in `src/environments`. Booking links
and some billing and careers destinations are stored in component data or templates. See the
[integration inventory](docs/MAINTENANCE.md#external-integrations) before updating them.

## Prerequisites and setup

Install Node.js 24+ and pnpm 11.5+, then install the locked dependency graph:

```bash
pnpm install --frozen-lockfile
```

Start the development server:

```bash
pnpm start
```

The default Angular development URL is `http://localhost:4200/`. Development uses Angular's default
localhost binding and host checks. To test the form APIs locally, copy `.env.example` to `.env`,
replace the mail placeholders with a test provider and test mailboxes, then run `pnpm run start:env`.
The ordinary `pnpm start` command uses environment variables already supplied to its process.
It does not read `.env` automatically.

Useful scripts:

| Command                               | Purpose                                                  |
| ------------------------------------- | -------------------------------------------------------- |
| `pnpm start`                          | Run the Angular development server                       |
| `pnpm run start:env`                  | Run development with private settings loaded from `.env` |
| `pnpm run build:prod`                 | Create the optimized hybrid production build             |
| `pnpm run build:dev`                  | Create an unoptimized build with source maps             |
| `pnpm watch`                          | Rebuild the development configuration on changes         |
| `pnpm test`                           | Run unit tests with the Angular/Vitest builder           |
| `pnpm run test:ci`                    | Run unit tests once in non-watch CI mode                 |
| `pnpm lint`                           | Lint TypeScript and Angular templates                    |
| `pnpm format`                         | Format source TypeScript, templates, and CSS             |
| `pnpm run format:check`               | Check formatting without modifying files                 |
| `pnpm run serve:ssr:local-md-website` | Start an existing production server bundle               |
| `pnpm run serve:ssr:env`              | Start the server bundle with settings loaded from `.env` |

The production build is written to `dist/local-md-website/`:

- `browser/` contains hashed client assets and prerendered output.
- `server/server.mjs` is the Express/Angular server entry point.

Production regression budgets are:

- Initial bundle: 500 kB warning and 650 kB error.
- Any JavaScript chunk: 250 kB warning and 350 kB error.
- Any component stylesheet: 24 kB warning and 32 kB error.

Angular enforces these budgets during production builds. The custom bundle-report tool and
development component playground were removed during the handoff cleanup.

## Runtime server configuration

The compiled server listens on `PORT`, defaulting to `4000`. `.env.example` documents private runtime
settings using placeholders. Copy it to `.env` for local use, or supply variables through the
receiving team's process environment or secret manager. `.env` files and private `.pem`/`.key` files
are excluded from Git. Configure these environment variables where the server process runs:

| Variable             | Required                       | Description                                                                                                  |
| -------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `PORT`               | No                             | Express listen port. Defaults to `4000`                                                                      |
| `SMTP_HOST`          | Yes for form delivery          | Receiving team's SMTP provider hostname                                                                      |
| `SMTP_PORT`          | Yes for form delivery          | SMTP port. Integer from `1` to `65535`                                                                       |
| `SMTP_SECURE`        | No                             | `true` for implicit TLS, normally port `465`. `false` for STARTTLS, normally port `587`. Defaults to `false` |
| `SMTP_USER`          | Yes for form delivery          | SMTP username                                                                                                |
| `SMTP_PASS`          | Yes for form delivery          | SMTP password                                                                                                |
| `SMTP_FROM`          | Yes for form delivery          | Sender address authorized by the SMTP provider                                                               |
| `SMTP_RECIPIENT`     | Yes for form delivery          | Recipient for partnership inquiries                                                                          |
| `MED_AUTH_RECIPIENT` | Yes for medical authorizations | Authorized mailbox for employer medical-authorization submissions                                            |
| `TRUST_PROXY_HOPS`   | No                             | Trusted Express proxy-hop count. Non-negative integer, defaults to `0`                                       |

Run a production build and start the server with the local configuration:

```bash
pnpm run build:prod
pnpm run serve:ssr:env
```

The server can also be started directly with
`node --env-file=.env dist/local-md-website/server/server.mjs`. If settings are already supplied by
the hosting environment, use `pnpm run serve:ssr:local-md-website` or start that Node entry point
without `--env-file`.

Mail configuration is validated lazily on the first valid submission, so content pages work without
SMTP credentials. Delivery needs valid provider settings and the relevant endpoint's recipient.
The example mailboxes are placeholders. SMTP connections are pooled with a maximum of three
simultaneous connections, TLS 1.2 or newer when TLS is negotiated, and explicit connection/socket
timeouts. Use test mailboxes in development. Do not place SMTP credentials in `src/environments`.
Values in that directory are compiled into browser assets and are public.

## Public browser configuration

`src/environments/environment.ts` contains production browser settings.
`environment.development.ts` replaces it in development builds. Local MD's public links are retained.
Changing these values requires rebuilding the application. Private server environment variables
do not populate browser settings.

The previous Google Maps key has been removed. `googleMapsApiKey` is intentionally empty in both
files. The locations page uses its fallback map and makes no Google Maps script request while the
key is empty. The receiving team can supply its own browser key and rebuild. Restrict that key to
the intended website referrers and required Maps APIs. A browser Maps key is public configuration,
so it must never be reused as a private server credential.

## Form APIs and security

The Express server exposes:

- `POST /api/send-email` for the occupational-health partnership inquiry.
- `POST /api/medical-authorization` for the employer medical-authorization form.

Both accept strict JSON only. API responses send `Cache-Control: no-store`. Request bodies are
limited to 32 kB. The server rejects unsupported fields and validates input types, lengths, and
formats. A filled honeypot returns success without sending mail. Values inserted into email HTML
are escaped, and line breaks are stripped from email header values. Client-side Signal Forms help
visitors complete the forms, but the server remains the authority for validation.

Each process allows five combined form attempts per identified client in a 15-minute window and
returns standard rate-limit response headers. The limiter is in memory: counters reset when the
process restarts and are not shared across multiple Node processes. Use a shared edge or datastore
limiter if the deployment is scaled horizontally.

### Client IP handling behind a reverse proxy

The rate limiter uses Express `request.ip`, falling back to the socket address. With
`TRUST_PROXY_HOPS=0`, forwarded client headers are not trusted. Set a positive hop count only when
the receiving team has established a fixed proxy chain that overwrites forwarded headers and
prevents shorter, untrusted paths to the origin. The value counts trusted hops outward from the
application. An incorrect count can group visitors under one proxy address or trust a forged
client address. Invalid values fail startup. No provider-specific visitor headers are read.

Medical-authorization submissions contain sensitive employee and health information. Limit mailbox
access, retention, forwarding, backups, and logs according to the organization's HIPAA/security
policies. The application does not persist submissions in a database. See
[Form APIs](docs/FORM_APIS.md) for exact fields, validation, and delivery behavior.

## Hosting contract

This handoff contains application source and build tooling. The receiving team supplies CI,
hosting, process supervision, reverse-proxy/TLS configuration, mail accounts, and any edge cache.

Build with the frozen lockfile, run lint/tests/formatting checks, and create the production output.
Deploy the complete `dist/local-md-website/` directory so both `browser/` assets (including the PDF
template) and `server/` modules are present. Run the Node server entry point using Node.js 24+.
It serves both the application and `/api` form endpoints. A static-files-only host does not provide
form delivery. Retain any external runtime packages required by the emitted server bundle.

The server's allowed application hosts are `local-md.com` and `www.local-md.com`. Add any new
staging/preview hostname to `angular.json` under `build.options.security.allowedHosts` before
rebuilding. Supply runtime secrets outside browser assets, configure the actual proxy hop count,
and verify both forms using authorized test mailboxes before switching traffic.
For local production smoke tests, send the HTTP header `Host: local-md.com` to the local server,
or explicitly allow `localhost` in that build configuration before rebuilding. `pnpm start` uses
the development server and works at localhost without changing the production host allowlist.

Express serves content-hashed JavaScript/CSS bundles with a one-year immutable cache lifetime.
HTML uses `no-cache`, and public assets without content hashes must revalidate before reuse.
Every API response uses `no-store`, including parser errors. Routes, fragments, and API URLs are
preserved without added version query parameters. Apply the same policy when serving prerendered
HTML directly in the receiving team's hosting platform, and retain old hashed bundles during
deployment/rollback so previously opened pages can still load lazy routes.

Medical service arrays accept only the selections offered by the current form. School bus and
DOT exams require their matching subtype. The accurate legacy physical-exam aliases and injury
care fields remain supported. Deprecated `drugScreenings`, `testingReason`, and `vaccinations`
fields are rejected: their previous conversions could change the requested medical service.
Use the current categorized selections or their explicit Other text fields instead.
The locations map shows clinic addresses and booking links. It does not claim live wait times.

Use [Operations](docs/OPERATIONS.md) for deployment checks, troubleshooting, and rollback.

## Development guidelines

- Use standalone components and Angular's built-in control flow (`@if`, `@for`, and `@switch`).
- Keep the homepage and persistent shell lean. New non-home pages should use `loadComponent`.
- Put new static public routes in both route configuration files and prerender them unless they need
  request-specific server data.
- Use `@defer` with a stable placeholder for expensive below-fold content. Add a `hydrate` trigger
  when server-rendered content should remain visible but become interactive later.
- Guard browser-only globals with `isPlatformBrowser` so prerendering remains deterministic.
- Keep validation and authorization checks on the server even when the client form validates them.
- Never commit mail credentials or other secrets. Treat all environment files imported by browser
  code as public.
- Run tests, lint, formatting checks, and a production build before merging.

Commit hooks have been removed. Run the checks explicitly before committing or through the
receiving team's CI. The `format` and `format:check` scripts cover source files. Check the guides with
`pnpm exec prettier --check README.md "docs/**/*.md"`.
