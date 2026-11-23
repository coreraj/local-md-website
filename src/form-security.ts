import type { Request, RequestHandler } from 'express';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9\s\-()]+$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

export const PHYSICAL_EXAMS = new Set([
  'Pre-Placement Exam / Post-Offer Exam',
  'Pre-Employment Physical',
  'DOT / FMCSA Physical',
]);

export const SCREENING_REASONS = new Set([
  'Pre-Employment',
  'Random',
  'Follow-Up',
  'Reasonable Suspicion',
  'Return to Duty',
  'Post-Accident',
]);

export const NON_DOT_DRUG_SELECTIONS = new Set([
  ...SCREENING_REASONS,
  'Hair Follicle Drug',
  'Rapid',
]);

export const OTHER_SERVICES = new Set([
  'Fit Testing',
  'Quantiferon Gold',
  'Tuberculosis (TB) Skin Test',
]);
const SCHOOL_BUS_TYPES = new Set(['Annual', 'New Hire']);
const DOT_EXAM_TYPES = new Set(['New Certification', 'Recertification']);

export interface InquirySubmission {
  company: string;
  contactName: string;
  email: string;
  phone: string;
  message: string;
}

export interface MedicalAuthorizationSubmission {
  company: string;
  accountNumber: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  resultEmail: string;
  authorizationExpires: string;
  employeeName: string;
  employeeDob: string;
  employeePhone: string;
  employeeTitle: string;
  physicalExams: string[];
  physicalPreEmployment: boolean;
  workInjuryTreatment: boolean;
  consultCompensability: boolean;
  bodyPart: string;
  liftTest: boolean;
  liftTestWeight: string;
  schoolBusDriver: boolean;
  schoolBusType: string;
  dotExam: boolean;
  dotExamType: string;
  nonDotDrugs: string[];
  nonDotDrugOther: string;
  nonDotAlcohol: string[];
  nonDotAlcoholOther: string;
  dotDrugs: string[];
  dotDrugOther: string;
  dotAlcohol: string[];
  otherServices: string[];
  otherServicesOther: string;
  injuryCare: boolean;
  injuryDate: string;
  notes: string;
  signatureName: string;
  signatureDate: string;
  consent: true;
}

export type FormValidationResult<T> =
  { status: 'valid'; data: T } | { status: 'bot' } | { status: 'invalid'; error: string };

interface StringRules {
  label: string;
  required?: boolean;
  minLength?: number;
  maxLength: number;
  multiline?: boolean;
  pattern?: RegExp;
}

class FormValidationError extends Error {}

function readObject(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new FormValidationError('The submission body must be a JSON object.');
  }
  return input as Record<string, unknown>;
}

function assertOnlyFields(
  record: Record<string, unknown>,
  allowedFields: ReadonlySet<string>,
): void {
  const unknownField = Object.keys(record).find((key) => !allowedFields.has(key));
  if (unknownField) {
    throw new FormValidationError('The submission contains unsupported fields.');
  }
}

function readString(record: Record<string, unknown>, key: string, rules: StringRules): string {
  const rawValue = record[key];
  if (rawValue === undefined && !rules.required) return '';
  if (typeof rawValue !== 'string') {
    throw new FormValidationError(`${rules.label} must be text.`);
  }

  const value = rawValue.replace(/\r\n?/g, '\n').trim();
  if (CONTROL_CHARACTER_PATTERN.test(value)) {
    throw new FormValidationError(`${rules.label} contains unsupported characters.`);
  }
  if (!rules.multiline && value.includes('\n')) {
    throw new FormValidationError(`${rules.label} must be on one line.`);
  }
  if (rules.required && value.length === 0) {
    throw new FormValidationError(`${rules.label} is required.`);
  }
  if (value.length > 0 && rules.minLength !== undefined && value.length < rules.minLength) {
    throw new FormValidationError(`${rules.label} must be at least ${rules.minLength} characters.`);
  }
  if (value.length > rules.maxLength) {
    throw new FormValidationError(`${rules.label} must be ${rules.maxLength} characters or fewer.`);
  }
  if (value && rules.pattern && !rules.pattern.test(value)) {
    throw new FormValidationError(`${rules.label} has an invalid format.`);
  }
  return value;
}

