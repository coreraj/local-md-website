# Operations

This is the application's deployment contract. Choose the hosting and CI tools that suit the
receiving team's environment, then use the checks below to confirm the site behaves as expected.

## Build and package

Use Node.js 24 or newer and the pinned `pnpm@11.5.3`. From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm run test:ci
pnpm lint
pnpm run format:check
pnpm exec prettier --check README.md "docs/**/*.md"
pnpm exec tsc --project tsconfig.spec.json --noEmit
pnpm run build:prod
```

Production builds fetch the Google Fonts stylesheets referenced in `src/styles.css` for font
inlining. Allow access to that service in the build environment.

The release directory is `dist/local-md-website/`. Deploy the complete directory, including
`browser/`, `server/`, and `browser/assets/Medical_Authorization_Form.pdf`. Keep any runtime
packages required by the emitted server modules available to Node. Copying only the static
browser files leaves the form APIs unavailable.

Angular checks the configured bundle budgets during production builds. There is no custom
bundle-report script or automatic commit hook in this handoff branch. Run the checks above
explicitly or include them in the receiving team's CI.

## Configuration

### Private runtime settings

Supply these through the server process environment or the receiving team's secret manager.
For local work, copy [.env.example](../.env.example) to `.env` and replace the placeholders.
Keep real credentials outside the repository.

| Variable             | Requirement and behavior                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| `PORT`               | Optional. Defaults to `4000`                                                                                 |
| `TRUST_PROXY_HOPS`   | Optional. Defaults to `0`. Must be a non-negative integer                                                    |
| `SMTP_HOST`          | Required for mail delivery                                                                                   |
| `SMTP_PORT`          | Required for mail delivery. Integer from `1` to `65535`                                                      |
| `SMTP_SECURE`        | `true` for implicit TLS, normally port `465`. `false` for STARTTLS, normally port `587`. Defaults to `false` |
| `SMTP_USER`          | Required for mail delivery                                                                                   |
| `SMTP_PASS`          | Required for mail delivery                                                                                   |
| `SMTP_FROM`          | Required. Use a sender authorized by the SMTP provider                                                       |
| `SMTP_RECIPIENT`     | Required for partnership inquiries                                                                           |
| `MED_AUTH_RECIPIENT` | Required for medical authorizations. Use an authorized staff mailbox                                         |

SMTP settings are checked on the first valid submission. Pages can therefore load normally
while mail is misconfigured. A page-load check alone is not enough to accept the deployment.
The transport is pooled and cached in the process. Restart the process after changing its settings.

SMTP uses at most three pooled connections, a 10-second connection and greeting timeout, and a
20-second socket timeout. When TLS is negotiated, its minimum version is TLS 1.2. Configure sender
authentication and delivery monitoring with the chosen provider.

### Public build settings

[environment.ts](../src/environments/environment.ts) supplies production links and the optional
Google Maps browser key. [environment.development.ts](../src/environments/environment.development.ts)
supplies development values. Changes require a rebuild. Server environment variables do not fill
these browser settings.

Both Maps keys are empty at handoff. The fallback map works without loading the Google Maps
script. If an interactive Google map is required, supply a browser key restricted to the intended
referrers and required APIs, then rebuild. Treat that key as public browser configuration.

Some public destinations are in templates or clinic data rather than the environment files.
Use the [integration inventory](MAINTENANCE.md#external-integrations) when changing accounts or URLs.

## Start the server

If the host already supplies the runtime environment:

```bash
node dist/local-md-website/server/server.mjs
```

For a local production check with `.env`:

```bash
pnpm run serve:ssr:env
```

The equivalent direct command is:

```bash
node --env-file=.env dist/local-md-website/server/server.mjs
```

Run one supervised Node process per application instance. Arrange startup, restart, logs, and
health monitoring in the hosting platform. There is no dedicated health-check API. Monitor a public
page for availability and check mail delivery separately using controlled submissions.

## Hosts and reverse proxies

The build allows `local-md.com` and `www.local-md.com`. Add a staging or preview hostname to
`build.options.security.allowedHosts` in [angular.json](../angular.json) before rebuilding.
Keep staging access and indexing policy under the receiving team's control.

Set `TRUST_PROXY_HOPS` to the actual trusted hop count only after establishing a fixed proxy chain.
The proxies must overwrite forwarded headers, and visitors must not be able to reach the origin
through a shorter untrusted path. The rate limiter uses Express's resolved client address. An
incorrect hop count can group visitors under a proxy address or accept a forged address.

Proxy `/api` requests to Node without caching them. Preserve methods, bodies, query strings,
fragments in browser navigation, and the intended application host. A URL fragment is handled by
the browser and is not part of the HTTP request. Serve the site over TLS and confirm the proxy
does not alter HTML bodies without also updating response metadata.

For a local production HTTP check, keep the configured application host:

```bash
curl --header "Host: local-md.com" --include http://localhost:4000/home
```

In PowerShell, use `curl.exe` to avoid the older `curl` alias. Development at
`http://localhost:4200/` works with `pnpm start` without changing the production host allowlist.

