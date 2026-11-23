import { PDFDocument, type PDFForm } from 'pdf-lib';
import type { MedicalAuthorizationSubmission } from './form-security';

// Keep these names and field types aligned with public/assets/Medical_Authorization_Form.pdf.
export const MEDICAL_AUTH_TEXT_FIELD_NAMES = [
  'employeeName',
  'authorizationDate',
  'company',
  'accountNumber',
  'contactPhone',
  'authorizedBy',
  'authorizationExpires',
  'bodyPart',
  'employeeTitle',
  'liftTestWeight',
  'nonDotDrugOtherText',
  'nonDotAlcoholOtherText',
  'dotDrugOtherText',
  'otherServicesOtherText',
] as const;

export const MEDICAL_AUTH_CHECKBOX_FIELD_NAMES = [
  'workInjuryTreatment',
  'consultCompensability',
  'physicalPreEmployment',
  'liftTest',
  'schoolBusDriver',
  'schoolBusAnnual',
  'schoolBusNewHire',
  'dotExam',
  'dotExamNewCertification',
  'dotExamRecertification',
  'nonDotDrugPreEmployment',
  'nonDotDrugRandom',
  'nonDotDrugFollowUp',
  'nonDotDrugReasonableSuspicion',
  'nonDotDrugReturnToDuty',
  'nonDotDrugPostAccident',
  'nonDotDrugHairFollicle',
  'nonDotDrugRapid',
  'nonDotDrugOtherSelected',
  'nonDotAlcoholPreEmployment',
  'nonDotAlcoholRandom',
  'nonDotAlcoholFollowUp',
  'nonDotAlcoholReasonableSuspicion',
  'nonDotAlcoholReturnToDuty',
  'nonDotAlcoholPostAccident',
  'nonDotAlcoholOtherSelected',
  'dotDrugPreEmployment',
  'dotDrugRandom',
  'dotDrugFollowUp',
  'dotDrugReasonableSuspicion',
  'dotDrugReturnToDuty',
  'dotDrugPostAccident',
  'dotDrugOtherSelected',
  'dotAlcoholPreEmployment',
  'dotAlcoholRandom',
  'dotAlcoholFollowUp',
  'dotAlcoholReasonableSuspicion',
  'dotAlcoholReturnToDuty',
  'dotAlcoholPostAccident',
  'fitTesting',
  'quantiferonGold',
  'tbSkinTest',
  'otherServicesOtherSelected',
] as const;

function setText(form: PDFForm, name: string, value: string): void {
  form.getTextField(name).setText(value);
}

function setChecked(form: PDFForm, name: string, checked: boolean): void {
  const field = form.getCheckBox(name);
  if (checked) {
    field.check();
  } else {
    field.uncheck();
  }

  // Preserve the template's borderless appearances so they align with the printed boxes.
  form.markFieldAsClean(field.ref);
}

function hasSelection(values: readonly string[], selection: string): boolean {
  return values.includes(selection);
}

