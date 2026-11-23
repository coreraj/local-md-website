# Maintenance

Most content changes need a source edit and a new build. There is no CMS or admin interface.
Use this map to find the right files and check the other places affected by a change.

## Where to edit

Paths below are relative to the repository root. Several pages keep their HTML and styles inside
the TypeScript component rather than separate files.

| Content                                                                     | Files                                                                                                                |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Homepage copy and layout                                                    | `src/app/pages/home/home.html`, `home.css`, and `home.ts`                                                            |
| Homepage clinic data and default hours                                      | `src/app/pages/home/home.ts`, particularly `locationsList` and `DEFAULT_HOURS`                                       |
| Locations, hours, services, coordinates, and booking links                  | `src/app/pages/locations/locations.ts`                                                                               |
| Patient shortcuts, insurance plans, and FAQs                                | `src/app/pages/for-patients/for-patients.ts`                                                                         |
| Occupational-health copy, billing links, and form markup                    | `src/app/pages/occupational-health/occupational-health.html`                                                         |
| Occupational-health form models, client validation, and submission payloads | `src/app/pages/occupational-health/occupational-health.ts`                                                           |
| Urgent care, primary care, lab diagnostics, and injury care                 | Their `.html` and `.ts` files under `src/app/pages/urgent-care/`, `primary-care/`, `lab-diagnostics/`, and `injury/` |
| Weight-loss copy, prices, and layout                                        | `src/app/pages/weight-loss/weight-loss.ts`                                                                           |
| Careers copy and Paycom link/embed                                          | `src/app/pages/careers/careers.html`                                                                                 |
| Shared navigation and contact links                                         | `src/app/components/header/` and `src/app/components/footer/`                                                        |
| Cookie-consent UI                                                           | `src/app/components/cookie-consent/`                                                                                 |
| Legal and accessibility notices                                             | `src/app/pages/privacy-policy/`, `terms-of-use/`, `hipaa-notice/`, and `accessibility/`                              |
| Shared colors, spacing, and typography                                      | `src/styles.css`, plus component styles                                                                              |
| Images, insurance logos, favicon, and downloadable PDF                      | `public/assets/`, `public/logos/`, and `public/favicon.ico`                                                          |
| Public environment links and optional Maps key                              | `src/environments/environment.ts` and `environment.development.ts`                                                   |

Have Local MD's content owner confirm clinical claims, prices, insurance coverage, hours, and legal
text before publishing changes. Technical checks do not establish whether those business details
are current.

## Clinic changes need two edits

The homepage and locations page each hold their own clinic list. Update both when a clinic opens,
closes, changes hours, moves, or changes its booking link. Keep clinic IDs, addresses, phone numbers,
coordinates, and state labels consistent. Check any selected-clinic defaults if removing an entry.

Local MD confirmed 10 locations during Stage 3, matching the current lists. Occupational-health
copy still refers to 13 locations and needs a content correction to 10.
The locations map shows clinic details and booking links without a live wait-time feed.

After a clinic edit, check the homepage hours card, location cards, state filters, proximity sorting,
map selection, directions, and booking destinations. Check the fallback map even if a Google Maps
key is configured in another environment.

## External integrations

These are destinations currently referenced by the application. Their presence in source does not
verify account access, availability, or ownership. Arrange access with Local MD and confirm the
intended destinations before replacing them.