## Caching and rollback

| Response                                  | Cache policy                          |
| ----------------------------------------- | ------------------------------------- |
| HTML pages                                | `no-cache`                            |
| Content-hashed JavaScript and CSS bundles | `public, max-age=31536000, immutable` |
| Public assets without content hashes      | `public, max-age=0, must-revalidate`  |
| Every `/api` response, including errors   | `no-store`                            |

HTML revalidation allows visitors to pick up the current release. Keep earlier hashed bundles
available during deployments and for the chosen rollback window so an already-open page can still
load its lazy routes. If the host serves prerendered HTML or assets directly, apply the same cache
rules there.

Keep the previous complete release and its configuration reference. For rollback, restore that
release, restart its Node process, revalidate cached HTML and unhashed assets, and repeat the page
and form checks. Avoid mixing server files and browser assets from different releases.

## Before switching traffic

Use synthetic employee data and authorized test mailboxes. Record the results against the actual
release and deployment environment.

- [ ] Run the checks in [Build and package](#build-and-package) and build production output.
- [ ] Confirm the Node version, supervised process, runtime settings, allowed host, proxy hop count,
      and TLS configuration.
- [ ] Open every public route directly and refresh it. Check the unknown application-route redirect.
- [ ] Open `/for-patients?source=handoff#faqs` directly and check FAQ position and focus after hydration.
- [ ] Check the partnership link reaches `/occupational-health#inquiry-form`.
- [ ] Check clinic selection and state filters with the fallback map. If enabling Google Maps,
      repeat with the receiving team's key and inspect browser errors.
- [ ] Use the medical dialog with a keyboard. Check initial focus, Tab and Shift+Tab wrapping,
      Escape, and focus return after the dialog and its notices close.
- [ ] Submit a partnership inquiry. Confirm the configured mailbox receives the correct details
      and the reply address points to the test sender. This form has no confirmation email.
- [ ] Submit a medical authorization. Compare service choices, exam subtypes, Other text, notes,
      and signature details in the staff email and attached PDF.
- [ ] Confirm the representative receives a confirmation with the same PDF. Repeat with a distinct
      results email and confirm both intended recipients receive it.
- [ ] Confirm invalid submissions return `400`, oversized JSON returns `413`, and unknown API paths
      return JSON `404`. Check API responses are uncached.
- [ ] Check the combined five-attempt rate limit and `429` retry headers using controlled requests.
- [ ] Check HTML, hashed bundles, the favicon, and the PDF have the expected cache headers through
      the actual proxy or edge cache.
- [ ] Confirm booking, billing, results, careers, and social destinations with their account owners.
- [ ] Confirm logs and mailboxes are accessible to the responsible staff and retention settings are agreed.
- [ ] Confirm a previous release can be restored and its lazy bundles remain available.

## Troubleshooting

| Symptom                                                | First checks                                                                                                                                                     |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pages load but forms return `500`                      | Check required SMTP values, endpoint recipient, authorized sender, outbound connectivity, and server mail errors                                                 |
| Medical submissions fail while inquiries work          | Check `MED_AUTH_RECIPIENT` and the deployed PDF asset. Confirm the template's field names match the code                                                         |
| Visitor sees success but no confirmation arrives       | Check the primary staff message, confirmation failure logs, provider delivery records, and spam filtering. Confirmation failure does not reverse primary success |
| A production URL is rejected                           | Check the requested host against the build allowlist and rebuild after an allowed-host change                                                                    |
| Visitors unexpectedly share `429` responses            | Check proxy trust and the resolved client address. The two forms share a limit                                                                                   |
| Form returns `400`                                     | Inspect the JSON error and compare the payload with [Form APIs](FORM_APIS.md). Check unsupported fields, exact service values, dates, and required subtypes      |
| New content is stale or lazy routes fail after release | Check HTML revalidation, release consistency, and retention of earlier hashed bundles                                                                            |
| Google Maps does not load                              | An empty key intentionally uses the fallback. For a configured key, check restrictions, enabled APIs, and browser errors after the map approaches the viewport   |

Mail failures are logged with transport error details. Keep those logs restricted and avoid adding
request bodies or attachments to routine logs. There is no database copy or durable retry queue.
Check provider records before resubmitting a potentially delivered message to avoid duplicates.
