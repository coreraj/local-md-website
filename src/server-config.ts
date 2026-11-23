type RuntimeEnvironment = Record<string, string | undefined>;

export function requireEnvironment(
  name: string,
  environment: RuntimeEnvironment = process.env,
): string {
  const value = environment[name]?.trim();
  if (!value) {
    throw new Error(`Required mail configuration is missing: ${name}`);
  }
  return value;
}

export function readTrustProxyHops(environment: RuntimeEnvironment = process.env): number {
  const value = environment['TRUST_PROXY_HOPS']?.trim() || '0';
  const hops = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(hops)) {
    throw new Error('TRUST_PROXY_HOPS must be a non-negative integer.');
  }
  return hops;
}

export function readMailConfiguration(environment: RuntimeEnvironment = process.env) {
  const portValue = requireEnvironment('SMTP_PORT', environment);
  const port = Number(portValue);
  if (!/^\d+$/.test(portValue) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('SMTP_PORT must be an integer between 1 and 65535.');
  }

  const secureValue = environment['SMTP_SECURE']?.trim() || 'false';
  if (secureValue !== 'true' && secureValue !== 'false') {
    throw new Error('SMTP_SECURE must be true or false.');
  }

  return {
    host: requireEnvironment('SMTP_HOST', environment),
    port,
    secure: secureValue === 'true',
    user: requireEnvironment('SMTP_USER', environment),
    pass: requireEnvironment('SMTP_PASS', environment),
    from: requireEnvironment('SMTP_FROM', environment),
  };
}