function readBoolean(record: Record<string, unknown>, key: string, label: string): boolean {
  const value = record[key];
  if (value === undefined) return false;
  if (typeof value !== 'boolean') {
    throw new FormValidationError(`${label} must be true or false.`);
  }
  return value;
}

function readStringArray(
  record: Record<string, unknown>,
  key: string,
  label: string,
  allowedValues: ReadonlySet<string>,
): string[] {
  const value = record[key];
  if (value === undefined) return [];
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new FormValidationError(`${label} must be a list.`);
  }
  if (value.length > allowedValues.size || value.some((item) => !allowedValues.has(item))) {
    throw new FormValidationError(`${label} contains an unsupported selection.`);
  }
  return [...new Set(value)];
}

function readExamType(
  record: Record<string, unknown>,
  key: string,
  label: string,
  selected: boolean,
  allowedValues: ReadonlySet<string>,
): string {
  const value = readString(record, key, { label, required: selected, maxLength: 50 });
  if (value && !allowedValues.has(value)) {
    throw new FormValidationError(`${label} contains an unsupported selection.`);
  }
  return selected ? value : '';
}

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function hasFilledHoneypot(record: Record<string, unknown>): boolean {
  return typeof record['website'] === 'string' && record['website'].trim().length > 0;
}

export function validateInquirySubmission(input: unknown): FormValidationResult<InquirySubmission> {
  try {
    const record = readObject(input);
    if (hasFilledHoneypot(record)) return { status: 'bot' };

    assertOnlyFields(
      record,
      new Set(['company', 'contactName', 'email', 'phone', 'message', 'website']),
    );

    const data: InquirySubmission = {
      company: readString(record, 'company', {
        label: 'Company name',
        required: true,
        minLength: 2,
        maxLength: 100,
      }),
      contactName: readString(record, 'contactName', {
        label: 'Contact name',
        required: true,
        minLength: 2,
        maxLength: 100,
      }),
      email: readString(record, 'email', {
        label: 'Email address',
        required: true,
        minLength: 5,
        maxLength: 100,
        pattern: EMAIL_PATTERN,
      }),
      phone: readString(record, 'phone', {
        label: 'Phone number',
        required: true,
        minLength: 7,
        maxLength: 20,
        pattern: PHONE_PATTERN,
      }),
      message: readString(record, 'message', {
        label: 'Message',
        required: true,
        minLength: 10,
        maxLength: 2000,
        multiline: true,
      }),
    };
    return { status: 'valid', data };
  } catch (error: unknown) {
    return {
      status: 'invalid',
      error: error instanceof FormValidationError ? error.message : 'Invalid inquiry submission.',
    };
  }
}

