# Form APIs

The site has two public, same-origin form endpoints. Send a JSON object with
`Content-Type: application/json`. Bodies are limited to 32 kB, and all API responses use
`Cache-Control: no-store`. These are submission endpoints, not a system for storing or retrieving
patient records.

The server contract is implemented in [form-security.ts](../src/form-security.ts). Delivery and
responses are in [server.ts](../src/server.ts). Client validation helps visitors complete the forms,
but it does not replace server validation.

## Shared validation and limits

- Unsupported fields are rejected. Required text must remain non-empty after trimming.
- Text is trimmed, CRLF is normalized, and unsupported control characters are rejected. Only
  message and notes fields allow line breaks.
- Emails must match the server's basic email pattern. This does not verify that a mailbox exists.
- Phone fields allow digits, spaces, hyphens, parentheses, and an optional leading `+`.
- Booleans must be JSON booleans. Strings such as `"true"` are rejected.
- Omitted optional text, arrays, and booleans default to empty text, empty arrays, and `false`.
  Sending `null` instead is rejected for these fields.
- Service arrays use exact, case-sensitive values. Duplicate choices are removed. An array may
  not contain more entries than the number of allowed choices.
- The optional `website` honeypot should be omitted or left as an empty string. A filled string
  returns success without creating a PDF or sending mail. That check occurs before field validation.

Each Node process allows five combined attempts per client across both endpoints in 15 minutes.
Valid JSON requests that reach an endpoint count even if validation fails or the honeypot is filled.
JSON parser errors occur before the limiter. Counters reset on process restart and are not shared
between replicas. Proxy configuration determines the resolved client address.

The limiter sends `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset`. The reset value
is the number of seconds remaining in the window. A rejected attempt also sends `Retry-After`.

## Partnership inquiry

`POST /api/send-email`

| Field         | Required | Rules                                             |
| ------------- | -------- | ------------------------------------------------- |
| `company`     | Yes      | Text, 2 to 100 characters                         |
| `contactName` | Yes      | Text, 2 to 100 characters                         |
| `email`       | Yes      | Email, 5 to 100 characters                        |
| `phone`       | Yes      | Phone, 7 to 20 characters                         |
| `message`     | Yes      | Text, 10 to 2,000 characters. Line breaks allowed |
| `website`     | No       | Honeypot. Leave empty                             |

Example with synthetic data:

```json
{
  "company": "Example Employer",
  "contactName": "Alex Example",
  "email": "alex@example.com",
  "phone": "+1 (555) 010-1234",
  "message": "Please contact us about an occupational health program.",
  "website": ""
}
```

The server sends one email to `SMTP_RECIPIENT`, from the configured `SMTP_FROM`, with the supplied
email as `replyTo`. There is no sender confirmation for this endpoint. A successful delivery call
returns:

```json
{
  "success": true,
  "message": "Inquiry email sent successfully."
}
```

## Medical authorization

`POST /api/medical-authorization`

### Employer, employee, and signature fields

| Field                  | Required | Rules                                                             |
| ---------------------- | -------- | ----------------------------------------------------------------- |
| `company`              | Yes      | Text, 2 to 100 characters                                         |
| `accountNumber`        | No       | Text, up to 100 characters                                        |
| `contactName`          | Yes      | Text, 2 to 100 characters                                         |
| `contactEmail`         | Yes      | Email, 5 to 100 characters                                        |
| `contactPhone`         | Yes      | Phone, 7 to 20 characters                                         |
| `resultEmail`          | No       | Email, up to 100 characters. Empty or omitted uses `contactEmail` |
| `authorizationExpires` | No       | Text, up to 50 characters. No date validation is applied          |
| `employeeName`         | Yes      | Text, 2 to 100 characters                                         |
| `employeeDob`          | No       | A real calendar date in `YYYY-MM-DD` format                       |
| `employeePhone`        | No       | Phone, up to 20 characters                                        |
| `employeeTitle`        | No       | Text, up to 100 characters                                        |
| `signatureName`        | Yes      | Text, 2 to 100 characters                                         |
| `signatureDate`        | Yes      | A real calendar date in `YYYY-MM-DD` format                       |
| `consent`              | Yes      | Must be the JSON value `true`                                     |
| `notes`                | No       | Text, up to 2,000 characters. Line breaks allowed                 |
| `website`              | No       | Honeypot. Leave empty                                             |

The server checks calendar validity for birth, injury, and signature dates. It does not enforce
age or past/future date rules. Electronic consent is a submitted boolean, not a cryptographic
signature or an identity check.

### Physical exams and injury fields

| Field                   | Rules                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| `physicalExams`         | Array containing `Pre-Placement Exam / Post-Offer Exam`, `Pre-Employment Physical`, or `DOT / FMCSA Physical` |
| `physicalPreEmployment` | Boolean. Also becomes true for either pre-employment choice in `physicalExams`                                |
| `workInjuryTreatment`   | Boolean                                                                                                       |
| `consultCompensability` | Boolean                                                                                                       |
| `bodyPart`              | Text, up to 200 characters                                                                                    |
| `liftTest`              | Boolean. Weight text alone does not select a lift test                                                        |
| `liftTestWeight`        | Text, up to 50 characters                                                                                     |
| `schoolBusDriver`       | Boolean                                                                                                       |
| `schoolBusType`         | `Annual` or `New Hire`. Required when `schoolBusDriver` is true                                               |
| `dotExam`               | Boolean. Also becomes true when `physicalExams` contains `DOT / FMCSA Physical`                               |
| `dotExamType`           | `New Certification` or `Recertification`. Required when the normalized DOT selection is true                  |
| `injuryCare`            | Legacy boolean. Also selects work-injury treatment in email/PDF output                                        |
| `injuryDate`            | Real calendar date in `YYYY-MM-DD` format. Required when `injuryCare` is true                                 |

