import { describe, expect, it } from 'vitest';
import { readMailConfiguration, readTrustProxyHops, requireEnvironment } from './server-config';

const mailEnvironment = {
  SMTP_HOST: 'smtp.example.com',
  SMTP_PORT: '587',
  SMTP_USER: 'test-user',
  SMTP_PASS: 'test-password',
  SMTP_FROM: 'website@example.com',
};

describe('portable server configuration', () => {
  it('uses the configured SMTP provider and defaults to STARTTLS mode', () => {
    expect(readMailConfiguration(mailEnvironment)).toEqual({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      user: 'test-user',
      pass: 'test-password',
      from: 'website@example.com',
    });
  });

  it('supports an implicit TLS provider', () => {
    const configuration = readMailConfiguration({
      ...mailEnvironment,
      SMTP_PORT: '465',
      SMTP_SECURE: 'true',
    });
    expect(configuration.port).toBe(465);
    expect(configuration.secure).toBe(true);
  });

  it.each(['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'])(
    'requires %s instead of falling back to the previous provider',
    (name) => {
      expect(() => readMailConfiguration({ ...mailEnvironment, [name]: '' })).toThrow(name);
    },
  );

  it.each(['0', '65536', '587x', '1.5'])('rejects invalid SMTP port %s', (SMTP_PORT) => {
    expect(() => readMailConfiguration({ ...mailEnvironment, SMTP_PORT })).toThrow('SMTP_PORT');
  });

  it('rejects ambiguous TLS settings', () => {
    expect(() => readMailConfiguration({ ...mailEnvironment, SMTP_SECURE: 'yes' })).toThrow(
      'SMTP_SECURE',
    );
  });

  it('requires a medical recipient independently of the inquiry mailbox', () => {
    expect(() =>
      requireEnvironment('MED_AUTH_RECIPIENT', { SMTP_RECIPIENT: 'inquiry@example.com' }),
    ).toThrow('MED_AUTH_RECIPIENT');
  });

  it('does not trust forwarded addresses by default and accepts an explicit hop count', () => {
    expect(readTrustProxyHops({})).toBe(0);
    expect(readTrustProxyHops({ TRUST_PROXY_HOPS: '2' })).toBe(2);
  });

  it.each(['-1', '1.5', '1extra', 'true', '9007199254740992'])(
    'rejects invalid trusted proxy count %s',
    (TRUST_PROXY_HOPS) => {
      expect(() => readTrustProxyHops({ TRUST_PROXY_HOPS })).toThrow('TRUST_PROXY_HOPS');
    },
  );
});