export function validateMedicalAuthorizationSubmission(
  input: unknown,
): FormValidationResult<MedicalAuthorizationSubmission> {
  try {
    const record = readObject(input);
    if (hasFilledHoneypot(record)) return { status: 'bot' };

    // Deprecated drugScreenings, testingReason, and vaccinations fields are deliberately excluded.
    // Their old conversions could authorize a different service from the one requested.
    assertOnlyFields(
      record,
      new Set([
        'company',
        'accountNumber',
        'contactName',
        'contactEmail',
        'contactPhone',
        'resultEmail',
        'authorizationExpires',
        'employeeName',
        'employeeDob',
        'employeePhone',
        'employeeTitle',
        'physicalExams',
        'physicalPreEmployment',
        'workInjuryTreatment',
        'consultCompensability',
        'bodyPart',
        'liftTest',
        'liftTestWeight',
        'schoolBusDriver',
        'schoolBusType',
        'dotExam',
        'dotExamType',
        'nonDotDrugs',
        'nonDotDrugOther',
        'nonDotAlcohol',
        'nonDotAlcoholOther',
        'dotDrugs',
        'dotDrugOther',
        'dotAlcohol',
        'otherServices',
        'otherServicesOther',
        'injuryCare',
        'injuryDate',
        'notes',
        'signatureName',
        'signatureDate',
        'consent',
        'website',
      ]),
    );

    const contactEmail = readString(record, 'contactEmail', {
      label: 'Contact email',
      required: true,
      minLength: 5,
      maxLength: 100,
      pattern: EMAIL_PATTERN,
    });
    const resultEmail = readString(record, 'resultEmail', {
      label: 'Results email',
      maxLength: 100,
      pattern: EMAIL_PATTERN,
    });
    const employeeDob = readString(record, 'employeeDob', {
      label: 'Employee date of birth',
      maxLength: 10,
      pattern: ISO_DATE_PATTERN,
    });
    const employeeTitle = readString(record, 'employeeTitle', {
      label: 'Employee job title',
      maxLength: 100,
    });
    const injuryCare = readBoolean(record, 'injuryCare', 'Injury care');
    const injuryDate = readString(record, 'injuryDate', {
      label: 'Injury date',
      required: injuryCare,
      maxLength: 10,
      pattern: ISO_DATE_PATTERN,
    });
    const signatureDate = readString(record, 'signatureDate', {
      label: 'Signature date',
      required: true,
      maxLength: 10,
      pattern: ISO_DATE_PATTERN,
    });
    if (
      (employeeDob && !isValidIsoDate(employeeDob)) ||
      (injuryDate && !isValidIsoDate(injuryDate))
    ) {
      throw new FormValidationError('One or more submitted dates are invalid.');
    }
    if (!isValidIsoDate(signatureDate)) {
      throw new FormValidationError('Signature date is invalid.');
    }
    if (record['consent'] !== true) {
      throw new FormValidationError('Electronic signature consent is required.');
    }

    // Keep the legacy physical labels and boolean flags that map to the same exams.
    // Normalize them here so email summaries and the PDF use the same canonical selections.
    let physicalPreEmployment = readBoolean(
      record,
      'physicalPreEmployment',
      'Physical pre-employment',
    );
    const requestedPhysicals = readStringArray(
      record,
      'physicalExams',
      'Physical exams',
      PHYSICAL_EXAMS,
    );
    physicalPreEmployment ||= requestedPhysicals.some(
      (exam) =>
        exam === 'Pre-Employment Physical' || exam === 'Pre-Placement Exam / Post-Offer Exam',
    );
    const dotExam =
      readBoolean(record, 'dotExam', 'DOT exam') ||
      requestedPhysicals.includes('DOT / FMCSA Physical');
    const schoolBusDriver = readBoolean(record, 'schoolBusDriver', 'School bus driver');
    const physicalExams = [
      ...(physicalPreEmployment ? ['Pre-Placement Exam / Post-Offer Exam'] : []),
      ...(dotExam ? ['DOT / FMCSA Physical'] : []),
    ];

    const nonDotDrugs = readStringArray(
      record,
      'nonDotDrugs',
      'Non-DOT drug screenings',
      NON_DOT_DRUG_SELECTIONS,
    );
    const nonDotAlcohol = readStringArray(
      record,
      'nonDotAlcohol',
      'Non-DOT alcohol screenings',
      SCREENING_REASONS,
    );
    const dotDrugs = readStringArray(record, 'dotDrugs', 'DOT drug screenings', SCREENING_REASONS);
    const dotAlcohol = readStringArray(
      record,
      'dotAlcohol',
      'DOT alcohol screenings',
      SCREENING_REASONS,
    );
    const otherServices = readStringArray(
      record,
      'otherServices',
      'Other services',
      OTHER_SERVICES,
    );

    const data: MedicalAuthorizationSubmission = {
      company: readString(record, 'company', {
        label: 'Company name',
        required: true,
        minLength: 2,
        maxLength: 100,
      }),
      accountNumber: readString(record, 'accountNumber', {
        label: 'Account number',
        maxLength: 100,
      }),
      contactName: readString(record, 'contactName', {
        label: 'Contact name',
        required: true,
        minLength: 2,
        maxLength: 100,
      }),
      contactEmail,
      contactPhone: readString(record, 'contactPhone', {
        label: 'Contact phone',
        required: true,
        minLength: 7,
        maxLength: 20,
        pattern: PHONE_PATTERN,
      }),
      resultEmail: resultEmail || contactEmail,
      authorizationExpires: readString(record, 'authorizationExpires', {
        label: 'Authorization expires',
        maxLength: 50,
      }),
      employeeName: readString(record, 'employeeName', {
        label: 'Employee name',
        required: true,
        minLength: 2,
        maxLength: 100,
      }),
      employeeDob,
      employeePhone: readString(record, 'employeePhone', {
        label: 'Employee phone',
        maxLength: 20,
        pattern: PHONE_PATTERN,
      }),
      employeeTitle,
      physicalExams,
      physicalPreEmployment,
      workInjuryTreatment: readBoolean(record, 'workInjuryTreatment', 'Work injury treatment'),
      consultCompensability: readBoolean(record, 'consultCompensability', 'Consult compensability'),
      bodyPart: readString(record, 'bodyPart', { label: 'Body part', maxLength: 200 }),
      liftTest: readBoolean(record, 'liftTest', 'Lift test'),
      liftTestWeight: readString(record, 'liftTestWeight', {
        label: 'Lift test weight',
        maxLength: 50,
      }),
      schoolBusDriver,
      schoolBusType: readExamType(
        record,
        'schoolBusType',
        'School bus type',
        schoolBusDriver,
        SCHOOL_BUS_TYPES,
      ),
      dotExam,
      dotExamType: readExamType(record, 'dotExamType', 'DOT exam type', dotExam, DOT_EXAM_TYPES),
      nonDotDrugs,
      nonDotDrugOther: readString(record, 'nonDotDrugOther', {
        label: 'Non-DOT drug other',
        maxLength: 200,
      }),
      nonDotAlcohol,
      nonDotAlcoholOther: readString(record, 'nonDotAlcoholOther', {
        label: 'Non-DOT alcohol other',
        maxLength: 200,
      }),
      dotDrugs,
      dotDrugOther: readString(record, 'dotDrugOther', { label: 'DOT drug other', maxLength: 200 }),
      dotAlcohol,
      otherServices,
      otherServicesOther: readString(record, 'otherServicesOther', {
        label: 'Other services other',
        maxLength: 200,
      }),
      injuryCare,
      injuryDate,
      notes: readString(record, 'notes', {
        label: 'Notes',
        maxLength: 2000,
        multiline: true,
      }),
      signatureName: readString(record, 'signatureName', {
        label: 'Signature name',
        required: true,
        minLength: 2,
        maxLength: 100,
      }),
      signatureDate,
      consent: true,
    };

    return { status: 'valid', data };
  } catch (error: unknown) {
    return {
      status: 'invalid',
      error:
        error instanceof FormValidationError
          ? error.message
          : 'Invalid medical authorization submission.',
    };
  }
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function safeHeaderValue(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

function getRateLimitClientIp(request: Request): string {
  // Express resolves forwarded addresses only through the configured trusted proxy chain.
  return request.ip || request.socket.remoteAddress || 'unknown';
}

export function createSubmissionRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
}): RequestHandler {
  const clients = new Map<string, { count: number; resetAt: number }>();
  let lastCleanup = Date.now();

  return (request, response, next) => {
    const now = Date.now();
    if (now - lastCleanup >= options.windowMs) {
      for (const [key, entry] of clients.entries()) {
        if (entry.resetAt <= now) clients.delete(key);
      }
      lastCleanup = now;
    }

    const key = getRateLimitClientIp(request);
    const previous = clients.get(key);
    const entry =
      previous && previous.resetAt > now ? previous : { count: 0, resetAt: now + options.windowMs };
    entry.count += 1;
    clients.set(key, entry);

    const remaining = Math.max(0, options.maxRequests - entry.count);
    const resetSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    response.setHeader('RateLimit-Limit', String(options.maxRequests));
    response.setHeader('RateLimit-Remaining', String(remaining));
    response.setHeader('RateLimit-Reset', String(resetSeconds));

    if (entry.count > options.maxRequests) {
      response.setHeader('Retry-After', String(resetSeconds));
      response.status(429).json({
        error: 'Too many submission attempts. Please wait before trying again.',
      });
      return;
    }

    next();
  };
}
