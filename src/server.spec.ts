// @vitest-environment node
import { createServer, type Server, type RequestListener } from 'node:http';
import type { AddressInfo } from 'node:net';
import { PDFDocument } from 'pdf-lib';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ sendMail: vi.fn(), handle: vi.fn() }));

vi.mock('nodemailer', () => ({
  default: { createTransport: () => ({ sendMail: mocks.sendMail }) },
}));
vi.mock('@angular/ssr/node', async (importOriginal) => {
  const original = await importOriginal<typeof import('@angular/ssr/node')>();
  return {
    ...original,
    AngularNodeAppEngine: class {
      handle = mocks.handle;
    },
    isMainModule: () => false,
  };
});

const inquiry = {
  company: 'Acme <Logistics>',
  contactName: 'John Smith',
  email: 'hr@example.com',
  phone: '555-123-4567',
  message: 'Please send details about employee examinations.',
};
const authorization = {
  company: 'Acme Logistics',
  employeeName: 'Jane Doe',
  contactName: 'John Smith',
  contactEmail: 'hr@example.com',
  contactPhone: '555-123-4567',
  signatureName: 'John Smith',
  signatureDate: '2026-09-30',
  consent: true,
  physicalPreEmployment: true,
  dotExam: true,
  dotExamType: 'Recertification',
  schoolBusDriver: true,
  schoolBusType: 'New Hire',
  liftTest: true,
  liftTestWeight: '50 lbs',
  workInjuryTreatment: true,
  consultCompensability: true,
  bodyPart: 'Left wrist',
  nonDotDrugs: ['Rapid'],
  nonDotDrugOther: 'Expanded panel',
  nonDotAlcohol: ['Follow-Up'],
  nonDotAlcoholOther: 'Observed BAT',
  dotDrugs: ['Return to Duty'],
  dotDrugOther: 'Panel note',
  dotAlcohol: ['Post-Accident'],
  otherServices: ['Fit Testing', 'Quantiferon Gold'],
  otherServicesOther: 'Vision screening',
};

