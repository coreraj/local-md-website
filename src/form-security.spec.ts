import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import {
  createSubmissionRateLimiter,
  NON_DOT_DRUG_SELECTIONS,
  OTHER_SERVICES,
  PHYSICAL_EXAMS,
  SCREENING_REASONS,
  validateMedicalAuthorizationSubmission,
} from './form-security';

describe('validateMedicalAuthorizationSubmission', () => {
  const requiredPayload = {
    employeeName: 'Jane Doe',
    signatureDate: '2026-09-30',
    company: 'Acme Logistics',
    contactPhone: '555-123-4567',
    contactName: 'John Smith',
    contactEmail: 'hr@example.com',
    signatureName: 'John Smith',
    consent: true,
  };

  it.each([
    ['physicalExams', PHYSICAL_EXAMS],
    ['nonDotDrugs', NON_DOT_DRUG_SELECTIONS],
    ['nonDotAlcohol', SCREENING_REASONS],
    ['dotDrugs', SCREENING_REASONS],
    ['dotAlcohol', SCREENING_REASONS],
    ['otherServices', OTHER_SERVICES],
  ] as const)('accepts approved selections and rejects unknown values in %s', (field, values) => {
    expect(
      validateMedicalAuthorizationSubmission({
        ...requiredPayload,
        [field]: [...values],
        dotExamType: 'Recertification',
      }).status,
    ).toBe('valid');
    expect(
      validateMedicalAuthorizationSubmission({
        ...requiredPayload,
        [field]: ['Unrecognized Service'],
      }).status,
    ).toBe('invalid');
    expect(
      validateMedicalAuthorizationSubmission({ ...requiredPayload, [field]: 'Random' }).status,
    ).toBe('invalid');
  });

  it.each([
    ['schoolBusDriver', 'schoolBusType', 'Annual', 'New Hire'],
    ['dotExam', 'dotExamType', 'New Certification', 'Recertification'],
  ])(
    'requires an approved subtype for %s and clears stale subtypes',
    (flag, field, first, second) => {
      for (const selection of [first, second]) {
        expect(
          validateMedicalAuthorizationSubmission({
            ...requiredPayload,
            [flag]: true,
            [field]: selection,
          }).status,
        ).toBe('valid');
      }
      for (const selection of ['', 'Unrecognized Type']) {
        expect(
          validateMedicalAuthorizationSubmission({
            ...requiredPayload,
            [flag]: true,
            [field]: selection,
          }).status,
        ).toBe('invalid');
      }
      const result = validateMedicalAuthorizationSubmission({
        ...requiredPayload,
        [flag]: false,
        [field]: first,
      });
      expect(result.status).toBe('valid');
      if (result.status === 'valid')
        expect(result.data[field as 'dotExamType' | 'schoolBusType']).toBe('');
    },
  );

  it('normalizes accurate physical aliases and modern flags into the same exam list', () => {
    const result = validateMedicalAuthorizationSubmission({
      ...requiredPayload,
      physicalExams: ['Pre-Employment Physical', 'DOT / FMCSA Physical'],
      dotExamType: 'Recertification',
    });
    expect(result.status).toBe('valid');
    if (result.status === 'valid') {
      expect(result.data.physicalPreEmployment).toBe(true);
      expect(result.data.dotExam).toBe(true);
      expect(result.data.physicalExams).toEqual([
        'Pre-Placement Exam / Post-Offer Exam',
        'DOT / FMCSA Physical',
      ]);
    }
  });

  it.each([
    { vaccinations: ['Hepatitis B Series / Titer'] },
    { vaccinations: ['TB Skin Test / QuantiFERON'] },
    { drugScreenings: ['5-Panel Drug Screen'] },
    { testingReason: 'Pre-Employment' },
    { physicalExams: ['Annual / Periodic Physical'] },
  ])('rejects legacy requests that cannot be represented accurately: %j', (legacy) => {
    expect(validateMedicalAuthorizationSubmission({ ...requiredPayload, ...legacy }).status).toBe(
      'invalid',
    );
  });

  it('does not add an exam or drug testing reason when none was selected', () => {
    const result = validateMedicalAuthorizationSubmission(requiredPayload);
    expect(result.status).toBe('valid');
    if (result.status === 'valid') {
      expect(result.data.physicalExams).toEqual([]);
      expect(result.data.nonDotDrugs).toEqual([]);
      expect(result.data.otherServices).toEqual([]);
    }
  });

  it.each(['2026-02-30', 'not-a-date', ''])(
    'rejects an invalid signature date: %s',
    (signatureDate) => {
      expect(
        validateMedicalAuthorizationSubmission({ ...requiredPayload, signatureDate }).status,
      ).toBe('invalid');
    },
  );

  it('should successfully validate payload containing physicalPreEmployment', () => {
    const payload = {
      employeeName: 'Jane Doe',
      signatureDate: '2026-08-04',
      company: 'Acme Logistics',
      accountNumber: 'ACC-9982',
      contactPhone: '555-123-4567',
      contactName: 'John Smith',
      authorizationExpires: '',
      contactEmail: 'hr@example.com',
      workInjuryTreatment: true,
      consultCompensability: false,
      bodyPart: 'Lower Back',
      physicalPreEmployment: true,
      employeeTitle: 'Warehouse Specialist',
      liftTest: true,
      liftTestWeight: '50 lbs',
      schoolBusDriver: false,
      schoolBusType: '',
      dotExam: false,
      dotExamType: '',
      nonDotDrugs: ['Pre-Employment', 'Reasonable Suspicion'],
      nonDotDrugOther: '',
      nonDotAlcohol: ['Follow-Up'],
      nonDotAlcoholOther: '',
      dotDrugs: ['Follow-Up'],
      dotDrugOther: '',
      dotAlcohol: ['Random'],
      otherServices: ['Tuberculosis (TB) Skin Test'],
      otherServicesOther: '',
      signatureName: 'John Smith',
      consent: true,
      website: '',
    };

    const result = validateMedicalAuthorizationSubmission(payload);
    expect(result.status).toBe('valid');
    if (result.status === 'valid') {
      expect(result.data.employeeName).toBe('Jane Doe');
      expect(result.data.company).toBe('Acme Logistics');
      expect(result.data.physicalPreEmployment).toBe(true);
      expect(result.data.physicalExams).toContain('Pre-Placement Exam / Post-Offer Exam');
      expect(result.data.liftTest).toBe(true);
    }
  });

  it('should reject submissions with actual unknown fields', () => {
    const payload = {
      employeeName: 'Jane Doe',
      signatureDate: '2026-08-04',
      company: 'Acme Logistics',
      contactPhone: '555-123-4567',
      contactName: 'John Smith',
      contactEmail: 'hr@example.com',
      signatureName: 'John Smith',
      consent: true,
      unknownFieldXYZ: 'invalid',
    };

    const result = validateMedicalAuthorizationSubmission(payload);
    expect(result.status).toBe('invalid');
    if (result.status === 'invalid') {
      expect(result.error).toBe('The submission contains unsupported fields.');
    }
  });
});

