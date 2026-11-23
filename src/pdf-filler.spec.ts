import { PDFCheckBox, PDFDocument, PDFTextField } from 'pdf-lib';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { MedicalAuthorizationSubmission } from './form-security';
import { NON_DOT_DRUG_SELECTIONS, SCREENING_REASONS, OTHER_SERVICES } from './form-security';
import {
  fillMedicalAuthPdf,
  MEDICAL_AUTH_CHECKBOX_FIELD_NAMES,
  MEDICAL_AUTH_TEXT_FIELD_NAMES,
} from './medical-authorization-pdf';

const submission: MedicalAuthorizationSubmission = {
  company: 'Acme Logistics',
  accountNumber: 'ACC-9982',
  contactName: 'John Smith',
  contactEmail: 'john.smith@example.com',
  contactPhone: '555-123-4567',
  resultEmail: 'results@example.com',
  authorizationExpires: '2026-12-31',
  employeeName: 'Jane Doe',
  employeeDob: '1990-03-14',
  employeePhone: '555-222-3333',
  employeeTitle: 'Warehouse Specialist',
  physicalExams: ['Pre-Placement Exam / Post-Offer Exam', 'DOT / FMCSA Physical'],
  physicalPreEmployment: true,
  workInjuryTreatment: true,
  consultCompensability: false,
  bodyPart: 'Lower Back',
  liftTest: true,
  liftTestWeight: '50 lbs',
  schoolBusDriver: true,
  schoolBusType: 'Annual',
  dotExam: true,
  dotExamType: 'New Certification',
  nonDotDrugs: ['Pre-Employment', 'Reasonable Suspicion', 'Rapid'],
  nonDotDrugOther: 'Expanded opiates',
  nonDotAlcohol: ['Follow-Up'],
  nonDotAlcoholOther: 'Observed BAT',
  dotDrugs: ['Post-Accident'],
  dotDrugOther: 'DOT panel note',
  dotAlcohol: ['Random'],
  otherServices: ['Fit Testing', 'Tuberculosis (TB) Skin Test'],
  otherServicesOther: 'Vision screening',
  injuryCare: false,
  injuryDate: '',
  notes: '',
  signatureName: 'John Smith',
  signatureDate: '2026-08-06',
  consent: true,
};

function fieldPosition(index: number): { x: number; y: number } {
  const columns = 6;
  return {
    x: 12 + (index % columns) * 98,
    y: 768 - Math.floor(index / columns) * 72,
  };
}

async function createMedicalAuthTemplate(): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  const page = document.addPage([612, 792]);
  const form = document.getForm();

  MEDICAL_AUTH_TEXT_FIELD_NAMES.forEach((name, index) => {
    const field = form.createTextField(name);
    const position = fieldPosition(index);
    field.addToPage(page, { ...position, width: 84, height: 18, borderWidth: 0 });
  });

  MEDICAL_AUTH_CHECKBOX_FIELD_NAMES.forEach((name, index) => {
    const field = form.createCheckBox(name);
    const position = fieldPosition(index + MEDICAL_AUTH_TEXT_FIELD_NAMES.length);
    field.addToPage(page, { ...position, width: 12, height: 12, borderWidth: 0 });
  });

  return document.save();
}

describe('fillMedicalAuthPdf', () => {
  it('fills the committed template with every current service, subtype, and Other field', async () => {
    const template = readFileSync(
      join(process.cwd(), 'public/assets/Medical_Authorization_Form.pdf'),
    );
    const output = await fillMedicalAuthPdf(new Uint8Array(template), {
      ...submission,
      consultCompensability: true,
      nonDotDrugs: [...NON_DOT_DRUG_SELECTIONS],
      nonDotAlcohol: [...SCREENING_REASONS],
      dotDrugs: [...SCREENING_REASONS],
      dotAlcohol: [...SCREENING_REASONS],
      otherServices: [...OTHER_SERVICES],
      notes: 'Also preserve these instructions.',
    });
    const document = await PDFDocument.load(output);
    const form = document.getForm();
    expect(document.getPageCount()).toBe(1);
    expect(form.getFields()).toHaveLength(57);
    for (const fieldName of MEDICAL_AUTH_CHECKBOX_FIELD_NAMES) {
      expect(form.getCheckBox(fieldName).isChecked(), fieldName).toBe(
        !['schoolBusNewHire', 'dotExamRecertification'].includes(fieldName),
      );
    }
    expect(form.getTextField('employeeName').getText()).toBe(submission.employeeName);
    expect(form.getTextField('authorizationDate').getText()).toBe(submission.signatureDate);
    expect(form.getTextField('otherServicesOtherText').getText()).toBe(
      'Vision screening; Also preserve these instructions.',
    );
  });

  it('does not authorize a lift test merely because stale weight text exists', async () => {
    const output = await fillMedicalAuthPdf(await createMedicalAuthTemplate(), {
      ...submission,
      liftTest: false,
    });
    const document = await PDFDocument.load(output);
    expect(document.getForm().getCheckBox('liftTest').isChecked()).toBe(false);
  });

  it('fills the typed AcroForm fields while keeping the PDF interactive', async () => {
    const template = await createMedicalAuthTemplate();
    const output = await fillMedicalAuthPdf(template, submission);
    const document = await PDFDocument.load(output);
    const form = document.getForm();
    const fields = form.getFields();

    expect(fields).toHaveLength(57);
    expect(fields.filter((field) => field instanceof PDFTextField)).toHaveLength(14);
    expect(fields.filter((field) => field instanceof PDFCheckBox)).toHaveLength(43);

    expect(form.getTextField('employeeName').getText()).toBe('Jane Doe');
    expect(form.getTextField('authorizedBy').getText()).toBe('John Smith');
    expect(form.getTextField('liftTestWeight').getText()).toBe('50 lbs');
    expect(form.getTextField('nonDotDrugOtherText').getText()).toBe('Expanded opiates');

    expect(form.getCheckBox('workInjuryTreatment').isChecked()).toBe(true);
    expect(form.getCheckBox('consultCompensability').isChecked()).toBe(false);
    expect(form.getCheckBox('liftTest').isChecked()).toBe(true);
    expect(form.getCheckBox('schoolBusAnnual').isChecked()).toBe(true);
    expect(form.getCheckBox('schoolBusNewHire').isChecked()).toBe(false);
    expect(form.getCheckBox('dotExamNewCertification').isChecked()).toBe(true);
    expect(form.getCheckBox('nonDotDrugOtherSelected').isChecked()).toBe(true);
    expect(form.getCheckBox('dotAlcoholRandom').isChecked()).toBe(true);
    expect(form.getCheckBox('fitTesting').isChecked()).toBe(true);
  });
});