These fields are optional unless a conditional requirement applies. A non-empty subtype must
be an allowed value even when its parent exam is unselected. A valid subtype is cleared during
normalization if its parent is unselected.

The server normalizes both pre-employment labels to `Pre-Placement Exam / Post-Offer Exam`.
The canonical physical-exam list is derived from the normalized pre-employment and DOT flags.
The API does not require at least one service selection.

### Drug, alcohol, and other services

The shared screening reasons are:

- `Pre-Employment`
- `Random`
- `Follow-Up`
- `Reasonable Suspicion`
- `Return to Duty`
- `Post-Accident`

| Field           | Accepted values                                                  |
| --------------- | ---------------------------------------------------------------- |
| `nonDotDrugs`   | Screening reasons above, plus `Hair Follicle Drug` and `Rapid`   |
| `nonDotAlcohol` | Screening reasons above                                          |
| `dotDrugs`      | Screening reasons above                                          |
| `dotAlcohol`    | Screening reasons above                                          |
| `otherServices` | `Fit Testing`, `Quantiferon Gold`, `Tuberculosis (TB) Skin Test` |

Each field is an optional array. Additional text can be supplied through `nonDotDrugOther`,
`nonDotAlcoholOther`, `dotDrugOther`, and `otherServicesOther`. Each accepts up to 200 characters
on one line. There is no `dotAlcoholOther` field.

The deprecated fields `drugScreenings`, `testingReason`, and `vaccinations` are rejected. Use the
current categories and explicit Other fields rather than relying on an old service conversion.

### Example and delivery flow

This example demonstrates current service choices. For live delivery tests, replace the example
email addresses with authorized test mailboxes and use a suitable test signature date.

```json
{
  "company": "Example Employer",
  "contactName": "Alex Example",
  "contactEmail": "alex@example.com",
  "contactPhone": "+1 (555) 010-1234",
  "resultEmail": "results@example.com",
  "employeeName": "Taylor Example",
  "employeeTitle": "Driver",
  "physicalExams": ["Pre-Placement Exam / Post-Offer Exam", "DOT / FMCSA Physical"],
  "dotExamType": "New Certification",
  "schoolBusDriver": true,
  "schoolBusType": "New Hire",
  "nonDotDrugs": ["Pre-Employment", "Rapid"],
  "dotAlcohol": ["Random"],
  "otherServices": ["Fit Testing"],
  "otherServicesOther": "Employer-requested assessment",
  "notes": "Synthetic handoff test. No real employee information.",
  "signatureName": "Alex Example",
  "signatureDate": "2026-09-30",
  "consent": true,
  "website": ""
}
```

After validation, the server fills the committed PDF template in memory and sends the primary
staff email to `MED_AUTH_RECIPIENT`. Its reply address is `contactEmail`. It then sends a confirmation
with the same PDF to `contactEmail` and also to `resultEmail` if the two differ, ignoring case.
Both emails include the selected-service summary.

The staff email contains employer, employee, service, notes, and signature details. The PDF maps
only its available fields. See [Maintenance](MAINTENANCE.md#forms-and-pdf-changes) for that mapping.
The attachment name is `Medical_Authorization_<company>_<employee>.pdf`, with unsupported filename
characters replaced by underscores.

If primary delivery or PDF generation fails, the endpoint returns `500`. If confirmation delivery
fails after primary success, it logs that failure and still returns:

```json
{
  "success": true,
  "message": "Medical Authorization Form submitted successfully."
}
```

The response does not report confirmation delivery separately. A successful SMTP call is not
proof of final inbox delivery. There is no durable queue, automatic resend, database record, or
submission identifier. Check provider records before retrying a request with an uncertain outcome.

## Responses and information handling

| Status | Meaning                                                                                               |
| ------ | ----------------------------------------------------------------------------------------------------- |
| `200`  | Primary delivery call succeeded, or the honeypot was filled and the request was silently discarded    |
| `400`  | Invalid JSON or invalid submission. Body contains an `error` string                                   |
| `413`  | JSON body exceeds 32 kB. Error is `Submission is too large.`                                          |
| `429`  | Combined attempt limit exceeded. Retry timing is in the headers                                       |
| `500`  | Mail configuration, PDF generation, or primary delivery failed. Transport details stay in server logs |
| `404`  | Unknown API path or unsupported method. Error is `Unknown API endpoint.`                              |

An example validation response is `{ "error": "Electronic signature consent is required." }`.
There is no separate `415` response for unsupported media types. Use JSON so the body reaches the
validator correctly.

Submitted values are escaped for email HTML, and line breaks are removed from values used in
headers. The application does not persist submissions in a database. SMTP services and recipient
mailboxes receive the emails and PDF attachments. Agree mailbox access, retention, forwarding,
logging, and backups with Local MD before live use. Use synthetic records in tests and avoid
logging request bodies or attachments.
