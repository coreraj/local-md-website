import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express, { type NextFunction, type Request, type Response } from 'express';
import nodemailer from 'nodemailer';
import { join } from 'node:path';
import {
  createSubmissionRateLimiter,
  escapeHtml,
  safeHeaderValue,
  validateInquirySubmission,
  validateMedicalAuthorizationSubmission,
} from './form-security';
import { generatePrefilledMedicalAuthPdf } from './pdf-filler';
import { medicalAuthorizationServiceSummary } from './medical-authorization-summary';
import { readMailConfiguration, readTrustProxyHops, requireEnvironment } from './server-config';

const browserDistFolder = join(import.meta.dirname, '../browser');
const app = express();
app.set('trust proxy', readTrustProxyHops());

app.use('/api', (_request, response, next) => {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Pragma', 'no-cache');
  next();
});

app.use(express.json({ limit: '32kb', strict: true }));
app.use((error: unknown, _request: Request, response: Response, next: NextFunction) => {
  const errorType = error && typeof error === 'object' && 'type' in error ? String(error.type) : '';
  if (errorType === 'entity.too.large') {
    response.status(413).json({ error: 'Submission is too large.' });
    return;
  }
  if (error instanceof SyntaxError) {
    response.status(400).json({ error: 'Submission must contain valid JSON.' });
    return;
  }
  next(error);
});

const submissionRateLimiter = createSubmissionRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
});

const angularApp = new AngularNodeAppEngine();

type MailTransporter = nodemailer.Transporter<unknown>;

interface MailRuntime {
  transporter: MailTransporter;
  from: string;
}

let mailRuntime: MailRuntime | undefined;

function formatSender(label: string, fromAddress: string): string {
  const match = fromAddress.match(/<([^>]+)>/);
  const email = match ? match[1].trim() : fromAddress.trim();
  return `"${label}" <${email}>`;
}

function getMailRuntime(): MailRuntime {
  if (mailRuntime) return mailRuntime;

  // Validate SMTP only when a form needs delivery so content pages can run without mail credentials.
  // The transport is cached. Restart the process after changing its configuration.
  const configuration = readMailConfiguration();

  const transporter = nodemailer.createTransport({
    pool: true,
    host: configuration.host,
    port: configuration.port,
    secure: configuration.secure,
    auth: {
      user: configuration.user,
      pass: configuration.pass,
    },
    maxConnections: 3,
    maxMessages: 100,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    tls: { minVersion: 'TLSv1.2' },
  });

  const runtime: MailRuntime = { transporter, from: configuration.from };
  mailRuntime = runtime;
  return runtime;
}

function resetMailRuntime(): void {
  mailRuntime = undefined;
}

function logMailFailure(context: string, error: unknown): void {
  const errorName = error instanceof Error ? error.name : 'UnknownError';
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorCode =
    error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
      ? error.code
      : undefined;
  console.error(`[mail] ${context} failed: ${errorMessage}`, {
    errorName,
    errorMessage,
    errorCode,
  });
}