| Integration                                          | Where configured                                                          | Receiving-team action                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Clinic bookings through ClockwiseMD                  | `reserveUrl` values in both clinic lists                                  | Confirm each clinic's visit URL with the booking account owner                     |
| Patient billing through CareAgent                    | `environment.links.payBill` in both environment files                     | Confirm the `careagent.io/pay/IL024` destination                                   |
| Header billing through WebPay                        | Two links in `src/app/components/header/header.html`                      | Confirm `localmdurgentcare.webpay.md` is intended alongside CareAgent              |
| Patient test results through InteliChart             | `environment.links.testResults`                                           | Confirm the `login.intelichart.com/localmd` destination                            |
| Occupational billing through CoworkHealth and Stripe | `src/app/pages/occupational-health/occupational-health.html`              | Confirm the login and payment links with occupational-health billing staff         |
| Careers through Paycom                               | Link and iframe in `src/app/pages/careers/careers.html`                   | Preserve both destinations together and confirm the recruiting account             |
| Google Maps and directions                           | Browser key in both environment files and map logic in `locations.ts`     | Supply an optional restricted key. Directions links work independently of that key |
| Facebook, Instagram, and LinkedIn                    | `environment.links` in both environment files                             | Confirm profile URLs and account access                                            |
| Public contact addresses                             | Footer and occupational-health templates                                  | Confirm these mailboxes. They are separate from runtime form recipients            |
| Form email delivery                                  | Runtime variables documented in [Operations](OPERATIONS.md#configuration) | Configure sender authorization, credentials, recipients, and delivery monitoring   |

## Routes and SEO

Add a public page to both [app.routes.ts](../src/app/app.routes.ts) and
[app.routes.server.ts](../src/app/app.routes.server.ts). Keep non-home pages lazy and choose the
appropriate render mode. Update navigation and [sitemap.xml](../public/sitemap.xml) when the page
should be discoverable. Set meaningful sitemap modification dates when publishing content updates.

Page components call [SeoService](../src/app/services/seo.service.ts) with the title, description,
image, and route path. That service supplies shared social metadata and uses `https://local-md.com`
as its base URL. A domain change also needs updates to [robots.txt](../public/robots.txt), the
sitemap, and the build host allowlist. Review public links for the same change.

## Forms and PDF changes

Treat [form-security.ts](../src/form-security.ts) as the server contract. If changing a service
option, review the client form, validator, [email summary](../src/medical-authorization-summary.ts),
[PDF mapping](../src/medical-authorization-pdf.ts), and [API documentation](FORM_APIS.md) together.
Use exact service labels and preserve the distinction between screening categories.

The template is [Medical_Authorization_Form.pdf](../public/assets/Medical_Authorization_Form.pdf).
The current template has 57 AcroForm fields: 14 text fields and 43 checkboxes. Their required names
are listed in `MEDICAL_AUTH_TEXT_FIELD_NAMES` and `MEDICAL_AUTH_CHECKBOX_FIELD_NAMES` in the PDF
mapping file. Preserve those names and types when replacing the template, or update the mapping
and regression tests as part of the same change.

The generated PDF remains fillable. The loader checks the source asset during development and
the copied browser asset in a production build. It caches the template in memory, so restart the
server after a replacement.

Not every submitted field has a dedicated PDF field. The email carries additional contact and
employee details. The PDF's authorization date comes from `signatureDate`, and its authorized-by
field comes from `contactName`. Injury date is combined with body-part text. Other-service text
and notes share one field. Check the resulting layout with long synthetic values as well as the
stored values in tests.

The regression tests in [pdf-filler.spec.ts](../src/pdf-filler.spec.ts) use the committed template.
[server.spec.ts](../src/server.spec.ts) checks email summaries and attachments with mock SMTP.
Run them through `pnpm run test:ci`, then inspect a delivered test PDF after any template or service
change.

## Language and rendering

The active build is English only. Templates still contain Angular localization markers, and
the application retains the localization runtime and hydration support they need. Unused
translation JSON files and the Spanish locale configuration have been removed. Edit the active
page templates to change English copy. Adding another language would need a separate localization
setup and build configuration.

Keep browser-only code behind platform guards. For deferred sections, preserve useful server
content and stable placeholders. Check direct fragment navigation when changing the patient FAQs
or other sections that render later. Shared dialog behavior lives in
[modal-dialog.ts](../src/app/shared/modal-dialog.ts).

## Before publishing a maintenance change

Run tests, lint, formatting checks, and a production build using the commands in
[Operations](OPERATIONS.md#build-and-package). Check the affected pages in a browser at both
mobile and desktop widths. For form or PDF edits, complete the relevant live-mail checks in
[Operations](OPERATIONS.md#before-switching-traffic). For content changes, obtain the content owner's
confirmation and include the updated pages in the release notes.
