import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { MedicalAuthorizationSubmission } from './form-security';
import { fillMedicalAuthPdf } from './medical-authorization-pdf';

let pdfTemplateBuffer: Buffer | undefined;

function getPdfTemplateBuffer(): Buffer {
  if (pdfTemplateBuffer) return pdfTemplateBuffer;

  const possiblePaths = [
    join(process.cwd(), 'public/assets/Medical_Authorization_Form.pdf'),
    join(import.meta.dirname, '../browser/assets/Medical_Authorization_Form.pdf'),
  ];

  for (const templatePath of possiblePaths) {
    try {
      const buffer = readFileSync(templatePath);
      pdfTemplateBuffer = buffer;
      return buffer;
    } catch {
      // Try the next development or production asset path.
    }
  }

  throw new Error('Medical Authorization PDF template file could not be found.');
}

export async function generatePrefilledMedicalAuthPdf(
  submission: MedicalAuthorizationSubmission,
): Promise<Buffer> {
  return Buffer.from(await fillMedicalAuthPdf(getPdfTemplateBuffer(), submission));
}