describe('provider-neutral rate limit client identification', () => {
  function createResponse() {
    const response = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    return response;
  }

  it('does not let custom visitor headers bypass the resolved client limit', () => {
    const limiter = createSubmissionRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 5 });
    const response = createResponse();
    const next = vi.fn();

    for (let attempt = 0; attempt < 6; attempt++) {
      const request = {
        ip: '192.0.2.1',
        headers: {
          'cf-connecting-ip': `192.0.2.${attempt + 2}`,
          'cf-connecting-ipv6': `2001:db8::${attempt + 1}`,
          'x-forwarded-for': `192.0.2.${attempt + 2}`,
        },
        socket: { remoteAddress: '192.0.2.1' },
      } as unknown as Request;
      limiter(request, response as unknown as Response, next);
    }

    expect(next).toHaveBeenCalledTimes(5);
    expect(response.status).toHaveBeenCalledWith(429);
  });

  it('counts distinct Express-resolved clients separately behind the same proxy', () => {
    const limiter = createSubmissionRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 1 });
    const response = createResponse();
    const next = vi.fn();

    for (const ip of ['192.0.2.1', '192.0.2.2']) {
      const request = { ip, socket: { remoteAddress: '192.0.2.3' } } as unknown as Request;
      limiter(request, response as unknown as Response, next);
    }

    expect(next).toHaveBeenCalledTimes(2);
    expect(response.status).not.toHaveBeenCalled();
  });
});