describe('Express form endpoints and HTML responses', () => {
  let server: Server;
  let baseUrl: string;

  beforeEach(async () => {
    vi.resetModules();
    mocks.sendMail.mockReset().mockResolvedValue({ messageId: 'test-only' });
    mocks.handle.mockReset().mockResolvedValue(null);
    for (const [name, value] of Object.entries({
      TRUST_PROXY_HOPS: '0',
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '587',
      SMTP_SECURE: 'false',
      SMTP_USER: 'test-user',
      SMTP_PASS: 'test-password',
      SMTP_FROM: 'website@example.com',
      SMTP_RECIPIENT: 'inquiries@example.com',
      MED_AUTH_RECIPIENT: 'medical@example.com',
    }))
      vi.stubEnv(name, value);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { reqHandler } = await import('./server');
    server = createServer(reqHandler as RequestListener);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterEach(async () => {
    if (server)
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  const post = (url: string, body: unknown) =>
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  it.each([
    ['{invalid-json', 400],
    [JSON.stringify({ message: 'x'.repeat(33_000) }), 413],
  ])('does not cache JSON parser errors (%i)', async (body, expectedStatus) => {
    const response = await fetch(`${baseUrl}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    expect(response.status).toBe(expectedStatus);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });

  it('delivers an inquiry with escaped HTML and the supplied reply address', async () => {
    const response = await post(`${baseUrl}/api/send-email`, inquiry);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(mocks.sendMail).toHaveBeenCalledOnce();
    expect(mocks.sendMail.mock.calls[0][0]).toMatchObject({
      to: 'inquiries@example.com',
      replyTo: inquiry.email,
      html: expect.stringContaining('Acme &lt;Logistics&gt;'),
    });
  });

  it('returns an uncached JSON error for unknown API routes', async () => {
    const response = await fetch(`${baseUrl}/api/unknown`);
    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ error: 'Unknown API endpoint.' });
    expect(mocks.handle).not.toHaveBeenCalled();
  });

  it('rejects invalid input and silently accepts honeypots without sending mail', async () => {
    expect((await post(`${baseUrl}/api/send-email`, { ...inquiry, email: 'bad' })).status).toBe(
      400,
    );
    expect(
      (await post(`${baseUrl}/api/medical-authorization`, { website: 'bot.example' })).status,
    ).toBe(200);
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });

  it('limits the combined endpoints and returns an uncached retry response', async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const path = attempt % 2 ? 'send-email' : 'medical-authorization';
      expect((await post(`${baseUrl}/api/${path}`, { website: 'bot.example' })).status).toBe(200);
    }
    const response = await post(`${baseUrl}/api/send-email`, inquiry);
    expect(response.status).toBe(429);
    expect(Number(response.headers.get('retry-after'))).toBeGreaterThan(0);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });

  it('reports primary mail failure without exposing transport errors', async () => {
    mocks.sendMail.mockRejectedValueOnce(new Error('Private SMTP failure details'));
    const response = await post(`${baseUrl}/api/send-email`, inquiry);
    expect(response.status).toBe(500);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.text()).not.toContain('Private SMTP');
  });

  it('rejects unsupported medical selections before generating or delivering an authorization', async () => {
    const response = await post(`${baseUrl}/api/medical-authorization`, {
      ...authorization,
      dotDrugs: ['Rapid'],
    });
    expect(response.status).toBe(400);
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });

  it('delivers matching service summaries and the real filled PDF to staff and the representative', async () => {
    const response = await post(`${baseUrl}/api/medical-authorization`, authorization);
    expect(response.status).toBe(200);
    expect(mocks.sendMail).toHaveBeenCalledTimes(2);
    const primary = mocks.sendMail.mock.calls[0][0];
    const confirmation = mocks.sendMail.mock.calls[1][0];
    expect(primary.to).toBe('medical@example.com');
    expect(confirmation.to).toBe('hr@example.com');
    for (const message of [primary, confirmation]) {
      for (const selected of [
        'Pre-Placement Exam / Post-Offer Exam',
        'DOT / FMCSA Physical',
        'Recertification',
        'New Hire',
        '50 lbs',
        'Left wrist',
        'Rapid',
        'Expanded panel',
        'Follow-Up',
        'Observed BAT',
        'Return to Duty',
        'Panel note',
        'Post-Accident',
        'Fit Testing',
        'Quantiferon Gold',
        'Vision screening',
      ]) {
        expect(message.html).toContain(selected);
      }
    }
    expect(confirmation.attachments[0].content).toEqual(primary.attachments[0].content);
    const document = await PDFDocument.load(primary.attachments[0].content);
    const form = document.getForm();
    for (const field of [
      'physicalPreEmployment',
      'workInjuryTreatment',
      'consultCompensability',
      'liftTest',
      'schoolBusNewHire',
      'dotExamRecertification',
      'nonDotDrugRapid',
      'nonDotAlcoholFollowUp',
      'dotDrugReturnToDuty',
      'dotAlcoholPostAccident',
      'fitTesting',
      'quantiferonGold',
    ]) {
      expect(form.getCheckBox(field).isChecked(), field).toBe(true);
    }
    expect(form.getCheckBox('tbSkinTest').isChecked()).toBe(false);
    expect(form.getTextField('employeeName').getText()).toBe('Jane Doe');
  });

  it('keeps the successful primary submission when the confirmation email fails', async () => {
    mocks.sendMail
      .mockResolvedValueOnce({ messageId: 'primary' })
      .mockRejectedValueOnce(new Error('Confirmation unavailable'));
    expect((await post(`${baseUrl}/api/medical-authorization`, authorization)).status).toBe(200);
    expect(mocks.sendMail).toHaveBeenCalledTimes(2);
  });

  it('preserves HTML bytes, query parameters, fragments, and Content-Length', async () => {
    const html =
      '<html><a href="/for-patients?source=mail#faqs">FAQs</a><img src="/assets/logo.svg"></html>';
    mocks.handle.mockResolvedValue(
      new Response(html, {
        headers: { 'Content-Type': 'text/html', 'Content-Length': String(Buffer.byteLength(html)) },
      }),
    );
    const response = await fetch(baseUrl);
    expect(response.headers.get('cache-control')).toBe('no-cache');
    expect(Number(response.headers.get('content-length'))).toBe(Buffer.byteLength(html));
    expect(await response.text()).toBe(html);
  });
});
