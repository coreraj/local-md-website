import type { MedicalAuthorizationSubmission } from './form-security';

/** Use the validated selections without inferring an additional medical service. */
export function medicalAuthorizationServiceSummary(
  submission: MedicalAuthorizationSubmission,
): { label: string; value: string }[] {
  const list = (values: string[], other = '') =>
    [...values, other].filter(Boolean).join(', ') || 'None';
  return [
    { label: 'Physical Exams', value: list(submission.physicalExams) },
    {
      label: 'Work Injury Treatment',
      value: submission.workInjuryTreatment || submission.injuryCare ? 'Yes' : 'No',
    },
    { label: 'Consult for Compensability', value: submission.consultCompensability ? 'Yes' : 'No' },
    { label: 'Body Part', value: submission.bodyPart || 'N/A' },
    { label: 'Injury Date', value: submission.injuryDate || 'N/A' },
    {
      label: 'Lift Test',
      value: submission.liftTest
        ? `Yes${submission.liftTestWeight ? ` (${submission.liftTestWeight})` : ''}`
        : 'No',
    },
    {
      label: 'School Bus Driver Exam',
      value: submission.schoolBusDriver ? submission.schoolBusType : 'None',
    },
    { label: 'DOT Exam Type', value: submission.dotExam ? submission.dotExamType : 'None' },
    {
      label: 'Non-DOT Drug Screenings',
      value: list(submission.nonDotDrugs, submission.nonDotDrugOther),
    },
    {
      label: 'Non-DOT Alcohol Screenings',
      value: list(submission.nonDotAlcohol, submission.nonDotAlcoholOther),
    },
    { label: 'DOT Drug Screenings', value: list(submission.dotDrugs, submission.dotDrugOther) },
    { label: 'DOT Alcohol Screenings', value: list(submission.dotAlcohol) },
    {
      label: 'Other Services',
      value: list(submission.otherServices, submission.otherServicesOther),
    },
  ];
}