app.post('/api/send-email', submissionRateLimiter, async (request, response) => {
  const validation = validateInquirySubmission(request.body);
  if (validation.status === 'bot') {
    response.status(200).json({ success: true, message: 'Inquiry received.' });
    return;
  }
  if (validation.status === 'invalid') {
    response.status(400).json({ error: validation.error });
    return;
  }

  const submission = validation.data;
  const cleanCompany = escapeHtml(submission.company);
  const cleanContactName = escapeHtml(submission.contactName);
  const cleanEmail = escapeHtml(submission.email);
  const cleanPhone = escapeHtml(submission.phone);
  const cleanMessage = escapeHtml(submission.message);

  try {
    const { transporter, from } = getMailRuntime();
    await transporter.sendMail({
      from: formatSender('Local MD Contact', from),
      to: requireEnvironment('SMTP_RECIPIENT'),
      replyTo: submission.email,
      subject: `New Partner Inquiry: ${safeHeaderValue(submission.company)}`,
      text: `
You have received a new partnership inquiry:

Company Name: ${submission.company}
Contact Person: ${submission.contactName}
Email Address: ${submission.email}
Phone Number: ${submission.phone}

Message Detail:
${submission.message}
      `,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="background-color: #1d5174; color: #ffffff; padding: 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 24px;">New Client Inquiry</h2>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Local MD Website Contact Form</p>
          </div>
          <div style="padding: 24px; background-color: #ffffff;">
            <p style="font-size: 16px;">You have received a new client submission with the following details:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; width: 140px;">Company</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${cleanCompany}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Contact Name</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${cleanContactName}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Email</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><a href="mailto:${cleanEmail}" style="color: #d41f38; text-decoration: none;">${cleanEmail}</a></td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Phone</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${cleanPhone}</td>
              </tr>
            </table>

            <h3 style="font-size: 18px; margin-top: 24px; color: #1d5174; border-left: 4px solid #d41f38; padding-left: 10px;">Message:</h3>
            <div style="padding: 16px; background-color: #f9f9f9; border-radius: 6px; white-space: pre-wrap; font-size: 15px; border: 1px solid #f0f0f0;">${cleanMessage}</div>
          </div>
          <div style="background-color: #f5f5f3; padding: 15px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee;">
            This email was generated automatically by the Local MD server application.
          </div>
        </div>
      `,
    });

    response.status(200).json({ success: true, message: 'Inquiry email sent successfully.' });
  } catch (error: unknown) {
    resetMailRuntime();
    logMailFailure('Inquiry delivery', error);
    response.status(500).json({ error: 'Unable to deliver the inquiry right now.' });
  }
});

app.post('/api/medical-authorization', submissionRateLimiter, async (request, response) => {
  const validation = validateMedicalAuthorizationSubmission(request.body);
  if (validation.status === 'bot') {
    response.status(200).json({ success: true, message: 'Authorization received.' });
    return;
  }
  if (validation.status === 'invalid') {
    response.status(400).json({ error: validation.error });
    return;
  }

  const submission = validation.data;
  const cleanCompany = escapeHtml(submission.company);
  const cleanAccount = escapeHtml(submission.accountNumber);
  const cleanContactName = escapeHtml(submission.contactName);
  const cleanContactEmail = escapeHtml(submission.contactEmail);
  const cleanContactPhone = escapeHtml(submission.contactPhone);
  const cleanResultEmail = escapeHtml(submission.resultEmail);
  const cleanEmployeeName = escapeHtml(submission.employeeName);
  const cleanEmployeeDob = escapeHtml(submission.employeeDob);
  const cleanEmployeePhone = escapeHtml(submission.employeePhone);
  const cleanEmployeeTitle = escapeHtml(submission.employeeTitle);
  const cleanNotes = escapeHtml(submission.notes);
  const cleanSignatureName = escapeHtml(submission.signatureName);
  const cleanSignatureDate = escapeHtml(submission.signatureDate);
  const serviceRows = medicalAuthorizationServiceSummary(submission)
    .map(
      ({ label, value }) =>
        `<tr><td style="padding: 6px 0; font-weight: bold; width: 180px;">${escapeHtml(label)}:</td><td>${escapeHtml(value)}</td></tr>`,
    )
    .join('');

  try {
    const { transporter, from } = getMailRuntime();
    const pdfBuffer = await generatePrefilledMedicalAuthPdf(submission);
    const safeCompany = submission.company.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeEmployee = submission.employeeName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const pdfFilename = `Medical_Authorization_${safeCompany}_${safeEmployee}.pdf`;

    await transporter.sendMail({
      from: formatSender('Local MD MedAuth', from),
      to: requireEnvironment('MED_AUTH_RECIPIENT'),
      replyTo: submission.contactEmail,
      subject: `[CONFIDENTIAL MED AUTH] ${safeHeaderValue(submission.company)} - Employee: ${safeHeaderValue(submission.employeeName)}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; border: 1px solid #c8d1d9; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #365873; color: #ffffff; padding: 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 22px;">Medical Authorization Form</h2>
            <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;">Prefilled PDF document attached below</p>
          </div>

          <div style="padding: 24px; background-color: #ffffff;">
            <div style="background-color: #f0f7ff; border-left: 4px solid #365873; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; color: #213a4f;">
              <strong>Confidentiality Notice:</strong> Contains Protected Health Information (PHI) and employee PII. Intended solely for authorized Local MD Occupational Health staff. The prefilled PDF form is attached to this email.
            </div>

            <h3 style="color: #365873; border-bottom: 2px solid #e2e2df; padding-bottom: 6px; font-size: 16px; margin-top: 0;">1. Employer Information</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
              <tr><td style="padding: 6px 0; font-weight: bold; width: 180px;">Company Name:</td><td>${cleanCompany}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Account / PO #:</td><td>${cleanAccount || 'N/A'}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Authorized Rep Name:</td><td>${cleanContactName}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Contact Phone:</td><td>${cleanContactPhone}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Contact Email:</td><td>${cleanContactEmail}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Results Email:</td><td>${cleanResultEmail}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Authorization Expires:</td><td>${escapeHtml(submission.authorizationExpires) || 'N/A'}</td></tr>
            </table>

            <h3 style="color: #365873; border-bottom: 2px solid #e2e2df; padding-bottom: 6px; font-size: 16px;">2. Employee / Patient Information</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
              <tr><td style="padding: 6px 0; font-weight: bold; width: 180px;">Employee Full Name:</td><td>${cleanEmployeeName}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Date of Birth:</td><td>${cleanEmployeeDob}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Job Title / Dept:</td><td>${cleanEmployeeTitle}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Employee Phone:</td><td>${cleanEmployeePhone || 'N/A'}</td></tr>
            </table>

            <h3 style="color: #365873; border-bottom: 2px solid #e2e2df; padding-bottom: 6px; font-size: 16px;">3. Authorized Services & Testing</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
              ${serviceRows}
            </table>

            ${
              cleanNotes
                ? `
              <h3 style="color: #365873; border-bottom: 2px solid #e2e2df; padding-bottom: 6px; font-size: 16px;">4. Special Instructions</h3>
              <div style="padding: 12px; background-color: #f9f9f9; border: 1px solid #eee; border-radius: 4px; font-size: 14px; margin-bottom: 20px; white-space: pre-wrap;">${cleanNotes}</div>
            `
                : ''
            }

            <h3 style="color: #365873; border-bottom: 2px solid #e2e2df; padding-bottom: 6px; font-size: 16px;">5. Electronic Signature</h3>
            <p style="font-size: 13px; color: #555; margin-bottom: 10px;">Authorized representative electronic consent confirmed with this submission.</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 6px 0; font-weight: bold; width: 180px;">Signature:</td><td>${cleanSignatureName}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Date:</td><td>${cleanSignatureDate}</td></tr>
            </table>
          </div>
          <div style="background-color: #f5f5f3; padding: 12px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee;">
            Local MD Urgent Care — Occupational Health Web Authorization Endpoint
          </div>
        </div>
      `,
      attachments: [
        {
          filename: pdfFilename,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    const confirmationRecipients = [submission.contactEmail];
    if (
      submission.resultEmail &&
      submission.resultEmail.toLowerCase() !== submission.contactEmail.toLowerCase()
    ) {
      confirmationRecipients.push(submission.resultEmail);
    }

    try {
      await transporter.sendMail({
        from: formatSender('Local MD Occupational Health', from),
        to: confirmationRecipients.join(', '),
        subject: `[CONFIRMATION] Medical Authorization Received - ${safeHeaderValue(submission.company)} (${safeHeaderValue(submission.employeeName)})`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; border: 1px solid #c8d1d9; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #365873; color: #ffffff; padding: 20px; text-align: center;">
              <h2 style="margin: 0; font-size: 22px;">Medical Authorization Confirmation</h2>
              <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;">Local MD Occupational Health Receipt</p>
            </div>

            <div style="padding: 24px; background-color: #ffffff;">
              <p style="font-size: 15px;">Dear ${cleanContactName},</p>
              <p style="font-size: 14px;">Thank you for submitting a Medical Authorization Form with Local MD Urgent Care & Occupational Health. We have received your authorization for <strong>${cleanEmployeeName}</strong> (${cleanCompany}).</p>
              <p style="font-size: 14px;">A prefilled copy of your submitted Medical Authorization PDF is attached to this email for your records.</p>

              <h3 style="color: #365873; border-bottom: 2px solid #e2e2df; padding-bottom: 6px; font-size: 16px; margin-top: 20px;">Authorization Summary</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
                <tr><td style="padding: 6px 0; font-weight: bold; width: 180px;">Company:</td><td>${cleanCompany}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Employee / Patient:</td><td>${cleanEmployeeName}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Authorized Rep:</td><td>${cleanContactName}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Authorization Date:</td><td>${cleanSignatureDate}</td></tr>
                ${serviceRows}
              </table>

              <p style="font-size: 13px; color: #555;">If you have any questions or need to make adjustments to this authorization, please contact Local MD Occupational Health staff.</p>
            </div>
            <div style="background-color: #f5f5f3; padding: 12px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee;">
              Local MD Urgent Care — Occupational Health Web Authorization Endpoint
            </div>
          </div>
        `,
        attachments: [
          {
            filename: pdfFilename,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });
    } catch (confirmationError: unknown) {
      // The staff email has already been sent. Keep the request successful so a confirmation
      // failure does not prompt the visitor to submit a duplicate authorization.
      logMailFailure('Medical authorization confirmation to contact', confirmationError);
    }

    response.status(200).json({
      success: true,
      message: 'Medical Authorization Form submitted successfully.',
    });
  } catch (error: unknown) {
    resetMailRuntime();
    logMailFailure('Medical authorization delivery', error);
    response.status(500).json({ error: 'Unable to deliver the authorization right now.' });
  }
});

app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'Unknown API endpoint.' });
});

app.use(
  express.static(browserDistFolder, {
    maxAge: 0,
    index: false,
    redirect: false,
    setHeaders: (response, filePath) => {
      // Only content-hashed bundles can safely be cached across deployments.
      const hashedBundle = /-[a-z0-9]{8}\.(?:js|css)$/i.test(filePath);
      response.setHeader(
        'Cache-Control',
        hashedBundle ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate',
      );
    },
  }),
);

app.use((request, response, next) => {
  angularApp
    .handle(request)
    .then(async (angularResponse) => {
      if (!angularResponse) {
        next();
        return;
      }
      if (angularResponse.headers.get('content-type')?.includes('text/html')) {
        angularResponse.headers.set('Cache-Control', 'no-cache');
      }
      // Preserve the body and its Content-Length exactly as produced by Angular.
      await writeResponseToNodeResponse(angularResponse, response);
    })
    .catch(next);
});

if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) throw error;
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