export async function fillMedicalAuthPdf(
  templateBytes: Uint8Array | ArrayBuffer,
  submission: MedicalAuthorizationSubmission,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  // The template's authorizedBy field uses contactName. authorizationDate uses signatureDate below.
  const authorizedBy = submission.contactName;
  // There is no separate injury-date field in the template. Keep it alongside the body-part text.
  const bodyPart = [
    submission.injuryDate ? `Injury Date: ${submission.injuryDate}` : '',
    submission.bodyPart,
  ]
    .filter(Boolean)
    .join(' - ');
  // Other-service text and notes share one PDF field. Keep both so neither is lost.
  const otherServiceText = [submission.otherServicesOther, submission.notes]
    .filter(Boolean)
    .join('; ');

  setText(form, 'employeeName', submission.employeeName);
  setText(form, 'authorizationDate', submission.signatureDate);
  setText(form, 'company', submission.company);
  setText(form, 'accountNumber', submission.accountNumber);
  setText(form, 'contactPhone', submission.contactPhone);
  setText(form, 'authorizedBy', authorizedBy);
  setText(form, 'authorizationExpires', submission.authorizationExpires);
  setText(form, 'bodyPart', bodyPart);
  setText(form, 'employeeTitle', submission.employeeTitle);
  setText(form, 'liftTestWeight', submission.liftTestWeight);
  setText(form, 'nonDotDrugOtherText', submission.nonDotDrugOther);
  setText(form, 'nonDotAlcoholOtherText', submission.nonDotAlcoholOther);
  setText(form, 'dotDrugOtherText', submission.dotDrugOther);
  setText(form, 'otherServicesOtherText', otherServiceText);

  setChecked(form, 'workInjuryTreatment', submission.workInjuryTreatment || submission.injuryCare);
  setChecked(form, 'consultCompensability', submission.consultCompensability);
  setChecked(
    form,
    'physicalPreEmployment',
    submission.physicalPreEmployment ||
      hasSelection(submission.physicalExams, 'Pre-Placement Exam / Post-Offer Exam') ||
      hasSelection(submission.physicalExams, 'Pre-Employment Physical'),
  );
  setChecked(form, 'liftTest', submission.liftTest);
  setChecked(form, 'schoolBusDriver', submission.schoolBusDriver);
  setChecked(
    form,
    'schoolBusAnnual',
    submission.schoolBusDriver && submission.schoolBusType === 'Annual',
  );
  setChecked(
    form,
    'schoolBusNewHire',
    submission.schoolBusDriver && submission.schoolBusType === 'New Hire',
  );
  setChecked(
    form,
    'dotExam',
    submission.dotExam || hasSelection(submission.physicalExams, 'DOT / FMCSA Physical'),
  );
  setChecked(
    form,
    'dotExamNewCertification',
    submission.dotExam && submission.dotExamType === 'New Certification',
  );
  setChecked(
    form,
    'dotExamRecertification',
    submission.dotExam && submission.dotExamType === 'Recertification',
  );

  setChecked(
    form,
    'nonDotDrugPreEmployment',
    hasSelection(submission.nonDotDrugs, 'Pre-Employment'),
  );
  setChecked(form, 'nonDotDrugRandom', hasSelection(submission.nonDotDrugs, 'Random'));
  setChecked(form, 'nonDotDrugFollowUp', hasSelection(submission.nonDotDrugs, 'Follow-Up'));
  setChecked(
    form,
    'nonDotDrugReasonableSuspicion',
    hasSelection(submission.nonDotDrugs, 'Reasonable Suspicion'),
  );
  setChecked(
    form,
    'nonDotDrugReturnToDuty',
    hasSelection(submission.nonDotDrugs, 'Return to Duty'),
  );
  setChecked(form, 'nonDotDrugPostAccident', hasSelection(submission.nonDotDrugs, 'Post-Accident'));
  setChecked(
    form,
    'nonDotDrugHairFollicle',
    hasSelection(submission.nonDotDrugs, 'Hair Follicle Drug'),
  );
  setChecked(form, 'nonDotDrugRapid', hasSelection(submission.nonDotDrugs, 'Rapid'));
  setChecked(form, 'nonDotDrugOtherSelected', Boolean(submission.nonDotDrugOther));

  setChecked(
    form,
    'nonDotAlcoholPreEmployment',
    hasSelection(submission.nonDotAlcohol, 'Pre-Employment'),
  );
  setChecked(form, 'nonDotAlcoholRandom', hasSelection(submission.nonDotAlcohol, 'Random'));
  setChecked(form, 'nonDotAlcoholFollowUp', hasSelection(submission.nonDotAlcohol, 'Follow-Up'));
  setChecked(
    form,
    'nonDotAlcoholReasonableSuspicion',
    hasSelection(submission.nonDotAlcohol, 'Reasonable Suspicion'),
  );
  setChecked(
    form,
    'nonDotAlcoholReturnToDuty',
    hasSelection(submission.nonDotAlcohol, 'Return to Duty'),
  );
  setChecked(
    form,
    'nonDotAlcoholPostAccident',
    hasSelection(submission.nonDotAlcohol, 'Post-Accident'),
  );
  setChecked(form, 'nonDotAlcoholOtherSelected', Boolean(submission.nonDotAlcoholOther));

  setChecked(form, 'dotDrugPreEmployment', hasSelection(submission.dotDrugs, 'Pre-Employment'));
  setChecked(form, 'dotDrugRandom', hasSelection(submission.dotDrugs, 'Random'));
  setChecked(form, 'dotDrugFollowUp', hasSelection(submission.dotDrugs, 'Follow-Up'));
  setChecked(
    form,
    'dotDrugReasonableSuspicion',
    hasSelection(submission.dotDrugs, 'Reasonable Suspicion'),
  );
  setChecked(form, 'dotDrugReturnToDuty', hasSelection(submission.dotDrugs, 'Return to Duty'));
  setChecked(form, 'dotDrugPostAccident', hasSelection(submission.dotDrugs, 'Post-Accident'));
  setChecked(form, 'dotDrugOtherSelected', Boolean(submission.dotDrugOther));

  setChecked(
    form,
    'dotAlcoholPreEmployment',
    hasSelection(submission.dotAlcohol, 'Pre-Employment'),
  );
  setChecked(form, 'dotAlcoholRandom', hasSelection(submission.dotAlcohol, 'Random'));
  setChecked(form, 'dotAlcoholFollowUp', hasSelection(submission.dotAlcohol, 'Follow-Up'));
  setChecked(
    form,
    'dotAlcoholReasonableSuspicion',
    hasSelection(submission.dotAlcohol, 'Reasonable Suspicion'),
  );
  setChecked(form, 'dotAlcoholReturnToDuty', hasSelection(submission.dotAlcohol, 'Return to Duty'));
  setChecked(form, 'dotAlcoholPostAccident', hasSelection(submission.dotAlcohol, 'Post-Accident'));

  setChecked(form, 'fitTesting', hasSelection(submission.otherServices, 'Fit Testing'));
  setChecked(form, 'quantiferonGold', hasSelection(submission.otherServices, 'Quantiferon Gold'));
  setChecked(
    form,
    'tbSkinTest',
    hasSelection(submission.otherServices, 'Tuberculosis (TB) Skin Test'),
  );
  setChecked(form, 'otherServicesOtherSelected', Boolean(otherServiceText));

  form.updateFieldAppearances();
  return pdfDoc.save();
}
